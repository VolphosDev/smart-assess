import { apiClient } from "./client";
// Quitamos API_ENDPOINTS porque ahora usaremos las rutas directas de Spring Boot
import type { CourseRecord } from "./store";

/** Estado de una ingesta en curso, tal como lo devuelve `GET /semanas/ingesta/{id}`. */
export interface ProgresoIngesta {
    encontrada: boolean;
    id?: string;
    nombreArchivo?: string;
    fase?: string;
    porcentaje: number;
    mensaje: string;
    /** Cifra concreta del paso actual, p. ej. "120 de 513 fragmentos". */
    detalle?: string | null;
    terminado: boolean;
    exitoso?: boolean;
    error?: string | null;
}

export const evaluacionApi = {
    generarPreguntas: (mongoId: string, tipo: string, cantidad: number = 5, tema?: string) =>
        apiClient.post<any>(
            `/archivos/una-tecnica-pdf-id?mongoId=${encodeURIComponent(mongoId)}&tipo=${tipo}&cantidad=${cantidad}${tema ? `&tema=${encodeURIComponent(tema)}` : ""}`,
            null
        ),
};
/**
 * Generación de preguntas por streaming (SSE).
 *
 * Vivía en `infrastructure/repositories/ApiEvaluationRepository`. Se trajo aquí al unificar
 * las dos pilas de acceso a datos que coexistían en el proyecto.
 *
 * No usa `apiClient` porque `EventSource` abre su propia conexión y no admite cabeceras: por
 * eso el token viaja en la URL. Devuelve la función de cierre para que quien lo llame pueda
 * cortar el flujo al desmontarse — sin eso, la conexión queda abierta al salir de la pantalla.
 */
export const generarPreguntasStream = (
    mongoId: string,
    tipo: string,
    cantidad: number,
    tema: string,
    token: string,
    onChunk: (chunk: string) => void,
    onResult: (data: any) => void,
    onError: (err: any) => void
): (() => void) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
    const url = `${baseUrl}/archivos/stream-tecnica-pdf?mongoId=${encodeURIComponent(mongoId)}`
        + `&tipo=${tipo}&cantidad=${cantidad}`
        + `${tema ? `&tema=${encodeURIComponent(tema)}` : ""}&token=${token}`;

    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("chunk", (e: MessageEvent) => {
        if (e.data) onChunk(e.data);
    });

    eventSource.addEventListener("result", (e: MessageEvent) => {
        try {
            onResult(JSON.parse(e.data));
        } catch (err) {
            onError(err);
        } finally {
            eventSource.close();
        }
    });

    eventSource.onerror = (err) => {
        onError(err);
        eventSource.close();
    };

    return () => eventSource.close();
};

