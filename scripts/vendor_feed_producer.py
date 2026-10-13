
#!/usr/bin/env python3
"""
Phase 3: High-Throughput Vendor Feed Producer
=============================================
Parses incoming vendor inventory feeds (regular or gzipped CSV, scrapers,
or distributor sync dumps), chunks items into manageable batches (e.g., 500 items),
and appends structured JSON payloads to a Redis Stream (`vendor:deltas`).

Key Capabilities:
- High performance streaming with `orjson` and connection pooling.
- Chunked backpressure buffering in Redis Streams.
- Built-in sample inventory generator with real & unmatched GTINs to exercise
  the Phase 2 barcode feedback loop.
"""

import argparse
import csv
import gzip
import logging
import os
import random
import sys
from typing import Dict, List, Optional

import orjson
import redis

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("vendor_feed_producer")


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

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DEFAULT_STREAM = "vendor:deltas"
DEFAULT_CHUNK_SIZE = 500


def clean_gtin(gtin: str) -> str:
    """Standardizes GTIN barcode string."""
    digits = "".join(c for c in gtin if c.isdigit())
    if 8 <= len(digits) <= 14:
        return digits.zfill(13) if len(digits) in (12, 13) else digits
    return digits


def publish_vendor_feed(
    vendor_id: int,
    file_path: str,
    stream_name: str = DEFAULT_STREAM,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    redis_client: Optional[redis.Redis] = None
) -> int:
    """
    Reads incoming CSV files (regular or gzipped) and pushes batch events to Redis Stream.
    Expected CSV columns: gtin, vendor_sku, price, stock_quantity, [compare_at_price]
    """
    if not os.path.isfile(file_path):
        logger.warning(f"Feed file '{file_path}' not found. Generating sample vendor inventory feed...")
        generate_sample_feed(file_path, count=50)

    r = redis_client or redis.from_url(REDIS_URL)

    open_fn = gzip.open if file_path.endswith(".gz") else open
    mode = "rt" if file_path.endswith(".gz") else "r"

    batch: List[Dict] = []
    total_enqueued = 0
    total_chunks = 0

    with open_fn(file_path, mode, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_gtin = row.get("gtin") or row.get("barcode") or row.get("upc") or row.get("ean") or ""
            sku = row.get("vendor_sku") or row.get("sku") or ""
            price_val = row.get("price") or "0"
            stock_val = row.get("stock_quantity") or row.get("stock") or row.get("qty") or "0"
            compare_val = row.get("compare_at_price") or row.get("original_price")

            gtin = clean_gtin(raw_gtin)
            sku = sku.strip()

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

            if len(batch) >= chunk_size:
                r.xadd(stream_name, {"payload": orjson.dumps(batch)})
                total_enqueued += len(batch)
                total_chunks += 1
                batch = []

        if batch:
            r.xadd(stream_name, {"payload": orjson.dumps(batch)})
            total_enqueued += len(batch)
            total_chunks += 1

    logger.info(
        f"Successfully enqueued {total_enqueued:,} items in {total_chunks} chunks "
        f"for Vendor ID {vendor_id} -> Stream '{stream_name}'"
    )
    return total_enqueued


def generate_sample_feed(output_path: str, count: int = 100):
    """
    Generates a realistic vendor inventory CSV file containing a mix of
    known GTINs (matching seeded canonical products) and new unknown GTINs.
    """
    # Sample real known barcodes present in our database from Phase 1 & 2
    known_sample_gtins = [
        ("0195949038280", "Apple iPhone 15 Pro", 175000.0, 189999.0),
        ("0880609530462", "Samsung Galaxy S24 Ultra", 168000.0, 179999.0),
        ("0194644098675", "Anker 737 Power Bank", 14500.0, 16999.0),
        ("0195949320149", "MacBook Air M3", 169000.0, 185000.0),
        ("0711719570776", "PlayStation 5 Slim", 74000.0, 79999.0),
        ("0195949052521", "Apple Watch Ultra 2", 112000.0, 120000.0),
        ("0195949015090", "iPad Air 11-inch M2", 89000.0, 95000.0),
        ("0027242923508", "Sony WH-1000XM5", 42000.0, 48000.0),
        ("0872038901509", "Philips Airfryer XXL", 28500.0, 32000.0),
    ]

    # Sample brand prefixes to generate realistic unmatched GTINs
    unmatched_gtin_pool = [
        f"0887224{random.randint(100000, 999999)}" for _ in range(count)
    ]

    rows = []

    # 1. Include known products with slight price and stock variations
    for gtin, name, base_price, original_price in known_sample_gtins:
        # Vendor offering competitive pricing +/- 5%
        jitter = random.uniform(0.92, 1.05)
        vendor_price = round(base_price * jitter, 2)
        stock = random.randint(3, 45)
        sku = f"SKU-{gtin[-6:]}"
        rows.append({
            "gtin": gtin,
            "vendor_sku": sku,
            "price": vendor_price,
            "compare_at_price": original_price,
            "stock_quantity": stock,
        })

    # 2. Add unmatched GTINs to trigger the Phase 2 barcode resolution queue
    for i in range(max(10, count - len(known_sample_gtins))):
        gtin = unmatched_gtin_pool[i]
        sku = f"VND-UNMATCH-{i+1:04d}"
        price = round(random.uniform(1500, 25000), 2)
        stock = random.randint(0, 30)
        rows.append({
            "gtin": gtin,
            "vendor_sku": sku,
            "price": price,
            "compare_at_price": round(price * 1.15, 2),
            "stock_quantity": stock,
        })

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["gtin", "vendor_sku", "price", "compare_at_price", "stock_quantity"])
        writer.writeheader()
        writer.writerows(rows)

    logger.info(f"Generated sample vendor inventory feed: {output_path} ({len(rows)} records)")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Phase 3 Vendor Feed Producer")
    parser.add_argument("--file", "-f", help="Path to vendor CSV feed (.csv or .csv.gz)")
    parser.add_argument("--vendor-id", "-v", type=int, default=1, help="Vendor ID (default: 1)")
    parser.add_argument("--stream", "-s", default=DEFAULT_STREAM, help=f"Redis stream name (default: {DEFAULT_STREAM})")
    parser.add_argument("--chunk-size", "-c", type=int, default=DEFAULT_CHUNK_SIZE, help="Items per chunk (default: 500)")
    parser.add_argument("--generate-sample", help="Generate sample CSV feed file at this path")
    parser.add_argument("--sample-count", type=int, default=50, help="Number of records for sample generator")
    parser.add_argument("--redis-url", default=REDIS_URL, help="Redis URL connection string")

    args = parser.parse_args()

    if args.generate_sample:
        sample_file = generate_sample_feed(args.generate_sample, count=args.sample_count)
        # If no explicit file was passed, also publish the generated file
        if not args.file:
            args.file = sample_file

    if args.file:
        publish_vendor_feed(
            vendor_id=args.vendor_id,
            file_path=args.file,
            stream_name=args.stream,
            chunk_size=args.chunk_size,
        )
    elif not args.generate_sample:
        parser.print_help()


if __name__ == "__main__":
    main()
