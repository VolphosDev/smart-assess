import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AriaSvg } from "@/components/Aria";
import { AriaCaminando } from "./AriaCaminando";
import { usePosicionJunto } from "@/hooks/usePosicionJunto";
import { ATERRIZAJE, CURVA, saltoHacia } from "@/lib/movimiento";
import type { Poder } from "@/services/gamificacion";
import { estallidoEstrellas, soplidoHelado, zarpazo } from "@/lib/efectosJuego";

/** Duraciones de la escena: entrar caminando, actuar y salir. El reloj de la pregunta queda detenido mientras tanto. */
export const ENTRADA_MS = 750;
export const ACCION_MS = 1100;
export const SALIDA_MS = 500;
export const ESCENA_MS = ENTRADA_MS + ACCION_MS + SALIDA_MS;
/** Momento en que el comodín "pega": ahí se aplica el efecto en la pantalla. */
export const IMPACTO_MS = ENTRADA_MS + 450;

const ANCHO = 240;

type Paso = "entra" | "actua" | "sale";

/**
 * Aria usando un comodín (reloj de arena, congelar o 50/50). Entra caminando hasta el costado
 * izquierdo de la pregunta, hace su gesto HACIA las alternativas y se va por donde vino. En
 * pantallas angostas actúa desde la esquina inferior derecha. Con "reducir movimiento" no hay
 * escena: el efecto se aplica directamente.
 */
