import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, ArrowRight, Loader2, Award, Star, Check, X, AlertCircle, Volume2, VolumeX, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { evaluacionApi, agentJudgeApi, intentosApi, archivosApi } from "@/api/courses";
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

const optionColors = [
    {
        bg: "bg-blue-500/10 text-blue-900 border-blue-200 hover:border-blue-400 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30",
        badge: "bg-blue-500 text-white",
        active: "bg-blue-500 text-white border-transparent shadow-[0_0_15px_rgba(59,130,246,0.25)] ring-2 ring-blue-500/30",
    },
    {
        bg: "bg-violet-500/10 text-violet-900 border-violet-200 hover:border-violet-400 dark:bg-violet-950/20 dark:text-violet-300 dark:border-violet-900/30",
        badge: "bg-violet-500 text-white",
        active: "bg-violet-500 text-white border-transparent shadow-[0_0_15px_rgba(139,92,246,0.25)] ring-2 ring-violet-500/30",
    },
    {
        bg: "bg-pink-500/10 text-pink-900 border-pink-200 hover:border-pink-400 dark:bg-pink-950/20 dark:text-pink-300 dark:border-pink-900/30",
        badge: "bg-pink-500 text-white",
        active: "bg-pink-500 text-white border-transparent shadow-[0_0_15px_rgba(236,72,153,0.25)] ring-2 ring-pink-500/30",
    },
    {
        bg: "bg-amber-500/10 text-amber-900 border-amber-200 hover:border-amber-400 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30",
        badge: "bg-amber-500 text-white",
        active: "bg-amber-500 text-white border-transparent shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/30",
    },
];

