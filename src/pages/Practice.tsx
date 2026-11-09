import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, BookOpen, Brain, CheckSquare, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AriaDescansando } from "@/components/AriaDescansando";
import { CODIGO_IA_NO_DISPONIBLE } from "@/services/http/config";
import { usePractice } from "@/hooks/usePractice";
import { PreguntaCard } from "@/components/practice/PreguntaCard";
import { ResumenDeteccionErrores } from "@/components/practice/ResumenDeteccionErrores";
import { QuizLoading } from "@/components/practice/QuizLoading";
import { HudContrarreloj } from "@/components/practice/HudContrarreloj";
import { AriaPista } from "@/components/gamificacion/AriaPista";
import { AriaComodin } from "@/components/gamificacion/AriaComodin";
import { Escarcha } from "@/components/gamificacion/Escarcha";
import { useContrarreloj } from "@/hooks/useContrarreloj";
import { AriaSvg } from "@/components/Aria";
import { ATERRIZAJE, RESORTE } from "@/lib/movimiento";

const modeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    OPCION_MULTIPLE: {
        label: "Opción múltiple",
        icon: <CheckSquare className="w-4 h-4" />,
        color: "text-primary",
    },
    VERDADERO_FALSO: {
        label: "Verdadero / Falso",
        icon: <BookOpen className="w-4 h-4" />,
        color: "text-lime-600",
    },
    ABIERTA: {
        label: "Pregunta abierta",
        icon: <Brain className="w-4 h-4" />,
        color: "text-coral-600",
    },
    DETECCION_ERRORES: {
        label: "Detección de errores",
        icon: <CheckSquare className="w-4 h-4" />,
        color: "text-lime-600",
    },
    VISUAL_QUIZ: {
        label: "Visual Quiz con IA",
        icon: <BookOpen className="w-4 h-4" />,
        color: "text-coral-600",
    },
};

const getBloomLevelLabel = (level: string | number) => {
    if (!level) return "No especificado";
    const clean = level.toString().trim().toLowerCase();
    if (clean === "1" || clean.includes("recordar") || clean.includes("conocimiento")) {
        return "Recordar (Conocimiento)";
    }
    if (clean === "2" || clean.includes("comprender") || clean.includes("comprension")) {
        return "Comprender (Comprensión)";
    }
    if (clean === "3" || clean.includes("aplicar") || clean.includes("aplicacion")) {
        return "Aplicar (Aplicación)";
    }
    if (clean === "4" || clean.includes("analizar") || clean.includes("analisis")) {
        return "Analizar (Análisis)";
    }
    if (clean === "5" || clean.includes("evaluar") || clean.includes("evaluacion")) {
        return "Evaluar (Evaluación)";
    }
    if (clean === "6" || clean.includes("crear") || clean.includes("sintesis")) {
        return "Crear (Síntesis)";
    }
    return level;
};

