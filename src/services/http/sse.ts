import { API_CONFIG, ApiError } from "./config";

export type ManejadoresSse = {
    onChunk?: (data: string) => void;
    onResult?: (data: string) => void;
    onDone?: () => void;
    onError: (err: unknown) => void;
};

function partirEventos(bloque: string): { evento: string; datos: string } | null {
    let evento = "message";
    const datos: string[] = [];

    for (const linea of bloque.split("\n")) {
        if (linea.startsWith(":")) continue;
        const sep = linea.indexOf(":");
        const campo = sep === -1 ? linea : linea.slice(0, sep);
        const valor = sep === -1 ? "" : linea.slice(sep + 1).replace(/^ /, "");
        if (campo === "event") evento = valor;
        else if (campo === "data") datos.push(valor);
    }

    if (datos.length === 0 && evento === "message") return null;
    return { evento, datos: datos.join("\n") };
}

export function abrirStream(ruta: string, manejadores: ManejadoresSse): () => void {
    const ctrl = new AbortController();

    (async () => {
        try {
            const headers: Record<string, string> = { Accept: "text/event-stream" };
            const token = localStorage.getItem("token");
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`${API_CONFIG.baseUrl}${ruta}`, {
                method: "GET",
                headers,
                credentials: "include",
                signal: ctrl.signal,
            });

            if (!res.ok || !res.body) {
                const cuerpo = await res.text().catch(() => "");
                let codigo: string | undefined;
                try {
                    codigo = JSON.parse(cuerpo)?.codigo;
                } catch {
                    codigo = undefined;
                }
                manejadores.onError({ status: res.status, message: cuerpo, codigo } as ApiError);
                return;
            }

            const lector = res.body.getReader();
            const decodificador = new TextDecoder();
            let pendiente = "";

            while (true) {
                const { done, value } = await lector.read();
                if (done) break;

                pendiente += decodificador.decode(value, { stream: true });
                const bloques = pendiente.split(/\r?\n\r?\n/);
                pendiente = bloques.pop() ?? "";

                for (const bloque of bloques) {
                    const parseado = partirEventos(bloque);
                    if (!parseado) continue;
                    if (parseado.evento === "chunk") manejadores.onChunk?.(parseado.datos);
                    else if (parseado.evento === "result") manejadores.onResult?.(parseado.datos);
                    else if (parseado.evento === "error") manejadores.onError(new Error(parseado.datos));
                    else if (parseado.evento === "done") manejadores.onDone?.();
                }
            }

            manejadores.onDone?.();
        } catch (err) {
            if ((err as Error)?.name === "AbortError") return;
            manejadores.onError(err);
        }
    })();

    return () => ctrl.abort();
}
