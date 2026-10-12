import type { QueryClient } from "@tanstack/react-query";

/**
 * Marca como obsoletos los datos de progreso del alumno al terminar cualquier evaluación.
 *
 * Sin esto, el cliente de consultas (staleTime de 60 s) devolvía el estado anterior a la
 * evaluación: la pantalla de modos seguía mostrando la semana como "pendiente" o "no
 * desarrollada" aunque el servidor ya la tuviera guardada, hasta que se recargaba la página.
 */
export function refrescarProgreso(queryClient: QueryClient) {
    for (const clave of [
        "estado-semana",
        "student-courses",
        "mapa-conocimiento",
        "mapa-conocimiento-dashboard",
    ]) {
        queryClient.invalidateQueries({ queryKey: [clave] });
    }
}
