/**
 * PM2 Ecosystem Configuration for JuroMart (juromart.com)
 * Optimized for NovaHost Kenya Cloud VPS / Dedicated Server
 */

module.exports = {
  apps: [
    // 1. JuroMart Next.js Standalone Web Frontend
    {
      name: "juromart-web",
      cwd: "./apps/web",
      script: "./.next/standalone/apps/web/server.js",
      instances: "max", // Utilize all available CPU cores on NovaHost VPS
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3004,
        HOSTNAME: "127.0.0.1",
        NEXT_PUBLIC_SITE_URL: "https://juromart.com",
        NEXT_PUBLIC_API_URL: "https://api.juromart.com",
        NEXT_PUBLIC_WS_URL: "wss://juromart.com/ws/notifications",
        BACKEND_INTERNAL_URL: "http://127.0.0.1:9000",
      },
      error_file: "./logs/pm2-web-error.log",
      out_file: "./logs/pm2-web-out.log",
      merge_logs: true,
      time: true,
    },

    // 2. JuroMart Express / Medusa Backend API
    {
      name: "juromart-api",
      cwd: "./apps/backend",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 9000,
        CORS_ALLOWED_ORIGINS: "https://juromart.com,https://www.juromart.com,https://api.juromart.com,https://seller.juromart.com",
      },
      error_file: "./logs/pm2-api-error.log",
      out_file: "./logs/pm2-api-out.log",
      merge_logs: true,
      time: true,
    },

    // 3. Real-Time WebSocket Notification Hub (Python)
    {
      name: "juromart-ws",
      cwd: "./",
      script: "./scripts/ws_notification_hub.py",
      interpreter: "python3",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        PORT: 8000,
        HOST: "127.0.0.1",
      },
      error_file: "./logs/pm2-ws-error.log",
      out_file: "./logs/pm2-ws-out.log",
      merge_logs: true,
      time: true,
    },

    // 4. Background Sync Worker (Vendor Feeds & Catalog Deltas)
    {
      name: "juromart-sync",
      cwd: "./",
      script: "./scripts/sync_worker.py",
      interpreter: "python3",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      error_file: "./logs/pm2-sync-error.log",
      out_file: "./logs/pm2-sync-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
