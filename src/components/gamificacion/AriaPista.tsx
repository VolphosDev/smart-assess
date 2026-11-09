import { useEffect, useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { AriaSvg } from "@/components/Aria";
import { AriaCaminando } from "./AriaCaminando";
import { callarAria, guardarVozActivada, hablarComoAria, vozActivada } from "@/lib/vozAria";
import { usePosicionJunto } from "@/hooks/usePosicionJunto";
import { ATERRIZAJE, CURVA, RESORTE } from "@/lib/movimiento";

const ANCHO = 240;

/**
 * La escena de la pista: Aria entra caminando hasta el costado de la pregunta, se sienta, dice la
 * pista en voz alta y espera a que el alumno la cierre. En pantallas angostas aparece abajo a la
 * derecha. Con "reducir movimiento" aparece directamente sentada.
 */
export function AriaPista({ pista, onCerrar, ancla }: { pista: string | null; onCerrar: () => void; ancla?: RefObject<HTMLElement> }) {
    const reducir = useReducedMotion();
    const [llego, setLlego] = useState(false);
    const [hablando, setHablando] = useState(false);
    const [conVoz, setConVoz] = useState(vozActivada);
    const pos = usePosicionJunto(ancla, !!pista, ANCHO);

    useEffect(() => {
        setLlego(!!reducir);
        if (!pista) callarAria();
    }, [pista, reducir]);

    useEffect(() => {
        if (pista && llego && conVoz) {
            hablarComoAria(pista, { alEmpezar: () => setHablando(true), alTerminar: () => setHablando(false) });
        }
        return () => callarAria();
    }, [pista, llego, conVoz]);

    const alternarVoz = () => {
        const nueva = !conVoz;
        setConVoz(nueva);
        guardarVozActivada(nueva);
        if (!nueva) { callarAria(); setHablando(false); }
    };

    const globo = (
        <motion.div
            role="status"
            aria-live="polite"
            className={pos.lado
                ? "pieza relative rounded-3xl rounded-bl-md bg-card px-4 py-3 w-full"
                : "pieza relative mb-24 rounded-3xl rounded-br-md bg-card px-4 py-3 max-w-[300px]"}
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={RESORTE.interfaz}
            style={{ transformOrigin: pos.lado ? "bottom left" : "bottom right" }}
        >
            <p className="font-juego text-base font-extrabold text-primary leading-none mb-1">Pista de Aria</p>
            <p className="text-sm leading-snug">{pista}</p>
            <div className="flex items-center justify-between gap-2 mt-3">
                <button
                    type="button"
                    onClick={alternarVoz}
                    className="grid place-items-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    title={conVoz ? "Silenciar a Aria" : "Que Aria lo diga en voz alta"}
                >
                    {conVoz ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                    type="button"
                    autoFocus
                    onClick={() => { callarAria(); onCerrar(); }}
                    className="boton-juego h-9 px-4 bg-[var(--j-oro)] text-[var(--j-tinta)] text-base"
                >
                    Gracias, Aria
                </button>
            </div>
        </motion.div>
    );

    const aria = (
        <div className="relative w-52 h-60 shrink-0">
            {llego ? (
                <motion.div className="absolute inset-0" style={{ originY: 1 }} {...ATERRIZAJE}>
                    <AriaSvg estado={hablando ? "hablando" : "idea"} className="w-full h-full" />
                </motion.div>
            ) : (
                <motion.div
                    className={pos.lado ? "absolute bottom-0 left-0 w-64" : "absolute bottom-0 right-0 w-64"}
                    initial={{ x: pos.lado ? -(pos.left + ANCHO + 60) : "110vw" }}
                    animate={{ x: 0 }}
                    transition={{ duration: 1.3, ease: CURVA.caminar }}
                    onAnimationComplete={() => setLlego(true)}
                >
                    <AriaCaminando className="w-64" mirando={pos.lado ? "derecha" : "izquierda"} />
                </motion.div>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            {pista && pos.medido && (
                <motion.div
                    className={pos.lado ? "fixed z-[70]" : "fixed inset-x-0 bottom-0 z-[70] pointer-events-none flex justify-end px-3 pb-24 md:pb-6 md:pr-8"}
                    style={pos.lado ? { left: pos.left, top: pos.top, width: ANCHO } : undefined}
                    exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                    {pos.lado ? (
                        // Altura fija y contenido abajo: Aria no salta cuando aparece el globo encima.
                        <div className="flex flex-col items-start justify-end gap-2 h-[430px]">
                            {llego && globo}
                            {aria}
                        </div>
                    ) : (
                        <div className="relative flex items-end gap-2 max-w-[560px] pointer-events-auto">
                            {llego && globo}
                            {aria}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
