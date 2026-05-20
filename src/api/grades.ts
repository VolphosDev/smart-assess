import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { GradeRecord } from "./store";

export const gradesApi = {
  forCourse: (courseId: string) =>
    apiClient.get<GradeRecord[]>(API_ENDPOINTS.courseGrades(courseId)),
  forStudent: (studentId: string) =>
    apiClient.get<GradeRecord[]>(API_ENDPOINTS.studentGrades(studentId)),
};