import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { MaterialRecord } from "./store";

export const materialsApi = {
  list: (courseId: string, week: number) =>
    apiClient.get<MaterialRecord[]>(API_ENDPOINTS.weekMaterials(courseId, week)),
  upload: (
    courseId: string,
    week: number,
    data: Pick<MaterialRecord, "name" | "type" | "size" | "dataUrl">
  ) => apiClient.post<MaterialRecord>(API_ENDPOINTS.weekMaterials(courseId, week), data),
  remove: (courseId: string, week: number, materialId: string) =>
    apiClient.delete<{ ok: true }>(API_ENDPOINTS.material(courseId, week, materialId)),
};