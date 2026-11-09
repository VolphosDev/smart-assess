import { useEffect, useMemo, useState } from "react";

/**
 * Escarcha sobre la tarjeta de la pregunta mientras dura "Congelar": cristales ramificados que
 * crecen desde los bordes hacia adentro y, al terminar el congelamiento, se derriten.
 *
 * Los cristales se generan al azar (un tronco con ramas a ±60°, como el hielo real), así que
 * nunca salen iguales. Se dibujan con trazos nítidos: un trazo azul y encima uno blanco.
 */
export function Escarcha({ hasta }: { hasta: number }) {
    const [visible, setVisible] = useState(() => Date.now() < hasta);
    const [derritiendo, setDerritiendo] = useState(false);

    useEffect(() => {
        const resto = hasta - Date.now();
        if (resto <= 0) { setVisible(false); return; }
        setVisible(true);
        setDerritiendo(false);
        const t1 = setTimeout(() => setDerritiendo(true), Math.max(0, resto - 700));
        const t2 = setTimeout(() => setVisible(false), resto);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [hasta]);

    // Cristales en coordenadas de una caja de 1000×600, anclados a los cuatro bordes.
    const cristales = useMemo(() => {
        const lista: string[] = [];
        const rama = (x: number, y: number, ang: number, largo: number, nivel: number) => {
            const x2 = x + Math.cos(ang) * largo, y2 = y + Math.sin(ang) * largo;
            lista.push(`M${x.toFixed(1)},${y.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`);
            if (nivel === 0) return;
            for (const f of [0.35, 0.62, 0.85]) {
                const bx = x + Math.cos(ang) * largo * f, by = y + Math.sin(ang) * largo * f;
                const sub = largo * (0.42 - f * 0.18);
                rama(bx, by, ang - Math.PI / 3, sub, nivel - 1);
                rama(bx, by, ang + Math.PI / 3, sub, nivel - 1);
            }
        };
        // Racimos en las cuatro esquinas (donde el hielo se forma primero) y pocos cristales
        // sueltos en los lados: el centro queda despejado para leer la pregunta.
        const esquinas: [number, number, number][] = [[0, 0, Math.PI / 4], [1000, 0, (3 * Math.PI) / 4], [0, 600, -Math.PI / 4], [1000, 600, (-3 * Math.PI) / 4]];
        for (const [x, y, centro] of esquinas) {
            for (const abre of [-0.5, 0, 0.5]) rama(x, y, centro + abre + (Math.random() - 0.5) * 0.2, 105 + Math.random() * 45, 3);
        }
        const lados: [number, number, number][] = [
            [250 + Math.random() * 120, 0, Math.PI / 2], [630 + Math.random() * 120, 0, Math.PI / 2],
            [300 + Math.random() * 400, 600, -Math.PI / 2],
            [0, 300, 0], [1000, 300, Math.PI],
        ];
        for (const [x, y, a] of lados) rama(x, y, a + (Math.random() - 0.5) * 0.4, 60 + Math.random() * 40, 2);
        return lista.join(" ");
    }, [hasta]);

    if (!visible) return null;

    return (
        <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            aria-hidden
            className={`escarcha absolute inset-0 w-full h-full pointer-events-none rounded-[1.75rem] z-10 ${derritiendo ? "derritiendo" : ""}`}
        >
            {/* Velo helado en los bordes (sin desenfoque: un degradado radial nítido) */}
            <rect x="0" y="0" width="1000" height="600" fill="url(#escarcha-velo)" />
            <defs>
                <radialGradient id="escarcha-velo" cx="50%" cy="50%" r="75%">
                    <stop offset="55%" stopColor="#E0F2FE" stopOpacity="0" />
                    <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
                </radialGradient>
            </defs>
            <path d={cristales} className="escarcha-fondo" />
            <path d={cristales} className="escarcha-frente" />
        </svg>
    );
}