export const coursesApi = {
    // Para el dashboard del Docente
    forTeacher: (teacherId: string) =>
        apiClient.get<any[]>(`/cursos/docente/${teacherId}`),

    // Para el dashboard del Alumno
    forStudent: (studentId: string) =>
        apiClient.get<any[]>(`/cursos/estudiante/${studentId}`),

    // Para crear cursos
    create: (data: any) =>
        apiClient.post<any>(`/cursos/crear`, data),

    // (Mantenemos estas por ahora si las usas en otras vistas)
    get: (id: string) => apiClient.get<CourseRecord>(`/cursos/${id}`),
    addStudent: (courseId: string, studentId: string) =>
        apiClient.post<{ ok: true }>(`/cursos/${courseId}/matricular`, { studentId }),
    removeStudent: (courseId: string, studentId: string) =>
        apiClient.delete<{ ok: true }>(`/cursos/${courseId}/desmatricular/${studentId}`),
    weeks: (courseId: string | number) =>
        apiClient.get<any[]>(`/cursos/${courseId}/semanas`),

    students: (courseId: string | number) =>
        apiClient.get<any[]>(`/cursos/${courseId}/alumnos`),
    buscarEstudiantes: (nombre: string) =>
        apiClient.get<any[]>(`/cursos/estudiantes/buscar?nombre=${encodeURIComponent(nombre)}`),
    update: (courseId: string | number, data: any) =>
        apiClient.put<any>(`/cursos/${courseId}`, data),
    delete: (courseId: string | number) =>
        apiClient.delete<{ message: string }>(`/cursos/${courseId}`),
    rendimiento: (teacherId: string | number) =>
        apiClient.get<any[]>(`/cursos/docente/${teacherId}/rendimiento`),
    reordenarSemanas: (courseId: string | number, semanaIds: string[]) =>
        apiClient.put<any>(`/cursos/${courseId}/semanas/reordenar`, semanaIds),
};
export const semanasApi = {
    get: (semanaId: string | number) =>
        apiClient.get<any>(`/semanas/${semanaId}`),

    uploadPDF: (semanaId: string | number, file: File) => {
        const form = new FormData();
        form.append("archivo", file);
        return apiClient.postForm<any>(`/semanas/${semanaId}/pdf`, form);
    },

    deletePDF: (semanaId: string | number) =>
        apiClient.delete<void>(`/semanas/${semanaId}/pdf`),

    uploadFiles: (semanaId: string | number, files: File[]) => {
        const form = new FormData();
        files.forEach(f => form.append("archivos", f));
        return apiClient.postForm<any>(`/semanas/${semanaId}/archivos`, form);
    },

    /**
     * Subida asíncrona: devuelve enseguida un `ingestaId` y el servidor procesa en segundo
     * plano. Es la ruta que debe usar la interfaz del docente.
     *
     * La ruta síncrona de arriba mantiene la petición abierta durante todo el procesado; con
     * una obra larga eso son varios minutos y el navegador o un proxy acaban cortándola,
     * dejando la ingesta a medias.
     */
    uploadFilesAsync: (semanaId: string | number, files: File[]) => {
        const form = new FormData();
        files.forEach(f => form.append("archivos", f));
        return apiClient.postForm<{ ingestaId: string; mensaje: string }>(
            `/semanas/${semanaId}/archivos-async`, form);
    },

    progresoIngesta: (ingestaId: string) =>
        apiClient.get<ProgresoIngesta>(`/semanas/ingesta/${ingestaId}`),
    deleteMaterial: (materialId: string | number) =>
        apiClient.delete<void>(`/semanas/material/${materialId}`),
    toggleMaterialVisibility: (materialId: string | number) =>
        apiClient.patch<any>(`/semanas/material/${materialId}/visibilidad`),

    /** El docente pone el nombre real del tema de la semana (no el del archivo subido). */
    renombrar: (semanaId: string | number, nombreTema: string) =>
        apiClient.patch<any>(`/semanas/${semanaId}/nombre-tema`, { nombreTema }),

    eliminar: (semanaId: string | number) =>
        apiClient.delete<void>(`/semanas/${semanaId}`),

    crear: (courseId: string | number, nombreTema?: string) =>
        apiClient.post<any>(`/cursos/${courseId}/semanas`, { nombreTema: nombreTema ?? null }),

    toggleHabilitada: (semanaId: string | number) =>
        apiClient.patch<any>(`/semanas/${semanaId}/toggle-habilitada`),
};

export const intentosApi = {
    guardar: (data: any) => apiClient.post('/intentos/guardar', data),
    misIntentos: (usuarioId: number) =>
        apiClient.get<any[]>(`/intentos/mis-intentos/${usuarioId}`),
    porSemana: (semanaId: number | string) =>
        apiClient.get<any[]>(`/intentos/semana/${semanaId}`),
    todos: () =>
        apiClient.get<any[]>('/intentos/todos'),
};

