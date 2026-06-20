export const API_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080/api",
  mock: (import.meta.env.VITE_API_MOCK ?? "false") !== "false", // Use false as default for real integrations
  timeoutMs: 600_000,
};

export type ApiError = { status: number; message: string };
