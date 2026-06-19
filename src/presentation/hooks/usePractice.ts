import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EvaluationResponse, Question } from "../../domain/entities/Evaluation";
import { ApiEvaluationRepository } from "../../infrastructure/repositories/ApiEvaluationRepository";
import { ApiAttemptRepository } from "../../infrastructure/repositories/ApiAttemptRepository";
import { ApiFileRepository } from "../../infrastructure/repositories/ApiFileRepository";
import { ApiAgentJudgeRepository } from "../../infrastructure/repositories/ApiAgentJudgeRepository";
import { GenerateQuestions } from "../../application/use-cases/GenerateQuestions";
import { SaveAttempt } from "../../application/use-cases/SaveAttempt";
import { EvaluateOpenAnswer } from "../../application/use-cases/EvaluateOpenAnswer";

// Instancias globales de los casos de uso / repositorios
const evaluationRepo = new ApiEvaluationRepository();
const attemptRepo = new ApiAttemptRepository();
const fileRepo = new ApiFileRepository();
const agentJudgeRepo = new ApiAgentJudgeRepository();

const generateQuestionsUseCase = new GenerateQuestions(evaluationRepo);
const saveAttemptUseCase = new SaveAttempt(attemptRepo);
const evaluateOpenAnswerUseCase = new EvaluateOpenAnswer(agentJudgeRepo);

const quizImageCache = new Map<string, string>();
const quizPendingRequests = new Set<string>();