function parseIncrementalLeccionYPreguntas(rawJson: string): any {
    const response: { leccion?: Leccion; preguntas: Pregunta[] } = { preguntas: [] };
    
    // Parse leccion topic
    const temaMatch = rawJson.match(/"tema"\s*:\s*"([^"]+)"/);
    const temaValue = temaMatch ? temaMatch[1] : "";

    // Parse slides
    const idxDiapositivas = rawJson.indexOf('"diapositivas"');
    const diapositivas: Diapositiva[] = [];
    if (idxDiapositivas !== -1) {
        const startArrayIdx = rawJson.indexOf('[', idxDiapositivas);
        if (startArrayIdx !== -1) {
            const listText = rawJson.substring(startArrayIdx + 1);
            let depth = 0;
            let objStart = -1;
            for (let i = 0; i < listText.length; i++) {
                const char = listText[i];
                if (char === '{') {
                    if (depth === 0) objStart = i;
                    depth++;
                } else if (char === '}') {
                    depth--;
                    if (depth === 0 && objStart !== -1) {
                        const candidate = listText.substring(objStart, i + 1);
                        try {
                            const parsed = JSON.parse(candidate);
                            if (parsed && typeof parsed === 'object' && parsed.titulo) {
                                diapositivas.push(parsed as Diapositiva);
                            }
                        } catch (e) {}
                    }
                } else if (char === ']' && depth === 0) {
                    break;
                }
            }
        }
    }
    
    if (diapositivas.length > 0 || temaValue) {
        response.leccion = {
            tema: temaValue || "el material de esta semana",
            diapositivas: diapositivas
        };
    }

    // Parse questions
    const idxPreguntas = rawJson.indexOf('"preguntas"');
    if (idxPreguntas !== -1) {
        const startArrayIdx = rawJson.indexOf('[', idxPreguntas);
        if (startArrayIdx !== -1) {
            const listText = rawJson.substring(startArrayIdx + 1);
            let depth = 0;
            let objStart = -1;
            for (let i = 0; i < listText.length; i++) {
                const char = listText[i];
                if (char === '{') {
                    if (depth === 0) objStart = i;
                    depth++;
                } else if (char === '}') {
                    depth--;
                    if (depth === 0 && objStart !== -1) {
                        const candidate = listText.substring(objStart, i + 1);
                        try {
                            const parsed = JSON.parse(candidate);
                            if (parsed && typeof parsed === 'object' && parsed.enunciado) {
                                response.preguntas.push(parsed as Pregunta);
                            }
                        } catch (e) {}
                    }
                } else if (char === ']' && depth === 0) {
                    break;
                }
            }
        }
    }

    return response;
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
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Estados del Cuestionario
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [respuestas, setRespuestas] = useState<Record<number, string>>({});
    const [resultadosQuiz, setResultadosQuiz] = useState<any[]>([]);
    const [evaluandoExamen, setEvaluandoExamen] = useState(false);
    const [preguntaEvaluada, setPreguntaEvaluada] = useState<any | null>(null);

    const [imagenesCargadas, setImagenesCargadas] = useState<Record<number, string>>({});
    const pendingRequests = useRef<Set<number>>(new Set());
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const cancelTTS = () => {
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        window.speechSynthesis.cancel();
    };

    // Cargar la videolección al montar
    useEffect(() => {
        if (!mongoId) {
            setError("No se proporcionó el ID de material válido.");
            setCargando(false);
            return;
        }

        let eventSource: EventSource | null = null;
        let sseCompleted = false;

        const ejecutarFallback = async () => {
            console.log("[VideoTutor] Iniciando fallback síncrono...");
            try {
                const data = await evaluacionApi.generarPreguntas(mongoId, "VIDEO_EXPLICATIVO", totalPreguntas, tema);
                setEvaluacion(data);
                setCargando(false);
            } catch (err: any) {
                console.error("[VideoTutor] Error en fallback:", err);
                setError(err?.message || "Error al generar la videolección.");
                setCargando(false);
            }
        };

        try {
            setCargando(true);
            setError("");
            const token = localStorage.getItem("token") || "";
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const url = `${baseUrl}/archivos/stream-tecnica-pdf?mongoId=${encodeURIComponent(
                mongoId
            )}&tipo=VIDEO_EXPLICATIVO&cantidad=${totalPreguntas}${tema ? `&tema=${encodeURIComponent(tema)}` : ""}&token=${token}`;

            eventSource = new EventSource(url, { withCredentials: true });
            let streamText = "";

            eventSource.addEventListener("chunk", (event) => {
                const chunk = event.data;
                if (chunk) {
                    streamText += chunk;
                    const parsed = parseIncrementalLeccionYPreguntas(streamText);
                    if (parsed && parsed.leccion && parsed.leccion.diapositivas.length > 0) {
                        setEvaluacion((prevEval) => {
                            if (prevEval && prevEval.preguntas.length >= parsed.preguntas.length && sseCompleted) {
                                return prevEval;
                            }
                            return {
                                leccion: parsed.leccion,
                                preguntas: parsed.preguntas,
                                tipo_pregunta: "VIDEO_EXPLICATIVO",
                                nivel_bloom: prevEval?.nivel_bloom || "5"
                            };
                        });
                        setCargando(false);
                    }
                }
            });

            eventSource.addEventListener("result", (event) => {
                try {
                    sseCompleted = true;
                    const finalData = JSON.parse(event.data);
                    setEvaluacion(finalData);
                    setCargando(false);
                    eventSource?.close();
                } catch (err) {
                    console.error("[VideoTutor] Error parseando datos de result SSE:", err);
                    ejecutarFallback();
                    eventSource?.close();
                }
            });

            eventSource.onerror = (err) => {
                console.warn("[VideoTutor] Error en canal SSE (fallback a síncrono):", err);
                eventSource?.close();
                if (!sseCompleted) {
                    ejecutarFallback();
                }
            };
        } catch (e) {
            console.error("[VideoTutor] Error al instanciar EventSource:", e);
            ejecutarFallback();
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [mongoId, totalPreguntas, tema]);

    // Cola de precarga en segundo plano para las imágenes del Video Tutor
    useEffect(() => {
        if (!evaluacion?.leccion?.diapositivas) return;
        
        const slides = evaluacion.leccion.diapositivas;
        
        // Cargar las base64 iniciales si existen
        slides.forEach((slide, idx) => {
            if (slide.base64_imagen && !imagenesCargadas[idx]) {
                setImagenesCargadas(prev => ({ ...prev, [idx]: slide.base64_imagen! }));
            }
        });

        // Cola asíncrona secuencial
        async function loadImagesSequentially() {
            for (let i = 0; i < slides.length; i++) {
                if (!isMounted.current) break;
                const slide = slides[i];
                if (slide.base64_imagen) continue;
                
                // Si ya solicitamos o estamos solicitando esta imagen, saltar
                if (pendingRequests.current.has(i)) continue;

                if (slide.prompt_imagen) {
                    pendingRequests.current.add(i); // Registrar la solicitud
                    try {
                        console.log(`[VideoTutor-Prefetch] Cargando imagen para diapositiva ${i + 1}...`);
                        const response = await archivosApi.generarImagen(slide.prompt_imagen);
                        const base64Data = response?.data?.base64 || (response as any)?.base64 || (response as any)?.data?.base64;
                        if (base64Data && isMounted.current) {
                            setImagenesCargadas(prev => ({ ...prev, [i]: base64Data }));
                        }
                    } catch (e) {
                        console.error(`Error precargando imagen de diapositiva ${i + 1}:`, e);
                    }
                }
            }
        }

        loadImagesSequentially();
    }, [evaluacion]);

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

        // Estimación visual de progreso: 15 caracteres por segundo aprox. ajustado por la velocidad
        const charsPerSec = 15 * playbackRate;
        const estimatedSecs = Math.max(6, slide.narracion.length / charsPerSec);
        const totalMs = estimatedSecs * 1000;
        let elapsed = 0;

        timerRef.current = setInterval(() => {
            elapsed += 100;
            const pct = Math.min(100, (elapsed / totalMs) * 100);
            setSlideProgress(pct);
        }, 100);

        // Configurar síntesis de voz en español
        cancelTTS();
        const utterance = new SpeechSynthesisUtterance(slide.narracion);
        utterance.lang = "es-ES";
        utterance.rate = playbackRate;
        utterance.pitch = 1.0;
        utterance.volume = isMuted ? 0 : 1;

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

    const changePlaybackRate = (rate: number) => {
        setPlaybackRate(rate);
        if (isPlaying) {
            cancelTTS();
            if (timerRef.current) clearInterval(timerRef.current);
            
            const slide = diapositivas[slideIndex];
            const charsPerSec = 15 * rate;
            const estimatedSecs = Math.max(6, slide.narracion.length / charsPerSec);
            const totalMs = estimatedSecs * 1000;
            // Reanudar desde el progreso actual
            let elapsed = (slideProgress / 100) * totalMs;

            timerRef.current = setInterval(() => {
                elapsed += 100;
                const pct = Math.min(100, (elapsed / totalMs) * 100);
                setSlideProgress(pct);
            }, 100);

            // Hablar desde la fracción restante
            const startIndex = Math.floor((slideProgress / 100) * slide.narracion.length);
            const subText = slide.narracion.substring(startIndex) || slide.narracion;

            const utterance = new SpeechSynthesisUtterance(subText);
            utterance.lang = "es-ES";
            utterance.rate = rate;
            utterance.pitch = 1.0;
            utterance.volume = isMuted ? 0 : 1;

            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(v => v.lang.startsWith("es"));
            if (spanishVoice) utterance.voice = spanishVoice;

            utterance.onend = () => {
                if (timerRef.current) clearInterval(timerRef.current);
                setSlideProgress(100);
                setTimeout(() => {
                    if (slideIndex < diapositivas.length - 1) {
                        startSlide(slideIndex + 1);
                    } else {
                        setIsPlaying(false);
                        setVideoCompletado(true);
                        toast.success("¡Has completado la videolección! Iniciemos tu test.");
                    }
                }, 800);
            };
            
            utterance.onerror = (e) => {
                console.warn("TTS Utterance error in change rate:", e);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        
        if (isPlaying) {
            cancelTTS();
            if (timerRef.current) clearInterval(timerRef.current);
            
            const slide = diapositivas[slideIndex];
            const charsPerSec = 15 * playbackRate;
            const estimatedSecs = Math.max(6, slide.narracion.length / charsPerSec);
            const totalMs = estimatedSecs * 1000;
            let elapsed = (slideProgress / 100) * totalMs;

            timerRef.current = setInterval(() => {
                elapsed += 100;
                const pct = Math.min(100, (elapsed / totalMs) * 100);
                setSlideProgress(pct);
            }, 100);

            const startIndex = Math.floor((slideProgress / 100) * slide.narracion.length);
            const subText = slide.narracion.substring(startIndex) || slide.narracion;

            const utterance = new SpeechSynthesisUtterance(subText);
            utterance.lang = "es-ES";
            utterance.rate = playbackRate;
            utterance.pitch = 1.0;
            utterance.volume = newMuted ? 0 : 1;

            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(v => v.lang.startsWith("es"));
            if (spanishVoice) utterance.voice = spanishVoice;

            utterance.onend = () => {
                if (timerRef.current) clearInterval(timerRef.current);
                setSlideProgress(100);
                setTimeout(() => {
                    if (slideIndex < diapositivas.length - 1) {
                        startSlide(slideIndex + 1);
                    } else {
                        setIsPlaying(false);
                        setVideoCompletado(true);
                        toast.success("¡Has completado la videolección! Iniciemos tu test.");
                    }
                }, 800);
            };
            
            utterance.onerror = (e) => {
                console.warn("TTS Utterance error in mute:", e);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = (clickX / width) * 100;
        setSlideProgress(percentage);
        
        if (isPlaying) {
            cancelTTS();
            if (timerRef.current) clearInterval(timerRef.current);
            
            const slide = diapositivas[slideIndex];
            const charsPerSec = 15 * playbackRate;
            const estimatedSecs = Math.max(6, slide.narracion.length / charsPerSec);
            const totalMs = estimatedSecs * 1000;
            let elapsed = (percentage / 100) * totalMs;
            
            timerRef.current = setInterval(() => {
                elapsed += 100;
                const pct = Math.min(100, (elapsed / totalMs) * 100);
                setSlideProgress(pct);
            }, 100);
            
            const startIndex = Math.floor((percentage / 100) * slide.narracion.length);
            const subText = slide.narracion.substring(startIndex) || slide.narracion;
            
            const utterance = new SpeechSynthesisUtterance(subText);
            utterance.lang = "es-ES";
            utterance.rate = playbackRate;
            utterance.pitch = 1.0;
            utterance.volume = isMuted ? 0 : 1;
            
            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(v => v.lang.startsWith("es"));
            if (spanishVoice) utterance.voice = spanishVoice;
            
            utterance.onend = () => {
                if (timerRef.current) clearInterval(timerRef.current);
                setSlideProgress(100);
                setTimeout(() => {
                    if (slideIndex < diapositivas.length - 1) {
                        startSlide(slideIndex + 1);
                    } else {
                        setIsPlaying(false);
                        setVideoCompletado(true);
                        toast.success("¡Has completado la videolección! Iniciemos tu test.");
                    }
                }, 800);
            };
            
            utterance.onerror = (e) => {
                console.warn("TTS Utterance error in seek:", e);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        } else {
            setSlideProgress(percentage);
        }
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            cancelTTS();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
        } else {
            // Reanudar barra de progreso e iniciar TTS desde la fracción restante
            const slide = diapositivas[slideIndex];
            const charsPerSec = 15 * playbackRate;
            const estimatedSecs = Math.max(6, slide.narracion.length / charsPerSec);
            const totalMs = estimatedSecs * 1000;
            
            setIsPlaying(true);
            
            let elapsed = (slideProgress / 100) * totalMs;
            if (timerRef.current) clearInterval(timerRef.current);

            timerRef.current = setInterval(() => {
                elapsed += 100;
                const pct = Math.min(100, (elapsed / totalMs) * 100);
                setSlideProgress(pct);
            }, 100);

            // Hablar desde la fracción restante
            const startIndex = Math.floor((slideProgress / 100) * slide.narracion.length);
            const subText = slide.narracion.substring(startIndex) || slide.narracion;

            const utterance = new SpeechSynthesisUtterance(subText);
            utterance.lang = "es-ES";
            utterance.rate = playbackRate;
            utterance.pitch = 1.0;
            utterance.volume = isMuted ? 0 : 1;

            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(v => v.lang.startsWith("es"));
            if (spanishVoice) utterance.voice = spanishVoice;

            utterance.onend = () => {
                if (timerRef.current) clearInterval(timerRef.current);
                setSlideProgress(100);
                setTimeout(() => {
                    if (slideIndex < diapositivas.length - 1) {
                        startSlide(slideIndex + 1);
                    } else {
                        setIsPlaying(false);
                        setVideoCompletado(true);
                        toast.success("¡Has completado la videolección! Iniciemos tu test.");
                    }
                }, 800);
            };
            
            utterance.onerror = (e) => {
                console.warn("TTS Utterance error in toggle play:", e);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleNextSlide = () => {
        cancelTTS();
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
        cancelTTS();
        if (timerRef.current) clearInterval(timerRef.current);

        if (slideIndex > 0) {
            startSlide(slideIndex - 1);
        } else {
            startSlide(0);
        }
    };

    const saltarVideo = () => {
        cancelTTS();
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
                onClick={() => cancelTTS()}
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
                    {/* Contenedor Principal del Video con Ambient Glow */}
                    <div className="relative group">
                        {/* Ambient Glow */}
                        <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-primary via-violet-600 to-indigo-500 opacity-15 blur-2xl group-hover:opacity-25 transition duration-1000 pointer-events-none" />

                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl flex flex-col justify-between p-8 text-white select-none">
                            
                            {/* Presenter slide background image (full presentation backdrop) */}
                            {(() => {
                                const imageToShow = imagenesCargadas[slideIndex] || diapositivas[slideIndex].base64_imagen;
                                return (
                                    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden flex flex-col md:flex-row gap-6 p-6 select-none bg-slate-950">
                                        
                                        {/* Left Side: Frame for the Illustration itself (Centerpiece) */}
                                        <div className="flex-1 flex flex-col justify-center items-center relative z-10 h-full">
                                            {imageToShow ? (
                                                <div className="relative w-full h-full max-h-[90%] rounded-2xl overflow-hidden border border-white/10 bg-slate-900/40 p-2 flex items-center justify-center shadow-lg transition-all duration-300">
                                                    <span className="absolute top-2.5 left-2.5 bg-primary/95 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full z-15 shadow-sm select-none">
                                                        Ilustración del Tutor
                                                    </span>
                                                    <img 
                                                        src={`data:image/png;base64,${imageToShow}`} 
                                                        alt="Ilustración explicativa de la lección"
                                                        className="max-w-full max-h-full object-contain rounded-xl shadow-md transition-transform duration-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full max-h-[90%] flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 text-center space-y-4">
                                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                                    <div className="space-y-1.5">
                                                        <h3 className="font-display font-black text-sm text-white">
                                                            Diseñando ilustración de apoyo...
                                                        </h3>
                                                        <p className="text-[10px] text-slate-300 max-w-xs leading-relaxed mx-auto">
                                                            El Tutor IA está componiendo los elementos visuales de la escena explicativa. Sigue escuchando la narración.
                                                        </p>
                                                    </div>
                                                    <div className="w-24 bg-white/10 rounded-full h-1 overflow-hidden relative border border-white/5">
                                                        <div className="bg-primary h-1 rounded-full animate-pulse w-full" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Information Pane (Title, Key Points, Practical Example) */}
                                        <div className="w-full md:w-[320px] flex flex-col justify-between relative z-10 h-full py-1.5 text-left pointer-events-auto">
                                            <div className="space-y-4">
                                                {/* Header info */}
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/15 border border-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full w-fit">
                                                        🎬 Diapositiva {slideIndex + 1}
                                                    </span>
                                                    <h2 className="font-display font-black text-sm md:text-base text-white leading-tight">
                                                        {diapositivas[slideIndex].titulo}
                                                    </h2>
                                                </div>

                                                {/* Puntos clave */}
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Conceptos Clave</span>
                                                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                                        {diapositivas[slideIndex].puntos_clave.map((punto, i) => (
                                                            <div key={i} className="flex gap-2 items-start bg-slate-900/50 border border-white/5 rounded-xl p-2.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                                <p className="text-[11px] font-semibold text-slate-200 leading-snug">{punto}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ejemplo práctico al fondo */}
                                            {diapositivas[slideIndex].ejemplo && (
                                                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mt-4 text-left">
                                                    <span className="text-[8px] font-black uppercase tracking-wider text-primary mb-1 block">💡 Ejemplo Práctico</span>
                                                    <p className="text-[11px] text-slate-200 leading-normal font-semibold">
                                                        {diapositivas[slideIndex].ejemplo}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Top HUD elements */}
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 pointer-events-none">
                                <div className="flex flex-col gap-1.5 pointer-events-auto opacity-0 w-0 h-0 overflow-hidden">
                                    {/* Mantenemos el componente para no alterar enlaces pero oculto, ya que todo el contenido está en el panel derecho */}
                                    <h2>{diapositivas[slideIndex].titulo}</h2>
                                </div>
                                
                                {/* Dynamic voice waveform status */}
                                <div className="flex items-center gap-2 bg-black/40 border border-white/5 backdrop-blur-md px-3 py-1.5 rounded-2xl pointer-events-auto shadow-md ml-auto">
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-300">
                                        {isPlaying ? (isMuted ? "Audio Muted" : "ARIA Narrando") : "Pausado"}
                                    </span>
                                    <div className="flex items-center gap-0.5 h-3 w-5">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className={cn(
                                                    "w-0.5 rounded-full bg-primary",
                                                    isMuted ? "bg-red-500" : "bg-primary"
                                                )}
                                                animate={isPlaying && !isMuted ? {
                                                    height: [2, 10, 2],
                                                    transition: {
                                                        repeat: Infinity,
                                                        duration: 0.4 + i * 0.1,
                                                        ease: "easeInOut"
                                                    }
                                                } : {
                                                    height: 2
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Interactive screen play listener */}
                            <div 
                                onClick={togglePlayPause}
                                className="absolute inset-0 bg-transparent z-20 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Controles del reproductor inferior */}
                    <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-4">
                        
                        {/* Barra de progreso de lectura de la diapositiva */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                <span>Progreso de Lección</span>
                                <span>{Math.round(slideProgress)}%</span>
                            </div>
                            <div 
                                onClick={handleSeekBarClick}
                                className="w-full h-2.5 bg-secondary hover:h-3 rounded-full overflow-hidden cursor-pointer relative group transition-all"
                                title="Haz clic para retroceder o avanzar en la narración"
                            >
                                <motion.div
                                    className="h-full bg-primary-gradient"
                                    animate={{ width: `${slideProgress}%` }}
                                    transition={{ ease: "linear", duration: 0.1 }}
                                />
                                <div className="absolute top-0 bottom-0 right-0 left-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        {/* Botones de Control */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            
                            {/* Left Controls: Audio and Speed */}
                            <div className="flex items-center gap-3">
                                {/* Mute Button */}
                                <button
                                    onClick={toggleMute}
                                    className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground transition-all active:scale-95 shadow-sm"
                                    title={isMuted ? "Activar audio" : "Silenciar"}
                                >
                                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-primary" />}
                                </button>

                                {/* Playback Rate Selector */}
                                <div className="flex items-center gap-1 border border-border bg-card rounded-xl p-1 shadow-sm">
                                    {[0.75, 1, 1.25, 1.5].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => changePlaybackRate(rate)}
                                            className={cn(
                                                "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all",
                                                playbackRate === rate 
                                                    ? "bg-primary text-white shadow-sm" 
                                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Center Controls: Playback buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handlePrevSlide}
                                    className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground transition-all shadow-sm active:scale-90"
                                    title="Diapositiva anterior"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                
                                <button
                                    onClick={togglePlayPause}
                                    className="w-14 h-14 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    title={isPlaying ? "Pausar" : "Reproducir"}
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                                </button>

                                <button
                                    onClick={handleNextSlide}
                                    className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground transition-all shadow-sm active:scale-90"
                                    title="Siguiente diapositiva"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Right Controls: Skipping and count */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                <button
                                    onClick={saltarVideo}
                                    className="text-[11px] font-bold text-muted-foreground hover:text-primary hover:underline border border-transparent hover:border-border/65 px-3 py-2 rounded-xl transition-all"
                                >
                                    Omitir lección e ir al test ➔
                                </button>

                                <span className="text-xs font-black text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-xl border border-border">
                                    {slideIndex + 1} / {diapositivas.length}
                                </span>
                            </div>

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
                        <div className="w-full">
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-0 m-0">
                                {(Array.isArray(preguntas[currentQuestionIdx].opciones_o_respuesta)
                                    ? (preguntas[currentQuestionIdx].opciones_o_respuesta as string[])
                                    : (preguntas[currentQuestionIdx].opciones_o_respuesta as string).split(" | ")
                                ).map((opcion, i) => {
                                    const esSeleccionado = respuestas[currentQuestionIdx] === opcion;
                                    const respondida = !!preguntaEvaluada;
                                    const esCorrecta = opcion.trim() === preguntas[currentQuestionIdx].respuesta_correcta?.trim();
                                    
                                    const hasLetterPrefix = /^[A-D]\)/.test(opcion.trim());
                                    const cleanText = hasLetterPrefix ? opcion.replace(/^[A-D]\)\s*/, "") : opcion;

                                    const colors = optionColors[i % 4];
                                    const letter = String.fromCharCode(65 + i);

                                    let cardStyle = cn(
                                        "border bg-card text-left",
                                        respondida ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200",
                                        colors.bg
                                    );
                                    let badgeStyle = colors.badge;
                                    let rightIcon = null;

                                    if (respondida) {
                                        if (esCorrecta) {
                                            cardStyle = "border-emerald-500/80 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01] text-left";
                                            badgeStyle = "bg-emerald-500 text-white font-bold border-transparent";
                                            rightIcon = <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 shrink-0" />;
                                        } else if (esSeleccionado && !esCorrecta) {
                                            cardStyle = "border-destructive/80 bg-destructive/5 text-destructive dark:bg-red-950/20 dark:text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-left";
                                            badgeStyle = "bg-destructive text-white font-bold border-transparent";
                                            rightIcon = <XCircle className="w-5.5 h-5.5 text-destructive shrink-0" />;
                                        } else {
                                            cardStyle = "border-border/50 bg-muted/10 opacity-30 select-none scale-[0.98] text-left";
                                            badgeStyle = "bg-muted text-muted-foreground/40 border-border/20";
                                        }
                                    } else if (esSeleccionado) {
                                        cardStyle = colors.active;
                                    }

                                    return (
                                        <li key={opcion} className="list-none relative">
                                            <button
                                                type="button"
                                                onClick={() => handleOptionSelect(opcion)}
                                                disabled={respondida || evaluandoExamen}
                                                className={cn(
                                                    "w-full relative flex items-center gap-4 p-5 pt-8 pb-5 rounded-2xl border transition-all text-sm font-semibold shadow-sm min-h-[76px]",
                                                    cardStyle
                                                )}
                                            >
                                                {/* Academic letter choice badge (A, B, C, D) */}
                                                <span className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent shadow-xs transition-all duration-200 font-display font-black text-lg",
                                                    badgeStyle
                                                )}>
                                                    {letter}
                                                </span>

                                                <span className="flex-1 leading-snug break-words pr-2">{cleanText}</span>
                                                {rightIcon}

                                                {/* Badges de corrección absolutos para evitar romper la cuadrícula y superponerse */}
                                                {respondida && esCorrecta && (
                                                    <span className="absolute top-2.5 right-3 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none border border-emerald-200/50">
                                                        ✓ Correcta
                                                    </span>
                                                )}
                                                {respondida && esSeleccionado && !esCorrecta && (
                                                    <span className="absolute top-2.5 right-3 text-[9px] font-black uppercase tracking-wider text-destructive bg-destructive/10 dark:bg-red-950/40 px-2 py-0.5 rounded-full select-none border border-destructive/20">
                                                        ✗ Tu Selección
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
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
