// ==============================================================================
// JuroMart Automated 1-Click FTP Deployment to NovaHost Kenya (juromart.com)
// Connects to NovaHost cPanel LiteSpeed Passenger Node.js Environment
// ==============================================================================

const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEPLOY_DIR = path.join(ROOT_DIR, "deploy_dist", "apps", "web");
const ZIP_FILE = path.join(ROOT_DIR, "juromart-production.zip");

const FTP_CONFIG = {
  host: process.env.NOVAHOST_FTP_HOST || "213.139.204.9",
  user: process.env.NOVAHOST_FTP_USER || "deploy@juromart.com",
  password: process.env.NOVAHOST_FTP_PASSWORD || "Juromart@9165",
  port: 21,
  secure: false,
};

async function warmUpSite(url, maxAttempts = 6) {
  console.log(`\n🌐 Warming up ${url}...`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 15000 }, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ status: res.statusCode, body: data }));
        });
        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Request timed out"));
        });
      });

      if (result.status === 200) {
        console.log(`✅ [Warmup Attempt ${attempt}] Received HTTP 200 OK from ${url}!`);
        return true;
      } else {
        console.log(`⏳ [Warmup Attempt ${attempt}] Received HTTP ${result.status}. Waiting 3s...`);
      }
    } catch (err) {
      console.log(`⏳ [Warmup Attempt ${attempt}] Server warming up (${err.message}). Waiting 3s...`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function deploy() {
  console.log("====================================================================");
  console.log("🚀 JuroMart 1-Click Production Deployment to NovaHost Kenya");
  console.log(`Target: https://juromart.com  |  Server: ${FTP_CONFIG.host}`);
  console.log(`FTP Account: ${FTP_CONFIG.user}`);
  console.log("====================================================================\n");

  const startTime = Date.now();

  // ----------------------------------------------------------------------------
  // 1. Build Verification
  // ----------------------------------------------------------------------------
  const standalonePath = path.join(ROOT_DIR, "apps", "web", ".next", "standalone");
  if (!fs.existsSync(standalonePath) || process.argv.includes("--build")) {
    console.log("📦 [1/5] Building Next.js Standalone production packages...");
    execSync("npm run build", { cwd: ROOT_DIR, stdio: "inherit" });
  } else {
    console.log("✓ [1/5] Using existing production build (pass --build to force fresh build)");
  }

  // ----------------------------------------------------------------------------
  // 2. Package Assembly in deploy_dist
  // ----------------------------------------------------------------------------
  console.log("📁 [2/5] Assembling production standalone bundle...");
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });

  const standaloneWebDir = path.join(standalonePath, "apps", "web");
  if (fs.existsSync(standaloneWebDir)) {
    fs.cpSync(standaloneWebDir, DEPLOY_DIR, { recursive: true });
  }

  const standaloneModules = path.join(standalonePath, "node_modules");
  if (fs.existsSync(standaloneModules)) {
    fs.cpSync(standaloneModules, path.join(DEPLOY_DIR, "node_modules"), { recursive: true });
  }

  const publicDir = path.join(ROOT_DIR, "apps", "web", "public");
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, path.join(DEPLOY_DIR, "public"), { recursive: true });
  }

  const staticDir = path.join(ROOT_DIR, "apps", "web", ".next", "static");
  if (fs.existsSync(staticDir)) {
    const targetStatic = path.join(DEPLOY_DIR, ".next", "static");
    fs.mkdirSync(targetStatic, { recursive: true });
    fs.cpSync(staticDir, targetStatic, { recursive: true });
  }

  // Copy entrypoints and environment
  fs.copyFileSync(path.join(ROOT_DIR, "apps", "web", "app.js"), path.join(DEPLOY_DIR, "app.js"));
  fs.copyFileSync(path.join(ROOT_DIR, "apps", "web", ".env"), path.join(DEPLOY_DIR, ".env"));
  fs.copyFileSync(path.join(ROOT_DIR, "apps", "web", ".htaccess"), path.join(DEPLOY_DIR, ".htaccess"));
  fs.copyFileSync(path.join(ROOT_DIR, "apps", "web", "package.json"), path.join(DEPLOY_DIR, "package.json"));

  const tmpDir = path.join(DEPLOY_DIR, "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "restart.txt"), `${Date.now()}`);

  // ----------------------------------------------------------------------------
  // 3. Compress into Production ZIP
  // ----------------------------------------------------------------------------
  console.log("🗜️  [3/5] Compressing production files into atomic zip archive...");
  if (fs.existsSync(ZIP_FILE)) {
    fs.unlinkSync(ZIP_FILE);
  }
  execSync(`tar -a -cf "${ZIP_FILE}" *`, { cwd: DEPLOY_DIR, stdio: "ignore" });

  const zipStats = fs.statSync(ZIP_FILE);
  const zipMb = (zipStats.size / 1024 / 1024).toFixed(2);
  console.log(`✓ Production archive created: juromart-production.zip (${zipMb} MB)`);

  // ----------------------------------------------------------------------------
  // 4. FTP Upload to NovaHost Kenya
  // ----------------------------------------------------------------------------
  console.log(`📡 [4/5] Connecting to NovaHost FTP (${FTP_CONFIG.host})...`);
  const client = new ftp.Client();
  client.ftp.timeout = 600000; // 10 minutes socket timeout for large bundles

  try {
    await client.access(FTP_CONFIG);
    console.log("✓ Authenticated successfully with NovaHost Pure-FTPd.");

    const pwd = await client.pwd();
    console.log(`📂 Remote root directory: ${pwd}`);

    // If connected with master root instead of dedicated deploy user, navigate to apps/web
    if (pwd !== "/" && !pwd.endsWith("apps/web")) {
      await client.ensureDir("apps/web");
    }

    // Track upload progress
    let lastLog = 0;
    client.trackProgress((info) => {
      const now = Date.now();
      if (now - lastLog > 1000 || info.bytesOverall === zipStats.size) {
        lastLog = now;
        const uploadedMb = (info.bytesOverall / 1024 / 1024).toFixed(2);
        const percent = ((info.bytesOverall / zipStats.size) * 100).toFixed(1);
        process.stdout.write(`\r⬆️  Uploading ${info.name}: ${uploadedMb} / ${zipMb} MB (${percent}%)   `);
      }
    });

    console.log(`⬆️  Uploading juromart-production.zip (${zipMb} MB)...`);
    await client.uploadFrom(ZIP_FILE, "juromart-production.zip");
    process.stdout.write("\n");
    console.log("✓ juromart-production.zip uploaded.");

    // Upload bootloader entrypoints
    console.log("⬆️  Updating app.js bootloader, .htaccess, and restart trigger...");
    await client.uploadFrom(path.join(DEPLOY_DIR, "app.js"), "app.js");
    await client.uploadFrom(path.join(DEPLOY_DIR, ".htaccess"), ".htaccess");
    await client.ensureDir("tmp");
    await client.uploadFrom(path.join(DEPLOY_DIR, "tmp", "restart.txt"), "restart.txt");
    await client.cd("..");

    console.log("✓ Phusion Passenger reload triggered via tmp/restart.txt.");

    // ----------------------------------------------------------------------------
    // 5. Verification & Warm-up
    // ----------------------------------------------------------------------------
    console.log("⏳ [5/5] Waiting 3 seconds for LiteSpeed process initialization...");
    await new Promise((r) => setTimeout(r, 3000));

    const ok = await warmUpSite("https://juromart.com");

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n====================================================================");
    if (ok) {
      console.log(`🎉 JuroMart IS LIVE IN PRODUCTION! (Completed in ${duration}s)`);
      console.log("🔗 Storefront: https://juromart.com");
      console.log("🔗 Seller Center: https://juromart.com/seller");
    } else {
      console.log(`⚠️  Files deployed in ${duration}s. Server still warming up.`);
      console.log("Check https://juromart.com in your browser.");
    }
    console.log("====================================================================\n");
  } catch (err) {
    console.error("\n❌ Deployment failed:", err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
