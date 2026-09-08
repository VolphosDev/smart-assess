import { apiClient } from "./client";

/**
 * Banco de preguntas del docente.
 *
 * Devuelve lo que la IA generó para una semana junto con lo que cada alumno respondió y la
 * retroalimentación que dio el juez. El backend comprueba que la semana sea de un curso del
 * docente: pedir el id de otro devuelve 403, no datos.
 */

export interface RespuestaDeAlumno {
    alumno: string;
    respuesta: string;
    correcta: boolean;
    retroalimentacion: string | null;
    fecha: string | null;
}

export interface PreguntaDelBanco {
    id: number;
    enunciado: string;
    tipo: string | null;
    nivelBloom: string | null;
    nivelDificultad: string | null;
    conceptos: string | null;
    respuestaCorrecta: string | null;
    opciones: string[];
    vecesRespondida: number;
    aciertos: number;
    /** null mientras nadie la haya respondido. */
    tasaAcierto: number | null;
    /** Lectura en lenguaje llano; advierte cuando la muestra es demasiado pequeña. */
    lecturaDificultad: string;
    respuestas: RespuestaDeAlumno[];
}

export interface BancoDeSemana {
    semanaId?: number;
    numSem?: string;
    nombreTema?: string | null;
    total: number;
    porNivelBloom: Record<string, number>;
    sinRespuestaCorrecta: number;
    preguntas: PreguntaDelBanco[];
    nota?: string;
}

export const bancoPreguntasApi = {
    porSemana: (semanaId: string | number) =>
        apiClient.get<BancoDeSemana>(`/banco-preguntas/semana/${semanaId}`),
};
