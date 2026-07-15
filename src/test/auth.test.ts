import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "../api/auth";
import { apiClient } from "../api/client";

vi.mock("../api/client", () => {
  return {
    apiClient: {
      post: vi.fn(),
      get: vi.fn()
    }
  };
});

describe("AuthApi tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should perform login successfully", async () => {
    const mockUserResponse = { user: { id: "1", email: "irwin@colegio.edu.pe", role: "TEACHER", name: "Irwin" } };
    vi.mocked(apiClient.post).mockResolvedValue(mockUserResponse);

    const res = await authApi.login("irwin@colegio.edu.pe", "teacher");
    expect(res).toEqual(mockUserResponse);
    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
      email: "irwin@colegio.edu.pe",
      password: "teacher"
    });
  });

  it("should send support request successfully", async () => {
    const mockSupportResponse = { message: "Solicitud recibida" };
    vi.mocked(apiClient.post).mockResolvedValue(mockSupportResponse);

    const res = await authApi.soporte("irwin@colegio.edu.pe", "Soporte", "Detalle de error");
    expect(res).toEqual(mockSupportResponse);
    expect(apiClient.post).toHaveBeenCalledWith("/auth/soporte", {
      correo: "irwin@colegio.edu.pe",
      motivo: "Soporte",
      descripcion: "Detalle de error"
    });
  });
});
