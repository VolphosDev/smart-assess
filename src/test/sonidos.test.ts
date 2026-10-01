import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * El bug que fija esta prueba: el sonido solo se oia la primera vez.
 *
 * El navegador suspende el AudioContext cuando lleva rato sin sonar, y el reloj de un contexto
 * suspendido esta CONGELADO. Si se lee currentTime antes de reanudar, toda la envolvente de
 * ganancia queda programada en el pasado, la ganancia salta a su valor final (0.0001) y el tono
 * sale mudo. Por eso currentTime tiene que leerse DESPUES de que resume() haya terminado.
 */
class ContextoFalso {
    state: "suspended" | "running" | "closed" = "suspended";
    relojCongelado = 5;
    relojEnMarcha = 100;
    destination = {};
    programados: number[] = [];

    get currentTime() {
        return this.state === "running" ? this.relojEnMarcha : this.relojCongelado;
    }

    async resume() {
        await Promise.resolve();
        this.state = "running";
    }

    createOscillator() {
        const self = this;
        return {
            type: "sine",
            frequency: { setValueAtTime: () => {} },
            connect: () => {},
            start: (t: number) => self.programados.push(t),
            stop: () => {},
        };
    }

    createGain() {
        return {
            gain: {
                setValueAtTime: () => {},
                exponentialRampToValueAtTime: () => {},
            },
            connect: () => {},
        };
    }
}

describe("sonidos de la interfaz", () => {
    let ctx: ContextoFalso;

    beforeEach(async () => {
        vi.resetModules();
        ctx = new ContextoFalso();
        vi.stubGlobal("AudioContext", function () { return ctx; });
        vi.stubGlobal("matchMedia", () => ({ matches: false }));
        localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("programa el tono con el reloj ya en marcha, no con el congelado", async () => {
        const { reproducirClic } = await import("@/lib/sonidos");

        reproducirClic();
        await vi.waitFor(() => expect(ctx.programados.length).toBe(1));

        // Si leyera currentTime antes de reanudar, esto valdria 5 y el tono saldria mudo.
        expect(ctx.programados[0]).toBeGreaterThanOrEqual(ctx.relojEnMarcha);
    });

    it("suena tambien la segunda vez, aunque el navegador vuelva a suspender el contexto", async () => {
        const { reproducirClic } = await import("@/lib/sonidos");

        reproducirClic();
        await vi.waitFor(() => expect(ctx.programados.length).toBe(1));

        // El navegador lo suspende por inactividad y el reloj se queda atras.
        ctx.state = "suspended";
        ctx.relojCongelado = ctx.relojEnMarcha;
        ctx.relojEnMarcha = 130;

        reproducirClic();
        await vi.waitFor(() => expect(ctx.programados.length).toBe(2));
        expect(ctx.programados[1]).toBeGreaterThanOrEqual(130);
    });
});
