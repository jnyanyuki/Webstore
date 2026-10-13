#!/usr/bin/env python3
"""
Phase 2: Long-Tail Catalog Ingestion & Barcode Resolution Engine
===============================================================
Resolves universal barcodes (UPC/EAN/GTIN) across long-tail retail categories
(Fashion, Cookware, Tools, Home Decor, Baby Gear, Personal Care) via:
  1. Local DB deduplication first (skips already resolved items).
  2. Bulk external API queries (UPCitemdb POST /prod/v1/lookup up to 100/batch).
  3. ImageKit CDN edge proxying for all discovered product media.
  4. Automatic category mapping into the internal 15-department taxonomy.
  5. Atomic upsert into canonical_products with status tracking in barcode_ingest_queue.
"""

import argparse
import asyncio
import logging
import os
import re
import sys
from typing import Any, Dict, List, Optional, Set, Tuple

import asyncpg
import httpx
import orjson
from slugify import slugify

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("phase2_resolver")


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
UPCITEMDB_KEY = os.getenv("UPCITEMDB_KEY", "")
BARCODE_LOOKUP_KEY = os.getenv("BARCODE_LOOKUP_KEY", "")
IMAGEKIT_ENDPOINT = os.getenv("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT", "https://ik.imagekit.io/njndeveloper").rstrip("/")
BATCH_FETCH_SIZE = 50


def clean_gtin(gtin_raw: Optional[str]) -> Optional[str]:
    """Normalize and validate universal GTIN/EAN-13/UPC-A barcode."""
    if not gtin_raw:
        return None
    cleaned = re.sub(r"\D", "", gtin_raw.strip())
    # Standardize 12-digit UPC-A to 13-digit EAN with leading 0
    if len(cleaned) == 12:
        cleaned = f"0{cleaned}"
    if len(cleaned) in (8, 13, 14):
        return cleaned
    return None


def wrap_imagekit_url(raw_url: Optional[str]) -> Optional[str]:
    """Wraps raw vendor image URL with ImageKit edge optimization."""
    if not raw_url:
        return None
    if IMAGEKIT_ENDPOINT in raw_url:
        return raw_url
    return f"{IMAGEKIT_ENDPOINT}/tr=w-800,q-85,f-auto/{raw_url}"


