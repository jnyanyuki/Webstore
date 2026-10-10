"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabasePoolOptions = void 0;
/**
 * Ultra High-Throughput Connection Pool Configuration (Tuned for 500 CCU Parallel Checkouts)
 */
const getDatabasePoolOptions = () => {
    const isPgBouncer = process.env.DB_PGBOUNCER === "true";
    return {
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "webstore_db",
        // Connection pool limits scaled for 500 CCU
        extra: {
            max: isPgBouncer ? 100 : 30, // Scaled for 500 parallel incoming buyer threads
            min: 10,
            idleTimeoutMillis: 15000,
            connectionTimeoutMillis: 2000,
            statement_timeout: 5000, // Instant 5s query timeout prevents lock stacking
        },
    };
};
exports.getDatabasePoolOptions = getDatabasePoolOptions;
