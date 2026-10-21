const { Pool } = require("pg");
const crypto = require("crypto");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_4ZYKLx6ArJNH@ep-royal-cake-b9cgphao.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, combinedHash) {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

async function main() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const email = "abokos@juromart.com";
  const password = "Abokos@99";
  const fullName = "Super Admin Abokos";
  const role = "ADMIN";

  console.log(`Setting up Super Admin: ${email}`);

  // 1. Ensure table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150),
      phone VARCHAR(30),
      role VARCHAR(30) DEFAULT 'CUSTOMER',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  const passwordHash = hashPassword(password);
  const verifyCheck = verifyPassword(password, passwordHash);
  if (!verifyCheck) {
    throw new Error("Self-check failed: generated password hash could not be verified!");
  }

  // 2. Upsert user
  const upsertQuery = `
    INSERT INTO users (email, password_hash, full_name, role, is_active, updated_at)
    VALUES ($1, $2, $3, $4, TRUE, NOW())
    ON CONFLICT (email) 
    DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      is_active = TRUE,
      updated_at = NOW()
    RETURNING id, email, full_name, role, is_active, updated_at;
  `;

  const result = await pool.query(upsertQuery, [email, passwordHash, fullName, role]);
  console.log("Super Admin Record Successfully Saved:");
  console.log(result.rows[0]);

  await pool.end();
}

main().catch((err) => {
  console.error("Failed to setup super admin:", err);
  process.exit(1);
});
