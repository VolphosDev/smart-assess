/**
 * Claves de localStorage POR USUARIO.
 *
 * En un aula varios alumnos comparten la misma PC y el mismo navegador, y localStorage es del
 * navegador, no de la persona. Una clave global como "aria_welcome_seen" hacía que el segundo
 * alumno que entraba en esa máquina heredara el progreso del anterior: el tutorial de Aria le
 * aparecía como "ya visto". Sufijar con el id del usuario aísla a cada uno.
 */
export function clavePorUsuario(base: string): string {
    let id = "anon";
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.id != null) id = String(user.id);
    } catch {
        // JSON corrupto: se usa la clave anónima, que no coincide con la de nadie.
    }
    return `${base}.${id}`;
}
