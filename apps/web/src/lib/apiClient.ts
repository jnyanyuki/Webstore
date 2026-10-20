/**
 * JuroMart Centralized API Client
 * - Forwards credentials ('include') for cross-domain httpOnly session cookies (.juromart.com)
 * - Implements automated 401 response interceptor with token rotation & concurrency queuing
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
  ok: boolean;
}

export interface RequestOptions extends RequestInit {
  skipAuthRefresh?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(refreshed: boolean) => void> = [];

  constructor() {
    this.baseUrl = this.resolveBaseUrl();
  }

  private resolveBaseUrl(): string {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      // 1. If running on production juromart.com (e.g. juromart.com or www.juromart.com),
      // ALWAYS target https://api.juromart.com so httpOnly session cookies (.juromart.com) propagate
      // and obsolete/suspended Render service URLs in Vercel environment variables are bypassed.
      if (hostname === "juromart.com" || hostname.endsWith(".juromart.com")) {
        return "https://api.juromart.com";
      }

      // 2. Custom environment override (guarding against suspended webstore-czie service)
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl && !envUrl.includes("webstore-czie")) {
        return envUrl.replace(/\/$/, "");
      }
      return "http://localhost:9000";
    }

    const envUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes("webstore-czie")) {
      return envUrl.replace(/\/$/, "");
    }
    return "https://api.juromart.com";
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setAuthToken(token: string | null): void {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("juromart_access_token", token);
      const isJuromart =
        window.location.hostname === "juromart.com" ||
        window.location.hostname.endsWith(".juromart.com");
      const domainAttr = isJuromart ? "; domain=.juromart.com" : "";
      const secureAttr = window.location.protocol === "https:" ? "; secure" : "";
      document.cookie = `access_token=${token}; path=/${domainAttr}; max-age=${15 * 60}${secureAttr}; samesite=lax`;
    } else {
      localStorage.removeItem("juromart_access_token");
      const isJuromart =
        window.location.hostname === "juromart.com" ||
        window.location.hostname.endsWith(".juromart.com");
      const domainAttr = isJuromart ? "; domain=.juromart.com" : "";
      document.cookie = `access_token=; path=/${domainAttr}; max-age=0; samesite=lax`;
    }
  }

  public getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("juromart_access_token");
  }

  private subscribeTokenRefresh(cb: (refreshed: boolean) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(success: boolean) {
    this.refreshSubscribers.forEach((cb) => cb(success));
    this.refreshSubscribers = [];
  }

  /**
   * Executes HTTP request with automated cookie propagation and 401 token refresh recovery
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const token = this.getAuthToken();
    const configHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const config: RequestInit = {
      ...options,
      credentials: "include", // Essential for sharing httpOnly cookies across juromart.com and api.juromart.com
      headers: configHeaders,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err: any) {
      console.error(`[API Network Error] ${options.method || "GET"} ${url}:`, err);
      throw new Error("Unable to connect to JuroMart servers. Please check your network connection.");
    }

    // Handle 401 Unauthorized with token refresh rotation
    if (response.status === 401 && !options.skipAuthRefresh && !endpoint.includes("/auth/")) {
      if (this.isRefreshing) {
        // Wait for active refresh in-flight
        const refreshed = await new Promise<boolean>((resolve) => {
          this.subscribeTokenRefresh(resolve);
        });

        if (refreshed) {
          return this.request<T>(endpoint, { ...options, skipAuthRefresh: true });
        } else {
          throw new Error("Session expired. Please sign in again.");
        }
      }

      this.isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (refreshResponse.ok) {
          this.isRefreshing = false;
          this.onTokenRefreshed(true);
          // Retry original failed request
          return this.request<T>(endpoint, { ...options, skipAuthRefresh: true });
        } else {
          this.isRefreshing = false;
          this.onTokenRefreshed(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("juromart:unauthorized"));
          }
          throw new Error("Session expired. Please sign in again.");
        }
      } catch (refreshErr) {
        this.isRefreshing = false;
        this.onTokenRefreshed(false);
        throw refreshErr;
      }
    }

    // Parse JSON or text response
    let data: any;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === "object" && (data.error || data.message)) ||
        `Request failed with status ${response.status}`;
      const err = new Error(errorMessage) as any;
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
