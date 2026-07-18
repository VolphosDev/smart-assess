import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, BookOpen, Brain, CheckSquare, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePractice } from "../presentation/hooks/usePractice";
import { PreguntaCard } from "../presentation/components/practice/PreguntaCard";
import { QuizLoading } from "../presentation/components/practice/QuizLoading";

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
        streamCompleted,
        imagenesCargadas,
        preguntas,
        notaTotal,
        handleVolver,
        handleAnswerChange,
        comprobarRespuestaActual,
        finalizarExamen
    } = usePractice();

    const modeInfo = modeLabels[mode] ?? modeLabels["OPCION_MULTIPLE"];
    const inputsBloqueados = evaluando || !!resultados[currentSlide];

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
        const isFreeTierIssue = errorText.includes("503") || errorText.includes("high demand") || errorText.includes("429") || errorText.includes("Quota exceeded");
        return (
            <div className="text-center py-20 space-y-4 max-w-lg mx-auto">
                <AlertCircle className={cn("w-16 h-16 mx-auto", isFreeTierIssue ? "text-amber-500" : "text-destructive")} />
                <h2 className="font-display font-bold text-2xl">
                    {isFreeTierIssue ? "¡Ups! La IA necesita un respiro 🤖" : "Error al generar las preguntas"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {isFreeTierIssue
                        ? "Hemos alcanzado los límites de la cuota gratuita de IA o el servidor está bajo una alta demanda. Por favor, espera un momento y reinténtalo."
                        : "No hemos podido conectar con el motor de Inteligencia Artificial para estructurar tu examen. Por favor, inténtalo más tarde."}
                </p>
                
                {!isFreeTierIssue && (
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
                        <div className={cn("inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary/10", modeInfo.color)}>
                            {modeInfo.icon}
                            {modeInfo.label}
                        </div>
                        {evaluacion?.nivel_bloom && (
                            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                                Nivel Bloom: <span className="font-bold text-foreground">{getBloomLevelLabel(evaluacion.nivel_bloom)}</span>
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
                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                <span>Progreso del Quiz</span>
                                <span>{Math.round(((currentSlide + (resultados[currentSlide] ? 1 : 0)) / preguntas.length) * 100)}%</span>
                            </div>
                            <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden border border-border/50">
                                <motion.div
                                    className="bg-primary-gradient h-full rounded-full"
                                    animate={{ width: `${((currentSlide + (resultados[currentSlide] ? 1 : 0)) / preguntas.length) * 100}%` }}
                                    transition={{ ease: "easeInOut", duration: 0.3 }}
                                />
                            </div>
                        </div>
                    )}
                </header>
            )}

            {!finalizado && preguntas.length > 0 && (
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="relative"
                        >
                            <PreguntaCard
                                pregunta={preguntas[currentSlide]}
                                index={currentSlide}
                                tipo={mode}
                                valor={respuestas[currentSlide] || ""}
                                onChange={handleAnswerChange}
                                disabled={inputsBloqueados}
                                resultado={resultados[currentSlide]}
                                imagenesCargadas={imagenesCargadas}
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

                            {resultados[currentSlide] && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "mt-5 p-6 rounded-3xl border shadow-soft transition-all duration-300",
                                        resultados[currentSlide].evaluacion.esCorrecta
                                            ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/20 dark:border-emerald-800/30"
                                            : "bg-destructive/5 border-destructive/20 dark:bg-red-950/20 dark:border-red-900/30"
                                    )}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm shrink-0",
                                                resultados[currentSlide].evaluacion.esCorrecta
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-destructive text-white"
                                            )}>
                                                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                                            </div>
                                            <div>
                                                <h4 className="font-display font-bold text-sm text-foreground">Retroalimentación del Tutor IA</h4>
                                                <p className="text-[11px] text-muted-foreground font-medium">Evaluación pedagógica personalizada</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-background/60 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl border border-border/30 shadow-xs">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Puntaje:</span>
                                            <span className={cn(
                                                "text-sm font-black",
                                                resultados[currentSlide].evaluacion.esCorrecta ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                                            )}>
                                                {resultados[currentSlide].evaluacion.puntaje}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-bold">/ {resultados[currentSlide].evaluacion.puntaje_maximo}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed pl-1 font-medium text-balance">
                                        {resultados[currentSlide].evaluacion.explicacion}
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-between items-center pt-6 border-t border-border/60 bg-card rounded-3xl p-5 border shadow-sm">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Pregunta {currentSlide + 1} de {preguntas.length}
                        </span>
                        
                        <div className="flex gap-3">
                            {!resultados[currentSlide] ? (
                                <button
                                    className="px-6 py-2.5 rounded-xl bg-primary-gradient text-white font-bold shadow-soft flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={comprobarRespuestaActual}
                                    disabled={evaluando || !respuestas[currentSlide]}
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
                                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all animate-bounce"
                                        onClick={() => setCurrentSlide(currentSlide + 1)}
                                    >
                                        Siguiente
                                    </button>
                                ) : (
                                    <button
                                        className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-soft flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                                        onClick={() => finalizarExamen(resultados)}
                                        disabled={evaluando}
                                    >
                                        {evaluando ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                            </>
                                        ) : (
                                            "Finalizar y Ver Resultados"
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
                    className="mt-8 p-8 rounded-3xl border border-border bg-card shadow-soft space-y-6"
                >
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                            <h2 className="font-display text-2xl font-bold">Evaluación Completada</h2>
                            <p className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                                Revisión de tu desempeño con el Tutor IA
                                {evaluacion?.nivel_bloom && (
                                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                        Nivel Bloom: {getBloomLevelLabel(evaluacion.nivel_bloom)}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="text-3xl font-black text-primary bg-primary/5 border border-primary/20 px-5 py-2.5 rounded-2xl shadow-sm">{notaTotal} / 20</div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Resumen de respuestas</h3>
                        <div className="space-y-3">
                            {preguntas.map((p, idx) => {
                                const res = resultados[idx];
                                const esCorrecto = res?.evaluacion?.esCorrecta || false;
                                return (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-border/80 bg-background/50">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm",
                                            esCorrecto ? "bg-emerald-500" : "bg-destructive"
                                        )}>
                                            {esCorrecto ? <CheckCircle2 className="w-4.5 h-4.5" /> : <XCircle className="w-4.5 h-4.5" />}
                                        </div>
                                        <div className="flex-1 space-y-1 text-left">
                                            <p className="text-sm font-semibold text-foreground leading-snug">{p.enunciado}</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                                <span className="text-muted-foreground font-semibold">Tu respuesta:</span>
                                                <span className={cn("font-bold", esCorrecto ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                                                    {respuestas[idx] || "No respondió"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={handleVolver}
                        className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-bold shadow-soft hover:opacity-90 active:scale-95 transition-all mt-4"
                    >
                        Volver al curso
                    </button>
                </motion.div>
            )}
        </div>
    );
}