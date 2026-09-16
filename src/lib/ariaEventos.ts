/**
 * Evento para abrir la bienvenida de Aria desde fuera del widget (p. ej. el botón "?" de la
 * cabecera). Vive aquí y no en AriaGuideWidget porque un archivo de componente que además
 * exporta funciones rompe el refresco en caliente de Vite.
 */
export const EVENTO_ABRIR_BIENVENIDA = "aria:abrir-bienvenida";

export function abrirBienvenidaAria() {
    window.dispatchEvent(new Event(EVENTO_ABRIR_BIENVENIDA));
}
