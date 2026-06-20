import { Course, Week } from "../entities/Course";

export interface CourseRepository {
    getForTeacher(teacherId: string): Promise<Course[]>;
    getForStudent(studentId: string): Promise<Course[]>;
    create(data: any): Promise<Course>;
    get(id: string): Promise<Course>;
    addStudent(courseId: string, studentId: string): Promise<{ ok: boolean }>;
    removeStudent(courseId: string, studentId: string): Promise<{ ok: boolean }>;
    getWeeks(courseId: string | number): Promise<Week[]>;
    getStudents(courseId: string | number): Promise<any[]>;
    update(courseId: string | number, data: any): Promise<Course>;
    delete(courseId: string | number): Promise<{ message: string }>;
    
    getWeek(semanaId: string | number): Promise<Week>;
    uploadPDF(semanaId: string | number, file: File): Promise<any>;
    deletePDF(semanaId: string | number): Promise<void>;
    uploadFiles(semanaId: string | number, files: File[]): Promise<any>;
    deleteMaterial(materialId: string | number): Promise<void>;
    toggleMaterialVisibility(materialId: string | number): Promise<any>;
}
