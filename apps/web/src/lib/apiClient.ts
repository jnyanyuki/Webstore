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

      // 3. If running strictly on local dev machine:
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:9000";
      }

      // 4. Any remote deployment (e.g. *.vercel.app) defaults to production API
      return "https://api.juromart.com";
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

  /**
   * True when the backend has issued a session (non-secret `jm_session` flag cookie).
   * Tokens themselves are httpOnly and never readable by page scripts.
   */
  public hasSessionHint(): boolean {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((c) => c.trim().startsWith("jm_session="));
  }

  /**
   * Removes token copies written to localStorage / JS cookies by an earlier build.
   */
  public purgeLegacyClientTokens(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("juromart_access_token");
    } catch {
      /* storage may be unavailable (private mode) */
    }
    const host = window.location.hostname;
    const domains = host === "juromart.com" || host.endsWith(".juromart.com") ? ["; domain=.juromart.com", ""] : [""];
    // JS cannot overwrite the server's httpOnly cookie, so this only removes the legacy JS-set copy
    domains.forEach((d) => {
      document.cookie = `access_token=; path=/${d}; max-age=0; samesite=lax`;
    });
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

    const config: RequestInit = {
      ...options,
      credentials: "include", // Essential for sharing httpOnly cookies across juromart.com and api.juromart.com
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err: any) {
      console.error(`[API Network Error] ${options.method || "GET"} ${url}:`, err);
      throw new Error("Unable to connect to JuroMart servers. Please check your network connection.");
    }

    // Handle 401 Unauthorized with token refresh rotation.
    // Credential endpoints are excluded; /auth/me IS eligible so sessions survive access-token expiry.
    const isCredentialEndpoint = /\/auth\/(login|register|refresh|logout)\b/.test(endpoint);
    if (response.status === 401 && !options.skipAuthRefresh && !isCredentialEndpoint) {
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
