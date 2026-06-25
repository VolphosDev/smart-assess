import "./mockServer"; // registra handlers cuando API_CONFIG.mock=true

export * from "./config";
export * from "./store";
export { apiClient, registerMock } from "./client";
export { authApi } from "./auth";
export { usersApi } from "./users";
export { coursesApi, intentosApi, rendimientoApi } from "./courses";
export { materialsApi } from "./materials";
export { gradesApi } from "./grades";