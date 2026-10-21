import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { dbPool } from "./navigation";
import { AuthUser, TokenPayload, AuthenticatedRequest } from "../types/auth";

const IS_PRODUCTION = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

// JWT secret MUST come from the environment in production. A hardcoded fallback would let
// anyone who reads the repository forge tokens.
const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (IS_PRODUCTION) {
    throw new Error(
      "[Auth] JWT_SECRET is missing or shorter than 32 characters. Refusing to start in production."
    );
  }
  // Development only: ephemeral per-process secret (sessions reset on restart)
  console.warn("[Auth] JWT_SECRET not set - using an ephemeral development secret.");
  return crypto.randomBytes(48).toString("hex");
};

const JWT_SECRET = resolveJwtSecret();
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Non-sensitive, JS-readable flag telling the frontend a session exists (contains no token).
export const SESSION_HINT_COOKIE = "jm_session";

const getRequestHost = (req?: any): string =>
  String(req?.headers?.["x-forwarded-host"] || req?.headers?.host || "")
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();

/**
 * Cookie domain is derived from the host that actually served the request.
 * - api.juromart.com  -> ".juromart.com" (shared with juromart.com / www.juromart.com)
 * - *.onrender.com / localhost -> host-only cookie (browsers reject foreign domains)
 */
const getCookieDomain = (req?: any): string | undefined => {
  if (process.env.COOKIE_DOMAIN) {
    return process.env.COOKIE_DOMAIN;
  }
  const host = getRequestHost(req);
  if (host === "juromart.com" || host.endsWith(".juromart.com")) {
    return ".juromart.com";
  }
  return undefined;
};

const isSecureRequest = (req?: any): boolean => {
  const proto = String(req?.headers?.["x-forwarded-proto"] || "").split(",")[0].trim();
  return proto === "https" || Boolean(req?.secure) || IS_PRODUCTION;
};

export class AuthService {
  private static tablesInitialized = false;

  /**
   * Automatically initializes users and refresh_tokens tables if they do not exist
   */
  public static async ensureTablesExist(): Promise<void> {
    if (this.tablesInitialized) return;
    try {
      await dbPool.query(`
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

        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          token_hash VARCHAR(255) UNIQUE NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          revoked BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
      `);
      this.tablesInitialized = true;
    } catch (err) {
      console.error("[Auth Service] Table initialization error:", err);
    }
  }

  /**
   * Generates a cryptographic scrypt password hash with unique salt
   */
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  /**
   * Verifies password in constant time against stored hash
   */
  public static verifyPassword(password: string, combinedHash: string): boolean {
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

  /**
   * Hashes a refresh token before storing in database (Defense-in-depth)
   */
  public static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Signs short-lived Access Token (15 minutes)
   */
  public static generateAccessToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: "access",
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  /**
   * Signs long-lived Refresh Token (7 days) and records it in database
   */
  public static async generateRefreshToken(userId: string): Promise<string> {
    await this.ensureTablesExist();

    const rawToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await dbPool.query(
      `INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
      [tokenHash, userId, expiresAt]
    );

    return rawToken;
  }

  /**
   * Sets httpOnly token cookies plus a non-sensitive session hint cookie
   */
  public static setAuthCookies(res: Response, accessToken: string, refreshToken: string, req?: any): void {
    const base = {
      secure: isSecureRequest(req),
      sameSite: "lax" as const,
      domain: getCookieDomain(req),
      path: "/",
    };
    const refreshMaxAge = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // 15-minute access token (httpOnly - never readable by page scripts)
    res.cookie("access_token", accessToken, { ...base, httpOnly: true, maxAge: 15 * 60 * 1000 });

    // 7-day refresh token (httpOnly)
    res.cookie("refresh_token", refreshToken, { ...base, httpOnly: true, maxAge: refreshMaxAge });

    // Session presence flag only - contains no credentials
    res.cookie(SESSION_HINT_COOKIE, "1", { ...base, httpOnly: false, maxAge: refreshMaxAge });
  }

  /**
   * Clears auth cookies upon logout
   */
  public static clearAuthCookies(res: Response, req?: any): void {
    const base = {
      secure: isSecureRequest(req),
      sameSite: "lax" as const,
      domain: getCookieDomain(req),
      path: "/",
    };
    res.clearCookie("access_token", { ...base, httpOnly: true });
    res.clearCookie("refresh_token", { ...base, httpOnly: true });
    res.clearCookie(SESSION_HINT_COOKIE, { ...base, httpOnly: false });
  }

  /**
   * Express Authentication Middleware
   */
  public static authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      // 1. Extract from Authorization Bearer header or httpOnly cookie
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
      }

      if (!token) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required to access this resource",
        });
      }

      // 2. Verify JWT signature and expiration
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
      if (payload.type !== "access") {
        return res.status(401).json({ error: "Invalid token type" });
      }

      // 3. Fetch user record to confirm active status
      await AuthService.ensureTablesExist();
      const userRes = await dbPool.query(
        `SELECT id, email, full_name, phone, role, created_at, is_active FROM users WHERE id = $1`,
        [payload.userId]
      );

      if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
        return res.status(401).json({ error: "User account inactive or not found" });
      }

      const row = userRes.rows[0];
      const authUser: AuthUser = {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        phone: row.phone,
        role: row.role,
        createdAt: row.created_at,
      };

      (req as any).user = authUser;
      req.authUser = authUser;

      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "TokenExpired",
          message: "Access token expired. Please refresh your session.",
        });
      }
      return res.status(401).json({ error: "Invalid or malformed authentication token" });
    }
  };
}
