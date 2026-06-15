import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, BookOpen, Brain, CheckSquare, RefreshCw } from "lucide-react";
import { evaluacionApi, agentJudgeApi, intentosApi } from "@/api/courses.ts";
import { cn } from "@/lib/utils";
import {toast} from "sonner";

interface Pregunta {
    enunciado: string;
    opciones_o_respuesta: string[] | string;
    justificacion_pregunta: string;
    respuesta_correcta?: string;
    base64_imagen?: string;
    prompt_imagen?: string;
}

interface EvaluacionResponse {
    preguntas: Pregunta[];
    tipo_pregunta: string;
    nivel_bloom: string;
    metricas_objetivas: Record<string, unknown>;
}

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

function PreguntaMultiple({
                              pregunta, index, valor, onChange, disabled, resultado, esVisualQuiz = false
                          }: {
    pregunta: Pregunta; index: number; valor: string; onChange: (val: string) => void; disabled?: boolean; resultado?: any; esVisualQuiz?: boolean;
}) {
    const opcionesArray = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : (pregunta.opciones_o_respuesta || "").split(" | ");

    const tieneResultado = !!resultado;
    const respuestaCorrecta = pregunta.respuesta_correcta || "";

    if (esVisualQuiz) {
        return (
            <div className="space-y-4">
                <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">
                    {pregunta.enunciado}
                </p>
                <ul className="grid sm:grid-cols-2 gap-3 p-0 m-0">
                    {opcionesArray.map((op, i) => {
                        const esSeleccionado = valor === op;
                        const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
                        
                        const hasLetterPrefix = /^[A-D]\)/.test(op.trim());
                        const letter = hasLetterPrefix ? op.trim().charAt(0) : String.fromCharCode(65 + i);
                        const cleanText = hasLetterPrefix ? op.replace(/^[A-D]\)\s*/, "") : op;

                        let cardStyle = "border-border bg-secondary/10 hover:bg-secondary/20 hover:border-primary/20";
                        let badgeStyle = "bg-secondary/40 text-muted-foreground";

                        if (tieneResultado) {
                            if (esCorrecto) {
                                cardStyle = "border-green-300 bg-green-500/10 text-green-700 dark:text-green-300";
                                badgeStyle = "bg-green-500 text-white";
                            } else if (esSeleccionado && !esCorrecto) {
                                cardStyle = "border-red-300 bg-red-500/10 text-red-700 dark:text-red-300";
                                badgeStyle = "bg-red-500 text-white";
                            } else {
                                cardStyle = "border-border bg-secondary/5 opacity-60";
                                badgeStyle = "bg-secondary/20 text-muted-foreground/50";
                            }
                        } else if (esSeleccionado) {
                            cardStyle = "border-primary bg-primary/5 shadow-soft ring-1 ring-primary/30";
                            badgeStyle = "bg-primary text-white";
                        }

                        return (
                            <li key={i} className="list-none">
                                <label className={cn(
                                    "flex items-center gap-3 p-4 rounded-2xl border transition-all text-sm font-medium",
                                    disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer active:scale-[0.98]",
                                    cardStyle
                                )}>
                                    <input
                                        type="radio"
                                        name={`q-${index}`}
                                        value={op}
                                        checked={esSeleccionado}
                                        onChange={(e) => onChange(e.target.value)}
                                        disabled={disabled}
                                        className="sr-only"
                                    />
                                    <span className={cn(
                                        "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors duration-200",
                                        badgeStyle
                                    )}>
                                        {letter}
                                    </span>
                                    <span className="flex-1 leading-snug">{cleanText}</span>
                                    {tieneResultado && esCorrecto && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full shrink-0">
                                            Correcta
                                        </span>
                                    )}
                                    {tieneResultado && esSeleccionado && !esCorrecto && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full shrink-0">
                                            Tu respuesta
                                        </span>
                                    )}
                                </label>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    // Original list layout for OPCION_MULTIPLE
    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <ul className="space-y-2">
                {opcionesArray.map((op, i) => {
                    const esSeleccionado = valor === op;
                    const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
                    
                    let cardStyle = "border-border bg-secondary/20 hover:bg-secondary/40";
                    if (tieneResultado) {
                        if (esCorrecto) {
                            cardStyle = "border-green-300 bg-green-500/10 text-green-700 dark:text-green-300";
                        } else if (esSeleccionado && !esCorrecto) {
                            cardStyle = "border-red-300 bg-red-500/10 text-red-700 dark:text-red-300";
                        } else {
                            cardStyle = "border-border bg-secondary/10 opacity-60";
                        }
                    } else if (esSeleccionado) {
                        cardStyle = "border-primary bg-primary/5";
                    }

                    return (
                        <li key={i}>
                            <label className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border transition-colors text-sm",
                                disabled ? "cursor-not-allowed" : "cursor-pointer",
                                cardStyle
                            )}>
                                <input
                                    type="radio"
                                    name={`q-${index}`}
                                    value={op}
                                    checked={esSeleccionado}
                                    onChange={(e) => onChange(e.target.value)}
                                    disabled={disabled}
                                    className="mt-0.5 accent-primary shrink-0 disabled:cursor-not-allowed"
                                />
                                <span className="font-medium">{op}</span>
                                {tieneResultado && esCorrecto && (
                                    <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full shrink-0">
                                        Correcta
                                    </span>
                                )}
                                {tieneResultado && esSeleccionado && !esCorrecto && (
                                    <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full shrink-0">
                                        Tu respuesta
                                    </span>
                                )}
                            </label>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function PreguntaVF({
                        pregunta, index, valor, onChange, disabled, resultado,
                    }: {
    pregunta: Pregunta; index: number; valor: string; onChange: (val: string) => void; disabled?: boolean; resultado?: any;
}) {
    const tieneResultado = !!resultado;
    const respuestaCorrecta = pregunta.respuesta_correcta || "";

    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <div className="flex gap-3">
                {["VERDADERO", "FALSO"].map((op) => {
                    const esSeleccionado = valor === op;
                    const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();

                    let cardStyle = "border-border bg-secondary/20 hover:bg-secondary/40";
                    if (tieneResultado) {
                        if (esCorrecto) {
                            cardStyle = "border-green-300 bg-green-500/10 text-green-700 dark:text-green-300";
                        } else if (esSeleccionado && !esCorrecto) {
                            cardStyle = "border-red-300 bg-red-500/10 text-red-700 dark:text-red-300";
                        } else {
                            cardStyle = "border-border bg-secondary/10 opacity-60";
                        }
                    } else if (esSeleccionado) {
                        cardStyle = "border-primary bg-primary/10";
                    }

                    return (
                        <label
                            key={op}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-colors text-sm font-semibold relative",
                                disabled ? "cursor-not-allowed" : "cursor-pointer",
                                cardStyle
                            )}
                        >
                            <input
                                type="radio"
                                name={`q-${index}`}
                                value={op}
                                checked={esSeleccionado}
                                onChange={(e) => onChange(e.target.value)}
                                disabled={disabled}
                                className="hidden"
                            />
                            <span>{op}</span>
                            {tieneResultado && esCorrecto && (
                                <span className="text-[10px] font-bold text-green-600 uppercase">
                                    Correcto
                                </span>
                            )}
                            {tieneResultado && esSeleccionado && !esCorrecto && (
                                <span className="text-[10px] font-bold text-red-600 uppercase">
                                    Marcado
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

function PreguntaAbierta({
                             pregunta, valor, onChange, disabled,
                         }: {
    pregunta: Pregunta; valor: string; onChange: (val: string) => void; disabled?: boolean;
}) {
    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <textarea
                rows={4}
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}

function PreguntaDeteccionErrores({
    pregunta, index, valor, onChange, disabled, resultado
}: {
    pregunta: Pregunta; index: number; valor: string; onChange: (val: string) => void; disabled?: boolean; resultado?: any;
}) {
    // Parse current corrections
    const correcciones: Record<string, string> = (() => {
        try {
            return valor ? JSON.parse(valor) : {};
        } catch(e) {
            return {};
        }
    })();

    const updateCorreccion = (word: string, corr: string) => {
        const newCorr = { ...correcciones, [word]: corr };
        onChange(JSON.stringify(newCorr));
    };

    const incorrectWords = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : [];

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (incorrectWords.length === 0) return <div>{pregunta.enunciado}</div>;

    const regex = new RegExp(`(${incorrectWords.map(escapeRegExp).join('|')})`, 'gi');
    const parts = pregunta.enunciado.split(regex);
    const tieneResultado = !!resultado;

    return (
        <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Haz clic en las palabras subrayadas en el texto para escribir la corrección adecuada:
            </p>
            <div className="p-5 rounded-2xl bg-secondary/15 border border-border/80 text-foreground leading-relaxed text-sm md:text-base font-medium">
                {parts.map((part, idx) => {
                    const lowerPart = part.toLowerCase();
                    const targetWord = incorrectWords.find(w => w.toLowerCase() === lowerPart);

                    if (targetWord) {
                        const valorCorreccion = correcciones[targetWord] || "";
                        const tieneCorreccion = valorCorreccion.trim().length > 0;
                        
                        let wordStyle = "border-b-2 border-dashed border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer";
                        if (tieneResultado) {
                            wordStyle = "border-b-2 border-dashed border-border opacity-70";
                        } else if (tieneCorreccion) {
                            wordStyle = "border-b-2 border-solid border-primary text-primary bg-primary/5";
                        }

                        return (
                            <span key={idx} className="relative inline-block mx-1">
                                {tieneResultado ? (
                                    <span className={cn("px-1 py-0.5 rounded font-bold", wordStyle)}>
                                        {part}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        disabled={disabled}
                                        value={valorCorreccion}
                                        onChange={(e) => updateCorreccion(targetWord, e.target.value)}
                                        placeholder={part}
                                        title={`Haz clic para corregir '${part}'`}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition w-32 placeholder:text-amber-700/80 dark:placeholder:text-amber-300/80 placeholder:italic",
                                            wordStyle
                                        )}
                                    />
                                )}
                            </span>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </div>

            {tieneResultado && (
                <div className="text-xs space-y-2 pt-2 border-t border-border/50">
                    <p className="font-bold text-muted-foreground">Comparación de tus correcciones:</p>
                    <ul className="space-y-1">
                        {incorrectWords.map((word, idx) => {
                            const corrEstudiante = correcciones[word] || "(No respondido)";
                            const correctAnswers = (pregunta.respuesta_correcta || "")
                                .split("|")
                                .map(s => s.trim());
                            const respuestaReal = correctAnswers[idx] || "N/A";
                            return (
                                <li key={word} className="flex flex-wrap items-center justify-between gap-1.5 font-semibold text-sm border-b border-border/40 pb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="line-through text-red-500">{word}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className={cn(
                                            corrEstudiante === "(No respondido)" 
                                                ? "text-red-500/80 italic font-normal" 
                                                : "text-green-600 dark:text-green-400"
                                        )}>
                                            {corrEstudiante}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-lg border border-border/30">
                                        Respuesta correcta: <span className="font-bold text-foreground">{respuestaReal}</span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

function PreguntaCard({
                          pregunta, index, tipo, valor, onChange, disabled, resultado,
                      }: {
    pregunta: Pregunta; index: number; tipo: string; valor: string; onChange: (val: string) => void; disabled?: boolean; resultado?: any;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4"
        >
            <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center shrink-0">
                    {index + 1}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Pregunta {index + 1}
                </span>
            </div>

            {tipo === "OPCION_MULTIPLE" && (
                <PreguntaMultiple pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} />
            )}
            {tipo === "VERDADERO_FALSO" && (
                <PreguntaVF pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} />
            )}
            {tipo === "ABIERTA" && (
                <PreguntaAbierta pregunta={pregunta} valor={valor} onChange={onChange} disabled={disabled} />
            )}
            {tipo === "DETECCION_ERRORES" && (
                <PreguntaDeteccionErrores pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} />
            )}
            {tipo === "VISUAL_QUIZ" && (
                <div className="grid md:grid-cols-12 gap-6 items-stretch">
                    {pregunta.base64_imagen && (
                        <div className="md:col-span-5 flex flex-col justify-center">
                            <div className="rounded-2xl overflow-hidden border border-border bg-secondary/5 shadow-md hover:shadow-lg transition-all duration-300">
                                <img 
                                    src={`data:image/png;base64,${pregunta.base64_imagen}`} 
                                    alt="Diagrama explicativo generado por IA"
                                    className="w-full h-auto object-contain max-h-[350px] mx-auto md:max-h-[400px]"
                                />
                            </div>
                        </div>
                    )}
                    <div className={cn("space-y-4", pregunta.base64_imagen ? "md:col-span-7" : "md:col-span-12")}>
                        <PreguntaMultiple pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} esVisualQuiz={true} />
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default function Practice() {
    const topRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [respuestas, setRespuestas] = useState<Record<number, string>>({});
    const [evaluando, setEvaluando] = useState(false);
    const [resultados, setResultados] = useState<any[]>([]);
    const [errorEnIndice, setErrorEnIndice] = useState<number | null>(null);

    const { courseId = "", semanaId = "", mode = "OPCION_MULTIPLE" } = useParams();
    const [searchParams] = useSearchParams();
    const cantidad = Number(searchParams.get("cantidad") ?? "5");
    const mongoId = searchParams.get("mongoId") ?? "";
    const tema = searchParams.get("tema") ?? "";

    // Estados de carga de datos personalizados para soportar SSE Streaming
    const [evaluacion, setEvaluacion] = useState<EvaluacionResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [streamText, setStreamText] = useState(""); // Acumula el texto crudo del stream

    const preguntas = evaluacion?.preguntas ?? [];
    const evaluacionCompleta = resultados.length === preguntas.length && preguntas.length > 0;

    useEffect(() => {
        if (!mongoId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setErrorMsg(null);
        setStreamText("");
        setEvaluacion(null);

        let eventSource: EventSource | null = null;
        let sseCompleted = false;

        // Fallback síncrono si el servidor no soporta SSE Streaming
        const ejecutarFallback = async () => {
            console.log("[Practice] Iniciando fallback síncrono...");
            try {
                const res = await evaluacionApi.generarPreguntas(mongoId, mode, cantidad, tema);
                setEvaluacion(res);
                setIsLoading(false);
            } catch (err: any) {
                console.error("[Practice] Error en fallback:", err);
                setIsError(true);
                setErrorMsg(
                    err?.response?.data || 
                    err?.message || 
                    "Error al generar las preguntas de evaluación."
                );
                setIsLoading(false);
            }
        };

        try {
            const token = localStorage.getItem("token") || "";
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const url = `${baseUrl}/archivos/stream-tecnica-pdf?mongoId=${encodeURIComponent(
                mongoId
            )}&tipo=${mode}&cantidad=${cantidad}${tema ? `&tema=${encodeURIComponent(tema)}` : ""}&token=${token}`;

            eventSource = new EventSource(url, { withCredentials: true });

            eventSource.addEventListener("chunk", (event) => {
                const chunk = event.data;
                if (chunk) {
                    setStreamText((prev) => prev + chunk);
                }
            });

            eventSource.addEventListener("result", (event) => {
                try {
                    sseCompleted = true;
                    const finalData = JSON.parse(event.data);
                    setEvaluacion(finalData);
                    setIsLoading(false);
                    eventSource?.close();
                } catch (err) {
                    console.error("[Practice] Error parseando datos de result SSE:", err);
                    ejecutarFallback();
                    eventSource?.close();
                }
            });

            eventSource.onerror = (err) => {
                console.warn("[Practice] Error en canal SSE (puede que el endpoint no esté expuesto aún):", err);
                eventSource?.close();
                if (!sseCompleted) {
                    ejecutarFallback();
                }
            };
        } catch (e) {
            console.error("[Practice] Error al instanciar EventSource:", e);
            ejecutarFallback();
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [mongoId, mode, cantidad, tema]);

    const handleVolver = () => {
        navigate(`/app/curso/${courseId}/semana/${semanaId}`);
    };

    const modeInfo = modeLabels[mode] ?? modeLabels["OPCION_MULTIPLE"];

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
        return (
            <div className="flex flex-col items-center justify-center py-16 max-w-md mx-auto text-center space-y-8">
                {/* Cerebro flotante con animación suave */}
                <motion.div
                    animate={{
                        y: [0, -12, 0],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="w-20 h-20 rounded-3xl bg-primary-gradient grid place-items-center text-4xl shadow-glow"
                >
                    🧠
                </motion.div>
                
                <div className="space-y-3">
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-balance">
                        ¡Tu tutora IA está preparando el juego! ✨
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Leyendo el material y redactando preguntas divertidas para medir tu nivel de aprendizaje.
                    </p>
                </div>

                {/* Barra de progreso animada */}
                <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden relative border border-border">
                    <motion.div
                        className="bg-primary-gradient h-full rounded-full"
                        animate={{
                            width: ["5%", "95%"],
                        }}
                        transition={{
                            duration: 15,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                </div>

                <div className="text-xs font-bold text-primary animate-pulse tracking-wider uppercase">
                    Generando preguntas... ¡Prepárate!
                </div>
            </div>
        );
    }

    if (isError) {
        const errorText = errorMsg || "Error desconocido";
        const isOverloaded = errorText.includes("503") || errorText.includes("high demand") || errorText.includes("Service Unavailable");
        const isRateLimited = errorText.includes("429") || errorText.includes("Too Many Requests") || errorText.includes("Quota exceeded");
        const isFreeTierIssue = isOverloaded || isRateLimited;

        return (
            <div className="text-center py-20 space-y-4 max-w-md mx-auto">
                <AlertCircle className={cn("w-16 h-16 mx-auto", isFreeTierIssue ? "text-amber-500" : "text-destructive")} />
                <h2 className="font-display font-bold text-2xl">
                    {isFreeTierIssue ? "¡Ups! La IA necesita un respiro 🤖" : "Error al generar las preguntas"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {isFreeTierIssue
                        ? (isRateLimited
                            ? "Hemos alcanzado el límite de peticiones rápidas (Cosas de la capa gratuita de Google 😅). Por favor, espera unos 15 segundos y vuelve a intentarlo."
                            : "Los servidores de IA están experimentando una alta demanda en este momento. Por favor, espera un minuto y vuelve a intentarlo.")
                        : errorText}
                </p>
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

    // Bloquear inputs si se está evaluando, hay resultados, o hubo un error (pausa)
    const inputsBloqueados = evaluando || resultados.length > 0 || errorEnIndice !== null;

    const manejarEnvio = async (desdeIndice = 0) => {
        setEvaluando(true);
        setErrorEnIndice(null);

        // Solo limpiar resultados al inicio, no al reanudar
        if (desdeIndice === 0) {
            setResultados([]);
        }

        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);

        // Array temporal para ir acumulando las evaluaciones sin perder las anteriores
        const nuevosResultados = [...resultados];

        try {
            for (let index = desdeIndice; index < preguntas.length; index++) {
                const p = preguntas[index];
                const respuestaEstudiante = respuestas[index] || "No respondió";

                let respuestaEsperada: string;
                if (mode === "VERDADERO_FALSO" || mode === "OPCION_MULTIPLE" || mode === "VISUAL_QUIZ") {
                    respuestaEsperada = p.respuesta_correcta || p.justificacion_pregunta;
                } else if (mode === "DETECCION_ERRORES") {
                    respuestaEsperada = p.respuesta_correcta || "";
                } else {
                    // ABIERTA
                    respuestaEsperada = p.justificacion_pregunta;
                    if (Array.isArray(p.opciones_o_respuesta)) {
                        respuestaEsperada += " Rúbrica: " + p.opciones_o_respuesta[0];
                    }
                }

                try {
                    const resultado = await agentJudgeApi.evaluarRespuesta({
                        pregunta: p.enunciado,
                        respuestaEsperada,
                        respuestaEstudiante,
                        totalPreguntas: preguntas.length,
                        tipoPregunta: mode,   // NUEVO
                    });

                    nuevosResultados[index] = resultado;
                    // Actualizamos el estado para que la UI se renderice pregunta por pregunta
                    setResultados([...nuevosResultados]);
                } catch (err) {
                    console.error(`Error evaluando pregunta ${index + 1}:`, err);
                    setErrorEnIndice(index);
                    return; // Detiene el flujo si hay error (para poder reanudar luego)
                }
            }

            const notaCalculada = nuevosResultados.reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0);

            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const respuestasDetalle = nuevosResultados.map((res, i) => ({
                preguntaTexto: preguntas[i].enunciado,
                tipoPregunta: mode,
                respuestaEstudiante: respuestas[i] || "No respondió",
                esCorrecta: res.evaluacion.esCorrecta
            }));

            await intentosApi.guardar({
                usuarioId: Number(user.id),
                semanaId: Number(semanaId),
                notaFinal: Number(notaCalculada.toFixed(2)),
                respuestas: respuestasDetalle
            });

            toast.success("¡Examen calificado y guardado en tu historial!");

        } catch(e) {
            console.error("Error al guardar el historial:", e);
            toast.error("El examen se calificó, pero hubo un error al guardarlo en el historial.");
        } finally {
            setEvaluando(false);
        }
    };

    const notaTotal = resultados
        .reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0)
        .toFixed(2);

    return (
        <div ref={topRef} className="space-y-8 max-w-3xl mx-auto">

            {/* Botón volver — ahora limpia el caché al salir */}
            <button
                onClick={handleVolver}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" /> Volver
            </button>

            <header className="space-y-2">
                <div className={cn("inline-flex items-center gap-2 text-sm font-bold", modeInfo.color)}>
                    {modeInfo.icon}
                    {modeInfo.label}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold">
                    {preguntas.length} preguntas listas
                </h1>
                {evaluacion?.nivel_bloom && (
                    <p className="text-sm text-muted-foreground">
                        Nivel Bloom:{" "}
                        <span className="font-semibold text-foreground">{evaluacion.nivel_bloom}</span>
                    </p>
                )}
            </header>

            <AnimatePresence>
                <div className="space-y-5">
                    {preguntas.map((p, i) => {
                        const estaEvaluandose = evaluando && resultados.length === i && errorEnIndice === null;

                        return (
                            <div key={i} className="relative">
                                <PreguntaCard
                                    pregunta={p}
                                    index={i}
                                    tipo={mode}
                                    valor={respuestas[i] || ""}
                                    onChange={(val) =>
                                        setRespuestas((prev) => ({ ...prev, [i]: val }))
                                    }
                                    disabled={inputsBloqueados}
                                    resultado={resultados[i]}
                                />

                                {estaEvaluandose && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3 text-sm font-semibold text-primary"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        La IA está evaluando tu respuesta...
                                    </motion.div>
                                )}

                                {resultados[i] && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "mt-4 p-5 rounded-xl border text-sm space-y-2",
                                            resultados[i].evaluacion.esCorrecta
                                                ? "bg-green-50/50 border-green-200"
                                                : "bg-red-50/50 border-red-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-bold uppercase",
                                                resultados[i].evaluacion.esCorrecta
                                                    ? "bg-green-200 text-green-800"
                                                    : "bg-red-200 text-red-800"
                                            )}>
                                                {resultados[i].evaluacion.esCorrecta ? "Correcto" : "Incorrecto"}
                                            </span>
                                            <span className="font-bold text-foreground">
                                                Puntaje: {resultados[i].evaluacion.puntaje} /{" "}
                                                {resultados[i].evaluacion.puntaje_maximo}
                                            </span>
                                        </div>
                                        <p className="text-foreground/80 leading-relaxed">
                                            {resultados[i].evaluacion.explicacion}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </AnimatePresence>

            {/* Botón enviar */}
            {preguntas.length > 0 && resultados.length === 0 && errorEnIndice === null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: preguntas.length * 0.07 + 0.1 }}
                    className="flex justify-end pt-4"
                >
                    <button
                        className="px-8 py-3 rounded-2xl bg-primary-gradient text-white font-bold shadow-soft flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => manejarEnvio(0)}
                        disabled={evaluando}
                    >
                        {evaluando ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Evaluando...
                            </>
                        ) : (
                            "Enviar respuestas"
                        )}
                    </button>
                </motion.div>
            )}

            {/* Banner de error con botón reanudar */}
            {errorEnIndice !== null && !evaluando && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-amber-200 bg-amber-50/60"
                >
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm font-semibold text-amber-800 flex-1">
                        La IA se interrumpió en la pregunta {errorEnIndice + 1}. Las respuestas están bloqueadas.
                    </p>
                    <button
                        onClick={() => manejarEnvio(errorEnIndice)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
                    >
                        <RefreshCw className="w-4 h-4" /> Reanudar
                    </button>
                </motion.div>
            )}

            {/* Calificación final */}
            {evaluacionCompleta && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-8 rounded-3xl border border-border bg-card shadow-soft space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-2xl font-bold">Resultado final</h2>
                        <div className="text-3xl font-bold text-primary">{notaTotal} / 20</div>
                    </div>
                    <button
                        onClick={handleVolver}
                        className="w-full py-3 rounded-2xl bg-primary-gradient text-white font-bold shadow-soft hover:opacity-90 active:scale-95 transition-all"
                    >
                        Volver
                    </button>
                </motion.div>
            )}
        </div>
    );
}