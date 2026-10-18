import { describe, expect, it } from "vitest";
import { primeraSeccionPermitida, SECCIONES_ADMIN } from "@/lib/permisos";

describe("primeraSeccionPermitida", () => {
  it("lleva al administrador principal a Usuarios", () => {
    expect(primeraSeccionPermitida(["CUENTAS_GESTIONAR", "USO_VER", "ADMINISTRADORES_GESTIONAR"])).toBe("/admin");
  });

  it("lleva a un miniadministrador solo con USO_VER a Uso, no a Usuarios", () => {
    expect(primeraSeccionPermitida(["USO_VER"])).toBe("/admin/uso");
  });

  it("con NOTAS_VER entra al panel de Usuarios (analíticas y notas)", () => {
    expect(primeraSeccionPermitida(["NOTAS_VER"])).toBe("/admin");
  });

  it("sin permisos no hay sección a la cual ir", () => {
    expect(primeraSeccionPermitida([])).toBeNull();
    expect(primeraSeccionPermitida(undefined)).toBeNull();
  });

  it("toda sección del menú exige al menos un permiso", () => {
    for (const s of SECCIONES_ADMIN) expect(s.permisos.length).toBeGreaterThan(0);
  });
});
