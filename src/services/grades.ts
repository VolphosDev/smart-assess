import { apiClient } from "./http/client";
import { API_ENDPOINTS } from "./http/config";
import type { GradeRecord } from "./store";

export const gradesApi = {
  forCourse: (courseId: string) =>
    apiClient.get<GradeRecord[]>(API_ENDPOINTS.courseGrades(courseId)),
  forStudent: (studentId: string) =>
    apiClient.get<GradeRecord[]>(API_ENDPOINTS.studentGrades(studentId)),
};