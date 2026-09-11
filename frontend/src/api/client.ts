// The backend lives in the shared center-kitchen-backend service, where this
// app's routes are namespaced under /api/market instead of owning /api/*.
const API_URL = import.meta.env.VITE_API_URL ?? "";
const API_PREFIX = "/api/market";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Callers write paths as "/api/..." (matching the app's own conceptual
  // API); rewrite to the shared backend's "/api/market/..." namespace here
  // so page code doesn't need to know about that indirection.
  const resolvedPath = path.startsWith("/api/") ? `${API_PREFIX}${path.slice(4)}` : path;
  const res = await fetch(`${API_URL}${resolvedPath}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Something went wrong";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: "POST", body: formData }),
};

export function resolveAssetUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${API_URL}${pathOrUrl}`;
}

export { API_URL };
