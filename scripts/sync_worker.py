#!/usr/bin/env python3
"""
Phase 3: High-Throughput Synchronization Consumer
=================================================
Consumes vendor inventory deltas from Redis Streams (consumer group: catalog-sync-group),
stages them via PostgreSQL binary COPY, and performs atomic set-based upserts
into `vendor_listings`.

Key Features:
- Redis Consumer Group with at-least-once delivery and auto ACK after DB commit.
- Binary streaming COPY into a connection-scoped TEMP TABLE (`stage_vendor_deltas`).
- High-performance set-based resolution against `canonical_products.gtin`.
- Automatic feedback loop: Unmatched vendor barcodes are dumped into `barcode_ingest_queue`
  so the Phase 2 resolver can fetch canonical metadata in the background.
- Live BuyBox integration: Updates immediately reflect in `product_buybox` view.
"""

import argparse
import asyncio
import csv
import gzip
import logging
import os
import socket
import sys
from typing import Any, Dict, List, Optional, Tuple

import asyncpg
import orjson
import redis.asyncio as aioredis

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("sync_worker")


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

STREAM_NAME = "vendor:deltas"
CONSUMER_GROUP = "catalog-sync-group"
CONSUMER_NAME = f"worker-{socket.gethostname()}-{os.getpid()}"
BATCH_FETCH_COUNT = 10  # Number of stream messages to fetch per poll


async def setup_redis_group(r: aioredis.Redis, stream_name: str = STREAM_NAME, group_name: str = CONSUMER_GROUP):
    """Ensures the consumer group exists, creating the stream if missing."""
    try:
        await r.xgroup_create(stream_name, group_name, id="0", mkstream=True)
        logger.info(f"Created consumer group: {group_name} on stream: {stream_name}")
    except aioredis.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise
        logger.debug(f"Consumer group {group_name} already exists.")


async def ensure_vendor_exists(conn: asyncpg.Connection, vendor_id: int):
    """Ensures the vendor record exists in the database to satisfy foreign keys."""
    await conn.execute(
        """
        INSERT INTO vendors (id, name, code, currency, is_active, created_at)
        VALUES ($1, $2, $3, 'KES', TRUE, NOW())
        ON CONFLICT (id) DO NOTHING;
        """,
        vendor_id,
        f"Partner Vendor #{vendor_id}",
        f"VENDOR_PARTNER_{vendor_id}"
    )


async def create_worker_staging(conn: asyncpg.Connection):
    """Temporary staging table local to the worker connection for set-based resolution."""
    await conn.execute(
        """
        CREATE TEMP TABLE stage_vendor_deltas (
            vendor_id INT,
            gtin VARCHAR(14),
            vendor_sku VARCHAR(120),
            price DOUBLE PRECISION,
            compare_at_price DOUBLE PRECISION,
            stock_quantity INT
        ) ON COMMIT DROP;
        """
    )


