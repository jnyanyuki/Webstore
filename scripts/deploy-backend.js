// ==============================================================================
// JuroMart 1-Click Backend API Deployment to NovaHost Kenya (juromart.com/api)
// ==============================================================================

const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "apps", "backend");
const DEPLOY_DIR = path.join(ROOT_DIR, "deploy_dist", "apps", "backend");
const ZIP_FILE = path.join(ROOT_DIR, "backend-production.zip");

const FTP_CONFIG = {
  host: process.env.NOVAHOST_FTP_HOST || "213.139.204.9",
  user: process.env.NOVAHOST_BACKEND_FTP_USER || "deploy-backend@juromart.com",
  password: process.env.NOVAHOST_BACKEND_FTP_PASSWORD || "Juromart@9165",
  port: 21,
  secure: false,
};

async function deployBackend() {
  console.log("====================================================================");
  console.log("🚀 JuroMart Backend API Deployment to NovaHost Kenya");
  console.log(`Target: https://juromart.com/api  |  Server: ${FTP_CONFIG.host}`);
  console.log(`FTP Account: ${FTP_CONFIG.user}`);
  console.log("====================================================================\n");

  const startTime = Date.now();

  // 1. Build Backend
  console.log("📦 [1/4] Compiling TypeScript backend...");
  execSync("npm --prefix apps/backend run build", { cwd: ROOT_DIR, stdio: "inherit" });

  // 2. Assemble Bundle
  console.log("📁 [2/4] Assembling backend production bundle...");
  if (fs.existsSync(DEPLOY_DIR)) {
    fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });

  // Copy dist
  fs.cpSync(path.join(BACKEND_DIR, "dist"), path.join(DEPLOY_DIR, "dist"), { recursive: true });
  // Copy app.js bootloader
  fs.copyFileSync(path.join(BACKEND_DIR, "app.js"), path.join(DEPLOY_DIR, "app.js"));
  // Copy package.json
  fs.copyFileSync(path.join(BACKEND_DIR, "package.json"), path.join(DEPLOY_DIR, "package.json"));
  // Copy .env
  if (fs.existsSync(path.join(BACKEND_DIR, ".env"))) {
    fs.copyFileSync(path.join(BACKEND_DIR, ".env"), path.join(DEPLOY_DIR, ".env"));
  }

  // Create restart trigger
  const tmpDir = path.join(DEPLOY_DIR, "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "restart.txt"), `${Date.now()}`);

  // 3. Compress into zip
  console.log("🗜️  [3/4] Compressing backend archive...");
  if (fs.existsSync(ZIP_FILE)) fs.unlinkSync(ZIP_FILE);
  execSync(`tar -a -cf "${ZIP_FILE}" *`, { cwd: DEPLOY_DIR, stdio: "ignore" });
  const zipMb = (fs.statSync(ZIP_FILE).size / 1024 / 1024).toFixed(2);
  console.log(`✓ Archive created: backend-production.zip (${zipMb} MB)`);

  // 4. FTP Upload
  console.log(`📡 [4/4] Connecting to NovaHost FTP (${FTP_CONFIG.host})...`);
  const client = new ftp.Client();
  client.ftp.verbose = false;
  client.ftp.timeout = 60000;

  try {
    await client.access(FTP_CONFIG);
    console.log("✓ Authenticated with NovaHost FTP.");

    const pwd = await client.pwd();
    if (pwd !== "/" && !pwd.endsWith("apps/backend")) {
      await client.ensureDir("apps/backend");
    }

    client.trackProgress((info) => {
      const mb = (info.bytesOverall / 1024 / 1024).toFixed(2);
      process.stdout.write(`\r⬆️  Uploading ${info.name}: ${mb} MB   `);
    });

    console.log("⬆️  Uploading backend-production.zip and app.js...");
    await client.uploadFrom(ZIP_FILE, "backend-production.zip");
    process.stdout.write("\n");
    await client.uploadFrom(path.join(DEPLOY_DIR, "app.js"), "app.js");
    await client.ensureDir("tmp");
    await client.uploadFrom(path.join(DEPLOY_DIR, "tmp", "restart.txt"), "restart.txt");

    console.log("✓ Backend deployed and Passenger reload triggered!");
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 JuroMart Backend API Live in ${duration}s!`);
    console.log("🔗 Health Endpoint: https://juromart.com/api/health");
  } catch (err) {
    console.error("\n❌ Backend Deployment failed:", err.message);
    if (err.message.includes("530")) {
      console.log("\n💡 Tip: Create an FTP Account for apps/backend in cPanel:");
      console.log("   - Log In: deploy-backend@juromart.com");
      console.log("   - Directory: /home/juromart/apps/backend");
      console.log("   - Password: Juromart@9165\n");
    }
    process.exit(1);
  } finally {
    client.close();
  }
}

deployBackend();
