// ==============================================================================
// NovaHost Kenya cPanel Node.js Selector Entrypoint for JuroMart Backend API
// ==============================================================================

const path = require("path");
const fs = require("fs");

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = process.env.PORT || 9000;

// 1. Auto-extract production bundle if backend zip archive is uploaded
const zipFile = path.join(__dirname, "backend-production.zip");
if (fs.existsSync(zipFile)) {
  console.log("[JuroMart API] Found backend-production.zip. Extracting...");
  try {
    const { execSync } = require("child_process");
    execSync(`unzip -o -q "${zipFile}" -d "${__dirname}"`, { stdio: "inherit" });
    console.log("[JuroMart API] Extraction complete!");
    fs.unlinkSync(zipFile);
  } catch (err) {
    console.error("[JuroMart API] Extraction failed:", err.message);
  }
}

// 2. Load compiled backend entrypoint
const serverPath = path.join(__dirname, "dist", "index.js");

if (fs.existsSync(serverPath)) {
  console.log(`[JuroMart API] Starting backend server from: ${serverPath}`);
  require(serverPath);
} else {
  console.error(`[JuroMart API] Entrypoint not found at: ${serverPath}`);
  process.exit(1);
}
