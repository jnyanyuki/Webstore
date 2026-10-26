"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/apiClient";
import { AuthUser, LoginCredentials, RegisterPayload } from "@webstore/types";

export function isUserProfileComplete(user: AuthUser | null): boolean {
  if (!user) return false;
  const hasName = Boolean(user.fullName && user.fullName.trim().length >= 2);
  const hasPhone = Boolean(user.phone && user.phone.trim().length >= 9);
  return hasName && hasPhone;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser | undefined>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (data: { fullName: string; phone: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    // Guests have no jm_session flag - skip /auth/me to avoid a guaranteed 401 in the console
    if (!apiClient.hasSessionHint()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<{ success: boolean; user: AuthUser }>("/auth/me");
      setUser(response?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    apiClient.purgeLegacyClientTokens();
    fetchCurrentUser();

    // Listen to global unauthorized events triggered by apiClient when refresh token is expired
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("juromart:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("juromart:unauthorized", handleUnauthorized);
    };
  }, [fetchCurrentUser]);

  const login = async (credentials: LoginCredentials): Promise<AuthUser | undefined> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; user: AuthUser }>(
        "/auth/login",
        credentials
      );
      if (response && response.user) {
        setUser(response.user);
        return response.user;
      }
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; user: AuthUser }>(
        "/auth/register",
        payload
      );
      if (response && response.user) {
        setUser(response.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { fullName: string; phone: string }): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const response = await apiClient.put<{ success: boolean; user: AuthUser }>("/auth/profile", data);
      if (response && response.user) {
        setUser(response.user);
        return response.user;
      }
      const updatedLocally: AuthUser = {
        ...(user || { id: "user", email: "", role: "CUSTOMER", createdAt: new Date().toISOString() }),
        fullName: data.fullName,
        phone: data.phone,
      };
      setUser(updatedLocally);
      return updatedLocally;
    } catch (err: any) {
      if (user) {
        const updatedLocally: AuthUser = {
          ...user,
          fullName: data.fullName,
          phone: data.phone,
        };
        setUser(updatedLocally);
        return updatedLocally;
      }
      throw err;
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
        isProfileComplete: isUserProfileComplete(user),
        login,
        register,
        updateProfile,
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
