import { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: string;
  createdAt: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
  body: any;
  cookies: Record<string, any>;
  headers: Record<string, any>;
  params: any;
  query: any;
}
