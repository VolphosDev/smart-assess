import { describe, it, expect } from "vitest";
import { desdeServidor, fechaHoraPeru, fechaHoraPeruCsv } from "@/lib/fechas";

describe("fechas del servidor en hora de Perú", () => {
    it("lee un texto sin zona como UTC", () => {
        expect(desdeServidor("2026-10-12T17:20:37.195098")?.toISOString()).toBe("2026-10-12T17:20:37.195Z");
    });

    it("resta 5 horas en el CSV", () => {
        expect(fechaHoraPeruCsv("2026-10-12T17:20:37.195098")).toBe("2026-10-12 12:20:37");
    });

    it("cruza la medianoche hacia el día anterior", () => {
        expect(fechaHoraPeruCsv("2026-09-17T04:28:36.008088")).toBe("2026-09-16 23:28:36");
    });

    it("respeta un texto que ya trae zona", () => {
        expect(fechaHoraPeruCsv("2026-10-12T17:20:37Z")).toBe("2026-10-12 12:20:37");
    });

    it("muestra la hora de Perú en pantalla", () => {
        expect(fechaHoraPeru("2026-10-12T17:20:37")).toContain("12:20:37");
    });

    it("devuelve vacío o el original cuando no hay fecha válida", () => {
        expect(desdeServidor(null)).toBeNull();
        expect(desdeServidor("no es fecha")).toBeNull();
        expect(fechaHoraPeru(undefined)).toBe("");
        expect(fechaHoraPeruCsv("basura")).toBe("basura");
    });
});
