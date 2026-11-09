import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AriaSvg } from "@/components/Aria";
import { ModalPortal } from "@/components/ModalPortal";
import { EscudoNivel } from "./BarraJugador";

const CLAVE = "semantika.nivelVisto";
const COLORES = ["#5B3BEF", "#FFC83D", "#FF7A2F", "#2F95F5", "#A24BF2"];

/**
 * Aria celebra cuando el alumno sube de nivel. Compara con el último nivel que ya celebró en
 * este navegador: la primera vez solo lo guarda, para no felicitar por niveles viejos.
 */
export default function CelebracionNivel({ nivel, titulo }: { nivel: number; titulo: string }) {
    const [abierta, setAbierta] = useState(false);
    const reducir = useReducedMotion();

    useEffect(() => {
        let visto: number | null = null;
        try { visto = Number(localStorage.getItem(CLAVE)) || null; } catch { /* sin almacenamiento */ }
        if (visto !== null && nivel > visto) setAbierta(true);
        try { localStorage.setItem(CLAVE, String(nivel)); } catch { /* sin almacenamiento */ }
    }, [nivel]);

    const confeti = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
        x: (Math.random() - 0.5) * 560,
        y: -(Math.random() * 240 + 140),
        giro: Math.random() * 720 - 360,
        color: COLORES[i % COLORES.length],
        retraso: Math.random() * 0.15,
    })), []);

    return (
        <AnimatePresence>
            {abierta && (
                <ModalPortal>
                    <motion.div
                        className="fixed inset-0 z-[80] grid place-items-center bg-[#140E2B]/70 p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setAbierta(false)}
                    >
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-nivel"
                            className="pieza relative w-full max-w-sm rounded-3xl bg-[var(--j-indigo)] text-white px-6 pb-6 pt-4 text-center overflow-hidden"
                            initial={reducir ? false : { scale: 0.6, y: 60 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 280, damping: 16 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="rayos absolute left-1/2 top-[38%] w-[560px] h-[560px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                            {!reducir && confeti.map((c, i) => (
                                <motion.span
                                    key={i}
                                    aria-hidden
                                    className="absolute left-1/2 top-1/3 w-2.5 h-3.5 rounded-[3px]"
                                    style={{ background: c.color, border: "1.5px solid var(--j-tinta)" }}
                                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                                    animate={{ x: c.x, y: [0, c.y, c.y + 460], rotate: c.giro, opacity: [1, 1, 0] }}
                                    transition={{ duration: 1.9, delay: c.retraso, ease: "easeOut" }}
                                />
                            ))}
                            <div className="relative mx-auto w-40 h-52">
                                <AriaSvg estado="celebrando" className="w-full h-full" />
                            </div>
                            <div className="relative flex items-center justify-center gap-3 -mt-2">
                                <EscudoNivel nivel={nivel} className="w-14 h-16 [&>span]:text-2xl" />
                                <h2 id="titulo-nivel" className="font-juego text-5xl font-extrabold leading-none">¡Nivel {nivel}!</h2>
                            </div>
                            <p className="relative text-white/85 mt-3">
                                Tu constancia se nota. Sigue así, {titulo.toLowerCase()}.
                            </p>
                            <button
                                type="button"
                                autoFocus
                                className="boton-juego relative mt-5 w-full h-12 bg-[var(--j-oro)] text-[var(--j-tinta)] text-xl"
                                onClick={() => setAbierta(false)}
                            >
                                Seguir practicando
                            </button>
                        </motion.div>
                    </motion.div>
                </ModalPortal>
            )}
        </AnimatePresence>
    );
}
