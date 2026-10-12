/**
 * Fechas del servidor en hora de Perú.
 *
 * EL PROBLEMA. El backend guarda y devuelve LocalDateTime en UTC y SIN zona
 * ("2026-10-12T17:20:37.195098"). Con `new Date(texto)`, el navegador lee un texto sin zona
 * como hora LOCAL, así que el panel mostraba la hora UTC como si fuera la de Perú: un acceso
 * de las 12:20 aparecía a las 17:20.
 *
 * LA SOLUCION. Se interpreta el texto como UTC y se convierte al mostrar. No se toca lo
 * guardado: la telemetría y la auditoría son evidencia y no se reescriben. Perú no tiene
 * horario de verano, así que el desfase es siempre de 5 horas.
 */
export const ZONA_PERU = "America/Lima";
const DESFASE_PERU_MS = 5 * 60 * 60 * 1000;

/** Texto del servidor -> Date (instante correcto). null si falta o no es una fecha. */
export function desdeServidor(valor: string | null | undefined): Date | null {
    if (!valor) return null;
    let texto = String(valor).trim();
    // Solo fecha (sin hora): no hay nada que convertir de zona.
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        const f = new Date(`${texto}T00:00:00`);
        return Number.isNaN(f.getTime()) ? null : f;
    }
    // Los navegadores solo garantizan 3 decimales en los segundos; el backend manda 6.
    texto = texto.replace(/(\.\d{3})\d+/, "$1");
    if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(texto)) texto += "Z";
    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Formatea con las opciones dadas, en hora de Perú. Cadena vacía si no hay fecha. */
export function formatoPeru(
    valor: string | null | undefined,
    opciones: Intl.DateTimeFormatOptions,
    idioma = "es-PE",
): string {
    const fecha = desdeServidor(valor);
    if (!fecha) return "";
    return new Intl.DateTimeFormat(idioma, { timeZone: ZONA_PERU, ...opciones }).format(fecha);
}

/** "12/10/2026, 12:20:37" en hora de Perú. */
export function fechaHoraPeru(valor: string | null | undefined): string {
    return formatoPeru(valor, {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

/** "2026-10-12 12:20:37" en hora de Perú, para columnas de CSV (ordena bien y Excel la lee). */
export function fechaHoraPeruCsv(valor: string | null | undefined): string {
    const fecha = desdeServidor(valor);
    if (!fecha) return valor ?? "";
    return new Date(fecha.getTime() - DESFASE_PERU_MS).toISOString().replace("T", " ").slice(0, 19);
}
