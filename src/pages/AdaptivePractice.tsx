import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Brain,
    Clock,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    BookOpen,
    Award,
    AlertCircle,
    MessageSquare,
    Loader2,
    FileText,
    TrendingUp,
    Bookmark,
    Check,
    Sliders,
    Gauge,
    Compass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adaptiveApi } from "../api/courses";
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import { toast } from "sonner";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from "recharts";

interface ParsedMessage {
    id: number;
    agent: string;
    text: string;
}

function getBloomProfile(nivel: string, nota: number) {
    const cleanNivel = (nivel || "PRINCIPIANTE").toUpperCase();
    
    // Default base scores based on level
    let recordar = 50;
    let comprender = 40;
    let aplicar = 30;
    let analizar = 20;
    let sintetizar = 15;
    let evaluar = 10;

    if (cleanNivel.includes("PRINCIPIANTE")) {
        recordar = 65 + (nota / 20) * 15;
        comprender = 45 + (nota / 20) * 15;
        aplicar = 25 + (nota / 20) * 15;
        analizar = 15 + (nota / 20) * 10;
        sintetizar = 10 + (nota / 20) * 10;
        evaluar = 5 + (nota / 20) * 10;
    } else if (cleanNivel.includes("INTERMEDIO")) {
        recordar = 80 + (nota / 20) * 15;
        comprender = 70 + (nota / 20) * 15;
        aplicar = 60 + (nota / 20) * 15;
        analizar = 45 + (nota / 20) * 20;
        sintetizar = 35 + (nota / 20) * 20;
        evaluar = 25 + (nota / 20) * 15;
    } else { // AVANZADO, EXPERTO, etc.
        recordar = 90 + (nota / 20) * 10;
        comprender = 85 + (nota / 20) * 12;
        aplicar = 80 + (nota / 20) * 15;
        analizar = 70 + (nota / 20) * 18;
        sintetizar = 65 + (nota / 20) * 18;
        evaluar = 60 + (nota / 20) * 20;
    }

    const clamp = (val: number) => Math.min(100, Math.max(5, Math.round(val)));

    return [
        { subject: "Recordar", valor: clamp(recordar), fullMark: 100 },
        { subject: "Comprender", valor: clamp(comprender), fullMark: 100 },
        { subject: "Aplicar", valor: clamp(aplicar), fullMark: 100 },
        { subject: "Analizar", valor: clamp(analizar), fullMark: 100 },
        { subject: "Sintetizar", valor: clamp(sintetizar), fullMark: 100 },
        { subject: "Evaluar", valor: clamp(evaluar), fullMark: 100 }
    ];
}

function getBloomLevelLabel(level: string | number) {
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
}

function getQuestionBadgeLabel(idx: number, q: any, bloomLevel: string) {
    const cleanBloom = (bloomLevel || "APLICACION").toUpperCase();
    if (cleanBloom.includes("CONOCIMIENTO") || cleanBloom.includes("RECORDAR")) {
        if (idx % 2 === 0) return "Concepto Base 📚";
        return "Repaso Rápido ⚡";
    }
    if (cleanBloom.includes("COMPRENSION")) {
        if (idx % 2 === 0) return "Entendimiento Teórico 🔍";
        return "Explicación Conceptual 💡";
    }
    if (cleanBloom.includes("APLICACION") || cleanBloom.includes("APLICAR")) {
        if (idx % 2 === 0) return "Caso Práctico ⚙️";
        return "Resolución Activa 🛠️";
    }
    if (cleanBloom.includes("ANALISIS") || cleanBloom.includes("ANALIZAR")) {
        if (idx % 2 === 0) return "Análisis Crítico 🧠";
        return "Desafío de Deducción 🎯";
    }
    if (idx % 2 === 0) return "Reto de Síntesis 🏆";
    return "Evaluación Crítica 🔥";
}

function getQuestionBadgeStyle(idx: number, q: any, bloomLevel: string) {
    const cleanBloom = (bloomLevel || "APLICACION").toUpperCase();
    if (cleanBloom.includes("CONOCIMIENTO") || cleanBloom.includes("RECORDAR")) {
        return "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400";
    }
    if (cleanBloom.includes("COMPRENSION")) {
        return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    }
    if (cleanBloom.includes("APLICACION") || cleanBloom.includes("APLICAR")) {
        return "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400";
    }
    if (cleanBloom.includes("ANALISIS") || cleanBloom.includes("ANALIZAR")) {
        return "bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400";
    }
    return "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400";
}

