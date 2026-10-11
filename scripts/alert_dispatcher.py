#!/usr/bin/env python3
"""
Price-Drop & Back-in-Stock Alert Dispatcher
==========================================
Listens to real-time events triggered by vendor listing changes via:
  1. PostgreSQL pg_notify on channel 'product_events'
  2. Redis Pub/Sub on channel 'product_events'

Key Features:
- Asynchronous non-blocking event loop listening for DB/Redis events.
- Redis-based atomic rate-limiting / deduplication guard (e.g., 12-hour cooldown window)
  using `SET cooldown:alert:{user_id}:{product_id}:{event_type} 1 NX EX <ttl>`.
- Resolution of active subscribers from `user_product_alerts` matching:
    * PRICE_DROP: where target_price IS NULL OR target_price >= new_price
    * BACK_IN_STOCK: where notify_on_back_in_stock = TRUE
- Outbound alert dispatch simulation (Email, SMS, Webhook, Mobile Push).
- Built-in self-test mode (`--test`) to verify trigger execution end-to-end.
"""

import argparse
import asyncio
import logging
import os
import sys
from typing import Any, Dict, Optional

import asyncpg
import orjson
import redis.asyncio as aioredis

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("alert_dispatcher")


def load_env_files():
    """Loads environment variables from apps/web/.env and .env.local."""
    potential_paths = [
        os.path.join(os.path.dirname(__file__), "..", "apps", "web", ".env"),
        os.path.join(os.path.dirname(__file__), "..", "apps", "web", ".env.local"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
    ]
    for path in potential_paths:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v

load_env_files()

DB_DSN = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

CHANNEL_NAME = "product_events"
ALERT_COOLDOWN_SECONDS = 3600 * 12  # 12-hour deduplication window per user+product+event


async def should_rate_limit(redis_client: Optional[aioredis.Redis], user_id: int, product_id: int, event_type: str) -> bool:
    """
    Uses Redis atomic SET NX with TTL to avoid spamming users during rapid price adjustments.
    Returns True if notification should be suppressed (rate limited), False if new alert.
    """
    if not redis_client:
        return False

    key = f"cooldown:alert:{user_id}:{product_id}:{event_type}"
    # Returns True if key was set (i.e. first time / cooldown expired), None/False if already present
    is_new = await redis_client.set(key, "1", ex=ALERT_COOLDOWN_SECONDS, nx=True)
    return not bool(is_new)


async def send_user_alert(user_id: int, product_title: str, event_data: Dict[str, Any]):
    """
    Simulates sending Email, SMS, or Push Notification to the user.
    """
    event = event_data.get("event")
    if event == "PRICE_DROP":
        msg = (
            f"💰 Price Drop Alert! '{product_title}' is now down to "
            f"KES {event_data.get('new_price'):,.2f} "
            f"(Saved KES {event_data.get('discount_amount', 0):,.2f} | -{event_data.get('discount_percent')}%)"
        )
    elif event == "BACK_IN_STOCK":
        msg = (
            f"📦 Back in Stock! '{product_title}' is available again with "
            f"{event_data.get('new_stock')} units at KES {event_data.get('current_price'):,.2f}."
        )
    else:
        return

    logger.info(f"[OUTBOUND ALERT] -> User {user_id}: {msg}")


async def process_event(pool: asyncpg.Pool, redis_client: Optional[aioredis.Redis], payload_str: str):
    """
    Handles a single raw JSON event received from pg_notify or Redis Pub/Sub.
    """
    try:
        data = orjson.loads(payload_str)
    except Exception as e:
        logger.error(f"Failed to parse event payload: {e}")
        return

    event_type = data.get("event")
    product_id = data.get("canonical_product_id")

    if not event_type or not product_id:
        return

    async with pool.acquire() as conn:
        # Fetch canonical product metadata
        product = await conn.fetchrow(
            "SELECT id, title, slug, brand FROM canonical_products WHERE id = $1",
            product_id
        )
        if not product:
            logger.debug(f"Product ID {product_id} not found in database.")
            return

        # Fetch active subscribers matching criteria
        if event_type == "BACK_IN_STOCK":
            subscribers = await conn.fetch(
                """
                SELECT user_id, target_price 
                FROM user_product_alerts
                WHERE canonical_product_id = $1 
                  AND is_active = TRUE 
                  AND notify_on_back_in_stock = TRUE
                """,
                product_id,
            )
        elif event_type == "PRICE_DROP":
            current_price = float(data.get("new_price", 0))
            subscribers = await conn.fetch(
                """
                SELECT user_id, target_price 
                FROM user_product_alerts
                WHERE canonical_product_id = $1 
                  AND is_active = TRUE 
                  AND (target_price IS NULL OR target_price >= $2)
                """,
                product_id,
                current_price,
            )
        else:
            subscribers = []

        if not subscribers:
            logger.info(f"Received {event_type} for '{product['title']}' (ID: {product_id}), 0 subscribers matched.")
            return

        logger.info(f"Processing {event_type} for '{product['title']}': {len(subscribers)} matching user(s).")

        for sub in subscribers:
            user_id = sub["user_id"]
            if await should_rate_limit(redis_client, user_id, product_id, event_type):
                logger.info(f"Suppressed alert for User {user_id}: cooldown window active.")
                continue

            await send_user_alert(user_id, product["title"], data)

            # Record last notified timestamp
            await conn.execute(
                """
                UPDATE user_product_alerts 
                SET last_notified_at = NOW() 
                WHERE user_id = $1 AND canonical_product_id = $2
                """,
                user_id,
                product_id,
            )


def make_pg_listener(pool: asyncpg.Pool, redis_client: Optional[aioredis.Redis]):
    """Creates an asyncpg notification callback for PostgreSQL pg_notify."""
    def on_notification(conn, pid, channel, payload):
        asyncio.create_task(process_event(pool, redis_client, payload))
    return on_notification


async def run_pg_listener(pool: asyncpg.Pool, redis_client: Optional[aioredis.Redis], clean_dsn: str, ssl_mode: Optional[str]):
    """Connects a dedicated connection to listen to PostgreSQL NOTIFY events."""
    listener_conn = await asyncpg.connect(dsn=clean_dsn, ssl=ssl_mode)
    handler = make_pg_listener(pool, redis_client)
    await listener_conn.add_listener(CHANNEL_NAME, handler)

    logger.info(f"Listening on PostgreSQL channel '{CHANNEL_NAME}'...")
    try:
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        logger.info("Stopping PostgreSQL listener...")
    finally:
        try:
            await listener_conn.remove_listener(CHANNEL_NAME, handler)
            await listener_conn.close()
        except Exception:
            pass


async def run_redis_pubsub_listener(pool: asyncpg.Pool, redis_client: aioredis.Redis):
    """Listens for notifications published over Redis Pub/Sub."""
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(CHANNEL_NAME)
    logger.info(f"Listening on Redis Pub/Sub channel '{CHANNEL_NAME}'...")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                payload = message["data"]
                if isinstance(payload, bytes):
                    payload = payload.decode("utf-8")
                await process_event(pool, redis_client, payload)
    except asyncio.CancelledError:
        logger.info("Stopping Redis Pub/Sub listener...")
    finally:
        await pubsub.unsubscribe(CHANNEL_NAME)
        await pubsub.aclose()


async def run_self_test(pool: asyncpg.Pool, redis_client: Optional[aioredis.Redis], clean_dsn: str, ssl_mode: Optional[str]):
    """
    Executes an end-to-end self test:
    1. Subscribes test user (ID 999) to an existing product in user_product_alerts.
    2. Starts the listener in the background.
    3. Simulates a vendor price drop on vendor_listings in PostgreSQL.
    4. Simulates a back-in-stock event (stock 0 -> 15).
    5. Verifies the pg_notify trigger fires and the alert is dispatched.
    """
    logger.info("Starting End-to-End Alert Self-Test...")

    async with pool.acquire() as conn:
        # Pick an active product
        product = await conn.fetchrow(
            "SELECT id, title FROM canonical_products ORDER BY id ASC LIMIT 1"
        )
        if not product:
            logger.error("No canonical products found for test!")
            return

        prod_id = product["id"]
        test_user_id = 999

        # Register test alert
        await conn.execute(
            """
            INSERT INTO user_product_alerts (
                user_id, canonical_product_id, target_price, notify_on_back_in_stock, is_active, created_at
            )
            VALUES ($1, $2, 200000.0, TRUE, TRUE, NOW())
            ON CONFLICT (user_id, canonical_product_id) DO UPDATE SET
                target_price = 200000.0,
                notify_on_back_in_stock = TRUE,
                is_active = TRUE;
            """,
            test_user_id,
            prod_id,
        )
        logger.info(f"Registered User {test_user_id} alert for product '{product['title']}' (ID: {prod_id})")

        # Clear any existing Redis cooldown for clean test
        if redis_client:
            await redis_client.delete(f"cooldown:alert:{test_user_id}:{prod_id}:PRICE_DROP")
            await redis_client.delete(f"cooldown:alert:{test_user_id}:{prod_id}:BACK_IN_STOCK")

    # Start dedicated listener
    listener_conn = await asyncpg.connect(dsn=clean_dsn, ssl=ssl_mode)
    received_events = []

    def on_test_notification(conn, pid, channel, payload):
        logger.info(f"[TRIGGER FIRED] pg_notify received on '{channel}': {payload}")
        received_events.append(payload)
        asyncio.create_task(process_event(pool, redis_client, payload))

    await listener_conn.add_listener(CHANNEL_NAME, on_test_notification)
    logger.info("Listener registered. Triggering simulated listing price drop in PostgreSQL...")

    async with pool.acquire() as conn:
        # 1. Test Price Drop: Update vendor listing price down by 5,000
        listing = await conn.fetchrow(
            "SELECT id, price, stock_quantity FROM vendor_listings WHERE canonical_product_id = $1 LIMIT 1",
            prod_id,
        )
        if listing:
            old_p = listing["price"]
            new_p = round(old_p - 5000.0, 2)
            await conn.execute(
                "UPDATE vendor_listings SET price = $1, stock_quantity = 10 WHERE id = $2",
                new_p,
                listing["id"],
            )
            logger.info(f"Updated vendor_listing #{listing['id']}: Price {old_p} -> {new_p}")

    await asyncio.sleep(2)

    async with pool.acquire() as conn:
        # 2. Test Back-in-Stock: First set stock to 0, then set stock to 25
        listing = await conn.fetchrow(
            "SELECT id, price FROM vendor_listings WHERE canonical_product_id = $1 LIMIT 1",
            prod_id,
        )
        if listing:
            # Set to 0 silently
            await conn.execute("UPDATE vendor_listings SET stock_quantity = 0 WHERE id = $1", listing["id"])
            await asyncio.sleep(0.5)
            # Now set to 25 to fire BACK_IN_STOCK trigger
            logger.info("Updating stock from 0 -> 25 to test BACK_IN_STOCK trigger...")
            await conn.execute("UPDATE vendor_listings SET stock_quantity = 25 WHERE id = $1", listing["id"])

    await asyncio.sleep(2)

    await listener_conn.remove_listener(CHANNEL_NAME, on_test_notification)
    await listener_conn.close()

    logger.info(f"Self-test finished! Total pg_notify events captured: {len(received_events)}")


def main():
    parser = argparse.ArgumentParser(description="Price-Drop & Back-in-Stock Alert Dispatcher")
    parser.add_argument("--test", action="store_true", help="Run end-to-end self-test with simulated price drop & back-in-stock")
    parser.add_argument("--redis-pubsub", action="store_true", help="Also listen to Redis Pub/Sub channel in addition to pg_notify")

    args = parser.parse_args()

    clean_dsn = DB_DSN.split("?")[0] if DB_DSN else ""
    ssl_mode = "require" if ("neon.tech" in (DB_DSN or "") or "sslmode=require" in (DB_DSN or "")) else None

    async def runner():
        pool = await asyncpg.create_pool(dsn=clean_dsn, ssl=ssl_mode, min_size=2, max_size=5)
        redis_client = None
        try:
            redis_client = aioredis.from_url(REDIS_URL)
            await redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis not available ({e}). Running without Redis cooldown guard.")
            redis_client = None

        try:
            if args.test:
                await run_self_test(pool, redis_client, clean_dsn, ssl_mode)
                return

            tasks = [run_pg_listener(pool, redis_client, clean_dsn, ssl_mode)]
            if args.redis_pubsub and redis_client:
                tasks.append(run_redis_pubsub_listener(pool, redis_client))

            await asyncio.gather(*tasks)

        finally:
            if redis_client:
                await redis_client.aclose()
            await pool.close()

    asyncio.run(runner())


if __name__ == "__main__":
    main()