async def process_payloads(
    pool: asyncpg.Pool,
    raw_batches: List[List[Dict[str, Any]]]
) -> Tuple[int, int]:
    """
    Ingests all deltas into temporary staging, joins with canonical_products on GTIN,
    and updates/inserts into vendor_listings in one atomic transaction.
    Also captures unmatched GTINs into barcode_ingest_queue.

    Returns:
        Tuple of (synced_listings_count, unmatched_gtins_count)
    """
    flat_records: List[Tuple] = []
    vendor_ids = set()

    for batch in raw_batches:
        for item in batch:
            v_id = item["vendor_id"]
            vendor_ids.add(v_id)
            flat_records.append((
                v_id,
                item["gtin"],
                item["sku"],
                float(item["price"]),
                float(item["compare_at_price"]) if item.get("compare_at_price") is not None else None,
                int(item["stock"]),
            ))

    if not flat_records:
        return 0, 0

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Ensure foreign key validity for all vendors in this payload
            for vid in vendor_ids:
                await ensure_vendor_exists(conn, vid)

            # 1. Create connection-scoped temp table
            await create_worker_staging(conn)

            # 2. Binary stream into TEMP table via PostgreSQL COPY protocol
            await conn.copy_records_to_table(
                "stage_vendor_deltas",
                records=flat_records,
                columns=["vendor_id", "gtin", "vendor_sku", "price", "compare_at_price", "stock_quantity"]
            )

            # 3. Join against canonical_products and batch-upsert into vendor_listings
            result = await conn.execute(
                """
                INSERT INTO vendor_listings (
                    vendor_id,
                    canonical_product_id,
                    vendor_sku,
                    price,
                    compare_at_price,
                    stock_quantity,
                    last_synced_at
                )
                SELECT 
                    s.vendor_id,
                    c.id AS canonical_product_id,
                    s.vendor_sku,
                    s.price,
                    s.compare_at_price,
                    s.stock_quantity,
                    NOW()
                FROM stage_vendor_deltas s
                INNER JOIN canonical_products c ON s.gtin = c.gtin
                ON CONFLICT (vendor_id, canonical_product_id) DO UPDATE SET
                    vendor_sku = EXCLUDED.vendor_sku,
                    price = EXCLUDED.price,
                    compare_at_price = EXCLUDED.compare_at_price,
                    stock_quantity = EXCLUDED.stock_quantity,
                    last_synced_at = NOW();
                """
            )
            synced_count = int(result.split()[-1])

            # 4. Feedback loop: Capture unmatched barcodes into Phase 2 resolution queue
            unmatched_res = await conn.execute(
                """
                INSERT INTO barcode_ingest_queue (gtin, source_hint, status, created_at)
                SELECT DISTINCT s.gtin, 'vendor_sync_unmatched', 'PENDING', NOW()
                FROM stage_vendor_deltas s
                LEFT JOIN canonical_products c ON s.gtin = c.gtin
                WHERE c.id IS NULL AND s.gtin IS NOT NULL AND s.gtin != ''
                ON CONFLICT (gtin) DO NOTHING;
                """
            )
            unmatched_count = int(unmatched_res.split()[-1])

            return synced_count, unmatched_count


async def run_worker(pool: asyncpg.Pool, stream_name: str = STREAM_NAME, once: bool = False):
    """Continuous or single-pass consumer group worker listening on Redis Stream."""
    r = aioredis.from_url(REDIS_URL)
    await setup_redis_group(r, stream_name)

    logger.info(f"Worker {CONSUMER_NAME} started listening on stream '{stream_name}'...")

    try:
        empty_polls = 0
        while True:
            # Poll stream via Consumer Group
            events = await r.xreadgroup(
                groupname=CONSUMER_GROUP,
                consumername=CONSUMER_NAME,
                streams={stream_name: ">"},
                count=BATCH_FETCH_COUNT,
                block=2000,  # 2-second block wait
            )

            if not events:
                empty_polls += 1
                if once and empty_polls >= 2:
                    logger.info("Single-pass mode: Stream drained, shutting down worker.")
                    break
                continue

            empty_polls = 0
            stream_key, messages = events[0]
            msg_ids = []
            batches = []

            for msg_id, data in messages:
                msg_ids.append(msg_id)
                payload_json = data.get(b"payload")
                if payload_json:
                    batches.append(orjson.loads(payload_json))

            # Execute transactional bulk upsert into PostgreSQL
            synced_count, unmatched_count = await process_payloads(pool, batches)

            # Acknowledge messages in Redis after successful DB commit
            if msg_ids:
                await r.xack(stream_name, CONSUMER_GROUP, *msg_ids)
                logger.info(
                    f"Acked {len(msg_ids)} stream chunks | "
                    f"Synced {synced_count:,} product listings | "
                    f"Queued {unmatched_count:,} unmatched barcodes to Phase 2"
                )

            if once:
                logger.info("Single-pass batch completed.")
                break

    except asyncio.CancelledError:
        logger.info("Worker gracefully shutting down...")
    finally:
        await r.aclose()


