import { createPortal } from "react-dom";

/**
 * Cuelga un modal directamente de <body>.
 *
 * POR QUE. `position: fixed` solo se mide respecto a la ventana si NINGUN ancestro tiene
 * `transform`, `filter`, `backdrop-filter` o `contain`. Las páginas entran con animaciones de
 * framer-motion (que escriben `transform`), así que un overlay `fixed inset-0` escrito dentro
 * de la página se medía respecto a ese contenedor animado: no llegaba arriba y dejaba una
 * franja blanca sin oscurecer sobre la cabecera. Desde <body> no hay ancestro que lo atrape.
 *
 * Es la misma solución que ya usaba UniversalPreviewModal, sacada a un componente para no
 * tener que acordarse de ella en cada modal nuevo.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
    if (typeof document === "undefined") return null;
    return createPortal(children, document.body);
}