class BarcodeResolver:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
        self.client: Optional[httpx.AsyncClient] = None
        self.category_cache: List[Dict[str, Any]] = []

    async def init(self):
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "JuroMartWebstore-CatalogResolver/1.0",
        }
        if UPCITEMDB_KEY:
            headers["user_key"] = UPCITEMDB_KEY
            headers["key_type"] = "3scale"

        self.client = httpx.AsyncClient(headers=headers, timeout=25.0)

        # Cache internal categories for fast token mapping
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, name, slug FROM categories WHERE parent_id IS NULL AND is_active = TRUE"
            )
            self.category_cache = [{"id": r["id"], "name": r["name"], "slug": r["slug"]} for r in rows]

    async def close(self):
        if self.client:
            await self.client.aclose()

    def resolve_category_id(self, title: str, category_hint: Optional[str]) -> int:
        """Determines best matching L1 category ID from title and category path."""
        combined = f"{title} {category_hint or ''}".lower()

        heuristics: Dict[str, List[str]] = {
            "mens-fashion-shoes": ["men", "hoodie", "shirt", "sneaker", "oxford", "boots", "jeans", "loafers", "chinos", "shorts", "boxers", "suit"],
            "womens-fashion-bags": ["women", "dress", "blouse", "handbag", "heels", "tote", "skirt", "lingerie", "pumps", "purse"],
            "home-furniture-living": ["sofa", "bed", "mattress", "table", "chair", "desk", "cookware", "pan", "pot", "skillet", "duvet", "curtains", "knife", "towel"],
            "beauty-personal-care": ["clipper", "shaver", "blow dryer", "straightener", "wig", "skincare", "massage", "toothbrush", "perfume", "fragrance"],
            "sports-fitness-outdoors": ["dumbbell", "treadmill", "bike", "bicycle", "tent", "sleeping bag", "yoga", "football", "scooter"],
            "automotive-tools": ["car", "dash cam", "helmet", "drill", "wrench", "welder", "tire inflator", "socket", "pliers"],
            "baby-gear-toys": ["stroller", "car seat", "crib", "toy", "drone", "puzzle", "lego", "baby", "infant"],
            "security-smart-home-travel": ["cctv", "camera", "smart lock", "suitcase", "luggage", "backpack", "intercom"],
            "office-stationery-music": ["printer", "laminator", "whiteboard", "guitar", "piano", "microphone", "mixer", "stapler"],
            "phones-tablets": ["phone", "smartphone", "iphone", "samsung", "tablet", "ipad", "power bank", "charger"],
            "computers-gaming": ["laptop", "macbook", "desktop", "cpu", "gpu", "ssd", "ram", "playstation", "xbox", "keyboard", "mouse"],
            "tvs-audio-vision": ["tv", "soundbar", "earbuds", "headphones", "speaker", "projector"],
            "home-appliances": ["air fryer", "blender", "microwave", "cooker", "fridge", "washing machine", "kettle", "fan"],
            "solar-power-backup": ["solar", "inverter", "battery", "ups", "generator"],
        }

        for slug, keywords in heuristics.items():
            if any(k in combined for k in keywords):
                match = next((c for c in self.category_cache if slug in c["slug"] or c["slug"] in slug), None)
                if match:
                    return match["id"]

        # Default fallback to first category
        return self.category_cache[0]["id"] if self.category_cache else 1

    async def fetch_bulk_upcitemdb(self, gtins: List[str]) -> List[Dict[str, Any]]:
        """Queries UPCitemdb bulk endpoint or trial lookup if unauthenticated."""
        if UPCITEMDB_KEY:
            # Pro / Paid Key: Bulk POST /prod/v1/lookup
            url = "https://api.upcitemdb.com/prod/v1/lookup"
            payload = {"upc": gtins}
            try:
                resp = await self.client.post(url, json=payload)
                if resp.status_code == 200:
                    return resp.json().get("items", [])
                elif resp.status_code == 429:
                    logger.warning("Hit UPCitemdb rate limit. Backing off 15s...")
                    await asyncio.sleep(15)
                else:
                    logger.warning(f"UPCitemdb responded with status {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                logger.error(f"Network error querying UPCitemdb: {e}")
            return []

        # Free / Unauthenticated Trial Mode: GET /prod/trial/lookup?upc=...
        items: List[Dict[str, Any]] = []
        for gtin in gtins[:10]:  # Limit trial batch size
            try:
                url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={gtin}"
                resp = await self.client.get(url)
                if resp.status_code == 200:
                    found = resp.json().get("items", [])
                    items.extend(found)
                elif resp.status_code == 429:
                    logger.warning("Trial rate limit reached (100 req/day).")
                    break
                await asyncio.sleep(0.5)  # Friendly pacing
            except Exception as e:
                logger.error(f"Trial query error for {gtin}: {e}")

        return items

    def normalize_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Converts raw UPCitemdb item into canonical database attributes."""
        try:
            gtin = clean_gtin(item.get("ean") or item.get("upc"))
            if not gtin:
                return None

            title = (item.get("title") or "").strip()[:255]
            if not title or len(title) < 3:
                return None

            brand = (item.get("brand") or "Generic").strip()[:100]
            mpn = (item.get("model") or item.get("mpn") or None)
            if mpn:
                mpn = mpn.strip()[:100]

            description = (item.get("description") or "").strip()

            # Process Images via ImageKit
            raw_images = item.get("images", [])
            images = []
            for img in raw_images:
                wrapped = wrap_imagekit_url(img)
                if wrapped:
                    images.append(wrapped)

            # Specs
            specs: Dict[str, Any] = {}
            for field in ("color", "size", "dimension", "weight", "currency"):
                val = item.get(field)
                if val:
                    specs[field.capitalize()] = str(val).strip()

            category_hint = item.get("category")
            category_id = self.resolve_category_id(title, category_hint)

            base_slug = slugify(f"{brand} {title}")[:240]
            slug = f"{base_slug}-{gtin}"

            # Estimated base price if available (lowest recorded price)
            lowest_price = item.get("lowest_recorded_price") or 0.0

            return {
                "category_id": category_id,
                "brand": brand,
                "title": title,
                "slug": slug,
                "gtin": gtin,
                "mpn": mpn,
                "base_price": float(lowest_price),
                "images": images,
                "specs": specs,
                "description": description[:2000] if description else None,
            }
        except Exception as e:
            logger.debug(f"Normalization failed for item: {e}")
            return None

    async def process_batch(self, gtins: List[str]):
        """Processes and reconciles a batch of barcodes."""
        if not gtins:
            return

        logger.info(f"Querying external barcode provider for {len(gtins)} barcodes...")
        raw_items = await self.fetch_bulk_upcitemdb(gtins)

        found_gtins: Set[str] = set()
        to_upsert: List[Dict[str, Any]] = []

        for item in raw_items:
            norm = self.normalize_item(item)
            if norm:
                to_upsert.append(norm)
                found_gtins.add(norm["gtin"])

        # Bulk upsert resolved canonical products
        if to_upsert:
            async with self.pool.acquire() as conn:
                await conn.executemany(
                    """
                    INSERT INTO canonical_products (
                        category_id,
                        brand,
                        title,
                        slug,
                        gtin,
                        mpn,
                        base_price,
                        images,
                        specs,
                        description,
                        is_active,
                        created_at,
                        updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, TRUE, NOW(), NOW()
                    )
                    ON CONFLICT (gtin) DO UPDATE SET
                        specs = canonical_products.specs || EXCLUDED.specs,
                        images = CASE
                            WHEN jsonb_array_length(canonical_products.images) = 0 THEN EXCLUDED.images
                            ELSE canonical_products.images
                        END,
                        description = COALESCE(canonical_products.description, EXCLUDED.description),
                        updated_at = NOW();
                    """,
                    [
                        (
                            p["category_id"],
                            p["brand"],
                            p["title"],
                            p["slug"],
                            p["gtin"],
                            p["mpn"],
                            p["base_price"],
                            orjson.dumps(p["images"]).decode("utf-8"),
                            orjson.dumps(p["specs"]).decode("utf-8"),
                            p["description"],
                        )
                        for p in to_upsert
                    ],
                )

        # Update barcode_ingest_queue statuses
        not_found_gtins = set(gtins) - found_gtins
        async with self.pool.acquire() as conn:
            if found_gtins:
                await conn.execute(
                    "UPDATE barcode_ingest_queue SET status = 'RESOLVED', last_attempt = NOW() WHERE gtin = ANY($1)",
                    list(found_gtins),
                )
            if not_found_gtins:
                await conn.execute(
                    "UPDATE barcode_ingest_queue SET status = 'NOT_FOUND', attempts = attempts + 1, last_attempt = NOW() WHERE gtin = ANY($1)",
                    list(not_found_gtins),
                )

        logger.info(f"Batch completed: {len(found_gtins)} resolved & upserted, {len(not_found_gtins)} marked NOT_FOUND.")


async def queue_raw_barcodes(pool: asyncpg.Pool, barcodes: List[str], source_hint: str = "wholesale_feed"):
    """Inserts a batch of barcodes into the processing queue."""
    clean_list = [clean_gtin(b) for b in barcodes]
    valid_gtins = list(set(b for b in clean_list if b))

    if not valid_gtins:
        logger.warning("No valid barcodes to enqueue.")
        return 0

    async with pool.acquire() as conn:
        # Check against existing canonical_products first (Cache-First Waterfall)
        existing = await conn.fetch(
            "SELECT gtin FROM canonical_products WHERE gtin = ANY($1)",
            valid_gtins,
        )
        existing_gtins = set(r["gtin"] for r in existing)
        to_queue = [g for g in valid_gtins if g not in existing_gtins]

        if to_queue:
            await conn.executemany(
                """
                INSERT INTO barcode_ingest_queue (gtin, source_hint, status, created_at)
                VALUES ($1, $2, 'PENDING', NOW())
                ON CONFLICT (gtin) DO NOTHING;
                """,
                [(g, source_hint) for g in to_queue],
            )
            logger.info(f"Queued {len(to_queue)} new barcodes (skipped {len(existing_gtins)} already in database).")
            return len(to_queue)
        else:
            logger.info(f"All {len(valid_gtins)} barcodes already exist in canonical_products.")
            return 0


async def run_worker(pool: asyncpg.Pool):
    """Continuous resolution worker processing pending barcodes."""
    resolver = BarcodeResolver(pool)
    await resolver.init()

    logger.info("Phase 2 Barcode Worker running. Polling queue...")
    try:
        while True:
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT gtin FROM barcode_ingest_queue
                    WHERE status = 'PENDING' AND attempts < 3
                    ORDER BY attempts ASC, created_at ASC
                    LIMIT $1
                    """,
                    BATCH_FETCH_SIZE,
                )

            if not rows:
                logger.info("No pending barcodes in queue. Sleeping for 20s...")
                await asyncio.sleep(20)
                continue

            gtin_batch = [r["gtin"] for r in rows]
            await resolver.process_batch(gtin_batch)
            await asyncio.sleep(1.5)  # Token bucket pacing to prevent rate-limit exhaustion

    except asyncio.CancelledError:
        logger.info("Worker cancelled.")
    finally:
        await resolver.close()


