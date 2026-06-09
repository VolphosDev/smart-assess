import { apiClient } from "./client";
// Quitamos API_ENDPOINTS porque ahora usaremos las rutas directas de Spring Boot
import type { CourseRecord } from "./store";

export const evaluacionApi = {
    generarPreguntas: (mongoId: string, tipo: string, cantidad: number = 5, tema?: string) =>
        apiClient.post<any>(
            `/archivos/una-tecnica-pdf-id?mongoId=${encodeURIComponent(mongoId)}&tipo=${tipo}&cantidad=${cantidad}${tema ? `&tema=${encodeURIComponent(tema)}` : ""}`,
            null
        ),
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
    update: (courseId: string | number, data: any) =>
        apiClient.put<any>(`/cursos/${courseId}`, data),
    delete: (courseId: string | number) =>
        apiClient.delete<{ message: string }>(`/cursos/${courseId}`),
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
    deleteMaterial: (materialId: string | number) =>
        apiClient.delete<void>(`/semanas/material/${materialId}`),
    toggleMaterialVisibility: (materialId: string | number) =>
        apiClient.patch<any>(`/semanas/material/${materialId}/visibilidad`),
};

export const intentosApi = {
    guardar: (data: any) => apiClient.post('/intentos/guardar', data),
    misIntentos: (usuarioId: number) =>
        apiClient.get<any[]>(`/intentos/mis-intentos/${usuarioId}`),
    porSemana: (semanaId: number) =>
        apiClient.get<any[]>(`/intentos/semana/${semanaId}`),
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

        const res = await fetch(`http://localhost:8080/api/archivos/subir`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!res.ok) throw new Error("Error al subir archivos");
        return await res.text();
    },

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