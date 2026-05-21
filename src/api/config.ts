/**
 * Configuración central de la API.
 * Cambia VITE_API_BASE_URL en .env cuando exista backend real.
 * Mientras tanto, MOCK=true hace que client.ts use datos locales.
 */
export const API_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string) || "https://api.semantika.local/v1",
  mock: (import.meta.env.VITE_API_MOCK ?? "true") !== "false",
  timeoutMs: 120_000,
};

export const API_ENDPOINTS = {
  // Auth
  login: "/auth/login",
  logout: "/auth/logout",
  me: "/auth/me",

  // Users (admin)
  users: "/users",
  user: (id: string) => `/users/${id}`,
  students: "/users?role=student",
  teachers: "/users?role=teacher",

  // Courses
  courses: "/courses",
  course: (id: string) => `/courses/${id}`,
  teacherCourses: (teacherId: string) => `/teachers/${teacherId}/courses`,
  enrollStudent: (courseId: string) => `/courses/${courseId}/students`,
  unenrollStudent: (courseId: string, studentId: string) => `/courses/${courseId}/students/${studentId}`,

  // Materiales semanales
  weekMaterials: (courseId: string, week: number) => `/courses/${courseId}/weeks/${week}/materials`,
  material: (courseId: string, week: number, materialId: string) =>
    `/courses/${courseId}/weeks/${week}/materials/${materialId}`,

  // Notas / intentos
  courseGrades: (courseId: string) => `/courses/${courseId}/grades`,
  studentGrades: (studentId: string) => `/students/${studentId}/grades`,

  // Evaluación
  startAttempt: "/attempts",
  submitAnswer: (attemptId: string) => `/attempts/${attemptId}/answers`,
  finishAttempt: (attemptId: string) => `/attempts/${attemptId}/finish`,
};

export type ApiError = { status: number; message: string };