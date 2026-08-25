import type { ApiResponse } from "@compsphere/types";

// Structured error so callers can inspect status + API error code
export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Use relative URL by default so requests go through the Vite dev proxy.
// Set VITE_API_URL only when the backend is on a different origin.
const API_BASE = import.meta.env.VITE_API_URL || "";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    
    // Add default headers
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Include credentials (cookies)
    options.credentials = "include";
    options.headers = headers;

    const response = await fetch(url, options);
    
    let json: ApiResponse<T>;
    try {
      json = await response.json();
    } catch {
      throw new ApiError(response.status, `HTTP error ${response.status}: ${response.statusText}`);
    }

    if (!response.ok || !json.success) {
      throw new ApiError(
        response.status,
        (json as unknown as Record<string, string>).error || response.statusText || "Request failed",
        json as unknown as Record<string, unknown>
      );
    }

    return json.data as T;
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();
export default api;
