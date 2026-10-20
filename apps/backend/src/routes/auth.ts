import { Router, Request, Response } from "express";
import { AuthService } from "../services/auth";
import { dbPool } from "../services/navigation";
import { AuthenticatedRequest } from "../types/auth";

const router = Router();

/**
 * POST /auth/register
 * Registers a new customer account with email and password
 */
router.post("/register", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, fullName, phone } = req.body;
    // Public registration strictly provisions CUSTOMER accounts only.
    // Merchant & administrative accounts are provisioned via secured internal channels.
    const role = "CUSTOMER";

    // 1. Validation
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
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
      accessToken,
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
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
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
      accessToken,
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
router.post("/refresh", async (req: Request, res: Response): Promise<any> => {
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
      AuthService.clearAuthCookies(res);
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const record = tokenRes.rows[0];

    // Check if token was revoked or expired
    if (record.revoked || new Date(record.expires_at) < new Date() || !record.is_active) {
      // Possible reuse detection: revoke all tokens for this user if compromised
      AuthService.clearAuthCookies(res);
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

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
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
