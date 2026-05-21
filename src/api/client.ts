import { API_CONFIG, ApiError } from "./config";

/**
 * Cliente HTTP genérico. Si API_CONFIG.mock=true, intercepta y delega
 * a los handlers mock registrados (ver mockServer.ts).
 */

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type MockHandler = (
    path: string,
    body: unknown,
    query: URLSearchParams
) => Promise<unknown> | unknown;

const mockHandlers: Record<string, MockHandler> = {};

export function registerMock(method: Method, pattern: RegExp | string, handler: MockHandler) {
    const key = `${method}:${pattern instanceof RegExp ? pattern.source : pattern}`;
    mockHandlers[key] = handler;
}

function matchMock(method: Method, path: string) {
    for (const key of Object.keys(mockHandlers)) {
        const [m, ...rest] = key.split(":");
        if (m !== method) continue;
        const pattern = rest.join(":");
        try {
            const re = new RegExp(`^${pattern}$`);
            if (re.test(path)) return mockHandlers[key];
        } catch {
            if (pattern === path) return mockHandlers[key];
        }
    }
    return null;
}

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const [pathname, qs = ""] = path.split("?");
    const query = new URLSearchParams(qs);

    if (API_CONFIG.mock) {
        const handler = matchMock(method, pathname);
        if (!handler) {
            throw { status: 404, message: `Mock no implementado: ${method} ${pathname}` } as ApiError;
        }
        await new Promise((r) => setTimeout(r, 120));
        return (await handler(pathname, body, query)) as T;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_CONFIG.timeoutMs);

    try {
        const headers: Record<string, string> = {};

        const isFormData = body instanceof FormData;

        if (!isFormData) {
            headers["Content-Type"] = "application/json";
        }

        // Buscamos el token y lo agregamos si existe
        const token = localStorage.getItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_CONFIG.baseUrl}${path}`, {
            method,
            headers,
            // 👇 Si es archivo, se manda crudo. Si es objeto, se hace JSON.stringify
            body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
            signal: ctrl.signal,
            credentials: "include",
        });

        if (!res.ok) throw { status: res.status, message: await res.text() } as ApiError;
        return (await res.json()) as T;
    } finally {
        clearTimeout(timer);
    }
}

export const apiClient = {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),

    postForm: <T>(path: string, body: FormData) => request<T>("POST", path, body),

    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),
};