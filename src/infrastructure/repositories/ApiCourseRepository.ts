import { CourseRepository } from "../../domain/repositories/CourseRepository";
import { Course, Week } from "../../domain/entities/Course";
import { apiClient } from "../http/apiClient";

export class ApiCourseRepository implements CourseRepository {
    getForTeacher(teacherId: string): Promise<Course[]> {
        return apiClient.get<Course[]>(`/cursos/docente/${teacherId}`);
    }

    getForStudent(studentId: string): Promise<Course[]> {
        return apiClient.get<Course[]>(`/cursos/estudiante/${studentId}`);
    }

    create(data: any): Promise<Course> {
        return apiClient.post<Course>(`/cursos/crear`, data);
    }

    get(id: string): Promise<Course> {
        return apiClient.get<Course>(`/cursos/${id}`);
    }

    addStudent(courseId: string, studentId: string): Promise<{ ok: boolean }> {
        return apiClient.post<{ ok: boolean }>(`/cursos/${courseId}/matricular`, { studentId });
    }

    removeStudent(courseId: string, studentId: string): Promise<{ ok: boolean }> {
        return apiClient.delete<{ ok: boolean }>(`/cursos/${courseId}/desmatricular/${studentId}`);
    }

    getWeeks(courseId: string | number): Promise<Week[]> {
        return apiClient.get<Week[]>(`/cursos/${courseId}/semanas`);
    }

    getStudents(courseId: string | number): Promise<any[]> {
        return apiClient.get<any[]>(`/cursos/${courseId}/alumnos`);
    }

    update(courseId: string | number, data: any): Promise<Course> {
        return apiClient.put<Course>(`/cursos/${courseId}`, data);
    }

    delete(courseId: string | number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/cursos/${courseId}`);
    }

    getWeek(semanaId: string | number): Promise<Week> {
        return apiClient.get<Week>(`/semanas/${semanaId}`);
    }

    uploadPDF(semanaId: string | number, file: File): Promise<any> {
        const form = new FormData();
        form.append("archivo", file);
        return apiClient.postForm<any>(`/semanas/${semanaId}/pdf`, form);
    }

    deletePDF(semanaId: string | number): Promise<void> {
        return apiClient.delete<void>(`/semanas/${semanaId}/pdf`);
    }

    uploadFiles(semanaId: string | number, files: File[]): Promise<any> {
        const form = new FormData();
        files.forEach(f => form.append("archivos", f));
        return apiClient.postForm<any>(`/semanas/${semanaId}/archivos`, form);
    }

    deleteMaterial(materialId: string | number): Promise<void> {
        return apiClient.delete<void>(`/semanas/material/${materialId}`);
    }

    toggleMaterialVisibility(materialId: string | number): Promise<any> {
        return apiClient.patch<any>(`/semanas/material/${materialId}/visibilidad`);
    }
}
