import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { AriaSvg } from "@/components/Aria";
import { gamificacionApi, type Poder } from "@/services/gamificacion";
import { cn } from "@/lib/utils";

interface Props {
    restante: number;
    total: number;
    congelado: boolean;
    combo: number;
    ultimo: "acierto" | "error" | null;
    tieneResultado: boolean;
    permiteMitad: boolean;
    poderesRestantes: number;
    precioPista: number;
    usando: Poder | null;
    usoAyuda: boolean;
    onPoder: (p: Poder) => void;
}

/**
 * Tablero del contrarreloj: reloj, combo, reacción de Aria y comodines de Aria.
 * El reloj nunca castiga: al llegar a cero solo avisa que ya no hay bono de rapidez.
 */
export function HudContrarreloj(p: Props) {
    const { data: resumen } = useQuery({ queryKey: ["gamificacion", "resumen"], queryFn: gamificacionApi.resumen, staleTime: 30_000 });
    const saldo = resumen?.monedas ?? 0;
    const fraccion = p.total > 0 ? p.restante / p.total : 0;
    const urgente = fraccion <= 0.25 && p.restante > 0;
    const agotado = p.total > 0 && p.restante === 0;

    const poderes: { id: Poder; icono: string; nombre: string; precio: number; visible: boolean }[] = [
        { id: "TIEMPO", icono: "⏳", nombre: "+15 s", precio: 10, visible: true },
        { id: "CONGELAR", icono: "❄️", nombre: "Congelar", precio: 15, visible: true },
        { id: "MITAD", icono: "✂️", nombre: "50/50", precio: 20, visible: p.permiteMitad },
        { id: "PISTA", icono: "🐱", nombre: "Pista", precio: p.precioPista, visible: true },
    ];

    const estadoAria = p.ultimo === "acierto" ? (p.combo >= 3 ? "celebrando" : "feliz")
        : p.ultimo === "error" ? "confundido" : urgente ? "sorprendido" : "esperando";

    return (
        // Fijo bajo la cabecera: el reloj tiene que verse aunque la pregunta sea larga.
        <div className="pieza sticky top-[72px] z-20 rounded-3xl bg-card px-4 py-3 space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 shrink-0" aria-hidden>
                    <AriaSvg estado={estadoAria} recorte="cara" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className={cn("font-juego font-extrabold text-2xl tabular-nums leading-none",
                            agotado ? "text-muted-foreground" : urgente ? "text-rose-600" : "text-foreground")}>
                            {p.congelado ? "❄️ " : ""}{agotado ? "¡Tiempo!" : `${p.restante} s`}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                            {agotado ? "Sin bono de rapidez, pero puedes seguir respondiendo"
                                : p.tieneResultado ? "Reloj detenido" : "Responde antes de que se acabe para ganar bono"}
                        </span>
                    </div>
                    <div className="barra-xp h-3.5 mt-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.restante}
                         aria-label="Tiempo restante">
                        <span style={{
                            width: `${fraccion * 100}%`,
                            background: p.congelado ? "linear-gradient(180deg,#BAE6FD,#38BDF8)"
                                : urgente ? "linear-gradient(180deg,#FDA4AF,#E11D48)" : undefined,
                            transition: "width 1s linear",
                        }} />
                    </div>
                </div>
                <AnimatePresence mode="popLayout">
                    {p.combo >= 2 && (
                        <motion.span
                            key={p.combo}
                            initial={{ scale: 0.4, rotate: -12 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 14 }}
                            className="pieza shrink-0 rounded-2xl bg-[var(--j-fuego)] text-white font-juego font-extrabold text-lg px-2.5 py-1"
                            title={`${p.combo} respuestas correctas seguidas`}
                        >
                            🔥 x{p.combo}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {poderes.filter((x) => x.visible).map((x) => {
                    const sinSaldo = saldo < x.precio;
                    const bloqueado = p.tieneResultado || p.poderesRestantes <= 0 || sinSaldo || !!p.usando;
                    return (
                        <button
                            key={x.id}
                            type="button"
                            disabled={bloqueado}
                            onClick={() => p.onPoder(x.id)}
                            className={cn("boton-juego h-10 px-3 flex items-center gap-1.5 text-sm",
                                x.id === "PISTA" ? "bg-[var(--j-indigo)] text-white" : "bg-card text-foreground")}
                            title={sinSaldo ? `Te faltan ${x.precio - saldo} monedas` : `Cuesta ${x.precio} monedas`}
                        >
                            <span aria-hidden>{x.icono}</span>
                            {p.usando === x.id ? "…" : x.nombre}
                            <span className={cn("tabular-nums", x.id === "PISTA" ? "text-white/80" : "text-muted-foreground")}>🪙{x.precio}</span>
                        </button>
                    );
                })}
                <span className="text-xs text-muted-foreground ml-auto">
                    {p.poderesRestantes > 1 ? `Te quedan ${p.poderesRestantes} comodines de Aria en esta práctica.`
                        : p.poderesRestantes === 1 ? "Te queda 1 comodín de Aria en esta práctica." : "Ya usaste tus comodines."}
                    {p.usoAyuda && " Con ayuda, esta pregunta vale la mitad."}
                </span>
            </div>
        </div>
    );
}
