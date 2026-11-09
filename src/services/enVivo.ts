import { apiClient } from "./http/client";

export type FaseEnVivo = "ESPERA" | "PREGUNTA" | "RESULTADO" | "FIN";

export interface PreguntaEnVivo {
    enunciado: string;
    opciones: string[];
    correcta: string;
}

interface Base {
    codigo: string;
    curso: string;
    tema: string | null;
    fase: FaseEnVivo;
    indice: number;
    total: number;
    segundos: number;
    restanteMs?: number;
    participantes: number;
    pregunta?: string;
    opciones?: string[];
    correcta?: number;
    ranking?: { apodo: string; puntos: number }[];
}

export interface TableroEnVivo extends Base {
    apodos: string[];
    respondieron?: number;
    distribucion?: number[];
}

export interface EstadoAlumnoEnVivo extends Base {
    apodo: string;
    puntos: number;
    racha: number;
    puesto: number;
    miRespuesta?: number | null;
    acerte?: boolean | null;
    ganancia?: number;
}

/** Clase en vivo (ver ClaseEnVivoService en el backend). */
export const enVivoApi = {
    crear: (semanaId: string, preguntas: PreguntaEnVivo[], segundos = 20) =>
        apiClient.post<{ codigo: string }>("/en-vivo", { semanaId, preguntas, segundos }),
    tablero: (codigo: string) => apiClient.get<TableroEnVivo>(`/en-vivo/${codigo}/tablero`),
    avanzar: (codigo: string) => apiClient.post<TableroEnVivo>(`/en-vivo/${codigo}/avanzar`),
    unirse: (codigo: string) => apiClient.post<EstadoAlumnoEnVivo>(`/en-vivo/${codigo}/unirse`),
    estado: (codigo: string) => apiClient.get<EstadoAlumnoEnVivo>(`/en-vivo/${codigo}`),
    responder: (codigo: string, opcion: number) =>
        apiClient.post<EstadoAlumnoEnVivo>(`/en-vivo/${codigo}/responder`, { opcion }),
};

/** Forma y color de cada alternativa: se reconocen de lejos en la pizarra y en el celular. */
export const FICHAS = [
    { forma: "▲", color: "var(--j-indigo)", texto: "#fff" },
    { forma: "◆", color: "var(--j-fuego)", texto: "#fff" },
    { forma: "●", color: "var(--j-oro)", texto: "var(--j-tinta)" },
    { forma: "■", color: "#14B8A6", texto: "#fff" },
    { forma: "★", color: "var(--j-epico)", texto: "#fff" },
    { forma: "✚", color: "var(--j-raro)", texto: "#fff" },
];

/** Quita la letra "A)" del inicio: la ficha ya muestra su forma. */
export const sinLetra = (s: string) => s.replace(/^\s*[A-Fa-f][).]\s*/, "");

export function mensajeError(e: unknown, porDefecto: string) {
    const texto = e instanceof Error ? e.message : "";
    try { return JSON.parse(texto).error ?? porDefecto; } catch { return texto || porDefecto; }
}