export default function Practice() {
    const topRef = useRef<HTMLDivElement>(null);
    // Aria se ubica junto a esta tarjeta cuando usa un comodín o da una pista.
    const refPregunta = useRef<HTMLDivElement>(null);
    const {
        courseId,
        semanaId,
        mode,
        cantidad,
        mongoId,
        respuestas,
        evaluando,
        resultados,
        currentSlide,
        setCurrentSlide,
        finalizado,
        evaluacion,
        isLoading,
        isError,
        errorMsg,
        codigoError,
        streamCompleted,
        imagenesCargadas,
        preguntas,
        handleVolver,
        handleAnswerChange,
        comprobarRespuestaActual,
        finalizarExamen
    } = usePractice();

    const modeInfo = modeLabels[mode] ?? modeLabels["OPCION_MULTIPLE"];
    const inputsBloqueados = evaluando || !!resultados[currentSlide];

    // Contrarreloj: opcional, se elige antes de responder la primera pregunta y luego queda fijo.
    const [searchParams] = useSearchParams();
    const [contrarreloj, setContrarreloj] = useState(searchParams.get("contrarreloj") === "1");
    const yaEmpezo = resultados.some(Boolean);
    const juego = useContrarreloj({
        activo: contrarreloj && !finalizado,
        preguntas,
        slide: currentSlide,
        resultados,
        evaluando,
        tipo: mode,
        nivelBloom: evaluacion?.nivel_bloom,
    });
    // Con ayuda (pista o 50/50) la pregunta vale la mitad: se ve así y se guarda así.
    const resultadosVista = contrarreloj ? juego.ajustar(resultados) : resultados;
    const notaTotal = resultadosVista.reduce((t: number, r: any) => t + (r?.evaluacion?.puntaje || 0), 0).toFixed(2);
    const opcionesActuales = preguntas[currentSlide] && Array.isArray(preguntas[currentSlide].opciones_o_respuesta)
        ? (preguntas[currentSlide].opciones_o_respuesta as string[]) : [];

    const terminar = async () => {
        await finalizarExamen(resultadosVista);
        if (contrarreloj) juego.cobrarBono();
    };

    if (!mongoId) {
        return (
            <div className="text-center py-20 space-y-3">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="font-semibold">Esta semana no tiene materiales disponibles.</p>
                <Link
                    to={`/app/curso/${courseId}/semana/${semanaId}`}
                    className="text-primary font-semibold hover:underline text-sm"
                >
                    Volver a elegir modalidad
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return <QuizLoading />;
    }

    if (isError) {
        const errorText = errorMsg || "Error desconocido";
        const isFreeTierIssue = codigoError === CODIGO_IA_NO_DISPONIBLE
            || errorText.includes("503") || errorText.includes("high demand")
            || errorText.includes("429") || errorText.includes("Quota exceeded");

        if (isFreeTierIssue) {
            return (
                <AriaDescansando
                    contexto="generacion"
                    onReintentar={() => window.location.reload()}
                />
            );
        }

        return (
            <div className="text-center py-20 space-y-4 max-w-lg mx-auto">
                <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
                <h2 className="font-display font-bold text-2xl">
                    Error al generar las preguntas
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    No hemos podido conectar con el motor de Inteligencia Artificial para estructurar tu examen. Por favor, inténtalo más tarde.
                </p>

                {(
                    <details className="text-left bg-muted/40 border border-border/60 rounded-lg p-3 text-xs text-muted-foreground max-w-md mx-auto">
                        <summary className="cursor-pointer font-semibold hover:text-foreground transition-colors select-none">
                            Ver detalles técnicos
                        </summary>
                        <p className="mt-2 font-mono whitespace-pre-wrap leading-relaxed break-words bg-background/60 p-2 rounded-md border border-border/40">
                            {errorText}
                        </p>
                    </details>
                )}

                <div className="pt-4">
                    <Link
                        to={`/app/curso/${courseId}/semana/${semanaId}`}
                        className="inline-block px-6 py-3 rounded-xl bg-primary-gradient text-white font-bold shadow-soft hover:opacity-90 active:scale-95 transition-all"
                    >
                        Volver e intentar de nuevo
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div ref={topRef} className="space-y-8 max-w-4xl mx-auto pb-10">
            <button
                onClick={handleVolver}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" /> Volver
            </button>

            {!finalizado && (
                <header className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="pieza inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-juego text-lg font-extrabold">
                            <span className={modeInfo.color}>{modeInfo.icon}</span>
                            {modeInfo.label}
                        </div>
                        {evaluacion?.nivel_bloom && (
                            <span className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                                Nivel de Bloom: <span className="font-bold text-foreground">{getBloomLevelLabel(evaluacion.nivel_bloom)}</span>
                            </span>
                        )}
                    </div>

                    {preguntas.length > 0 && preguntas.length < cantidad && !streamCompleted && (
                        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary text-xs font-bold leading-normal animate-pulse shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
                            <span>El Tutor IA está redactando más preguntas en segundo plano ({preguntas.length} de {cantidad} listas). Puedes empezar a responder las que ya están cargadas.</span>
                        </div>
                    )}
                    
                    {preguntas.length > 0 && (
                        // Progreso como mapa de niveles: una ficha por pregunta (verde acierto, rosa error, índigo la actual).
                        <ol className="flex items-center gap-1.5 pt-1" aria-label="Progreso de la práctica">
                            {preguntas.map((_, i) => {
                                const r = resultadosVista[i];
                                const actual = i === currentSlide && !r;
                                return (
                                    <li key={i} className="flex-1 flex items-center gap-1.5 last:flex-none">
                                        <motion.span
                                            animate={actual ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                                            transition={actual ? { duration: 1.2, repeat: Infinity } : RESORTE.salto}
                                            className={cn("pieza grid place-items-center w-9 h-9 shrink-0 rounded-xl font-juego text-base font-extrabold",
                                                r ? (r.evaluacion?.esCorrecta ? "bg-[#16A34A] text-white" : "bg-[#E11D48] text-white")
                                                    : actual ? "bg-[var(--j-indigo)] text-white" : "bg-card text-muted-foreground")}
                                            aria-label={`Pregunta ${i + 1}${r ? (r.evaluacion?.esCorrecta ? ", correcta" : ", incorrecta") : actual ? ", actual" : ""}`}
                                        >
                                            {r ? (r.evaluacion?.esCorrecta ? "✓" : "✗") : i + 1}
                                        </motion.span>
                                        {i < preguntas.length - 1 && (
                                            <span className={cn("h-1.5 flex-1 rounded-full", r ? "bg-[#2B2140]" : "bg-[#2B2140]/15")} />
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    {preguntas.length > 0 && !yaEmpezo && mode !== "VISUAL_QUIZ" && (
                        <label className={cn("pieza flex items-center gap-4 rounded-3xl px-4 py-3 cursor-pointer transition-colors",
                            contrarreloj ? "bg-[var(--j-indigo)] text-white" : "bg-card")}>
                            <span className="text-3xl" aria-hidden>⚡</span>
                            <span className="flex-1">
                                <span className="block font-juego text-xl font-extrabold leading-tight">Modo contrarreloj</span>
                                <span className={cn("block text-sm", contrarreloj ? "text-white/85" : "text-muted-foreground")}>
                                    Cada pregunta tiene su tiempo. Responde rápido y encadena aciertos para ganar monedas extra. Si te trabas, Aria te ayuda con sus comodines.
                                </span>
                            </span>
                            <input
                                type="checkbox"
                                checked={contrarreloj}
                                onChange={(e) => setContrarreloj(e.target.checked)}
                                className="w-6 h-6 accent-[var(--j-oro)] shrink-0"
                                aria-label="Activar modo contrarreloj"
                            />
                        </label>
                    )}
                </header>
            )}

            {!finalizado && preguntas.length > 0 && (
                <div className="space-y-6">
                    {contrarreloj && (
                        <HudContrarreloj
                            restante={juego.restante}
                            total={juego.total}
                            congelado={juego.congelado}
                            combo={juego.combo}
                            ultimo={juego.ultimo}
                            tieneResultado={!!resultados[currentSlide] || evaluando}
                            permiteMitad={mode === "OPCION_MULTIPLE" && opcionesActuales.length >= 3 && juego.ocultas.length === 0}
                            poderesRestantes={juego.poderesRestantes}
                            precioPista={juego.precioPista}
                            usando={juego.usando ?? juego.comodinEnEscena}
                            usoAyuda={juego.usoAyuda}
                            onPoder={juego.usarPoder}
                        />
                    )}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="relative"
                            ref={refPregunta}
                        >
                            {contrarreloj && juego.escarchaHasta > Date.now() && <Escarcha hasta={juego.escarchaHasta} />}
                            <PreguntaCard
                                pregunta={preguntas[currentSlide]}
                                index={currentSlide}
                                tipo={mode}
                                valor={respuestas[currentSlide] || ""}
                                onChange={handleAnswerChange}
                                disabled={inputsBloqueados}
                                resultado={resultados[currentSlide]}
                                imagenesCargadas={imagenesCargadas}
                                ocultas={contrarreloj ? juego.ocultas : undefined}
                            />

                            {evaluando && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center gap-3 text-sm font-semibold text-primary"
                                >
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    El Tutor IA está evaluando tu respuesta...
                                </motion.div>
                            )}

                            {resultados[currentSlide] && (() => {
                                const ev = resultadosVista[currentSlide].evaluacion;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={RESORTE.interfaz}
                                        className={cn("pieza mt-5 rounded-[1.75rem] p-5 flex gap-4 items-start",
                                            ev.esCorrecta ? "bg-[#DCFCE7] text-[#14532D] dark:bg-emerald-950/50 dark:text-emerald-100"
                                                : "bg-[#FFE4E6] text-[#881337] dark:bg-rose-950/50 dark:text-rose-100")}
                                    >
                                        <motion.div className="w-20 h-24 shrink-0" {...ATERRIZAJE} style={{ originY: 1 }}>
                                            <AriaSvg estado={ev.esCorrecta ? "celebrando" : "confundido"} className="w-full h-full" />
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="font-juego text-3xl font-extrabold leading-none">
                                                    {ev.esCorrecta ? "¡Correcto!" : "Casi, revisa esto"}
                                                </p>
                                                <span className="pieza rounded-full bg-card text-foreground px-3 py-1 font-juego text-lg font-extrabold tabular-nums">
                                                    {ev.puntaje} / {ev.puntaje_maximo}
                                                </span>
                                            </div>
                                            <p className="mt-2 leading-relaxed text-balance">{ev.explicacion}</p>
                                        </div>
                                    </motion.div>
                                );
                            })()}
                        </motion.div>
                    </AnimatePresence>

                    <div className="pieza flex justify-between items-center gap-3 bg-card rounded-[1.75rem] p-4">
                        <span className="font-juego text-lg font-extrabold text-muted-foreground tabular-nums">
                            {currentSlide + 1} de {preguntas.length}
                        </span>
                        
                        <div className="flex gap-3">
                            {!resultados[currentSlide] ? (
                                <button
                                    className="boton-juego h-12 px-7 bg-[var(--j-oro)] text-[var(--j-tinta)] text-xl flex items-center gap-2"
                                    onClick={comprobarRespuestaActual}
                                    disabled={evaluando || (mode !== "DETECCION_ERRORES" && !respuestas[currentSlide])}
                                >
                                    {evaluando ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Evaluando...
                                        </>
                                    ) : (
                                        "Comprobar"
                                    )}
                                </button>
                            ) : (
                                currentSlide < preguntas.length - 1 ? (
                                    <button
                                        className="boton-juego h-12 px-7 bg-[var(--j-indigo)] text-white text-xl flex items-center gap-2"
                                        onClick={() => setCurrentSlide(currentSlide + 1)}
                                    >
                                        Siguiente
                                    </button>
                                ) : (
                                    <button
                                        className="boton-juego h-12 px-7 bg-[#16A34A] text-white text-xl flex items-center gap-2"
                                        onClick={terminar}
                                        disabled={evaluando}
                                    >
                                        {evaluando ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                            </>
                                        ) : (
                                            "Ver mis resultados"
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {finalizado && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pieza mt-4 p-6 md:p-8 rounded-[2rem] bg-card space-y-6"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-border pb-5">
                        <div>
                            <h2 className="font-juego text-4xl font-extrabold leading-none">¡Práctica completada!</h2>
                            <p className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                                Revisión de tu desempeño con el Tutor IA
                                {evaluacion?.nivel_bloom && (
                                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                        Nivel Bloom: {getBloomLevelLabel(evaluacion.nivel_bloom)}
                                    </span>
                                )}
                            </p>
                        </div>
                        <motion.div initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={RESORTE.rebote}
                                    className="pieza rounded-2xl bg-[var(--j-oro)] text-[var(--j-tinta)] px-5 py-2 font-juego text-4xl font-extrabold tabular-nums">
                            {notaTotal} <span className="text-2xl">/ 20</span>
                        </motion.div>
                    </div>

                    {contrarreloj && (
                        <div className="pieza rounded-3xl bg-[var(--j-indigo)] text-white p-4 grid grid-cols-3 gap-3 text-center">
                            <div>
                                <p className="font-juego text-3xl font-extrabold leading-none">⚡ {juego.rapidas}</p>
                                <p className="text-xs text-white/80 mt-1">respuestas a tiempo</p>
                            </div>
                            <div>
                                <p className="font-juego text-3xl font-extrabold leading-none">🔥 x{juego.comboMaximo}</p>
                                <p className="text-xs text-white/80 mt-1">mejor combo</p>
                            </div>
                            <div>
                                <p className="font-juego text-3xl font-extrabold leading-none text-[var(--j-oro)]">
                                    {juego.bono === null ? "…" : `+${juego.bono}`} 🪙
                                </p>
                                <p className="text-xs text-white/80 mt-1">bono de la partida</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="font-juego text-2xl font-extrabold">Tus respuestas</h3>
                        <div className="space-y-3">
                            {preguntas.map((p, idx) => {
                                const res = resultadosVista[idx];
                                const esCorrecto = res?.evaluacion?.esCorrecta || false;
                                return (
                                    <div key={idx} className="opcion-juego flex items-start gap-4 p-4" data-estado={esCorrecto ? "correcta" : "incorrecta"} style={{ animation: "none" }}>
                                        <span className="ficha-letra" style={{ background: esCorrecto ? "#16A34A" : "#E11D48", color: "#fff" }}>
                                            {esCorrecto ? "✓" : "✗"}
                                        </span>
                                        <div className="flex-1 space-y-1 text-left">
                                            <p className="text-sm font-semibold text-foreground leading-snug">{p.enunciado}</p>
                                            {/* La deteccion de errores necesita su propia
                                                presentacion: su respuesta es un mapa
                                                {fragmento: correccion} y aqui se pintaba
                                                serializado, obligando al alumno a leer JSON
                                                para saber que hizo mal. */}
                                            {String(p.tipo_pregunta || "").toUpperCase() === "DETECCION_ERRORES" ? (
                                                <ResumenDeteccionErrores
                                                    respuesta={respuestas[idx] || ""}
                                                    fragmentos={Array.isArray(p.opciones_o_respuesta)
                                                        ? p.opciones_o_respuesta
                                                        : []}
                                                    esperadas={p.respuesta_correcta || ""}
                                                />
                                            ) : (
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                                    <span className="text-muted-foreground font-semibold">Tu respuesta:</span>
                                                    <span className={cn("font-bold", esCorrecto ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                                                        {respuestas[idx] || "No respondió"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={handleVolver}
                        className="boton-juego w-full h-14 bg-[var(--j-indigo)] text-white text-2xl mt-2"
                    >
                        Volver al curso
                    </button>
                </motion.div>
            )}

            <AriaPista pista={juego.pista} onCerrar={juego.cerrarPista} ancla={refPregunta} />
            <AriaComodin comodin={juego.comodinEnEscena} onTerminar={juego.terminarComodin} ancla={refPregunta} />
        </div>
    );
}