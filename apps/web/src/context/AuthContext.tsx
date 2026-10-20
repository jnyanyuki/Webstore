"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/apiClient";
import { AuthUser, LoginCredentials, RegisterPayload } from "@webstore/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    // Only query /auth/me if there is an active session or cookie, avoiding unnecessary 401 console logs for guests
    const token = typeof window !== "undefined" ? apiClient.getAuthToken() : null;
    const hasCookie = typeof document !== "undefined" && document.cookie.includes("access_token");
    if (!token && !hasCookie) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<{ success: boolean; user: AuthUser }>(
        "/auth/me",
        { skipAuthRefresh: false }
      );
      if (response && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      apiClient.setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Listen to global unauthorized events triggered by apiClient when refresh token is expired
    const handleUnauthorized = () => {
      apiClient.setAuthToken(null);
      setUser(null);
    };

    window.addEventListener("juromart:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("juromart:unauthorized", handleUnauthorized);
    };
  }, [fetchCurrentUser]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; user: AuthUser; accessToken?: string }>(
        "/auth/login",
        credentials
      );
      if (response && response.user) {
        setUser(response.user);
        if (response.accessToken) {
          apiClient.setAuthToken(response.accessToken);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; user: AuthUser; accessToken?: string }>(
        "/auth/register",
        payload
      );
      if (response && response.user) {
        setUser(response.user);
        if (response.accessToken) {
          apiClient.setAuthToken(response.accessToken);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.post("/auth/logout", {});
    } catch (err) {
      console.warn("[AuthContext] Logout API error:", err);
    } finally {
      apiClient.setAuthToken(null);
      setUser(null);
      setIsLoading(false);
      // Redirect to home if on a protected route or refresh state
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const refreshUser = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
