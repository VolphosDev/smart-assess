import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { CourseRecord } from "./store";

export const coursesApi = {
  list: () => apiClient.get<CourseRecord[]>(API_ENDPOINTS.courses),
  get: (id: string) => apiClient.get<CourseRecord>(API_ENDPOINTS.course(id)),
  forTeacher: (teacherId: string) =>
    apiClient.get<CourseRecord[]>(API_ENDPOINTS.teacherCourses(teacherId)),
  create: (data: Omit<CourseRecord, "id">) =>
    apiClient.post<CourseRecord>(API_ENDPOINTS.courses, data),
  addStudent: (courseId: string, studentId: string) =>
    apiClient.post<{ ok: true }>(API_ENDPOINTS.enrollStudent(courseId), { studentId }),
  removeStudent: (courseId: string, studentId: string) =>
    apiClient.delete<{ ok: true }>(API_ENDPOINTS.unenrollStudent(courseId, studentId)),
};