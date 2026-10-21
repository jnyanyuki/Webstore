import { Router, Request, Response } from "express";
import { AuthService } from "../services/auth";
import { dbPool } from "../services/navigation";
import { AuthenticatedRequest } from "../types/auth";

const router = Router();

/**
 * Lightweight in-memory fixed-window rate limiter (per client IP + route).
 * Suitable for a single Render instance; move to Redis if the API is scaled horizontally.
 */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const getClientIp = (req: Request): string =>
  String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();

const rateLimit =
  (name: string, max: number, windowMs: number) =>
  (req: Request, res: Response, next: () => void): any => {
    const key = `${name}:${getClientIp(req)}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000).toString());
      return res
        .status(429)
        .json({ error: "Too many attempts. Please wait a few minutes and try again." });
    }
    next();
  };

// Periodically evict expired buckets to bound memory
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s-]{9,16}$/;

/**
 * POST /auth/register
 * Registers a new customer account with email and password
 */
router.post("/register", rateLimit("register", 5, 60 * 60 * 1000), async (req: Request, res: Response): Promise<any> => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const fullName = typeof req.body?.fullName === "string" ? req.body.fullName.trim() : "";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
    // Public registration strictly provisions CUSTOMER accounts only.
    // Merchant & administrative accounts are provisioned via secured internal channels.
    const role = "CUSTOMER";

    // 1. Validation
    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: "Password must be between 8 and 128 characters long" });
    }
    if (fullName.length > 150) {
      return res.status(400).json({ error: "Full name is too long" });
    }
    if (phone && !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    await AuthService.ensureTablesExist();

    // 2. Check if user already exists
    const existing = await dbPool.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // 3. Hash password and insert user
    const passwordHash = AuthService.hashPassword(password);
    const result = await dbPool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role) 
       VALUES (LOWER($1), $2, $3, $4, $5) 
       RETURNING id, email, full_name, phone, role, created_at`,
      [email, passwordHash, fullName || null, phone || null, role]
    );

    const user = result.rows[0];

    // 4. Issue tokens and set cookies
    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = await AuthService.generateRefreshToken(user.id);
    AuthService.setAuthCookies(res, accessToken, refreshToken, req);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error("[Auth Register Error]:", error);
    return res.status(500).json({ error: "Failed to register account" });
  }
});

/**
 * POST /auth/login
 * Authenticates user credentials and issues session tokens
 */
router.post("/login", rateLimit("login", 10, 15 * 60 * 1000), async (req: Request, res: Response): Promise<any> => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password || email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    await AuthService.ensureTablesExist();

    // 1. Look up user by email
    const result = await dbPool.query(
      `SELECT id, email, password_hash, full_name, phone, role, is_active, created_at 
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: "Account has been suspended. Please contact support." });
    }

    // 2. Verify password
    const passwordValid = AuthService.verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Issue tokens and set cookies
    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = await AuthService.generateRefreshToken(user.id);
    AuthService.setAuthCookies(res, accessToken, refreshToken, req);

    return res.status(200).json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error("[Auth Login Error]:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

/**
 * POST /auth/refresh
 * Rotates the refresh token and issues a new short-lived access token
 */
router.post("/refresh", rateLimit("refresh", 60, 15 * 60 * 1000), async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    await AuthService.ensureTablesExist();
    const tokenHash = AuthService.hashToken(token);

    // Look up token in database
    const tokenRes = await dbPool.query(
      `SELECT rt.id, rt.user_id, rt.revoked, rt.expires_at, u.email, u.role, u.is_active 
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      AuthService.clearAuthCookies(res, req);
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const record = tokenRes.rows[0];

    // Check if token was revoked or expired
    if (record.revoked || new Date(record.expires_at) < new Date() || !record.is_active) {
      // Possible reuse detection: revoke all tokens for this user if compromised
      AuthService.clearAuthCookies(res, req);
      return res.status(401).json({ error: "Refresh token expired or revoked" });
    }

    // Revoke old token (Token rotation pattern)
    await dbPool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [record.id]);

    // Issue new token pair
    const newAccessToken = AuthService.generateAccessToken({
      id: record.user_id,
      email: record.email,
      role: record.role,
    });
    const newRefreshToken = await AuthService.generateRefreshToken(record.user_id);
    AuthService.setAuthCookies(res, newAccessToken, newRefreshToken, req);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[Auth Refresh Error]:", error);
    return res.status(500).json({ error: "Failed to refresh session" });
  }
});

/**
 * POST /auth/logout
 * Revokes refresh token in DB and clears cookies
 */
router.post("/logout", async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;

    if (token) {
      await AuthService.ensureTablesExist();
      const tokenHash = AuthService.hashToken(token);
      await dbPool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [
        tokenHash,
      ]);
    }

    AuthService.clearAuthCookies(res, req);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    console.error("[Auth Logout Error]:", error);
    AuthService.clearAuthCookies(res, req);
    return res.status(200).json({ success: true });
  }
});

/**
 * GET /auth/me
 * Protected endpoint returning current session user
 */
router.get("/me", AuthService.authenticate as any, (req: AuthenticatedRequest, res: Response): any => {
  return res.status(200).json({
    success: true,
    user: req.authUser || (req as any).user,
  });
});

export default router;
