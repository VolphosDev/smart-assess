import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, BookOpen, Brain, CheckSquare, RefreshCw, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { evaluacionApi, agentJudgeApi, intentosApi, archivosApi } from "@/api/courses.ts";
import { cn } from "@/lib/utils";
import {toast} from "sonner";
import VisualQuiz from "./VisualQuiz";

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
};function PreguntaMultiple({
                              pregunta, index, valor, onChange, disabled, resultado, esVisualQuiz = false
                          }: {
    pregunta: Pregunta; index: number; valor: string; onChange: (val: string) => void; disabled?: boolean; resultado?: any; esVisualQuiz?: boolean;
}) {
    const opcionesArray = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : (pregunta.opciones_o_respuesta || "").split(" | ");

    const tieneResultado = !!resultado;
    const respuestaCorrecta = pregunta.respuesta_correcta || "";

    const renderOption = (op: string, i: number) => {
        const esSeleccionado = valor === op;
        const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
        
        const hasLetterPrefix = /^[A-D]\)/.test(op.trim());
        const letter = hasLetterPrefix ? op.trim().charAt(0) : String.fromCharCode(65 + i);
        const cleanText = hasLetterPrefix ? op.replace(/^[A-D]\)\s*/, "") : op;

        // Base color schemes for letters A, B, C, D to look gamified and friendly
        const colorClasses = [
            "bg-blue-50/70 text-blue-600 border-blue-200 hover:border-blue-400 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
            "bg-violet-50/70 text-violet-600 border-violet-200 hover:border-violet-400 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30",
            "bg-pink-50/70 text-pink-600 border-pink-200 hover:border-pink-400 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30",
            "bg-amber-50/70 text-amber-600 border-amber-200 hover:border-amber-400 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
        ][i % 4];

        const activeColorClasses = [
            "bg-blue-500 text-white font-bold border-transparent",
            "bg-violet-500 text-white font-bold border-transparent",
            "bg-pink-500 text-white font-bold border-transparent",
            "bg-amber-500 text-white font-bold border-transparent",
        ][i % 4];

        let cardStyle = "border-border bg-card hover:bg-muted/30 hover:scale-[1.01] active:scale-[0.99] hover:shadow-soft";
        let badgeStyle = colorClasses;
        let rightIcon = null;

        if (tieneResultado) {
            if (esCorrecto) {
                cardStyle = "border-emerald-500/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]";
                badgeStyle = "bg-emerald-500 text-white font-bold border-transparent";
                rightIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            } else if (esSeleccionado && !esCorrecto) {
                cardStyle = "border-destructive/80 bg-destructive/5 text-destructive dark:bg-red-950/20 dark:text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]";
                badgeStyle = "bg-destructive text-white font-bold border-transparent";
                rightIcon = <XCircle className="w-5 h-5 text-destructive shrink-0" />;
            } else {
                cardStyle = "border-border/60 bg-muted/10 opacity-40 select-none scale-[0.99]";
                badgeStyle = "bg-muted text-muted-foreground/50 border-border/30";
            }
        } else if (esSeleccionado) {
            cardStyle = "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20 scale-[1.01]";
            badgeStyle = activeColorClasses;
        }

        return (
            <li key={i} className="list-none relative">
                <label className={cn(
                    "relative flex items-center gap-4 p-4 pt-7 pb-4 rounded-2xl border transition-all text-sm md:text-base font-semibold",
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
                        className="sr-only"
                    />
                    <span className={cn(
                        "w-9 h-9 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 border transition-all duration-200 shadow-sm",
                        badgeStyle
                    )}>
                        {letter}
                    </span>
                    <span className="flex-1 leading-snug pr-2">{cleanText}</span>
                    {rightIcon}
                    {tieneResultado && esCorrecto && (
                        <span className="absolute top-2 right-3 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none">
                            ✓ Correcta
                        </span>
                    )}
                    {tieneResultado && esSeleccionado && !esCorrecto && (
                        <span className="absolute top-2 right-3 text-[9px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 dark:bg-red-950/40 px-2 py-0.5 rounded-full select-none">
                            ✗ Tu respuesta
                        </span>
                    )}
                </label>
            </li>
        );
    };

    if (esVisualQuiz) {
        return (
            <div className="space-y-4">
                <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">
                    {pregunta.enunciado}
                </p>
                <ul className="grid sm:grid-cols-2 gap-3 p-0 m-0">
                    {opcionesArray.map((op, i) => renderOption(op, i))}
                </ul>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <ul className="space-y-3 p-0 m-0">
                {opcionesArray.map((op, i) => renderOption(op, i))}
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
        <div className="space-y-4">
            <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <div className="flex gap-4">
                {["VERDADERO", "FALSO"].map((op) => {
                    const esSeleccionado = valor === op;
                    const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
                    const isTrue = op === "VERDADERO";

                    // Base styles
                    const baseColorStyle = isTrue
                        ? "bg-blue-50/60 border-blue-200 text-blue-600 hover:bg-blue-100/50 hover:border-blue-400 dark:bg-blue-950/10 dark:border-blue-900/30 dark:text-blue-400"
                        : "bg-rose-50/60 border-rose-200 text-rose-600 hover:bg-rose-100/50 hover:border-rose-400 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-400";

                    let cardStyle = `${baseColorStyle} hover:scale-[1.01] active:scale-[0.99] hover:shadow-soft bg-card`;
                    let rightIcon = null;

                    if (tieneResultado) {
                        if (esCorrecto) {
                            cardStyle = "border-emerald-500/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]";
                            rightIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
                        } else if (esSeleccionado && !esCorrecto) {
                            cardStyle = "border-destructive/80 bg-destructive/5 text-destructive dark:bg-red-950/20 dark:text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]";
                            rightIcon = <XCircle className="w-5 h-5 text-destructive shrink-0" />;
                        } else {
                            cardStyle = "border-border/60 bg-muted/10 opacity-40 select-none scale-[0.99]";
                        }
                    } else if (esSeleccionado) {
                        cardStyle = isTrue
                            ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 scale-[1.01] font-bold"
                            : "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 scale-[1.01] font-bold";
                    }

                    return (
                        <label
                            key={op}
                            className={cn(
                                "relative flex-1 flex items-center justify-center gap-3 p-4 pt-7 pb-4 rounded-2xl border transition-all text-sm md:text-base font-semibold cursor-pointer",
                                disabled ? "cursor-not-allowed" : "active:scale-[0.98]",
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
                            {rightIcon}
                            {tieneResultado && esCorrecto && (
                                <span className="absolute top-1.5 right-2.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none">
                                    ✓ Correcto
                                </span>
                            )}
                            {tieneResultado && esSeleccionado && !esCorrecto && (
                                <span className="absolute top-1.5 right-2.5 text-[9px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 dark:bg-red-950/40 px-2 py-0.5 rounded-full select-none">
                                    ✗ Marcado
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

                        const widthCh = Math.max(part.length, valorCorreccion.length, 8) + 2;
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
                                        style={{ width: `${widthCh}ch` }}
                                        title={`Haz clic para corregir '${part}'`}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition placeholder:text-amber-700/80 dark:placeholder:text-amber-300/80 placeholder:italic",
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
                          pregunta, index, tipo, valor, onChange, disabled, resultado, imagenesCargadas,
                      }: {
    pregunta: Pregunta; index: number; tipo: string; valor: string; onChange: (val: string) => void; disabled?: boolean; resultado?: any; imagenesCargadas: Record<number, string>;
}) {
    if (tipo === "VISUAL_QUIZ") {
        return (
            <VisualQuiz
                pregunta={pregunta}
                index={index}
                valor={valor}
                onChange={onChange}
                disabled={disabled}
                resultado={resultado}
                base64Imagen={imagenesCargadas[index]}
            />
        );
    }

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
        </motion.div>
    );
}

function parseIncrementalPreguntas(rawJson: string): Pregunta[] {
    const idx = rawJson.indexOf('"preguntas"');
    if (idx === -1) return [];
    
    const startArrayIdx = rawJson.indexOf('[', idx);
    if (startArrayIdx === -1) return [];
    
    const questionsText = rawJson.substring(startArrayIdx + 1);
    const list: Pregunta[] = [];
    let depth = 0;
    let objStart = -1;
    
    for (let i = 0; i < questionsText.length; i++) {
        const char = questionsText[i];
        if (char === '{') {
            if (depth === 0) {
                objStart = i;
            }
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth === 0 && objStart !== -1) {
                const candidate = questionsText.substring(objStart, i + 1);
                try {
                    const parsed = JSON.parse(candidate);
                    if (parsed && typeof parsed === 'object' && parsed.enunciado) {
                        list.push(parsed as Pregunta);
                    }
                } catch (e) {
                    // Ignorar
                }
            }
        }
    }
    return list;
}

export default function Practice() {
    const topRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [respuestas, setRespuestas] = useState<Record<number, string>>({});
    const [evaluando, setEvaluando] = useState(false);
    const [resultados, setResultados] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [finalizado, setFinalizado] = useState(false);

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
    const [streamCompleted, setStreamCompleted] = useState(false);

    const preguntas = evaluacion?.preguntas ?? [];
    const evaluacionCompleta = finalizado && preguntas.length > 0;

    const [imagenesCargadas, setImagenesCargadas] = useState<Record<number, string>>({});
    const pendingRequests = useRef<Set<number>>(new Set());
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Cola en segundo plano para precargar ilustraciones de Visual Quiz
    useEffect(() => {
        if (!preguntas || preguntas.length === 0 || mode !== "VISUAL_QUIZ") return;

        // Registrar las que ya vienen con base64 de inicio
        preguntas.forEach((p, idx) => {
            if (p.base64_imagen && !imagenesCargadas[idx]) {
                setImagenesCargadas(prev => ({ ...prev, [idx]: p.base64_imagen! }));
            }
        });

        async function prefetchQuizImages() {
            for (let i = 0; i < preguntas.length; i++) {
                if (!isMounted.current) break;
                const p = preguntas[i];
                if (p.base64_imagen) continue;
                
                // Si ya solicitamos o estamos solicitando esta imagen, saltar
                if (pendingRequests.current.has(i)) continue;

                if (p.prompt_imagen) {
                    pendingRequests.current.add(i); // Registrar la solicitud
                    try {
                        console.log(`[Quiz-Prefetch] Solicitando ilustración ${i + 1}...`);
                        const res = await archivosApi.generarImagen(p.prompt_imagen);
                        const base64Data = res?.data?.base64 || (res as any)?.base64 || (res as any)?.data?.base64;
                        if (base64Data && isMounted.current) {
                            setImagenesCargadas(prev => ({ ...prev, [i]: base64Data }));
                        }
                    } catch (err) {
                        console.error(`Error cargando imagen de pregunta ${i + 1}:`, err);
                    }
                }
            }
        }

        prefetchQuizImages();
    }, [preguntas, mode]);

    useEffect(() => {
        if (!mongoId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setErrorMsg(null);
        setStreamText("");
        setStreamCompleted(false);
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
                setStreamCompleted(true);
            } catch (err: any) {
                console.error("[Practice] Error en fallback:", err);
                setIsError(true);
                setErrorMsg(
                    err?.response?.data || 
                    err?.message || 
                    "Error al generar las preguntas de evaluación."
                );
                setIsLoading(false);
                setStreamCompleted(true);
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
                    setStreamText((prev) => {
                        const newText = prev + chunk;
                        const parsed = parseIncrementalPreguntas(newText);
                        if (parsed.length > 0) {
                            setEvaluacion((prevEval) => {
                                if (prevEval && prevEval.preguntas.length >= parsed.length && sseCompleted) {
                                    return prevEval;
                                }
                                return {
                                    preguntas: parsed,
                                    tipo_pregunta: mode,
                                    nivel_bloom: prevEval?.nivel_bloom || "5",
                                    metricas_objetivas: prevEval?.metricas_objetivas || {}
                                };
                            });
                            setIsLoading(false);
                        }
                        return newText;
                    });
                }
            });

            eventSource.addEventListener("result", (event) => {
                try {
                    sseCompleted = true;
                    setStreamCompleted(true);
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
                } else {
                    setStreamCompleted(true);
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

    const inputsBloqueados = evaluando || !!resultados[currentSlide];

    const comprobarRespuestaActual = async () => {
        if (evaluando) return;
        const p = preguntas[currentSlide];
        const respuestaEstudiante = respuestas[currentSlide];
        if (!respuestaEstudiante) {
            toast.warning("Por favor selecciona una alternativa.");
            return;
        }

        setEvaluando(true);

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
            const res = await agentJudgeApi.evaluarRespuesta({
                pregunta: p.enunciado,
                respuestaEsperada,
                respuestaEstudiante,
                totalPreguntas: preguntas.length,
                tipoPregunta: mode,
            });

            setResultados((prev) => {
                const copy = [...prev];
                copy[currentSlide] = res;
                return copy;
            });
        } catch (err) {
            console.error(`Error calificando pregunta ${currentSlide + 1}:`, err);
            toast.error("Error al evaluar con la IA. Inténtalo de nuevo.");
        } finally {
            setEvaluando(false);
        }
    };

    const finalizarExamen = async (resultadosFinales: any[]) => {
        setEvaluando(true);
        try {
            const notaCalculada = resultadosFinales.reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0);
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const respuestasDetalle = resultadosFinales.map((res, i) => ({
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
            setFinalizado(true);
        } catch (e) {
            console.error("Error al guardar el historial:", e);
            toast.error("Hubo un error al guardar el intento en el historial.");
            setFinalizado(true);
        } finally {
            setEvaluando(false);
        }
    };

    const notaTotal = resultados
        .reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0)
        .toFixed(2);

    return (
        <div ref={topRef} className="space-y-8 max-w-4xl mx-auto pb-10">

            {/* Botón volver */}
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
                                Nivel Bloom: <span className="font-bold text-foreground">{evaluacion.nivel_bloom}</span>
                            </span>
                        )}
                    </div>

                    {/* Banner de Carga en Segundo Plano */}
                    {preguntas.length > 0 && preguntas.length < cantidad && !streamCompleted && (
                        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary text-xs font-bold leading-normal animate-pulse shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary" />
                            <span>El Tutor IA está redactando más preguntas en segundo plano ({preguntas.length} de {cantidad} listas). Puedes empezar a responder las que ya están cargadas.</span>
                        </div>
                    )}
                    
                    {/* Progress Bar */}
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

            {/* WIZARD CONTAINER */}
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
                                onChange={(val) => {
                                    if (!resultados[currentSlide] && !evaluando) {
                                        setRespuestas((prev) => ({ ...prev, [currentSlide]: val }));
                                    }
                                }}
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

                    {/* Action Bar */}
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
                                        className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-soft flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
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

            {/* FINAL RESULTS SCORECARD */}
            {finalizado && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-8 rounded-3xl border border-border bg-card shadow-soft space-y-6"
                >
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                            <h2 className="font-display text-2xl font-bold">Evaluación Completada</h2>
                            <p className="text-sm text-muted-foreground font-semibold">Revisión de tu desempeño con el Tutor IA</p>
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