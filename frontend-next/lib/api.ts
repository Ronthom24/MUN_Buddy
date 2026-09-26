const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "mb_token";
const DELEGATE_TOKEN_KEY = "mb_delegate_token";

const ADMIN_VIEW_TOKEN_KEY = "mb_admin_view_token";

/**
 * Organizer and delegate sessions are separate identities that can be live
 * in the same browser at once (e.g. testing both roles), so they can't share
 * one localStorage slot -- request() picks the right one by route, since
 * every delegate page lives under /delegate and everything else is
 * organizer-facing.
 */
function isDelegateRoute(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/delegate");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const adminView = window.localStorage.getItem(ADMIN_VIEW_TOKEN_KEY);
  if (adminView) return adminView;
  return window.localStorage.getItem(isDelegateRoute() ? DELEGATE_TOKEN_KEY : TOKEN_KEY);
}

/**
 * Resolves a stored file_path (e.g. "/uploads/xyz.pdf" from local disk
 * storage, or a full https:// URL from S3 -- see backend storageService.js)
 * to a URL a browser can load directly. Local paths are rooted at the API
 * server's origin, NOT under /api -- API_BASE_URL includes /api, so it must
 * be stripped, not prepended raw (that produces a 404 at .../api/uploads/...).
 */
export function resolveFileUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${path}`;
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getDelegateToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DELEGATE_TOKEN_KEY);
}

export function setDelegateToken(token: string) {
  window.localStorage.setItem(DELEGATE_TOKEN_KEY, token);
}

export function clearDelegateToken() {
  window.localStorage.removeItem(DELEGATE_TOKEN_KEY);
}

export class ApiRequestError extends Error {
  status: number;
  errors?: string[];

  constructor(status: number, message: string, errors?: string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/**
 * A 401 with no token attached is a normal failed-login response ("Invalid
 * email or password", authService.js) and must NOT redirect -- only a 401
 * on a request that DID send a token means an actual session (Supabase
 * access token, ~1hr expiry, never refreshed -- see lib/api.ts module docs)
 * has expired or been revoked. Without this check, redirectOnSessionExpiry
 * would fire on every wrong-password attempt on the login form itself.
 */
function redirectOnSessionExpiry(status: number, hadToken: boolean) {
  if (status !== 401 || !hadToken || typeof window === "undefined") return;
  const loginPath = isDelegateRoute() ? "/delegate/login" : "/login";
  if (window.location.pathname === loginPath) return;

  if (isDelegateRoute()) clearDelegateToken();
  else clearToken();
  window.localStorage.removeItem(ADMIN_VIEW_TOKEN_KEY);
  window.location.href = `${loginPath}?sessionExpired=1`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  // maintenanceMode middleware (backend) is the only thing that returns 503
  // in this app -- redirect to a branded page instead of leaving every
  // caller to render its own raw error state for it.
  if (res.status === 503 && typeof window !== "undefined" && window.location.pathname !== "/maintenance") {
    window.location.href = "/maintenance";
  }

  redirectOnSessionExpiry(res.status, Boolean(token));

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiRequestError(res.status, body.message || "Request failed", body.errors);
  }

  return body as T;
}

async function postForm<T>(path: string, formData: FormData, method: "POST" | "PUT" = "POST"): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: formData });
  redirectOnSessionExpiry(res.status, Boolean(token));
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiRequestError(res.status, body.message || "Request failed", body.errors);
  }
  return body as T;
}

async function getBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  redirectOnSessionExpiry(res.status, Boolean(token));
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiRequestError(res.status, body.message || "Request failed");
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  getBlob,
  postForm,
};
