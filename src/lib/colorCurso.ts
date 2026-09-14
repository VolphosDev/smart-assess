import type { CSSProperties } from "react";

/**
 * Colores de curso: claves heredadas ("primary", "lime", "coral") o cualquier hexadecimal.
 *
 * POR QUE SE CALCULAN Y NO SE ELIGEN CLASES. Con un selector de color libre ya no hay una
 * lista cerrada de clases de Tailwind que escribir (y Tailwind purga las que se arman con
 * plantillas). Así que el color se aplica en estilos en línea y variables CSS.
 *
 * POR QUE HAY UN TONO "FUERTE". Un docente puede elegir amarillo claro. Texto blanco encima
 * de ese amarillo no se lee, y la cabecera del curso lleva el título en blanco. En vez de
 * prohibir colores, se oscurece el tono (mismo matiz) hasta que el blanco alcance contraste
 * AA (4.5:1). El curso sigue viéndose "amarillo", pero legible.
 */

const LEGADO: Record<string, string> = {
    primary: "#5739EF",
    lime: "#16A34A",
    coral: "#ED3548",
};

export const PALETA_CURSO = [
    { hex: "#4F46E5", nombre: "Índigo" },
    { hex: "#7C3AED", nombre: "Violeta" },
    { hex: "#DB2777", nombre: "Rosa" },
    { hex: "#E11D48", nombre: "Rojo" },
    { hex: "#EA580C", nombre: "Naranja" },
    { hex: "#CA8A04", nombre: "Mostaza" },
    { hex: "#16A34A", nombre: "Verde" },
    { hex: "#0D9488", nombre: "Turquesa" },
    { hex: "#0284C7", nombre: "Celeste" },
    { hex: "#475569", nombre: "Pizarra" },
];

export const esHexValido = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

export function hexDeColorCurso(color?: string | null): string {
    if (!color) return LEGADO.primary;
    if (esHexValido(color)) return color.toUpperCase();
    return LEGADO[color] ?? LEGADO.primary;
}

function aRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function aHex([r, g, b]: [number, number, number]) {
    return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminancia(hex: string) {
    const [r, g, b] = aRgb(hex).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string) {
    const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

/** Mezcla con negro (t<0) o blanco (t>0) conservando el matiz. */
function mezclar(hex: string, t: number) {
    const [r, g, b] = aRgb(hex);
    const destino = t < 0 ? 0 : 255;
    const k = Math.abs(t);
    return aHex([r + (destino - r) * k, g + (destino - g) * k, b + (destino - b) * k]);
}

function oscurecerHasta(hex: string, fondo: string, minimo: number) {
    let actual = hex;
    for (let i = 1; i <= 20 && contraste(actual, fondo) < minimo; i++) actual = mezclar(hex, -i * 0.05);
    return actual;
}

function aclararHasta(hex: string, fondo: string, minimo: number) {
    let actual = hex;
    for (let i = 1; i <= 20 && contraste(actual, fondo) < minimo; i++) actual = mezclar(hex, i * 0.05);
    return actual;
}

export interface EstiloCurso {
    /** El color tal como lo eligió el docente. */
    base: string;
    /** Fondo sólido donde va texto blanco (cabeceras, botones): siempre AA con blanco. */
    fuerte: string;
    /** Texto del color del curso sobre tarjeta clara. */
    tintaClara: string;
    /** Texto del color del curso sobre tarjeta oscura. */
    tintaOscura: string;
    suave: string;
    borde: string;
}

export function estiloCurso(color?: string | null): EstiloCurso {
    const base = hexDeColorCurso(color);
    const [r, g, b] = aRgb(base);
    return {
        base,
        fuerte: oscurecerHasta(base, "#FFFFFF", 4.5),
        tintaClara: oscurecerHasta(base, "#FFFFFF", 4.5),
        tintaOscura: aclararHasta(base, "#1C1D25", 4.5),
        suave: `rgba(${r}, ${g}, ${b}, 0.12)`,
        borde: `rgba(${r}, ${g}, ${b}, 0.32)`,
    };
}

/**
 * Variables CSS para usar con clases arbitrarias de Tailwind, p. ej.
 * `bg-[var(--curso-fuerte)]`, `text-[var(--curso-tinta)] dark:text-[var(--curso-tinta-osc)]`.
 */
export function variablesCurso(color?: string | null): CSSProperties {
    const e = estiloCurso(color);
    return {
        "--curso-base": e.base,
        "--curso-fuerte": e.fuerte,
        "--curso-tinta": e.tintaClara,
        "--curso-tinta-osc": e.tintaOscura,
        "--curso-suave": e.suave,
        "--curso-borde": e.borde,
    } as CSSProperties;
}

/**
 * Fondo de cabecera: la portada (si hay) bajo un velo del color del curso que garantiza que el
 * título blanco se lea sobre cualquier foto; sin portada, el color sólido.
 */
export function fondoCabeceraCurso(color?: string | null, bannerUrl?: string | null): CSSProperties {
    const { fuerte } = estiloCurso(color);
    if (!bannerUrl) return { backgroundColor: fuerte, color: "#fff" };
    return {
        backgroundColor: fuerte,
        backgroundImage: `linear-gradient(90deg, ${fuerte} 0%, ${fuerte}E6 38%, ${fuerte}73 70%, ${fuerte}33 100%), url("${bannerUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff",
    };
}
