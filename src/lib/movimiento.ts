import type { MotionProps } from "framer-motion";

/**
 * Estilo de animación de Semantika (parte de juego). Todo lo que se mueve usa estos valores, así
 * la app se siente como UN juego y no como piezas sueltas.
 *
 * PRINCIPIOS (de los 12 principios clásicos de animación, adaptados a interfaz):
 *  1. Respuesta física: lo que se toca reacciona al instante (botones 3D que se hunden, ~80 ms).
 *  2. Anticipación: antes de un salto o un golpe, un pequeño gesto contrario (agacharse).
 *  3. Aplastar y estirar: al despegar se estira, al caer se aplasta y rebota. Da peso y vida.
 *  4. Asentamiento con rebote: las entradas llegan con un leve exceso y vuelven (resortes), nunca lineales.
 *  5. Un protagonista por momento: mientras Aria actúa, el resto queda quieto y el reloj se detiene.
 *  6. Duraciones cortas: micro 120 ms, interfaz 250 ms, escenas de Aria ≤ 2,4 s.
 *  7. Accesibilidad: con "reducir movimiento" no hay escenas; el resultado aparece directamente.
 */

export const RESORTE = {
    /** Interfaz: tarjetas, globos, paneles. Llega con un leve exceso. */
    interfaz: { type: "spring", stiffness: 340, damping: 22 },
    /** Personaje y celebraciones: más rebote. */
    rebote: { type: "spring", stiffness: 420, damping: 13 },
    /** Fichas y números que "saltan" al cambiar. */
    salto: { type: "spring", stiffness: 520, damping: 15 },
} as const;

export const DURACION = { micro: 0.12, interfaz: 0.25, medio: 0.45 } as const;

/** Curvas: entrada con exceso (llega y se asienta) y salida que acelera (se va decidida). */
export const CURVA = {
    entrada: [0.2, 0.9, 0.3, 1.15] as [number, number, number, number],
    salida: [0.5, 0, 0.9, 0.4] as [number, number, number, number],
    caminar: [0.25, 0.8, 0.3, 1] as [number, number, number, number],
};

/** Aterrizaje de Aria: se aplasta al tocar el suelo y rebota hasta su forma. */
export const ATERRIZAJE: MotionProps = {
    initial: { scaleY: 0.78, scaleX: 1.14, y: 6 },
    animate: { scaleY: [0.78, 1.08, 0.97, 1], scaleX: [1.14, 0.95, 1.02, 1], y: 0 },
    transition: { duration: 0.5, times: [0, 0.4, 0.7, 1], ease: "easeOut" as const },
};

/** Salto con anticipación: se agacha, se estira en el aire y se aplasta al caer. */
export function saltoHacia(dir: number): MotionProps {
    return {
        animate: {
            y: [0, 8, -54, 0, 0],
            x: [0, -6 * dir, 26 * dir, 18 * dir, 0],
            scaleY: [1, 0.82, 1.12, 0.84, 1],
            scaleX: [1, 1.12, 0.92, 1.12, 1],
            rotate: [0, -6 * dir, 10 * dir, 0, 0],
        },
        transition: { duration: 0.75, times: [0, 0.18, 0.5, 0.78, 1], ease: "easeInOut" },
    };
}