async def direct_file_sync(pool: asyncpg.Pool, file_path: str, vendor_id: int):
    """Directly synchronizes a vendor CSV file bypassing Redis (for offline/cron scripts)."""
    open_fn = gzip.open if file_path.endswith(".gz") else open
    mode = "rt" if file_path.endswith(".gz") else "r"

    batch = []
    total_synced = 0
    total_unmatched = 0

    with open_fn(file_path, mode, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            gtin = "".join(c for c in (row.get("gtin") or row.get("barcode") or "") if c.isdigit())
            sku = (row.get("vendor_sku") or row.get("sku") or "").strip()
            price_val = row.get("price") or "0"
            stock_val = row.get("stock_quantity") or row.get("stock") or "0"
            compare_val = row.get("compare_at_price")

            if not gtin or not sku:
                continue

            try:
                price = float(price_val)
                stock = int(stock_val)
                compare_at_price = float(compare_val) if compare_val else None
            except (ValueError, TypeError):
                continue

            batch.append({
                "vendor_id": vendor_id,
                "gtin": gtin,
                "sku": sku,
                "price": price,
                "compare_at_price": compare_at_price,
                "stock": stock,
            })

            if len(batch) >= 500:
                s, u = await process_payloads(pool, [batch])
                total_synced += s
                total_unmatched += u
                batch = []

        if batch:
            s, u = await process_payloads(pool, [batch])
            total_synced += s
            total_unmatched += u

    logger.info(
        f"Direct file sync complete: {total_synced:,} listings synced, "
        f"{total_unmatched:,} unmatched barcodes queued."
    )


async def print_buybox_summary(pool: asyncpg.Pool, limit: int = 10):
    """Fetches and displays live aggregated BuyBox data from product_buybox."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT 
                canonical_product_id,
                brand,
                title,
                total_network_stock,
                lowest_active_price,
                highest_active_price,
                active_seller_count
            FROM product_buybox
            WHERE total_network_stock > 0
            ORDER BY total_network_stock DESC
            LIMIT {limit};
            """
        )
        print("\n" + "=" * 95)
        print(f"{'ID':<5} | {'Brand':<10} | {'Title':<35} | {'Stock':<6} | {'Lowest (KES)':<13} | {'Sellers':<7}")
        print("-" * 95)
        for r in rows:
            lowest = f"{r['lowest_active_price']:,.2f}" if r['lowest_active_price'] else "N/A"
            title = (r['title'][:32] + "...") if len(r['title']) > 35 else r['title']
            print(f"{r['canonical_product_id']:<5} | {r['brand']:<10} | {title:<35} | {r['total_network_stock']:<6} | {lowest:<13} | {r['active_seller_count']:<7}")
        print("=" * 95 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Phase 3 Continuous Sync Worker")
    parser.add_argument("--stream", "-s", default=STREAM_NAME, help=f"Redis stream name (default: {STREAM_NAME})")
    parser.add_argument("--once", action="store_true", help="Process existing messages in stream and exit")
    parser.add_argument("--direct-file", "-f", help="Directly sync CSV feed file without Redis")
    parser.add_argument("--vendor-id", "-v", type=int, default=1, help="Vendor ID for direct file sync")
    parser.add_argument("--verify-buybox", action="store_true", help="Display top active BuyBox listings")

    args = parser.parse_args()

    clean_dsn = DB_DSN.split("?")[0] if DB_DSN else ""
    ssl_mode = "require" if ("neon.tech" in (DB_DSN or "") or "sslmode=require" in (DB_DSN or "")) else None

    async def runner():
        pool = await asyncpg.create_pool(dsn=clean_dsn, ssl=ssl_mode, min_size=2, max_size=8)
        try:
            if args.verify_buybox:
                await print_buybox_summary(pool)
                return

            if args.direct_file:
                await direct_file_sync(pool, args.direct_file, vendor_id=args.vendor_id)
                await print_buybox_summary(pool)
                return

            await run_worker(pool, stream_name=args.stream, once=args.once)

            if args.once:
                await print_buybox_summary(pool)
        finally:
            await pool.close()

    asyncio.run(runner())


if __name__ == "__main__":
    main()
