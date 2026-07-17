import { ApiRequestError } from "./api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "mb_platform_token";

export function getPlatformToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setPlatformToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearPlatformToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPlatformToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiRequestError(res.status, body.message || "Request failed", body.errors);
  }

  return body as T;
}

export const platformApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/**
 * Mints a short-lived admin-view token for a conference (spec ch.9) and
 * navigates into the existing Organizer Workspace with it. Writes to a
 * dedicated `mb_admin_view_token` slot (not the shared `mb_token`) so a real
 * organizer/delegate session in the same browser isn't clobbered -- see
 * lib/api.ts's getToken().
 */
export async function viewConferenceAsOrganizer(conferenceId: number) {
  const result = await platformApi.post<{ success: true; token: string }>(`/platform/conferences/${conferenceId}/admin-view`);
  window.localStorage.setItem(
    "mb_organizer",
    JSON.stringify({ id: null, fullName: "Platform Administrator", email: "platform-admin", __adminView: true })
  );
  window.localStorage.setItem("mb_admin_view_token", result.token);
  window.localStorage.setItem("mb_admin_view", String(conferenceId));
  window.location.href = `/conferences/${conferenceId}`;
}
