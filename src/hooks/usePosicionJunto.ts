import { useLayoutEffect, useState, type RefObject } from "react";

export interface PosicionEscena {
    /** true: hay sitio a la izquierda del ancla y la escena va ahí; false: va abajo (celular). */
    lado: boolean;
    left: number;
    top: number;
    /** Ya se calculó: hasta entonces la escena no se monta, para que entre por el lado correcto. */
    medido: boolean;
}

/**
 * Dónde poner a Aria durante una escena: pegada al costado izquierdo de la pregunta, a la altura
 * de las alternativas, para que se vea que actúa sobre ellas. Si no cabe (pantallas angostas),
 * la escena vuelve a la esquina inferior. Se recalcula al desplazar o cambiar el tamaño.
 */
export function usePosicionJunto(ancla: RefObject<HTMLElement> | undefined, activo: boolean, ancho: number): PosicionEscena {
    const [pos, setPos] = useState<PosicionEscena>({ lado: false, left: 0, top: 0, medido: false });

    useLayoutEffect(() => {
        if (!activo) { setPos((p) => (p.medido ? { ...p, medido: false } : p)); return; }
        const calcular = () => {
            const r = ancla?.current?.getBoundingClientRect();
            // Con al menos 120 px de margen se pone al costado; si el margen es algo menor que su
            // ancho, Aria se apoya sobre el borde de la tarjeta (queda más dinámico que irse abajo).
            if (!r || r.left < 120) {
                setPos({ lado: false, left: 0, top: 0, medido: true });
                return;
            }
            const top = Math.min(Math.max(r.top + 60, 90), window.innerHeight - 440);
            setPos({ lado: true, left: Math.max(8, r.left - ancho - 8), top, medido: true });
        };
        calcular();
        window.addEventListener("scroll", calcular, { passive: true });
        window.addEventListener("resize", calcular);
        return () => {
            window.removeEventListener("scroll", calcular);
            window.removeEventListener("resize", calcular);
        };
    }, [activo, ancla, ancho]);

    return pos;
}
