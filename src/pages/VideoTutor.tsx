import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, ArrowRight, Loader2, Award, Star, Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { evaluacionApi, agentJudgeApi, intentosApi } from "@/api/courses";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Diapositiva {
    titulo: string;
    puntos_clave: string[];
    narracion: string;
    ejemplo?: string;
    prompt_imagen?: string;
    base64_imagen?: string;
}

interface Leccion {
    tema: string;
    diapositivas: Diapositiva[];
}

interface Pregunta {
    enunciado: string;
    opciones_o_respuesta: string[] | string;
    respuesta_correcta: string;
    justificacion_pregunta: string;
}

interface EvaluacionResponse {
    leccion?: Leccion;
    preguntas: Pregunta[];
    tipo_pregunta: string;
    nivel_bloom?: string;
}

export default function VideoTutor() {
    const { courseId = "", semanaId = "" } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const mongoId = searchParams.get("mongoId") ?? "";
    const tema = searchParams.get("tema") ?? "el material de esta semana";
    const cantidadParam = searchParams.get("cantidad");
    const totalPreguntas = cantidadParam ? parseInt(cantidadParam, 10) : 5;

    // Estados de Carga y Datos
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [evaluacion, setEvaluacion] = useState<EvaluacionResponse | null>(null);

    // Estados de Flujo
    const [sesionIniciada, setSesionIniciada] = useState(false);
    const [videoCompletado, setVideoCompletado] = useState(false);
    const [examenCompletado, setExamenCompletado] = useState(false);

    // Estados del Reproductor de Video Simulado
    const [slideIndex, setSlideIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [slideProgress, setSlideProgress] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Estados del Cuestionario
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [respuestas, setRespuestas] = useState<Record<number, string>>({});
    const [resultadosQuiz, setResultadosQuiz] = useState<any[]>([]);
    const [evaluandoExamen, setEvaluandoExamen] = useState(false);
    const [preguntaEvaluada, setPreguntaEvaluada] = useState<any | null>(null);

    // Cargar la videolección al montar
    useEffect(() => {
        if (!mongoId) {
            setError("No se proporcionó el ID de material válido.");
            setCargando(false);
            return;
        }

        async function obtenerLeccion() {
            try {
                setCargando(true);
                setError("");
                // Usamos el endpoint de generación de preguntas que ahora incluye la lección de video explicativo
                const data = await evaluacionApi.generarPreguntas(mongoId, "VIDEO_EXPLICATIVO", totalPreguntas, tema);
                if (!data) throw new Error("No se recibieron datos de la evaluación.");
                
                setEvaluacion(data);
            } catch (err: any) {
                console.error(err);
                setError(err?.message || "Error al generar la videolección.");
            } finally {
                setCargando(false);
            }
        }

        obtenerLeccion();
    }, [mongoId, totalPreguntas, tema]);

    // Limpieza de TTS al desmontar
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Preparar Diapositivas con Fallback seguro
    const diapositivas: Diapositiva[] = evaluacion?.leccion?.diapositivas || [
        {
            titulo: `1. Introducción: ${tema}`,
            puntos_clave: ["Conceptos clave del material de estudio", "Marco general y definiciones"],
            narracion: `Bienvenidos a esta videolección interactiva sobre ${tema}. En esta sesión, analizaremos los aspectos conceptuales clave contenidos en la lectura de la semana. Presta mucha atención a los puntos mostrados en la pantalla, ya que al finalizar realizaremos un cuestionario de comprensión.`
        },
        {
            titulo: "2. Profundización de ideas",
            puntos_clave: ["Análisis estructurado", "Explicación de relaciones lógicas"],
            narracion: "Continuando con nuestro análisis, es fundamental comprender cómo se relacionan estos conceptos. Observa los puntos en pantalla: cada uno describe un proceso que soporta la idea central del tema de estudio. Toma nota de las justificaciones y detalles explicados."
        },
        {
            titulo: "3. Conclusiones y Evaluación",
            puntos_clave: ["Resumen y síntesis", "Preparación para el test de control"],
            narracion: "Para concluir, resumiremos los aprendizajes del día. Hemos visto la definición básica y la estructura lógica de los elementos de estudio. Ahora que has completado la lección, procederemos al test de comprensión lectora. ¡Éxitos!"
        }
    ];

    const preguntas: Pregunta[] = evaluacion?.preguntas || [];

    // Funciones del Reproductor TTS
    const startSlide = (index: number) => {
        if (diapositivas.length === 0) return;
        const slide = diapositivas[index];
        setSlideIndex(index);
        setSlideProgress(0);
        setIsPlaying(true);

        if (timerRef.current) clearInterval(timerRef.current);

        // Estimación visual de progreso: 15 caracteres por segundo aprox.
        const charsPerSec = 15;
        const estimatedSecs = Math.max(6, slide.narracion.length / charsPerSec);
        const totalMs = estimatedSecs * 1000;
        let elapsed = 0;

        timerRef.current = setInterval(() => {
            elapsed += 100;
            const pct = Math.min(100, (elapsed / totalMs) * 100);
            setSlideProgress(pct);
        }, 100);

        // Configurar síntesis de voz en español
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(slide.narracion);
        utterance.lang = "es-ES";
        utterance.rate = 0.95; // Un poco más lento para que sea claro
        utterance.pitch = 1.0;

        // Seleccionar una voz española si está disponible
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang.startsWith("es"));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }

        utterance.onend = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            setSlideProgress(100);

            // Transición automática tras medio segundo
            setTimeout(() => {
                if (index < diapositivas.length - 1) {
                    startSlide(index + 1);
                } else {
                    setIsPlaying(false);
                    setVideoCompletado(true);
                    toast.success("¡Has completado la videolección! Iniciemos tu test.");
                }
            }, 800);
        };

        utterance.onerror = (e) => {
            console.warn("TTS Utterance error:", e);
            if (timerRef.current) clearInterval(timerRef.current);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            window.speechSynthesis.pause();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
        } else {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                setIsPlaying(true);

                // Reanudar barra de progreso
                const slide = diapositivas[slideIndex];
                const charsPerSec = 15;
                const estimatedSecs = Math.max(6, slide.narracion.length / charsPerSec);
                const totalMs = estimatedSecs * 1000;
                let elapsed = (slideProgress / 100) * totalMs;

                timerRef.current = setInterval(() => {
                    elapsed += 100;
                    const pct = Math.min(100, (elapsed / totalMs) * 100);
                    setSlideProgress(pct);
                }, 100);
            } else {
                startSlide(slideIndex);
            }
        }
    };

    const handleNextSlide = () => {
        window.speechSynthesis.cancel();
        if (timerRef.current) clearInterval(timerRef.current);

        if (slideIndex < diapositivas.length - 1) {
            startSlide(slideIndex + 1);
        } else {
            setIsPlaying(false);
            setVideoCompletado(true);
            toast.success("¡Videolección completada!");
        }
    };

    const handlePrevSlide = () => {
        window.speechSynthesis.cancel();
        if (timerRef.current) clearInterval(timerRef.current);

        if (slideIndex > 0) {
            startSlide(slideIndex - 1);
        } else {
            startSlide(0);
        }
    };

    const saltarVideo = () => {
        window.speechSynthesis.cancel();
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
        setVideoCompletado(true);
        toast.info("Videolección omitida. Comienza el cuestionario.");
    };

    // Comenzar la reproducción
    const empezarLeccion = () => {
        setSesionIniciada(true);
        // Pequeño timeout para permitir que las voces del navegador se carguen si es necesario
        setTimeout(() => {
            startSlide(0);
        }, 150);
    };

    // Lógica del Cuestionario
    const handleOptionSelect = (option: string) => {
        if (preguntaEvaluada) return; // Ya respondida
        setRespuestas(prev => ({ ...prev, [currentQuestionIdx]: option }));
    };

    const evaluarRespuestaActual = async () => {
        const selected = respuestas[currentQuestionIdx];
        if (!selected) {
            toast.warning("Por favor selecciona una alternativa.");
            return;
        }

        setEvaluandoExamen(true);
        const p = preguntas[currentQuestionIdx];

        try {
            const res = await agentJudgeApi.evaluarRespuesta({
                pregunta: p.enunciado,
                respuestaEsperada: p.respuesta_correcta || p.justificacion_pregunta,
                respuestaEstudiante: selected,
                totalPreguntas: preguntas.length,
                tipoPregunta: "VIDEO_EXPLICATIVO",
            });

            setPreguntaEvaluada(res);
            setResultadosQuiz(prev => [...prev, res]);
        } catch (err: any) {
            console.error(err);
            toast.error("Error al calificar la respuesta. Reintentando...");
        } finally {
            setEvaluandoExamen(false);
        }
    };

    const irSiguientePregunta = () => {
        setPreguntaEvaluada(null);
        if (currentQuestionIdx < preguntas.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        } else {
            // Cuestionario completo, guardar resultados finales
            finalizarCuestionario();
        }
    };

    const finalizarCuestionario = async () => {
        setCargando(true);
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const finalScore = resultadosQuiz.reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0);
            
            const respuestasDetalle = preguntas.map((p, idx) => {
                const resEval = resultadosQuiz[idx];
                return {
                    preguntaTexto: p.enunciado,
                    tipoPregunta: "VIDEO_EXPLICATIVO",
                    respuestaEstudiante: respuestas[idx] || "No respondió",
                    esCorrecta: resEval?.evaluacion?.esCorrecta || false
                };
            });

            await intentosApi.guardar({
                usuarioId: Number(user.id),
                semanaId: Number(semanaId),
                notaFinal: Number(finalScore.toFixed(2)),
                respuestas: respuestasDetalle
            });

            setExamenCompletado(true);
            toast.success("¡Tu videolección y test han sido guardados exitosamente!");
        } catch (err) {
            console.error(err);
            toast.error("El examen finalizó, pero no se pudo guardar en el historial.");
            setExamenCompletado(true);
        } finally {
            setCargando(false);
        }
    };

    // Vistas de renderizado
    if (cargando && !sesionIniciada) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm font-semibold text-muted-foreground">Generando videolección interactiva con IA...</p>
            </div>
        );
    }

    if (error && !sesionIniciada) {
        return (
            <div className="max-w-md mx-auto py-16 text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-2xl grid place-items-center text-red-600 mx-auto text-2xl">
                    ⚠️
                </div>
                <div className="space-y-2">
                    <h2 className="font-display font-bold text-xl">Fallo al preparar la lección</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {error}
                    </p>
                </div>
                <Link
                    to={`/app/curso/${courseId}/semana/${semanaId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a modalidades
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link
                to={`/app/curso/${courseId}/semana/${semanaId}`}
                onClick={() => window.speechSynthesis.cancel()}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" /> Volver a modalidades
            </Link>

            <header className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                    🎬 Video Explicativo IA
                </div>
                <h1 className="font-display text-3xl font-bold">Videolección Animada y Evaluación</h1>
                <p className="text-sm text-muted-foreground">
                    Sigue la presentación narrada por el tutor sintético y evalúa tu comprensión al finalizar.
                </p>
            </header>

            {/* ESTADO 1: PANTALLA DE BIENVENIDA */}
            {!sesionIniciada && (
                <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-6 shadow-soft max-w-md mx-auto">
                    <div className="w-16 h-16 bg-primary-gradient rounded-2xl grid place-items-center text-white text-3xl mx-auto shadow-md">
                        🎬
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-display font-bold text-xl">¿Listo para aprender con IA?</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            ARIA ha sintetizado el tema <strong>"{tema}"</strong> en 3 diapositivas narradas por voz artificial. Al finalizar, responderás un test rápido de control.
                        </p>
                    </div>
                    <button
                        onClick={empezarLeccion}
                        className="w-full py-3.5 rounded-2xl bg-primary-gradient text-white font-bold shadow-soft hover:opacity-90 active:scale-95 transition-all"
                    >
                        Comenzar videolección
                    </button>
                </div>
            )}

            {/* ESTADO 2: REPRODUCTOR DE VIDEO SIMULADO */}
            {sesionIniciada && !videoCompletado && (
                <div className="space-y-6">
                    {/* Contenedor Principal del Video */}
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-8 text-white select-none">
                        
                        {/* Soft Blur Glow Shapes en el fondo para estética premium */}
                        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

                        {/* Top: Header de la diapositiva */}
                        <div className="flex justify-between items-center z-10">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/20 px-3 py-1 rounded-full border border-primary/20">
                                Lección: {diapositivas[slideIndex].titulo.split(".")[0] || "Slide"} de {diapositivas.length}
                            </span>
                            
                            {/* Visualizador de voz animado */}
                            <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
                                <span className="text-[10px] uppercase font-bold text-slate-300">ARIA Hablando</span>
                                <div className="flex items-center gap-0.5 h-3.5 w-6">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-0.5 bg-primary rounded-full"
                                            animate={isPlaying ? {
                                                height: [3, 14, 3],
                                                transition: {
                                                    repeat: Infinity,
                                                    duration: 0.6 + i * 0.12,
                                                    ease: "easeInOut"
                                                }
                                            } : {
                                                height: 3
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center: Contenido de la Diapositiva Animada */}
                        <div className="my-auto z-10 w-full max-w-3xl mx-auto py-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={slideIndex}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full"
                                >
                                    {diapositivas[slideIndex].base64_imagen ? (
                                        <div className="grid md:grid-cols-12 gap-6 items-center">
                                            {/* Left Column: Text Content (Col-span 7) */}
                                            <div className="md:col-span-7 space-y-4 text-left">
                                                <h2 className="font-display font-bold text-xl md:text-2xl text-balance bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                                                    {diapositivas[slideIndex].titulo}
                                                </h2>
                                                
                                                <div className="space-y-2">
                                                    {diapositivas[slideIndex].puntos_clave.map((punto, i) => (
                                                        <motion.div
                                                            key={punto}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.15 + i * 0.1 }}
                                                            className="flex items-start gap-2.5 bg-white/5 border border-white/5 backdrop-blur-md rounded-xl px-4 py-2 hover:bg-white/10 transition-colors"
                                                        >
                                                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 text-primary shrink-0 mt-0.5">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-200">{punto}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {diapositivas[slideIndex].ejemplo && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.4 }}
                                                        className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-left"
                                                    >
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary mb-0.5 flex items-center gap-1">
                                                            💡 Ejemplo práctico
                                                        </p>
                                                        <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                                                            {diapositivas[slideIndex].ejemplo}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Right Column: Illustration (Col-span 5) */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="md:col-span-5 rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-1 shadow-2xl aspect-square flex items-center justify-center max-w-[240px] mx-auto w-full"
                                            >
                                                <img 
                                                    src={`data:image/png;base64,${diapositivas[slideIndex].base64_imagen}`} 
                                                    alt="Ilustración explicativa"
                                                    className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform duration-300"
                                                />
                                            </motion.div>
                                        </div>
                                    ) : (
                                        <div className="max-w-xl mx-auto text-center space-y-5">
                                            <h2 className="font-display font-bold text-2xl md:text-3xl text-balance bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                                                {diapositivas[slideIndex].titulo}
                                            </h2>
                                            
                                            <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                                                {diapositivas[slideIndex].puntos_clave.map((punto, i) => (
                                                    <motion.div
                                                        key={punto}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.2 + i * 0.15 }}
                                                        className="w-full flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl px-5 py-2.5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 text-primary shrink-0">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-200 text-left">{punto}</span>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {diapositivas[slideIndex].ejemplo && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                    className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-left max-w-md mx-auto"
                                                >
                                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary mb-0.5 flex items-center gap-1">
                                                        💡 Ejemplo práctico
                                                    </p>
                                                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                                                        {diapositivas[slideIndex].ejemplo}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Bottom: Subtítulos de Narración (Lo que lee la voz) */}
                        <div className="z-10 mt-auto bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl p-4 text-center max-w-2xl mx-auto shadow-inner">
                            <p className="text-xs md:text-sm font-medium leading-relaxed text-slate-300 italic">
                                "{diapositivas[slideIndex].narracion}"
                            </p>
                        </div>
                    </div>

                    {/* Controles del reproductor inferior */}
                    <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-4">
                        
                        {/* Barra de progreso de lectura de la diapositiva */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                <span>Progreso diapositiva</span>
                                <span>{Math.round(slideProgress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary-gradient"
                                    animate={{ width: `${slideProgress}%` }}
                                    transition={{ ease: "linear", duration: 0.1 }}
                                />
                            </div>
                        </div>

                        {/* Botones de Control */}
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={saltarVideo}
                                className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline border border-transparent hover:border-border px-3 py-2 rounded-xl transition-all"
                            >
                                Saltar lección e ir al test ➔
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handlePrevSlide}
                                    className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground transition-all"
                                    title="Diapositiva anterior"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                
                                <button
                                    onClick={togglePlayPause}
                                    className="w-14 h-14 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    title={isPlaying ? "Pausar narración" : "Reproducir narración"}
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                                </button>

                                <button
                                    onClick={handleNextSlide}
                                    className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground transition-all animate-pulse"
                                    title="Siguiente diapositiva"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <span className="text-xs font-bold text-muted-foreground">
                                Diapositiva {slideIndex + 1} de {diapositivas.length}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ESTADO 3: CUESTIONARIO DE CONTROL */}
            {videoCompletado && !examenCompletado && preguntas.length > 0 && (
                <div className="space-y-6">
                    {/* Indicador de progreso del Quiz */}
                    <div className="bg-card border border-border rounded-3xl p-5 shadow-soft flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                                <span>Cuestionario de control</span>
                                <span>Pregunta {currentQuestionIdx + 1} de {preguntas.length}</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${((currentQuestionIdx + 1) / preguntas.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta de la Pregunta */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-6">
                        <h3 className="font-display font-bold text-lg md:text-xl text-foreground leading-relaxed">
                            {preguntas[currentQuestionIdx].enunciado}
                        </h3>

                        {/* Opciones */}
                        <div className="grid gap-3">
                            {(Array.isArray(preguntas[currentQuestionIdx].opciones_o_respuesta)
                                ? (preguntas[currentQuestionIdx].opciones_o_respuesta as string[])
                                : (preguntas[currentQuestionIdx].opciones_o_respuesta as string).split(" | ")
                            ).map((opcion) => {
                                const esSeleccionado = respuestas[currentQuestionIdx] === opcion;
                                const respondida = !!preguntaEvaluada;
                                const esCorrecta = opcion.trim() === preguntas[currentQuestionIdx].respuesta_correcta?.trim();
                                
                                let cardStyle = "border-border hover:bg-secondary/40 bg-secondary/10";
                                if (esSeleccionado) {
                                    cardStyle = "border-primary bg-primary/5";
                                }
                                if (respondida) {
                                    if (esCorrecta) {
                                        cardStyle = "border-green-300 dark:border-green-700 bg-green-500/10 text-green-700 dark:text-green-300";
                                    } else if (esSeleccionado && !esCorrecta) {
                                        cardStyle = "border-red-300 dark:border-red-700 bg-red-500/10 text-red-700 dark:text-red-300";
                                    } else {
                                        cardStyle = "border-border bg-secondary/5 opacity-50";
                                    }
                                }

                                return (
                                    <button
                                        key={opcion}
                                        onClick={() => handleOptionSelect(opcion)}
                                        disabled={respondida || evaluandoExamen}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-start gap-3 justify-between",
                                            !respondida && "hover:border-primary/50",
                                            cardStyle
                                        )}
                                    >
                                        <span>{opcion}</span>
                                        {respondida && esCorrecta && <Check className="w-5 h-5 text-green-500 shrink-0" />}
                                        {respondida && esSeleccionado && !esCorrecta && <X className="w-5 h-5 text-red-500 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback Detallado de la IA */}
                        <AnimatePresence>
                            {preguntaEvaluada && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed font-medium",
                                        preguntaEvaluada.evaluacion.esCorrecta
                                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
                                    )}
                                >
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-current text-[10px] font-bold">
                                        {preguntaEvaluada.evaluacion.esCorrecta ? "✓" : "✗"}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-[13px]">Feedback de ARIA:</p>
                                        <p>{preguntaEvaluada.evaluacion.explicacion}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Botón de envío/siguiente */}
                        <div className="flex justify-end">
                            {!preguntaEvaluada ? (
                                <button
                                    onClick={evaluarRespuestaActual}
                                    disabled={evaluandoExamen || !respuestas[currentQuestionIdx]}
                                    className="px-6 py-3 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                                >
                                    {evaluandoExamen ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Evaluando...
                                        </>
                                    ) : (
                                        "Verificar respuesta"
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={irSiguientePregunta}
                                    className="px-6 py-3 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                                >
                                    {currentQuestionIdx === preguntas.length - 1 ? "Finalizar test" : "Siguiente pregunta"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ESTADO 4: TEST FINALIZADO Y NOTA FINAL */}
            {examenCompletado && (
                <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-6 shadow-soft max-w-md mx-auto">
                    <Award className="w-16 h-16 text-primary mx-auto animate-bounce" />
                    
                    <div className="space-y-2">
                        <h2 className="font-display font-bold text-2xl">¡Evaluación Completada!</h2>
                        <p className="text-sm text-muted-foreground">
                            Has finalizado de ver la videolección de <strong>"{tema}"</strong> y respondiste el test de comprensión.
                        </p>
                    </div>

                    {/* Resumen de Calificación */}
                    <div className="bg-secondary/40 border border-border rounded-2xl p-5 space-y-3">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Tu calificación</span>
                        <div className="text-4xl font-extrabold text-primary">
                            {resultadosQuiz.reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0).toFixed(1)} <span className="text-lg text-muted-foreground font-normal">/ 20.0</span>
                        </div>
                        <div className="flex justify-center gap-1">
                            {Array.from({ length: 4 }).map((_, i) => {
                                const finalScore = resultadosQuiz.reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0);
                                const stars = finalScore >= 18 ? 4 : finalScore >= 14 ? 3 : finalScore >= 10 ? 2 : 1;
                                return (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-5 h-5",
                                            i < stars ? "text-amber-500 fill-amber-500" : "text-muted-foreground/35"
                                        )}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate(`/app/curso/${courseId}/semana/${semanaId}`)}
                        className="w-full py-3.5 rounded-2xl bg-primary-gradient text-white font-bold shadow-soft hover:opacity-90 active:scale-95 transition-all"
                    >
                        Volver a la Semana
                    </button>
                </div>
            )}
        </div>
    );
}