export function usePractice() {
    const navigate = useNavigate();
    const { courseId = "", semanaId = "", mode = "OPCION_MULTIPLE" } = useParams();
    const [searchParams] = useSearchParams();
    const cantidad = Number(searchParams.get("cantidad") ?? "5");
    const mongoId = searchParams.get("mongoId") ?? "";
    const tema = searchParams.get("tema") ?? "";

    const [respuestas, setRespuestas] = useState<Record<number, string>>({});
    const [evaluando, setEvaluando] = useState(false);
    const [resultados, setResultados] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [finalizado, setFinalizado] = useState(false);

    // Streaming & Load state
    const [evaluacion, setEvaluacion] = useState<EvaluationResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [streamCompleted, setStreamCompleted] = useState(false);
    const [imagenesCargadas, setImagenesCargadas] = useState<Record<string, string>>({});

    const preguntas = evaluacion?.preguntas ?? [];
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Helper to parse streaming json chunks incrementally
    const parseIncrementalPreguntas = (rawJson: string): Question[] => {
        const idx = rawJson.indexOf('"preguntas"');
        if (idx === -1) return [];
        
        const startArrayIdx = rawJson.indexOf('[', idx);
        if (startArrayIdx === -1) return [];
        
        const questionsText = rawJson.substring(startArrayIdx + 1);
        const list: Question[] = [];
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
                            list.push(parsed as Question);
                        }
                    } catch (e) {
                        // Ignore parsing errors of incomplete elements
                    }
                }
            }
        }
        return list;
    };

    // Pre-fetch illustration queue for Visual Quizzes in background
    useEffect(() => {
        if (!preguntas || preguntas.length === 0 || mode !== "VISUAL_QUIZ") return;

        preguntas.forEach((p) => {
            if (p.prompt_imagen) {
                if (p.base64_imagen && !imagenesCargadas[p.prompt_imagen]) {
                    setImagenesCargadas(prev => ({ ...prev, [p.prompt_imagen!]: p.base64_imagen! }));
                    quizImageCache.set(p.prompt_imagen, p.base64_imagen);
                } else if (quizImageCache.has(p.prompt_imagen) && !imagenesCargadas[p.prompt_imagen]) {
                    const cachedData = quizImageCache.get(p.prompt_imagen)!;
                    setImagenesCargadas(prev => ({ ...prev, [p.prompt_imagen!]: cachedData }));
                }
            }
        });

        async function prefetchImages() {
            for (let i = 0; i < preguntas.length; i++) {
                if (!isMounted.current) break;
                const p = preguntas[i];
                if (!p.prompt_imagen) continue;
                if (p.base64_imagen) continue;
                
                if (quizImageCache.has(p.prompt_imagen) || quizPendingRequests.has(p.prompt_imagen)) {
                    continue;
                }

                quizPendingRequests.add(p.prompt_imagen);
                try {
                    const res = await fileRepo.generateImage(p.prompt_imagen);
                    const base64Data = res?.base64;
                    if (base64Data) {
                        quizImageCache.set(p.prompt_imagen, base64Data);
                        if (isMounted.current) {
                            setImagenesCargadas(prev => ({ ...prev, [p.prompt_imagen!]: base64Data }));
                        }
                    }
                } catch (err) {
                    console.error(`Error preloading visual question image:`, err);
                }
            }
        }

        prefetchImages();
    }, [preguntas, mode]);

    // Setup Evaluation Questions Fetching (with SSE Streaming falling back to direct HTTP post)
    useEffect(() => {
        if (!mongoId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setErrorMsg(null);
        setStreamCompleted(false);
        setEvaluacion(null);
        setImagenesCargadas({});

        let sseCompleted = false;
        let cleanUpStream: (() => void) | null = null;
        let accumulatedText = "";

        const handleFallback = async () => {
            try {
                const res = await generateQuestionsUseCase.execute(mongoId, mode, cantidad, tema);
                if (isMounted.current) {
                    setEvaluacion(res);
                    setIsLoading(false);
                    setStreamCompleted(true);
                }
            } catch (err: any) {
                if (isMounted.current) {
                    setIsError(true);
                    setErrorMsg(err?.message || "Error al generar preguntas de evaluación.");
                    setIsLoading(false);
                    setStreamCompleted(true);
                }
            }
        };

        try {
            const token = localStorage.getItem("token") || "";
            cleanUpStream = generateQuestionsUseCase.executeStream(
                mongoId,
                mode,
                cantidad,
                tema,
                token,
                (chunk) => {
                    accumulatedText += chunk;
                    const parsed = parseIncrementalPreguntas(accumulatedText);
                    if (parsed.length > 0 && isMounted.current) {
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
                },
                (result) => {
                    sseCompleted = true;
                    if (isMounted.current) {
                        setEvaluacion(result);
                        setIsLoading(false);
                        setStreamCompleted(true);
                    }
                },
                (err) => {
                    console.warn("SSE EventSource stream warning, launching fallback", err);
                    if (!sseCompleted) {
                        handleFallback();
                    } else if (isMounted.current) {
                        setStreamCompleted(true);
                    }
                }
            );
        } catch (e) {
            console.error("Failed to construct stream connections:", e);
            handleFallback();
        }

        return () => {
            if (cleanUpStream) cleanUpStream();
        };
    }, [mongoId, mode, cantidad, tema]);

    const handleVolver = () => {
        navigate(`/app/curso/${courseId}/semana/${semanaId}`);
    };

    const handleAnswerChange = (val: string) => {
        if (!resultados[currentSlide] && !evaluando) {
            setRespuestas((prev) => ({ ...prev, [currentSlide]: val }));
        }
    };

    const comprobarRespuestaActual = async () => {
        if (evaluando) return;
        const p = preguntas[currentSlide];
        const respuestaEstudiante = respuestas[currentSlide];
        if (!respuestaEstudiante) {
            toast.warning("Por favor selecciona una alternativa.");
            return;
        }

        setEvaluando(true);

        let respuestaEsperada = p.respuesta_correcta || p.justificacion_pregunta;
        if (mode === "ABIERTA") {
            respuestaEsperada = p.justificacion_pregunta;
            if (Array.isArray(p.opciones_o_respuesta)) {
                respuestaEsperada += " Rúbrica: " + p.opciones_o_respuesta[0];
            }
        } else if (mode === "DETECCION_ERRORES") {
            respuestaEsperada = p.respuesta_correcta || "";
        }

        try {
            const res = await evaluateOpenAnswerUseCase.execute({
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
            console.error(`Error grading question ${currentSlide + 1}:`, err);
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

            await saveAttemptUseCase.execute({
                usuarioId: Number(user.id),
                semanaId: Number(semanaId),
                notaFinal: Number(notaCalculada.toFixed(2)),
                respuestas: respuestasDetalle
            });

            toast.success("¡Examen calificado y guardado en tu historial!");
            setFinalizado(true);
        } catch (e) {
            console.error("Error while saving test attempt:", e);
            toast.error("Hubo un error al guardar el intento en el historial.");
            setFinalizado(true);
        } finally {
            setEvaluando(false);
        }
    };

    const notaTotal = resultados
        .reduce((total, r) => total + (r?.evaluacion?.puntaje || 0), 0)
        .toFixed(2);

    return {
        courseId,
        semanaId,
        mode,
        cantidad,
        mongoId,
        tema,
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
    };
}
