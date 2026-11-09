import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { enVivoApi, FICHAS, mensajeError, sinLetra } from "@/services/enVivo";
import { cn } from "@/lib/utils";

/**
 * Pantalla que el docente proyecta en la pizarra. Se actualiza sola cada segundo.
 * Muestra apodos, nunca nombres: la clase entera la está mirando.
 */
export default function ClaseEnVivoDocente() {
    const { codigo = "" } = useParams();
    const qc = useQueryClient();
    const { data: t, error } = useQuery({
        queryKey: ["en-vivo", "tablero", codigo],
        queryFn: () => enVivoApi.tablero(codigo),
        refetchInterval: 1000,
        retry: false,
    });
    const avanzar = useMutation({
        mutationFn: () => enVivoApi.avanzar(codigo),
        onSuccess: (d) => qc.setQueryData(["en-vivo", "tablero", codigo], d),
        onError: (e) => toast.error(mensajeError(e, "No se pudo avanzar.")),
    });

    if (error) {
        return (
            <div className="text-center py-20 space-y-3">
                <p className="font-semibold">{mensajeError(error, "Esta clase en vivo ya no existe.")}</p>
                <Link to="/docente" className="text-primary font-semibold hover:underline">Volver</Link>
            </div>
        );
    }
    if (!t) return null;

    const segundosRestantes = Math.ceil((t.restanteMs ?? 0) / 1000);
    const textoBoton = t.fase === "ESPERA" ? "Empezar"
        : t.fase === "PREGUNTA" ? "Cerrar pregunta"
        : t.fase === "RESULTADO" ? (t.indice + 1 >= t.total ? "Ver el podio" : "Siguiente pregunta") : null;

    return (
        <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <Link to="/docente" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" /> Salir
                </Link>
                <button type="button" onClick={() => document.documentElement.requestFullscreen?.()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <Maximize2 className="w-4 h-4" /> Pantalla completa
                </button>
            </div>

            <section className="pieza rounded-[2rem] overflow-hidden text-white min-h-[70vh] flex flex-col"
                     style={{ background: "radial-gradient(circle at 50% 0%, #4C2FD0 0%, #24135F 55%, #140A38 100%)" }}>
                <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b-[2.5px] border-[var(--j-tinta)] bg-black/15">
                    <div>
                        <p className="text-white/70 text-sm">{t.curso}{t.tema ? `, ${t.tema}` : ""}</p>
                        <p className="font-juego text-2xl font-extrabold leading-none">
                            {t.fase === "ESPERA" ? "Clase en vivo" : t.fase === "FIN" ? "Podio final" : `Pregunta ${t.indice + 1} de ${t.total}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-white/70 text-sm">Código</p>
                        <p className="font-juego text-3xl font-extrabold tracking-[0.2em] leading-none text-[var(--j-oro)]">{t.codigo}</p>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10 flex flex-col">
                    {t.fase === "ESPERA" && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                            <p className="text-xl text-white/85">Entren a Semantika, toquen <b>En vivo</b> y escriban el código</p>
                            <p className="font-juego text-7xl md:text-9xl font-extrabold tracking-[0.15em] text-[var(--j-oro)] leading-none">{t.codigo}</p>
                            <p className="font-juego text-2xl font-extrabold">{t.participantes} {t.participantes === 1 ? "alumno conectado" : "alumnos conectados"}</p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
                                <AnimatePresence>
                                    {t.apodos.map((a) => (
                                        <motion.span key={a} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                     className="pieza rounded-full bg-white text-[var(--j-tinta)] font-bold px-3 py-1">{a}</motion.span>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {(t.fase === "PREGUNTA" || t.fase === "RESULTADO") && t.opciones && (
                        <div className="flex-1 flex flex-col gap-6">
                            <div className="flex items-start gap-6">
                                <h2 className="flex-1 font-juego text-3xl md:text-5xl font-extrabold leading-tight">{t.pregunta}</h2>
                                {t.fase === "PREGUNTA" && (
                                    <div className="pieza shrink-0 grid place-items-center w-24 h-24 rounded-full bg-white text-[var(--j-tinta)]">
                                        <span className="font-juego text-5xl font-extrabold tabular-nums">{segundosRestantes}</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 mt-auto">
                                {t.opciones.map((o, i) => {
                                    const f = FICHAS[i % FICHAS.length];
                                    const esCorrecta = t.fase === "RESULTADO" && t.correcta === i;
                                    const apagada = t.fase === "RESULTADO" && !esCorrecta;
                                    const votos = t.distribucion?.[i] ?? 0;
                                    return (
                                        <div key={i} className={cn("pieza rounded-2xl flex items-center gap-4 px-5 py-4 transition-opacity",
                                            apagada && "opacity-40")} style={{ background: f.color, color: f.texto }}>
                                            <span className="text-3xl" aria-hidden>{f.forma}</span>
                                            <span className="flex-1 font-juego text-2xl font-extrabold leading-tight">{sinLetra(o)}</span>
                                            {t.fase === "RESULTADO" && (
                                                <span className="font-juego text-3xl font-extrabold tabular-nums">{esCorrecta ? "✓ " : ""}{votos}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {t.fase === "PREGUNTA" && (
                                <p className="text-center font-juego text-2xl font-extrabold">
                                    Respondieron {t.respondieron ?? 0} de {t.participantes}
                                </p>
                            )}
                            {t.fase === "RESULTADO" && t.ranking && <Ranking filas={t.ranking} />}
                        </div>
                    )}

                    {t.fase === "FIN" && t.ranking && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6">
                            <div className="flex items-end justify-center gap-4">
                                {[1, 0, 2].map((i) => {
                                    const r = t.ranking![i];
                                    if (!r) return <div key={i} className="w-40" />;
                                    const alto = i === 0 ? "h-48" : i === 1 ? "h-36" : "h-28";
                                    const color = i === 0 ? "var(--j-oro)" : i === 1 ? "var(--j-plata)" : "var(--j-bronce)";
                                    return (
                                        <div key={i} className="w-40 flex flex-col items-center text-center">
                                            <span className="text-5xl" aria-hidden>{["🥇", "🥈", "🥉"][i]}</span>
                                            <span className="font-juego text-xl font-extrabold mt-1">{r.apodo}</span>
                                            <span className="text-white/80 tabular-nums">{r.puntos} pts</span>
                                            <div className={cn("pieza podio-sube w-full mt-2 rounded-t-2xl border-b-0", alto)} style={{ background: color }} />
                                        </div>
                                    );
                                })}
                            </div>
                            <Ranking filas={t.ranking.slice(3)} desde={4} />
                        </div>
                    )}
                </div>

                {textoBoton && (
                    <footer className="px-6 pb-6 flex justify-end">
                        <button type="button" disabled={avanzar.isPending} onClick={() => avanzar.mutate()}
                                className="boton-juego h-14 px-8 bg-[var(--j-oro)] text-[var(--j-tinta)] text-2xl">
                            {textoBoton}
                        </button>
                    </footer>
                )}
            </section>
        </div>
    );
}

function Ranking({ filas, desde = 1 }: { filas: { apodo: string; puntos: number }[]; desde?: number }) {
    if (filas.length === 0) return null;
    return (
        <ol className="grid gap-2 max-w-xl w-full mx-auto">
            {filas.map((f, i) => (
                <li key={f.apodo + i} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2">
                    <span className="font-juego font-extrabold text-xl w-6 text-center">{desde + i}</span>
                    <span className="flex-1 font-semibold">{f.apodo}</span>
                    <span className="font-juego font-extrabold tabular-nums">{f.puntos} pts</span>
                </li>
            ))}
        </ol>
    );
}
