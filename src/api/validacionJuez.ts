import { apiClient } from "./client";

/**
 * Validación del juez de IA contra docentes.
 *
 * Nota importante sobre `pendientes`: la respuesta NO trae la calificación de la IA, y es
 * deliberado. Si el docente la viera antes de decidir tendería a confirmarla, y la
 * concordancia medida sería sugestión en vez de acuerdo. No lo añadas "para que sea más
 * cómodo": romperías el control experimental de la medición.
 */
export interface CasoParaCalificar {
    muestraId: number;
    pregunta: string;
    respuestaAlumno: string;
    respuestaCorrecta: string | null;
    escalaMin: number;
    escalaMax: number;
    origen: string;
}

export interface Concordancia {
    origen: string;
    casosEnMuestra: number;
    calificacionesRecibidas: number;
    docentesParticipantes: number;
    escala: string;
    acuerdoExacto: number;
    acuerdoAdyacente: number;
    kappaCuadratica: number;
    kappaSinPonderar: number;
    sesgoMedio: number;
    interpretacion: string;
}

export interface Desacuerdo {
    muestraId: number;
    pregunta: string;
    respuestaAlumno: string;
    puntuacionIa: number;
    puntuacionDocente: number;
    docente: string;
    comentario: string | null;
}

export const validacionJuezApi = {
    construirMuestra: (origen: string, tamano: number) =>
        apiClient.post<{ origen: string; casosAgregados: number; mensaje: string }>(
            `/validacion-juez/muestra?origen=${origen}&tamano=${tamano}`, {}),

    pendientes: (origen: string, limite = 20) =>
        apiClient.get<CasoParaCalificar[]>(
            `/validacion-juez/pendientes?origen=${origen}&limite=${limite}`),

    calificar: (muestraId: number, puntuacion: number, comentario?: string) =>
        apiClient.post<{ mensaje: string }>(`/validacion-juez/${muestraId}/calificar`, {
            puntuacion,
            comentario: comentario ?? null,
        }),

    concordancia: (origen: string) =>
        apiClient.get<Concordancia>(`/validacion-juez/concordancia?origen=${origen}`),

    desacuerdos: (origen: string) =>
        apiClient.get<Desacuerdo[]>(`/validacion-juez/desacuerdos?origen=${origen}`),
};