export default function AdaptivePractice() {
    const navigate = useNavigate();
    const { courseId = "", semanaId = "" } = useParams();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // General states
    const [phase, setPhase] = useState<"loading" | "questionnaire" | "debate" | "results">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [startTime] = useState<number>(Date.now());
    const [isAcra, setIsAcra] = useState<boolean>(false);

    // Evaluation data
    const [evaluationData, setEvaluationData] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState<number>(0);

    // Answers
    const [acraAnswers, setAcraAnswers] = useState<Record<string, string>>({});
    const [formativeAnswers, setFormativeAnswers] = useState<Record<number, string>>({});

    // Debate states
    const [debateData, setDebateData] = useState<any>(null);
    const [debateMessages, setDebateMessages] = useState<ParsedMessage[]>([]);
    const [visibleMessages, setVisibleMessages] = useState<ParsedMessage[]>([]);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [typingAgent, setTypingAgent] = useState<string | null>(null);
    const [debateFinished, setDebateFinished] = useState<boolean>(false);
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const [isWaitingForDebateApi, setIsWaitingForDebateApi] = useState<boolean>(false);
    const [currentStreamingMsg, setCurrentStreamingMsg] = useState<ParsedMessage | null>(null);
    const [streamedText, setStreamedText] = useState<string>("");

    // Recommended materials
    const [recommendedMaterials, setRecommendedMaterials] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<{ id: string; name: string } | null>(null);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch evaluation on load
    useEffect(() => {
        if (!user.id || !semanaId) {
            setErrorMsg("Información de usuario o semana no disponible.");
            setPhase("loading");
            return;
        }

        async function fetchEvaluation() {
            try {
                const response = await adaptiveApi.getEvaluacion(user.id, semanaId);
                setEvaluationData(response);

                if (response.tipo_evaluacion === "DIAGNOSTICA" && response.instrumento === "ACRA") {
                    setIsAcra(true);
                    setQuestions(response.items || []);
                } else {
                    setIsAcra(false);
                    // Normalize formative questions
                    const normalized = normalizeFormativeQuestions(response.preguntas_json);
                    setQuestions(normalized);
                }
                setPhase("questionnaire");
            } catch (err: any) {
                console.error("Error fetching adaptive evaluation:", err);
                setErrorMsg(err?.response?.data?.error || "Error al conectar con el servidor.");
            }
        }

        fetchEvaluation();
    }, [semanaId, user.id]);

    // Helper to normalize static or dynamic questions
    const normalizeFormativeQuestions = (pregJson: any) => {
        if (!pregJson || !Array.isArray(pregJson.preguntas)) return [];
        return pregJson.preguntas.map((q: any, idx: number) => {
            let options: { texto: string; esCorrecta: boolean }[] = [];
            if (Array.isArray(q.opciones)) {
                // Static database format
                options = q.opciones.map((o: any) => ({
                    texto: o.texto,
                    esCorrecta: !!o.esCorrecta
                }));
            } else if (Array.isArray(q.opciones_o_respuesta)) {
                // Dynamic Gemini format
                options = q.opciones_o_respuesta.map((o: string) => {
                    const label = o.trim();
                    // Match letters like A) or check if correct text matches
                    const isCorrect = q.respuesta_correcta && (
                        label.startsWith(q.respuesta_correcta) ||
                        q.respuesta_correcta.startsWith(label) ||
                        label.includes(q.respuesta_correcta) ||
                        q.respuesta_correcta.includes(label)
                    );
                    return {
                        texto: label,
                        esCorrecta: !!isCorrect
                    };
                });
            }
            return {
                id: q.id || idx,
                enunciado: q.enunciado,
                tipoPregunta: q.tipo_pregunta || (options.length > 0 ? "OPCION_MULTIPLE" : "ABIERTA"),
                opciones: options,
                respuestaCorrectaText: q.respuesta_correcta || "",
                justificacion: q.justificacion_pregunta || ""
            };
        });
    };

    // Auto-scroll chat window
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [visibleMessages, isTyping]);

    // 2. Animate Agent Debate sequentially with Typewriter effect
    const startDebateAnimation = (debateText: string) => {
        setPhase("debate");
        const parsed = parseDebate(debateText);
        setDebateMessages(parsed);
        setVisibleMessages([]);
        setDebateFinished(false);
        setCurrentStreamingMsg(null);
        setStreamedText("");

        if (parsed.length === 0) {
            setDebateFinished(true);
            return;
        }

        let messageIdx = 0;

        const speakNextMessage = () => {
            if (messageIdx >= parsed.length) {
                setIsTyping(false);
                setTypingAgent(null);
                setActiveAgent(null);
                setCurrentStreamingMsg(null);
                setStreamedText("");
                setDebateFinished(true);
                return;
            }

            const currentMsg = parsed[messageIdx];
            
            // Step 1: Show typing indicator
            setTypingAgent(currentMsg.agent);
            setActiveAgent(currentMsg.agent);
            setIsTyping(true);
            setCurrentStreamingMsg(null);
            setStreamedText("");

            setTimeout(() => {
                // Step 2: Hide typing indicator and start typewriter
                setIsTyping(false);
                setTypingAgent(null);
                setCurrentStreamingMsg(currentMsg);
                
                let charIdx = 0;
                const textToStream = currentMsg.text;
                setStreamedText("");

                const interval = setInterval(() => {
                    charIdx += 2; // Stream 2 characters at a time for smooth but readable speed
                    if (charIdx >= textToStream.length) {
                        setStreamedText(textToStream);
                        clearInterval(interval);
                        
                        // Step 3: Typewriter finished, move message to visibleMessages
                        setTimeout(() => {
                            setVisibleMessages(prev => [...prev, currentMsg]);
                            setCurrentStreamingMsg(null);
                            setStreamedText("");
                            messageIdx++;
                            
                            // Delay before starting next message (reading delay)
                            setTimeout(() => {
                                speakNextMessage();
                            }, 1500);
                        }, 800); // Small pause after completing the text
                    } else {
                        setStreamedText(textToStream.slice(0, charIdx));
                    }
                }, 35); // 35ms per step
            }, 1500); // 1.5 seconds typing indicator
        };

        // Start first message
        setTimeout(() => {
            speakNextMessage();
        }, 500);
    };

    const highlightKeywords = (text: string) => {
        const keywords = [
            "video explicativo",
            "opción múltiple",
            "verdadero / falso",
            "pregunta abierta",
            "detección de errores",
            "visual quiz con ia",
            "hablar con el avatar",
            "avatar tutor",
            "aria",
            "visual quiz",
            "verdadero/falso"
        ];
        
        const sortedKeywords = [...new Set(keywords)].sort((a, b) => b.length - a.length);
        const pattern = new RegExp(`(${sortedKeywords.map(k => k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})`, "gi");
        
        const parts = text.split(pattern);
        return parts.map((part, index) => {
            const isMatch = sortedKeywords.some(k => k.toLowerCase() === part.toLowerCase());
            if (isMatch) {
                return (
                    <span 
                        key={index} 
                        className="underline decoration-indigo-500/80 decoration-2 underline-offset-4 bg-indigo-500/10 px-1.5 py-0.5 rounded-md font-bold text-indigo-700 dark:text-indigo-300"
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const parseDebate = (rawText: string): ParsedMessage[] => {
        if (!rawText) return [];
        return rawText.split("\n").map((line, index) => {
            const match = line.match(/^\[(Agente Evaluador|Agente Psicopedagogo|Agente de Adaptación de Evaluaciones|Agente Coordinador|Sistema)\]:\s*(.*)$/i);
            if (match) {
                return {
                    id: index,
                    agent: match[1],
                    text: match[2]
                };
            }
            // Fallback keywords search
            if (line.includes("Evaluador")) {
                return { id: index, agent: "Agente Evaluador", text: line.replace(/^.*?:\s*/, "") };
            }
            if (line.includes("Psicopedagogo")) {
                return { id: index, agent: "Agente Psicopedagogo", text: line.replace(/^.*?:\s*/, "") };
            }
            if (line.includes("Adaptación") || line.includes("Adaptador")) {
                return { id: index, agent: "Agente de Adaptación de Evaluaciones", text: line.replace(/^.*?:\s*/, "") };
            }
            if (line.includes("Coordinador")) {
                return { id: index, agent: "Agente Coordinador", text: line.replace(/^.*?:\s*/, "") };
            }
            return { id: index, agent: "Sistema", text: line };
        }).filter(item => item.text.trim().length > 0);
    };

    // 3. Submit evaluation
    const handleSubmitEvaluation = async () => {
        // Validation check
        if (isAcra) {
            const unanswered = questions.filter(q => !acraAnswers[q.id]);
            if (unanswered.length > 0) {
                toast.warning(`Por favor responde todos los ítems. Te faltan ${unanswered.length} preguntas.`);
                return;
            }
        } else {
            const unansweredCount = questions.filter((_, idx) => !formativeAnswers[idx] || !formativeAnswers[idx].trim()).length;
            if (unansweredCount > 0) {
                toast.warning(`Por favor responde todas las preguntas del cuestionario.`);
                return;
            }
        }

        setPhase("debate");
        setIsWaitingForDebateApi(true);
        setIsTyping(true);
        setTypingAgent("Agente Evaluador");
        setActiveAgent("Agente Evaluador");
        setErrorMsg(null);

        // Map answers payload
        const respuestasDetalle = isAcra
            ? questions.map((item) => ({
                preguntaTexto: item.enunciado,
                tipoPregunta: "ACRA_LIKERT",
                respuestaEstudiante: acraAnswers[item.id],
                esCorrecta: true
            }))
            : questions.map((q, idx) => {
                const answer = formativeAnswers[idx] || "";
                let isCorrect = false;
                if (q.tipoPregunta === "OPCION_MULTIPLE") {
                    const opt = q.opciones.find((o: any) => o.texto === answer);
                    isCorrect = opt ? opt.esCorrecta : false;
                } else {
                    isCorrect = true; // Open questions evaluated by the LLM
                }
                return {
                    preguntaTexto: q.enunciado,
                    tipoPregunta: q.tipoPregunta,
                    respuestaEstudiante: answer,
                    esCorrecta: isCorrect
                };
            });

        const notaCalculada = isAcra
            ? 0.0
            : respuestasDetalle.reduce((sum, r) => sum + (r.esCorrecta ? 4.0 : 0.0), 0.0); // 5 questions * 4 pts = 20 pts max

        const payload = {
            usuarioId: Number(user.id),
            semanaId: semanaId,
            notaFinal: Number(notaCalculada.toFixed(2)),
            tiempoEmpleadoSegundos: Math.round((Date.now() - startTime) / 1000),
            numeroIntentos: 1,
            tipoEvaluacion: isAcra ? "DIAGNOSTICA" : "FORMATIVA",
            respuestas: respuestasDetalle
        };

        try {
            const res = await adaptiveApi.guardarIntento(payload);
            setIsWaitingForDebateApi(false);
            setDebateData(res);

            // Update user profile in localStorage
            const localUser = JSON.parse(localStorage.getItem("user") || "{}");
            localUser.diagnosticoCompletado = true;
            localUser.nivelConocimiento = res.nivel_nuevo;
            localStorage.setItem("user", JSON.stringify(localUser));

            // Save recommendations list to localStorage for EvalModeSelect routing locks
            if (res.debate && Array.isArray(res.debate.recomendaciones)) {
                localStorage.setItem(`semantika.recomendaciones.${user.id}.${semanaId}`, JSON.stringify(res.debate.recomendaciones));
            }

            // Fetch recommended materials
            fetchRecommendedMaterials();

            // Trigger visual sequential agent debate
            startDebateAnimation(res.debate?.debate_transcripcion || "");
        } catch (err: any) {
            console.error("Error submitting adaptive attempt:", err);
            setIsWaitingForDebateApi(false);
            setIsTyping(false);
            setTypingAgent(null);
            setActiveAgent(null);
            toast.error(err?.response?.data?.error || "Error al procesar y guardar la evaluación.");
            setPhase("questionnaire");
        }
    };

    const fetchRecommendedMaterials = async () => {
        setIsLoadingMaterials(true);
        try {
            const res = await adaptiveApi.getMaterialesRecomendados(user.id, semanaId);
            setRecommendedMaterials(res);
        } catch (err) {
            console.error("Error fetching recommended materials:", err);
        } finally {
            setIsLoadingMaterials(false);
        }
    };

    const handleBackToModes = () => {
        navigate(`/app/curso/${courseId}/semana/${semanaId}`);
    };

    const getAgentIcon = (agent: string) => {
        switch (agent) {
            case "Agente Evaluador": return <TrendingUp className="w-5 h-5 text-white" />;
            case "Agente Psicopedagogo": return <Brain className="w-5 h-5 text-white" />;
            case "Agente de Adaptación de Evaluaciones": return <Sliders className="w-5 h-5 text-white" />;
            case "Agente Coordinador": return <Award className="w-5 h-5 text-white" />;
            default: return <MessageSquare className="w-5 h-5 text-white" />;
        }
    };

    const getAgentBadgeColor = (agent: string) => {
        switch (agent) {
            case "Agente Evaluador": return "bg-blue-500 border-blue-600/30 text-white shadow-blue-500/20";
            case "Agente Psicopedagogo": return "bg-emerald-500 border-emerald-600/30 text-white shadow-emerald-500/20";
            case "Agente de Adaptación de Evaluaciones": return "bg-amber-500 border-amber-600/30 text-white shadow-amber-500/20";
            case "Agente Coordinador": return "bg-violet-600 border-violet-700/30 text-white shadow-violet-600/20";
            default: return "bg-secondary text-secondary-foreground border-border";
        }
    };

    const getAgentBubbleColor = (agent: string) => {
        switch (agent) {
            case "Agente Evaluador": return "bg-blue-50/70 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 text-blue-950 dark:text-blue-50";
            case "Agente Psicopedagogo": return "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-50";
            case "Agente de Adaptación de Evaluaciones": return "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-950 dark:text-amber-50";
            case "Agente Coordinador": return "bg-violet-50/70 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900/40 text-violet-950 dark:text-violet-50";
            default: return "bg-card border-border text-foreground";
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handleBackToModes}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Cancelar y Volver
                </button>
                <div className="flex items-center gap-2 text-xs bg-secondary/60 border border-border px-3 py-1.5 rounded-full">
                    <span className="font-bold">Nivel Actual:</span>
                    <span className="font-extrabold text-primary uppercase">{user.nivelConocimiento || "PRINCIPIANTE"}</span>
                </div>
            </div>

            {/* Loading Phase */}
            {phase === "loading" && (
                <div className="flex flex-col items-center justify-center py-24 space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Brain className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2 max-w-sm">
                        <h2 className="font-display font-black text-2xl text-balance">Preparando tu evaluación...</h2>
                        <p className="text-sm text-muted-foreground">Estamos cargando el cuestionario adaptado y sintonizando el comité de debate pedagógico.</p>
                    </div>
                </div>
            )}

            {/* Error state */}
            {errorMsg && phase === "loading" && (
                <div className="p-6 rounded-3xl border border-destructive/20 bg-destructive/5 text-center space-y-4 max-w-md mx-auto">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                    <h3 className="font-display font-bold text-lg">Error al inicializar la evaluación</h3>
                    <p className="text-sm text-muted-foreground">{errorMsg}</p>
                    <button
                        onClick={handleBackToModes}
                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                        Volver
                    </button>
                </div>
            )}

            {/* Questionnaire Phase */}
            {phase === "questionnaire" && questions.length > 0 && (
                <div className="space-y-6">
                    <header className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                {isAcra ? "Diagnóstico ACRA Inicial" : "Evaluación Formativa Adaptativa"}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                                {isAcra ? "Escala Likert" : `Nivel Bloom: ${getBloomLevelLabel(evaluationData?.nivel_bloom)}`}
                            </span>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                <span>Cuestionario del Estudiante</span>
                                <span>{Math.round(((currentSlide + 1) / questions.length) * 100)}%</span>
                            </div>
                            <div className="w-full bg-secondary/30 rounded-full h-2.5 overflow-hidden border border-border/50">
                                <div
                                    className="bg-primary-gradient h-full rounded-full transition-all duration-300"
                                    style={{ width: `${((currentSlide + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </header>

                    {/* Question Card */}
                    <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground border-b border-border/40 pb-3">
                                <span className="bg-secondary px-2.5 py-1 rounded-lg text-foreground font-black">
                                    Pregunta {currentSlide + 1} de {questions.length}
                                </span>
                                {isAcra ? (
                                    <span className="text-primary font-bold">
                                        Escala {questions[currentSlide].escala}
                                    </span>
                                ) : (
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider border",
                                        getQuestionBadgeStyle(currentSlide, questions[currentSlide], evaluationData?.nivel_bloom)
                                    )}>
                                        {getQuestionBadgeLabel(currentSlide, questions[currentSlide], evaluationData?.nivel_bloom)}
                                    </span>
                                )}
                            </div>

                            <p className="font-display font-bold text-lg md:text-xl text-foreground text-balance leading-normal">
                                {questions[currentSlide].enunciado}
                            </p>

                            {/* ACRA Likert Answers */}
                            {isAcra ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    {evaluationData.opciones_likert?.map((opt: any) => {
                                        const isSelected = acraAnswers[questions[currentSlide].id] === opt.valor;
                                        return (
                                            <button
                                                key={opt.valor}
                                                onClick={() => setAcraAnswers(prev => ({ ...prev, [questions[currentSlide].id]: opt.valor }))}
                                                className={cn(
                                                    "w-full text-left p-5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between min-h-[68px] shadow-sm",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary text-primary shadow-glow-sm scale-[1.01]"
                                                        : "bg-background border-border/80 hover:border-border hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <span className="flex-1 pr-2">{opt.etiqueta}</span>
                                                {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Formative Answers */
                                <div className="pt-4">
                                    {questions[currentSlide].tipoPregunta === "OPCION_MULTIPLE" ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {questions[currentSlide].opciones.map((opt: any, optIdx: number) => {
                                                const isSelected = formativeAnswers[currentSlide] === opt.texto;
                                                const optionLetter = String.fromCharCode(65 + optIdx);
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => setFormativeAnswers(prev => ({ ...prev, [currentSlide]: opt.texto }))}
                                                        className={cn(
                                                            "w-full text-left p-5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between min-h-[68px] shadow-sm",
                                                            isSelected
                                                                ? "bg-primary/5 border-primary text-primary shadow-glow-sm scale-[1.01]"
                                                                : "bg-background border-border/80 hover:border-border hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <span className="flex-1 pr-2">
                                                            <span className="text-primary mr-1.5 font-extrabold">{optionLetter} –</span>
                                                            {opt.texto}
                                                        </span>
                                                        {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <textarea
                                            rows={5}
                                            value={formativeAnswers[currentSlide] || ""}
                                            onChange={(e) => setFormativeAnswers(prev => ({ ...prev, [currentSlide]: e.target.value }))}
                                            placeholder="Escribe tu respuesta detalladamente con tus propias palabras basándote en el material..."
                                            className="w-full p-5 rounded-2xl border-2 border-border bg-background text-sm font-semibold focus:outline-none focus:border-primary transition-all resize-none shadow-inner"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination footer */}
                    <div className="flex justify-between items-center bg-card rounded-3xl p-5 border border-border shadow-sm">
                        <button
                            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                            disabled={currentSlide === 0}
                            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold font-display hover:bg-secondary/40 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                        >
                            <ChevronLeft className="w-4.5 h-4.5" /> Anterior
                        </button>

                        <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
                            Pregunta {currentSlide + 1} de {questions.length}
                        </div>

                        {currentSlide < questions.length - 1 ? (
                            <button
                                onClick={() => {
                                    // Check if answered before passing
                                    const answered = isAcra ? !!acraAnswers[questions[currentSlide].id] : !!formativeAnswers[currentSlide]?.trim();
                                    if (!answered) {
                                        toast.warning("Por favor responde antes de continuar.");
                                        return;
                                    }
                                    setCurrentSlide(prev => prev + 1);
                                }}
                                className="px-5 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold font-display hover:bg-secondary/80 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                            >
                                Siguiente <ChevronRight className="w-4.5 h-4.5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitEvaluation}
                                className="px-7 py-3 rounded-xl bg-primary-gradient text-white text-xs font-black font-display shadow-glow hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                Finalizar y Entrar a Debate
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Debate Phase */}
            {phase === "debate" && (
                <div className="space-y-6">
                    <header className="text-center space-y-2">
                        <span className="inline-block px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-wider animate-pulse">
                            🎓 Comité Académico Virtual
                        </span>
                        <h1 className="font-display text-3xl font-black">Deliberación en Tiempo Real</h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto text-balance">
                            Los especialistas analizan tus respuestas para determinar tu nivel estratégico e instruccional idóneo.
                        </p>
                    </header>

                    {/* Committee Header Avatars */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {[
                            { name: "Agente Evaluador", color: "blue", role: "Estadística & Métricas", icon: <TrendingUp className="w-4 h-4" /> },
                            { name: "Agente Psicopedagogo", color: "emerald", role: "Estrategias Cognitivas", icon: <Brain className="w-4 h-4" /> },
                            { name: "Agente de Adaptación de Evaluaciones", color: "amber", role: "Ajuste de Dificultad / Bloom", icon: <Sliders className="w-4 h-4" /> },
                            { name: "Agente Coordinador", color: "violet", role: "Consenso & Decisiones", icon: <Award className="w-4 h-4" /> }
                        ].map((agent) => {
                            const isActive = activeAgent === agent.name;
                            const isTypingNow = typingAgent === agent.name;
                            return (
                                <div
                                    key={agent.name}
                                    className={cn(
                                        "bg-card border rounded-2xl p-4 text-center transition-all duration-300 relative overflow-hidden",
                                        isActive ? "border-primary shadow-soft shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]" : "border-border/60 opacity-60",
                                        isTypingNow && "animate-pulse"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2.5 shadow-sm",
                                        agent.color === "blue" && "bg-blue-500 text-white",
                                        agent.color === "emerald" && "bg-emerald-500 text-white",
                                        agent.color === "amber" && "bg-amber-500 text-white",
                                        agent.color === "violet" && "bg-violet-600 text-white"
                                    )}>
                                        {agent.icon}
                                    </div>
                                    <h4 className="font-display font-bold text-xs text-foreground leading-tight">{agent.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{agent.role}</p>

                                    {/* Typing animation glow overlay */}
                                    {isTypingNow && (
                                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Chat Deliberation Box */}
                    <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-soft h-[350px] overflow-y-auto space-y-4">
                        <AnimatePresence>
                            {/* 1. If waiting for backend API response */}
                            {isWaitingForDebateApi && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4 text-left"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className={cn(
                                            "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                            getAgentBadgeColor("Agente Evaluador")
                                        )}>
                                            {getAgentIcon("Agente Evaluador")}
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-display font-black text-xs text-foreground">Agente Evaluador</span>
                                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Miembro</span>
                                            </div>
                                            <div className={cn(
                                                "p-4 rounded-3xl rounded-tl-xs border text-sm leading-relaxed font-semibold shadow-xs max-w-md flex flex-col gap-2",
                                                getAgentBubbleColor("Agente Evaluador")
                                            )}>
                                                <div className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                                <span className="text-[11px] text-muted-foreground/90 font-bold leading-normal">
                                                    Recibiendo tus respuestas y analizando métricas de tiempo para iniciar el debate...
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center py-4 text-xs font-black text-muted-foreground/60 animate-pulse">
                                        Conectando con el comité educativo, por favor espera...
                                    </div>
                                </motion.div>
                            )}

                            {/* 2. Chat history messages */}
                            {visibleMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    className="flex items-start gap-3.5 max-w-[85%] text-left"
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                        getAgentBadgeColor(msg.agent)
                                    )}>
                                        {getAgentIcon(msg.agent)}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-display font-black text-xs text-foreground">{msg.agent}</span>
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Miembro</span>
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-3xl rounded-tl-xs border text-sm leading-relaxed font-semibold shadow-xs",
                                            getAgentBubbleColor(msg.agent)
                                        )}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* 3. Current streaming typewriter bubble */}
                            {currentStreamingMsg && (
                                <motion.div
                                    key={currentStreamingMsg.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3.5 max-w-[85%] text-left"
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                        getAgentBadgeColor(currentStreamingMsg.agent)
                                    )}>
                                        {getAgentIcon(currentStreamingMsg.agent)}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-display font-black text-xs text-foreground">{currentStreamingMsg.agent}</span>
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Miembro</span>
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-3xl rounded-tl-xs border text-sm leading-relaxed font-semibold shadow-xs",
                                            getAgentBubbleColor(currentStreamingMsg.agent)
                                        )}>
                                            {streamedText}
                                            <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 4. Normal typing indicators */}
                            {isTyping && typingAgent && !isWaitingForDebateApi && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3.5 text-left"
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                        getAgentBadgeColor(typingAgent)
                                    )}>
                                        {getAgentIcon(typingAgent)}
                                    </div>
                                    <div className="space-y-1">
                                        <span className="font-display font-black text-xs text-foreground block">{typingAgent}</span>
                                        <div className={cn(
                                            "p-4 rounded-3xl rounded-tl-xs border flex items-center justify-center gap-1 shadow-xs",
                                            getAgentBubbleColor(typingAgent)
                                        )}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={chatEndRef} />
                    </div>

                    {/* Debate actions footer */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setPhase("results")}
                            disabled={!debateFinished}
                            className={cn(
                                "px-8 py-3.5 rounded-2xl text-white text-sm font-black font-display flex items-center gap-2 transition-all shadow-glow cursor-pointer",
                                debateFinished
                                    ? "bg-gradient-to-r from-violet-600 to-primary hover:opacity-90 active:scale-95"
                                    : "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50 shadow-none"
                            )}
                        >
                            {!debateFinished ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    Comité deliberando...
                                </>
                            ) : (
                                <>
                                    Ver Resultados y Diagnóstico <ChevronRight className="w-4.5 h-4.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Results & Dashboard Phase */}
            {phase === "results" && debateData && (
                <div className="space-y-8 animate-fade-in text-left">
                    <header className="border-b border-border pb-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="font-display font-black text-3xl">Reporte y Diagnóstico Adaptativo</h1>
                            <p className="text-sm text-muted-foreground font-semibold">Consenso determinado por el comité educativo inteligente</p>
                        </div>
                    </header>

                    {/* Level Consensus Badge */}
                    <div className="bg-card border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-soft">
                        <div className="w-24 h-24 rounded-3xl bg-primary-gradient grid place-items-center text-white text-4xl shadow-glow">
                            🎓
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                                Perfil Cognitivo Resultante
                            </span>
                            <h2 className="font-display font-black text-2xl md:text-3xl text-foreground">
                                Nivel: <span className="text-primary font-black uppercase">{debateData.nivel_nuevo}</span>
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium max-w-xl">
                                El comité pedagógico evaluó tu respuesta de forma cualitativa y estratégica, asignando un nivel que equilibra tu capacidad reflexiva e instructiva.
                            </p>
                        </div>
                    </div>

                    {/* Dashboard de Progreso Cognitivo (Taxonomía de Bloom) y Medidor Adaptativo */}
                    <div className="grid md:grid-cols-5 gap-6">
                        {/* Radar Chart Column (3/5 cols) */}
                        <div className="md:col-span-3 bg-card border border-border rounded-3xl p-6 shadow-soft flex flex-col justify-between">
                            <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
                                <Compass className="w-5 h-5 text-primary animate-spin-slow" />
                                <div>
                                    <h3 className="font-display font-bold text-base md:text-lg">Distribución de Habilidades (Taxonomía de Bloom)</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Estimación de tu dominio actual por nivel cognitivo</p>
                                </div>
                            </div>
                            
                            <div className="h-64 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getBloomProfile(debateData.nivel_nuevo, debateData.notaFinal || 14)}>
                                        <PolarGrid stroke="hsl(var(--border))" />
                                        <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight="bold" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={9} />
                                        <Radar name="Dominio" dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Adaptive Difficulty Gauge (2/5 cols) */}
                        <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-soft flex flex-col justify-between">
                            <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
                                <Gauge className="w-5 h-5 text-amber-500" />
                                <div>
                                    <h3 className="font-display font-bold text-base md:text-lg">Medidor de Dificultad Adaptativa</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Tu posición en la ruta de aprendizaje</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-6 py-4">
                                {/* Visual Track Gauge */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                        <span>Principiante</span>
                                        <span>Intermedio</span>
                                        <span>Avanzado</span>
                                        <span>Experto</span>
                                    </div>
                                    
                                    {/* The segmented track */}
                                    <div className="grid grid-cols-4 gap-1 h-3.5 rounded-full overflow-hidden bg-secondary/30 p-0.5 border border-border/50">
                                        <div className={cn(
                                            "rounded-l-full h-full transition-all duration-300",
                                            (debateData.nivel_nuevo || "").toUpperCase().includes("PRINCIPIANTE")
                                                ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                                : "bg-muted"
                                        )} />
                                        <div className={cn(
                                            "h-full transition-all duration-300",
                                            (debateData.nivel_nuevo || "").toUpperCase().includes("INTERMEDIO")
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                : (debateData.nivel_nuevo || "").toUpperCase().includes("AVANZADO") || (debateData.nivel_nuevo || "").toUpperCase().includes("EXPERTO")
                                                    ? "bg-emerald-500/30"
                                                    : "bg-muted"
                                        )} />
                                        <div className={cn(
                                            "h-full transition-all duration-300",
                                            (debateData.nivel_nuevo || "").toUpperCase().includes("AVANZADO")
                                                ? "bg-gradient-to-r from-violet-600 to-indigo-600"
                                                : (debateData.nivel_nuevo || "").toUpperCase().includes("EXPERTO")
                                                    ? "bg-violet-600/30"
                                                    : "bg-muted"
                                        )} />
                                        <div className={cn(
                                            "rounded-r-full h-full transition-all duration-300",
                                            (debateData.nivel_nuevo || "").toUpperCase().includes("EXPERTO")
                                                ? "bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse"
                                                : "bg-muted"
                                        )} />
                                    </div>
                                </div>

                                {/* Active Level Indicator Box */}
                                <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 text-xs font-semibold leading-relaxed">
                                    <span className="block font-black text-[10px] uppercase text-primary tracking-widest mb-1">
                                        NIVEL ADAPTADO
                                    </span>
                                    <span className="font-bold text-foreground">
                                        Tu nivel adaptado actual es: <span className="text-primary font-black uppercase">{debateData.nivel_nuevo}</span>.
                                    </span>
                                    <p className="text-muted-foreground mt-2 font-medium">
                                        {(debateData.nivel_nuevo || "").toUpperCase().includes("PRINCIPIANTE") && (
                                            "¡Excelente base! El sistema está consolidando tus conceptos iniciales centrándose en los niveles de Recordar y Comprender de la taxonomía."
                                        )}
                                        {(debateData.nivel_nuevo || "").toUpperCase().includes("INTERMEDIO") && (
                                            "¡Gran progreso! El sistema te preparará para preguntas desafiantes de nivel Aplicación y Análisis en las siguientes lecciones."
                                        )}
                                        {((debateData.nivel_nuevo || "").toUpperCase().includes("AVANZADO") || (debateData.nivel_nuevo || "").toUpperCase().includes("EXPERTO")) && (
                                            "¡Felicidades, nivel superior! Dominas los fundamentos teóricos. El sistema te empujará hacia retos de Síntesis y Evaluación Crítica."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACRA Scale details */}
                    {isAcra && debateData.acra_detalle && (
                        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
                            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
                                <BookOpen className="w-5 h-5 text-primary" />
                                <h3 className="font-display font-bold text-lg">Estrategias de Aprendizaje (Escalas ACRA)</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: "Escala I: Adquisición",
                                        desc: "Atención, repetición y lectura exploratoria rápida.",
                                        value: debateData.acra_detalle.escala_I_adquisicion?.puntaje || 15,
                                        max: debateData.acra_detalle.escala_I_adquisicion?.max || 20
                                    },
                                    {
                                        title: "Escala II: Codificación",
                                        desc: "Elaboración de analogías, resúmenes e imágenes mentales.",
                                        value: debateData.acra_detalle.escala_II_codificacion?.puntaje || 14,
                                        max: debateData.acra_detalle.escala_II_codificacion?.max || 20
                                    },
                                    {
                                        title: "Escala III: Recuperación",
                                        desc: "Búsqueda en la memoria, autoevaluación e inducción de pistas.",
                                        value: debateData.acra_detalle.escala_III_recuperacion?.puntaje || 16,
                                        max: debateData.acra_detalle.escala_III_recuperacion?.max || 20
                                    },
                                    {
                                        title: "Escala IV: Apoyo",
                                        desc: "Metacognición, motivación intrínseca y control atencional.",
                                        value: debateData.acra_detalle.escala_IV_apoyo?.puntaje || 13,
                                        max: debateData.acra_detalle.escala_IV_apoyo?.max || 20
                                    }
                                ].map((scale) => (
                                    <div key={scale.title} className="space-y-2 p-4.5 rounded-2xl border border-border/60 bg-background/50">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-display font-bold text-sm text-foreground">{scale.title}</h4>
                                            <span className="text-xs font-black text-primary">{scale.value} / {scale.max}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed leading-normal">{scale.desc}</p>
                                        <div className="w-full bg-secondary/40 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{ width: `${(scale.value / scale.max) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center pt-2">
                                <span className="inline-block bg-primary/5 text-primary border border-primary/20 text-xs font-bold px-4 py-2 rounded-xl">
                                    Puntuación total ACRA: <span className="font-extrabold">{debateData.acra_detalle.total} / 80 puntos</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Pedagogical recommendations & Concepts */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Recommendations */}
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
                            <h3 className="font-display font-bold text-md text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                                Recomendaciones Pedagógicas
                            </h3>
                            <ul className="space-y-3">
                                {debateData.debate?.recomendaciones?.map((rec: string, index: number) => (
                                    <li key={index} className="text-xs font-semibold flex items-start gap-2.5 leading-normal">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black grid place-items-center shrink-0 mt-0.5">
                                            {index + 1}
                                        </span>
                                        <span className="text-muted-foreground leading-relaxed">
                                            {highlightKeywords(rec)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Concepts & Dificultades */}
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
                            <h3 className="font-display font-bold text-md text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                                <Brain className="w-4.5 h-4.5 text-primary" />
                                Áreas de Refuerzo Identificadas
                            </h3>
                            {isAcra ? (
                                <div className="bg-secondary/15 rounded-2xl p-4 border border-dashed border-border text-center">
                                    <p className="text-xs text-muted-foreground font-semibold leading-normal">
                                        Este apartado aún no está disponible al ser una práctica introductoria. Conforme avances en las semanas, aquí se mostrarán tus puntos específicos a mejorar.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-muted-foreground leading-normal font-medium">
                                        El análisis pedagógico determinó que deberías enfocar tu estudio prioritariamente en los siguientes conceptos:
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {debateData.debate?.conceptos_a_reforzar?.split(",").map((concept: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-xl cursor-default transition-all shadow-xs"
                                            >
                                                💡 {concept.trim()}
                                            </span>
                                        )) || (
                                            <span className="text-xs text-muted-foreground font-semibold">Ningún concepto crítico a reforzar. ¡Sigue así!</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Recommended Materials drawer */}
                    <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
                        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
                            <Bookmark className="w-5 h-5 text-primary animate-pulse" />
                            <div>
                                <h3 className="font-display font-bold text-lg text-foreground">Materiales de Aprendizaje Recomendados</h3>
                                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Accede a los recursos recomendados para tu nuevo nivel instructivo</p>
                            </div>
                        </div>

                        {isLoadingMaterials ? (
                            <div className="flex items-center justify-center py-10 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-bold">Cargando recursos recomendados...</span>
                            </div>
                        ) : recommendedMaterials.length === 0 ? (
                            <div className="bg-secondary/20 rounded-2xl p-8 border border-dashed border-border text-center">
                                <p className="text-xs text-muted-foreground font-semibold leading-normal">
                                    {isAcra
                                        ? "Este apartado aún no está disponible al ser una práctica introductoria, conforme avances en las semanas, aquí se mostrarán tus materiales recomendados."
                                        : "No se encontraron materiales alternativos recomendados para esta semana."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {recommendedMaterials.map((mat) => (
                                    <div
                                        key={mat.id}
                                        onClick={() => mat.visible && setSelectedFile({ id: mat.mongoId, name: mat.nombreArchivo })}
                                        className={cn(
                                            "border rounded-2xl p-4.5 hover:-translate-y-0.5 transition-all shadow-xs flex items-center justify-between cursor-pointer",
                                            mat.visible
                                                ? "bg-card border-border hover:bg-secondary/20 hover:border-primary/40"
                                                : "bg-secondary/10 border-border/40 opacity-40 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-display font-bold text-sm text-foreground leading-tight line-clamp-1">{mat.nombreArchivo}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">{mat.nivelDificultad || "INTERMEDIO"}</span>
                                                    {mat.tagsConceptos && (
                                                        <span className="text-[9px] font-bold text-muted-foreground truncate max-w-[140px]">{mat.tagsConceptos}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Back to course selection */}
                    <div className="pt-6 text-center">
                        <button
                            onClick={handleBackToModes}
                            className="px-14 py-5 rounded-[22px] bg-primary-gradient text-white text-base md:text-lg font-black font-display shadow-glow hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        >
                            Ir a Modalidades de Evaluación
                        </button>
                    </div>
                </div>
            )}

            {/* Universal Preview Modal for materials */}
            <UniversalPreviewModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                mongoId={selectedFile?.id || ""}
                fileName={selectedFile?.name || ""}
            />
        </div>
    );
}