export const archivosApi = {
    uploadMultipleFiles: async (archivos: File[]) => {
        const formData = new FormData();
        archivos.forEach(file => {
            formData.append("archivos", file);
        });

        const token = localStorage.getItem("token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const res = await fetch(`${baseUrl}/archivos/subir`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!res.ok) throw new Error("Error al subir archivos");
        return await res.text();
    },

    generarImagen: (prompt: string) =>
        apiClient.get<{ base64: string }>(`/archivos/generar-imagen?prompt=${encodeURIComponent(prompt)}`),
};
export interface EvaluarRespuestaRequest {
    pregunta: string;
    respuestaEsperada: string;
    respuestaEstudiante: string;
    totalPreguntas: number;
    tipoPregunta: string;
}

export interface EvaluarRespuestaResponse {
    pregunta_evaluada: string;
    evaluacion: {
        esCorrecta: boolean;
        puntaje: number;
        explicacion: string;
    };
    metricas_rendimiento: {
        latencia_segundos: number;
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    };
}

export const agentJudgeApi = {
    evaluarRespuesta: (data: EvaluarRespuestaRequest) =>
        // Usamos apiClient como en las demás rutas
        apiClient.post<EvaluarRespuestaResponse>('/agent-judge/evaluar-respuesta', data),
};

export interface GuardarIntentoAdaptativoRequest {
    usuarioId: number;
    semanaId: string;
    notaFinal: number;
    tiempoEmpleadoSegundos: number;
    numeroIntentos: number;
    tipoEvaluacion: string;
    respuestas: Array<{
        preguntaTexto: string;
        tipoPregunta: string;
        respuestaEstudiante: string;
        esCorrecta: boolean;
    }>;
}

export const adaptiveApi = {
    /**
     * Guarda la prueba de UBICACION de una semana.
     *
     * Endpoint SEPARADO de guardarIntento a proposito: la ubicacion no es un examen, no
     * genera nota ni intento. Enviarla por la ruta normal hundiria el promedio del alumno con
     * un cero antes de haber estudiado.
     */
    guardarUbicacion: (payload: any) =>
        apiClient.post<any>(`/adaptive/ubicacion`, payload),

    /**
     * Estado del alumno en la semana, segun el SERVIDOR.
     *
     * La pantalla decidia si la evaluacion recomendadora estaba hecha mirando localStorage.
     * Eso vive en un navegador concreto: entrar desde el movil, o limpiar el navegador, hacia
     * reaparecer como "Pendiente" algo que ya estaba hecho y guardado en la base de datos.
     */
    estadoSemana: (semanaId: string) =>
        apiClient.get<{
            recomendadoraCompletada: boolean;
            recomendaciones: string[];
            /** Codigos de formato decididos por el comite (AVATAR, VIDEO, ABIERTA...). */
            modosRecomendados: string[];
            /** false cuando el comite no pudo deliberar y se uso el respaldo. */
            deliberacionReal: boolean;
            nivelAplicado?: string | null;
            ubicacionCompletada: boolean;
            nivelUbicacion?: string | null;
        }>(`/adaptive/estado?semanaId=${encodeURIComponent(semanaId)}`),

    getEvaluacion: (usuarioId: number | string, semanaId: string) =>
        apiClient.get<any>(`/adaptive/evaluacion?usuarioId=${usuarioId}&semanaId=${semanaId}`),
    
    guardarIntento: (data: GuardarIntentoAdaptativoRequest) =>
        apiClient.post<any>('/adaptive/guardar', data),

    getMaterialesRecomendados: (usuarioId: number | string, semanaId: string) =>
        apiClient.get<any[]>(`/adaptive/materiales-recomendados?usuarioId=${usuarioId}&semanaId=${semanaId}`),
};

export const rendimientoApi = {
    mapaCalor: (usuarioId: number | string) =>
        apiClient.get<any[]>(`/rendimiento/mapa-calor/${usuarioId}`),
    /** Mapa de conocimiento por curso: temas con probabilidad de dominio (BKT). */
    mapaConocimiento: (usuarioId: number | string) =>
        apiClient.get<any[]>(`/rendimiento/mapa-conocimiento/${usuarioId}`),
};