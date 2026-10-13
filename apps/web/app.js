// ==============================================================================
// NovaHost Kenya cPanel Node.js Selector Entrypoint (CloudLinux Passenger)
// ==============================================================================

const path = require("path");
const fs = require("fs");

process.env.NODE_ENV = "production";
process.env.PORT = process.env.PORT || 3004;
process.env.HOSTNAME = "127.0.0.1";

// 1. Auto-extract production bundle if zip archive is uploaded
const zipFile = path.join(__dirname, "juromart-production.zip");
if (fs.existsSync(zipFile)) {
  console.log("[JuroMart] Found juromart-production.zip. Extracting production bundle...");
  try {
    const { execSync } = require("child_process");
    execSync(`unzip -o -q "${zipFile}" -d "${__dirname}"`, { stdio: "inherit" });
    console.log("[JuroMart] Extraction complete!");
    fs.unlinkSync(zipFile);
  } catch (err) {
    console.error("[JuroMart] Extraction failed:", err.message);
  }
}

// 2. Support both monorepo root and direct standalone execution
const candidatePaths = [
  path.join(__dirname, "server.js"),
  path.join(__dirname, ".next", "standalone", "apps", "web", "server.js"),
  path.join(__dirname, ".next", "standalone", "server.js"),
];

const standaloneServer = candidatePaths.find((p) => fs.existsSync(p));

if (standaloneServer) {
  console.log(`[JuroMart] Loading Next.js Standalone server from: ${standaloneServer}`);
  require(standaloneServer);

} else {
  console.error(
    `[JuroMart] Next.js server.js not found in candidate paths:\n${candidatePaths.join(
      "\n"
    )}\nPlease ensure 'npm run build' was executed and the standalone build was uploaded.`
  );
  process.exit(1);
}