def main():
    parser = argparse.ArgumentParser(description="Phase 2 Long-Tail Barcode Resolver")
    parser.add_argument("--enqueue", "-e", nargs="+", help="Enqueue one or more barcodes to resolve")
    parser.add_argument("--file", "-f", help="Text/CSV file containing raw barcodes (one per line)")
    parser.add_argument("--source", default="wholesale_feed", help="Source hint tag (e.g. fashion_csv, tools_feed)")
    parser.add_argument("--worker", "-w", action="store_true", help="Run continuous resolution worker")
    parser.add_argument("--test", action="store_true", help="Run self-test with sample retail barcodes")

    args = parser.parse_args()

    clean_dsn = DB_DSN.split("?")[0] if DB_DSN else ""
    ssl_mode = "require" if ("neon.tech" in (DB_DSN or "") or "sslmode=require" in (DB_DSN or "")) else None

    async def runner():
        pool = await asyncpg.create_pool(dsn=clean_dsn, ssl=ssl_mode, min_size=2, max_size=8)
        try:
            if args.test:
                # Sample real-world retail barcodes across fashion, home, and tools
                sample_barcodes = [
                    "0195949038280",  # Apple iPhone
                    "0880609530462",  # Samsung Galaxy
                    "0027242923508",  # Sony WH-1000XM5
                    "0872038901509",  # Philips Airfryer
                    "0194644098675",  # Anker Power Bank
                ]
                logger.info("Executing self-test with retail barcodes...")
                await queue_raw_barcodes(pool, sample_barcodes, source_hint="sample_test")
                resolver = BarcodeResolver(pool)
                await resolver.init()
                await resolver.process_batch(sample_barcodes)
                await resolver.close()
                return

            if args.file:
                with open(args.file, "r", encoding="utf-8") as f:
                    barcodes = [line.strip() for line in f if line.strip()]
                await queue_raw_barcodes(pool, barcodes, source_hint=args.source)

            if args.enqueue:
                await queue_raw_barcodes(pool, args.enqueue, source_hint=args.source)

            if args.worker:
                await run_worker(pool)

        finally:
            await pool.close()

    asyncio.run(runner())


if __name__ == "__main__":
    main()