export function AriaComodin({ comodin, onTerminar, ancla }: {
    comodin: Exclude<Poder, "PISTA"> | null;
    onTerminar: () => void;
    ancla?: RefObject<HTMLElement>;
}) {
    const reducir = useReducedMotion();
    const [paso, setPaso] = useState<Paso>("entra");
    const pos = usePosicionJunto(ancla, !!comodin, ANCHO);
    // Hacia dónde apuntan los efectos: a la derecha si Aria está a la izquierda de la pregunta.
    const dir = pos.lado ? 1 : -1;
    const escena = useRef<HTMLDivElement>(null);
    // Los efectos se disparan con temporizadores: leen la dirección vigente, no la del primer render
    // (cuando todavía no se había medido dónde va Aria).
    const dirRef = useRef(dir);
    dirRef.current = dir;

    useEffect(() => {
        if (!comodin) return;
        if (reducir) { onTerminar(); return; }
        setPaso("entra");
        const t1 = setTimeout(() => setPaso("actua"), ENTRADA_MS);
        const t2 = setTimeout(() => setPaso("sale"), ENTRADA_MS + ACCION_MS);
        const t3 = setTimeout(onTerminar, ESCENA_MS);

        // Los efectos de partículas salen de Aria y van hacia la pregunta, sincronizados con su gesto.
        const origen = () => {
            const r = escena.current?.getBoundingClientRect();
            if (!r) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            return { x: dirRef.current > 0 ? r.right - 20 : r.left + 20, y: r.top + r.height * 0.42 };
        };
        const destino = () => ancla?.current?.getBoundingClientRect();
        const efectos: ReturnType<typeof setTimeout>[] = [];
        // Three.js se pide al usar el comodín; cuando llega el momento del efecto ya está cargado.
        const tres = import("@/lib/efectos3d");
        const en3d = (f: (m: typeof import("@/lib/efectos3d")) => void) => tres.then(f).catch(() => { /* sin WebGL: queda el 2D */ });
        if (comodin === "CONGELAR") {
            efectos.push(setTimeout(() => { const d = destino(); const o = origen(); if (d) soplidoHelado(o.x, o.y, d); }, ENTRADA_MS + 270));
            efectos.push(setTimeout(() => {
                const d = destino();
                if (d) en3d((m) => m.esquirlasHielo3D(d.left + d.width * 0.35, d.top + d.height * 0.45));
            }, ENTRADA_MS + 520));
        }
        if (comodin === "MITAD") {
            efectos.push(setTimeout(() => {
                const d = destino();
                if (!d) return;
                zarpazo(d, dirRef.current);
                en3d((m) => m.escombros3D(d.left + d.width * (dirRef.current > 0 ? 0.35 : 0.65), d.top + d.height * 0.5, dirRef.current));
                // La tarjeta acusa el golpe con un temblor corto.
                ancla?.current?.animate(
                    [{ transform: "translate(0,0)" }, { transform: `translate(${8 * dirRef.current}px,-3px)` }, { transform: `translate(${-5 * dirRef.current}px,2px)` }, { transform: "translate(0,0)" }],
                    { duration: 260, easing: "ease-out" });
            }, IMPACTO_MS - 120));
        }
        if (comodin === "TIEMPO") {
            efectos.push(setTimeout(() => { const o = origen(); en3d((m) => m.relojDeArena3D(o.x + 46 * dirRef.current, o.y - 40)); }, ENTRADA_MS + 40));
            efectos.push(setTimeout(() => { const o = origen(); estallidoEstrellas(o.x + 46 * dirRef.current, o.y - 40); }, ENTRADA_MS + 620));
        }
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); efectos.forEach(clearTimeout); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [comodin, reducir]);


    if (reducir) return null;

    const estado = comodin === "TIEMPO" ? "invoca" : comodin === "CONGELAR" ? "sopla" : "zarpa";
    const fuera = pos.lado ? -(pos.left + ANCHO + 60) : "110vw";

    return (
        <AnimatePresence>
            {comodin && pos.medido && (
                <motion.div
                    className={pos.lado ? "fixed z-[70] pointer-events-none" : "fixed inset-x-0 bottom-0 z-[70] pointer-events-none flex justify-end px-3 pb-24 md:pb-6 md:pr-10"}
                    style={pos.lado ? { left: pos.left, top: pos.top + 60, width: ANCHO } : undefined}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    aria-hidden
                >
                    <div ref={escena} className="relative w-60 h-64">
                        {paso !== "actua" && (
                            <motion.div
                                className={`absolute bottom-0 ${pos.lado ? "left-0" : "right-0"} w-64`}
                                initial={{ x: paso === "entra" ? fuera : 0 }}
                                animate={{ x: paso === "entra" ? 0 : fuera }}
                                transition={{ duration: paso === "entra" ? ENTRADA_MS / 1000 : SALIDA_MS / 1000, ease: paso === "entra" ? CURVA.caminar : CURVA.salida }}
                            >
                                <AriaCaminando className="w-64"
                                               mirando={(paso === "entra") === pos.lado ? "derecha" : "izquierda"} />
                            </motion.div>
                        )}

                        {paso === "actua" && (
                            <>
                                {/* Llega y se sienta aplastándose; en el 50/50, además, se agacha y salta hacia las alternativas. */}
                                <motion.div
                                    className="absolute inset-x-2 bottom-0 h-64"
                                    style={{ originY: 1 }}
                                    {...(comodin === "MITAD" ? saltoHacia(dir) : ATERRIZAJE)}
                                >
                                    <AriaSvg estado={estado} lado={dir > 0 ? 1 : -1} className="w-full h-full" />
                                </motion.div>

                                {comodin === "TIEMPO" && <RelojDeArena dir={dir} />}
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function RelojDeArena({ dir }: { dir: number }) {
    return (
        <>
            {/* "+15 s" sale volando hacia el reloj de arriba */}
            <motion.span
                className={`absolute ${dir > 0 ? "-right-10" : "-left-10"} bottom-36 font-juego text-3xl font-extrabold text-[var(--j-oro)] whitespace-nowrap`}
                style={{ WebkitTextStroke: "1.5px #2B2140" }}
                initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
                animate={{ opacity: [0, 1, 1, 0], y: -200, x: 140 * dir, scale: 1.25 }}
                transition={{ duration: 1, delay: 0.45, ease: "easeOut" }}
            >
                +15 s
            </motion.span>
        </>
    );
}
