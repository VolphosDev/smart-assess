import { esMaterialDemo, urlMaterialDemo } from "@/lib/tourDemo";

/**
 * Caché en memoria de los materiales que abre el alumno (PDF, Word, imágenes).
 *
 * POR QUE EXISTE. El visor descargaba el archivo ENTERO cada vez que se abría: el backend
 * lo lee de Mongo como un byte[] y lo manda sin cabeceras de caché, y el modal, al cerrarse,
 * tiraba el blob. Abrir, cerrar y volver a abrir el mismo PDF costaba dos descargas
 * completas, y un alumno que alterna entre el material y las preguntas lo hace muchas veces.
 *
 * QUE HACE.
 *  1. Guarda los últimos archivos descargados: reabrir es instantáneo.
 *  2. Deduplica descargas: si el alumno pasa el ratón por el botón (precarga) y luego hace
 *     clic, el clic se engancha a la descarga que ya va en camino en vez de empezar otra.
 *  3. Informa del progreso real, para mostrar "3,1 MB de 8 MB" en lugar de un spinner mudo.
 *
 * LIMITES. Memoria de la pestaña, no disco: se vacía al recargar. Por eso tiene tope de
 * entradas y de bytes; se expulsa lo usado hace más tiempo.
 */

const MAX_ENTRADAS = 6;
const MAX_BYTES = 80 * 1024 * 1024;

interface Entrada {
    blob: Blob;
    url: string;
}

type Oyente = (cargado: number, total: number | null) => void;

const cache = new Map<string, Entrada>();
const enCurso = new Map<string, Promise<Blob>>();
const oyentes = new Map<string, Set<Oyente>>();
const htmlWord = new Map<string, string>();

function avisar(id: string, cargado: number, total: number | null) {
    oyentes.get(id)?.forEach((fn) => fn(cargado, total));
}

function guardar(id: string, blob: Blob): Entrada {
    const entrada = { blob, url: URL.createObjectURL(blob) };
    cache.delete(id);
    cache.set(id, entrada);

    let bytes = 0;
    cache.forEach((e) => { bytes += e.blob.size; });
    // Map conserva el orden de inserción: la primera clave es la usada hace más tiempo.
    for (const [clave, e] of cache) {
        if (cache.size <= MAX_ENTRADAS && bytes <= MAX_BYTES) break;
        if (clave === id) continue;
        URL.revokeObjectURL(e.url);
        bytes -= e.blob.size;
        cache.delete(clave);
        htmlWord.delete(clave);
    }
    return entrada;
}

async function descargar(id: string): Promise<Blob> {
    const demo = esMaterialDemo(id);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const url = demo ? urlMaterialDemo(id) : `${baseUrl}/cursos/ver-archivo/${id}`;
    const headers: Record<string, string> = {};
    const token = localStorage.getItem("token");
    if (!demo && token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(response.status === 403
            ? "No tienes permisos para ver este archivo."
            : "No se pudo cargar el documento.");
    }

    const total = Number(response.headers.get("Content-Length")) || null;
    const tipo = response.headers.get("Content-Type") || "application/octet-stream";

    if (!response.body) return response.blob();

    const lector = response.body.getReader();
    const partes: BlobPart[] = [];
    let cargado = 0;
    avisar(id, 0, total);
    for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        partes.push(value);
        cargado += value.length;
        avisar(id, cargado, total);
    }
    return new Blob(partes, { type: tipo });
}

/** Devuelve el archivo (desde caché si está) y su URL de objeto, estable mientras siga en caché. */
export async function obtenerMaterial(id: string, onProgreso?: Oyente): Promise<Entrada> {
    const enCache = cache.get(id);
    if (enCache) {
        // Se reinserta para marcarlo como usado recientemente.
        cache.delete(id);
        cache.set(id, enCache);
        return enCache;
    }

    if (onProgreso) {
        if (!oyentes.has(id)) oyentes.set(id, new Set());
        oyentes.get(id)!.add(onProgreso);
    }

    try {
        let promesa = enCurso.get(id);
        if (!promesa) {
            promesa = descargar(id);
            enCurso.set(id, promesa);
        }
        const blob = await promesa;
        return cache.get(id) ?? guardar(id, blob);
    } finally {
        enCurso.delete(id);
        if (onProgreso) oyentes.get(id)?.delete(onProgreso);
    }
}

/**
 * Empieza a descargar en segundo plano. Se llama al pasar el ratón, enfocar o tocar el
 * botón de leer: entre esa intención y el clic suelen pasar 200-400 ms que ya cuentan.
 * No precarga con "ahorro de datos" activado: en un plan móvil prepago eso es dinero.
 */
export function precargarMaterial(id?: string | null, nombreArchivo?: string) {
    if (!id || cache.has(id) || enCurso.has(id)) return;
    const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conexion?.saveData) return;
    obtenerMaterial(id).catch(() => { /* el visor mostrará el error si de verdad se abre */ });
    if (nombreArchivo && /\.docx?$/i.test(nombreArchivo)) {
        import("mammoth").catch(() => {});
    }
}

export function htmlWordEnCache(id: string) {
    return htmlWord.get(id) ?? null;
}

export function guardarHtmlWord(id: string, html: string) {
    if (cache.has(id)) htmlWord.set(id, html);
}
