import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { abrirStream } from "@/services/http/sse";

function respuestaSse(trozos: string[]): Response {
    const codificador = new TextEncoder();
    const body = new ReadableStream({
        start(controller) {
            for (const t of trozos) controller.enqueue(codificador.encode(t));
            controller.close();
        },
    });
    return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

describe("lector de SSE sobre fetch", () => {
    beforeEach(() => {
        localStorage.setItem("token", "jwt-de-prueba");
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("manda el token en la cabecera y nunca en la URL", async () => {
        const espia = vi.fn().mockResolvedValue(respuestaSse(["event: done\ndata: ok\n\n"]));
        vi.stubGlobal("fetch", espia);

        abrirStream("/archivos/stream-tecnica-pdf?mongoId=abc", { onError: () => {} });
        await vi.waitFor(() => expect(espia).toHaveBeenCalled());

        const [url, opciones] = espia.mock.calls[0];
        expect(String(url)).not.toContain("token");
        expect(opciones.headers.Authorization).toBe("Bearer jwt-de-prueba");
    });

    it("reconstruye un evento partido entre dos lecturas", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            respuestaSse(["event: chunk\nda", "ta: hola mundo\n\n"])
        ));
        const trozos: string[] = [];

        abrirStream("/x", { onChunk: (d) => trozos.push(d), onError: () => {} });
        await vi.waitFor(() => expect(trozos).toEqual(["hola mundo"]));
    });

    it("une las lineas data de un mismo evento", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            respuestaSse(["event: result\ndata: {\"a\":1,\ndata: \"b\":2}\n\n"])
        ));
        let recibido = "";

        abrirStream("/x", { onResult: (d) => { recibido = d; }, onError: () => {} });
        await vi.waitFor(() => expect(recibido).toBe('{"a":1,\n"b":2}'));
    });

    it("un 503 del backend llega como error con su codigo", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ codigo: "IA_NO_DISPONIBLE" }), { status: 503 })
        ));
        let error: any = null;

        abrirStream("/x", { onError: (e) => { error = e; } });
        await vi.waitFor(() => expect(error?.codigo).toBe("IA_NO_DISPONIBLE"));
        expect(error.status).toBe(503);
    });
});
