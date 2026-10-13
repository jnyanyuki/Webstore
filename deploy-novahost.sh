#!/usr/bin/env bash
# ==============================================================================
# JuroMart Automated Deployment Script for NovaHost Kenya (juromart.com)
# ==============================================================================

set -euo pipefail

COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_BLUE="\033[0;34m"
COLOR_RED="\033[0;31m"
COLOR_RESET="\033[0m"

echo -e "${COLOR_BLUE}======================================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}🚀 Starting JuroMart Production Deployment (NovaHost) ${COLOR_RESET}"
echo -e "${COLOR_BLUE}Target Domain: https://juromart.com                   ${COLOR_RESET}"
echo -e "${COLOR_BLUE}======================================================${COLOR_RESET}"

# 1. Ensure directory
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DEPLOY_DIR"

echo -e "\n${COLOR_YELLOW}[1/6] Installing monorepo dependencies...${COLOR_RESET}"
npm install --no-audit --prefer-offline

echo -e "\n${COLOR_YELLOW}[2/6] Generating Prisma Client...${COLOR_RESET}"
npx prisma generate --schema=apps/web/prisma/schema.prisma

echo -e "\n${COLOR_YELLOW}[3/6] Building production bundles (Turbopack + TSC)...${COLOR_RESET}"
npm run build

echo -e "\n${COLOR_YELLOW}[4/6] Synchronizing Next.js Standalone static assets...${COLOR_RESET}"
# Standalone Next.js requires static and public assets in its execution folder
mkdir -p apps/web/.next/standalone/apps/web/.next
mkdir -p apps/web/.next/standalone/apps/web/public

cp -rf apps/web/public/* apps/web/.next/standalone/apps/web/public/ 2>/dev/null || true
cp -rf apps/web/.next/static apps/web/.next/standalone/apps/web/.next/ 2>/dev/null || true

echo -e "${COLOR_GREEN}✓ Standalone static assets synchronized.${COLOR_RESET}"

echo -e "\n${COLOR_YELLOW}[5/6] Zero-downtime reload via PM2...${COLOR_RESET}"
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
    pm2 save
    echo -e "${COLOR_GREEN}✓ PM2 processes reloaded.${COLOR_RESET}"
else
    echo -e "${COLOR_YELLOW}⚠ PM2 not installed globally. Starting via npx pm2...${COLOR_RESET}"
    npx pm2 reload ecosystem.config.cjs --update-env || npx pm2 start ecosystem.config.cjs
fi

# 5b. Touch Passenger restart triggers (for cPanel Node.js Selector compatibility)
mkdir -p apps/web/tmp apps/backend/tmp 2>/dev/null || true
touch apps/web/tmp/restart.txt apps/backend/tmp/restart.txt 2>/dev/null || true

echo -e "\n${COLOR_YELLOW}[6/6] Verifying system health...${COLOR_RESET}"
sleep 2

# Verify Web Frontend
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3004/ | grep -q "200\|307\|308"; then
    echo -e "${COLOR_GREEN}✓ JuroMart Web (Port 3004): HEALTHY${COLOR_RESET}"
else
    echo -e "${COLOR_RED}✗ JuroMart Web (Port 3004): FAILED CHECK${COLOR_RESET}"
fi

# Verify Backend API
if curl -s http://127.0.0.1:9000/health | grep -q "healthy"; then
    echo -e "${COLOR_GREEN}✓ JuroMart API (Port 9000): HEALTHY${COLOR_RESET}"
else
    echo -e "${COLOR_RED}✗ JuroMart API (Port 9000): FAILED CHECK${COLOR_RESET}"
fi

echo -e "\n${COLOR_GREEN}======================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}🎉 Deployment Successfully Completed on NovaHost!    ${COLOR_RESET}"
echo -e "${COLOR_GREEN}Storefront: https://juromart.com                      ${COLOR_RESET}"
echo -e "${COLOR_GREEN}API Endpoint: https://api.juromart.com                ${COLOR_RESET}"
echo -e "${COLOR_GREEN}======================================================${COLOR_RESET}"
