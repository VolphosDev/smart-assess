import "./http/mockServer"; // registra handlers cuando API_CONFIG.mock=true

export * from "./http/config";
export * from "./store";
export { apiClient, registerMock } from "./http/client";
export { authApi } from "./auth";
export { usersApi } from "./users";
export { coursesApi, semanasApi, intentosApi, rendimientoApi } from "./courses";
export { materialsApi } from "./materials";
export { gradesApi } from "./grades";
export { validacionJuezApi } from "./validacionJuez";
export { bancoPreguntasApi } from "./bancoPreguntas";
export { auditoriaApi } from "./auditoria";
