import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AriaDescansando } from "@/components/AriaDescansando";
import { AriaSvg } from "@/components/Aria";
import { esIaNoDisponible } from "@/services/http/config";

describe("Aria descansando", () => {
    it("muestra un mensaje honesto y no un error tecnico", () => {
        render(<AriaDescansando contexto="generacion" />);
        expect(screen.getByText(/Aria se quedó dormida/i)).toBeTruthy();
        expect(screen.getByText(/unos minutos/i)).toBeTruthy();
    });

    it("el estado durmiendo se dibuja sin romperse", () => {
        const { container } = render(<AriaSvg estado="durmiendo" />);
        expect(container.querySelector("svg")).toBeTruthy();
        expect(container.textContent).toContain("z");
    });

    it("solo un 503 con el codigo del backend cuenta como Aria dormida", () => {
        expect(esIaNoDisponible({ status: 503, message: "", codigo: "IA_NO_DISPONIBLE" })).toBe(true);
        expect(esIaNoDisponible({ status: 503, message: "", codigo: "OTRA_COSA" })).toBe(false);
        expect(esIaNoDisponible({ status: 500, message: "", codigo: "IA_NO_DISPONIBLE" })).toBe(false);
        expect(esIaNoDisponible(undefined)).toBe(false);
    });
});
