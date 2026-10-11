#!/usr/bin/env python3
"""
FastAPI WebSocket Notification Hub & Background Event Bridge
============================================================
Bridges PostgreSQL `pg_notify` (or Redis) product change events to:
  1. Hot Path: In-browser WebSockets for instant toast notifications.
  2. Cold Path: Background Celery tasks for rich HTML emails.
"""

import asyncio
from contextlib import asynccontextmanager
import logging
import os
import sys
from typing import Dict, Optional, Set

import asyncpg
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import orjson
import uvicorn

# Import Celery background task
from email_tasks import send_product_alert_email

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("ws_notification_hub")


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


class ConnectionManager:
    """Manages concurrent browser WebSocket sessions partitioned by user_id."""
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket client connected: User {user_id} (Active tabs: {len(self.active_connections[user_id])})")

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket client disconnected: User {user_id}")

    async def send_to_user(self, user_id: int, payload: dict) -> int:
        """Sends payload to all active browser windows/tabs for the user."""
        if user_id not in self.active_connections:
            return 0

        message = orjson.dumps(payload).decode("utf-8")
        dead_sockets = set()
        delivered = 0

        for ws in self.active_connections[user_id]:
            try:
                await ws.send_text(message)
                delivered += 1
            except Exception:
                dead_sockets.add(ws)

        for ws in dead_sockets:
            self.active_connections[user_id].discard(ws)

        return delivered

    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


ws_manager = ConnectionManager()


async def process_notification(pool: asyncpg.Pool, payload_str: str):
    """
    Parses incoming event from PostgreSQL pg_notify, matches user alerts,
    delivers real-time WebSocket toast, and enqueues Celery HTML email.
    """
    try:
        data = orjson.loads(payload_str)
    except Exception as e:
        logger.error(f"Failed to decode payload: {e}")
        return

    event_type = data.get("event")
    product_id = data.get("canonical_product_id")

    if not event_type or not product_id:
        return

    async with pool.acquire() as conn:
        product = await conn.fetchrow(
            "SELECT id, title, slug FROM canonical_products WHERE id = $1", 
            product_id
        )
        if not product:
            return

        # Query all active subscribers
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
            return

        if not subscribers:
            return

        logger.info(f"Dispatching {event_type} for '{product['title']}' to {len(subscribers)} subscribers...")

        for sub in subscribers:
            uid = sub["user_id"]
            # Fallback mock user email if no users table is present
            user_email = f"user{uid}@example.com"

            # 1. Hot Path: Send WebSocket Toast notification
            ws_payload = {
                "type": "NOTIFICATION_TOAST",
                "event": event_type,
                "product_id": product["id"],
                "product_title": product["title"],
                "product_slug": product["slug"],
                "timestamp": data.get("timestamp"),
                "data": data,
            }
            delivered_tabs = await ws_manager.send_to_user(uid, ws_payload)
            if delivered_tabs > 0:
                logger.info(f"[HOT PATH] Delivered in-browser toast to User {uid} across {delivered_tabs} tab(s)")
            else:
                logger.info(f"[HOT PATH] User {uid} is offline (0 active tabs)")

            # 2. Cold Path: Enqueue background Celery task for HTML email
            subject = (
                f"🔥 Price Drop: {product['title']}" 
                if event_type == "PRICE_DROP" 
                else f"📦 Back in Stock: {product['title']}"
            )
            email_ctx = {
                "event_type": event_type,
                "product_title": product["title"],
                "product_slug": product["slug"],
                **data
            }
            task_res = send_product_alert_email.delay(user_email, subject, email_ctx)
            logger.info(f"[COLD PATH] Enqueued Celery email task {task_res.id} for {user_email}")


async def pg_listener_task(pool: asyncpg.Pool, clean_dsn: str, ssl_mode: Optional[str]):
    """Maintains connection to PostgreSQL pg_notify channel 'product_events'."""
    listener_conn = await asyncpg.connect(dsn=clean_dsn, ssl=ssl_mode)
    def on_notification(conn, pid, channel, payload):
        asyncio.create_task(process_notification(pool, payload))

    await listener_conn.add_listener(CHANNEL_NAME, on_notification)
    logger.info(f"FastAPI background listener active on channel '{CHANNEL_NAME}'")
    try:
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        pass
    finally:
        try:
            await listener_conn.remove_listener(CHANNEL_NAME, on_notification)
            await listener_conn.close()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    clean_dsn = DB_DSN.split("?")[0] if DB_DSN else ""
    ssl_mode = "require" if ("neon.tech" in (DB_DSN or "") or "sslmode=require" in (DB_DSN or "")) else None

    pool = await asyncpg.create_pool(dsn=clean_dsn, ssl=ssl_mode, min_size=2, max_size=8)
    app.state.pool = pool
    listener_coro = asyncio.create_task(pg_listener_task(pool, clean_dsn, ssl_mode))
    yield
    listener_coro.cancel()
    await pool.close()


app = FastAPI(title="Webstore Real-Time Notification Gateway", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "active_users_online": len(ws_manager.active_connections),
        "total_active_tabs": sum(len(tabs) for tabs in ws_manager.active_connections.values()),
    }


@app.post("/api/alerts/simulate")
async def simulate_event(payload: dict):
    """Allows simulating a price drop or back in stock notification."""
    await process_notification(app.state.pool, orjson.dumps(payload).decode("utf-8"))
    return {"status": "dispatched", "payload": payload}


@app.websocket("/ws/notifications")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: int = Query(...)):
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            # Keepalive receiver
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)


if __name__ == "__main__":
    uvicorn.run("ws_notification_hub:app", host="0.0.0.0", port=8000, reload=False)
