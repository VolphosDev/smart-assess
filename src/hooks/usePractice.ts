import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EvaluationResponse, Question } from "@/types/Evaluation";
import {
    evaluacionApi,
    generarPreguntasStream,
    intentosApi,
    agentJudgeApi,
    archivosApi,
} from "@/api/courses";
import { reproducirAcierto, reproducirError, reproducirLogro } from "@/lib/sonidos";

// Instancias globales de los casos de uso / repositorios

/**
 * Caché de imágenes de Visual Quiz, acotada.
 *
 * Antes era un Map sin límite a nivel de módulo: cada imagen generada por IA que el alumno
 * veía se quedaba en memoria como cadena base64 (~2 MB cada una, porque base64 infla el
 * binario un 33%) mientras la pestaña siguiera abierta, sin liberarse nunca. Veinte
 * imágenes en una sesión larga son ~40 MB de heap muerto — suficiente para que un Android
 * de gama media mate la pestaña.
 *
 * Ahora es LRU con tope: al superar MAX_IMAGENES_EN_CACHE se descarta la más antigua. Un
 * Map de JS conserva el orden de inserción, así que la primera clave que devuelve el
 * iterador es la más vieja; volver a insertar una clave existente la mueve al final.
 */
const MAX_IMAGENES_EN_CACHE = 12;

const quizImageCacheRaw = new Map<string, string>();

const quizImageCache = {
    has: (clave: string) => quizImageCacheRaw.has(clave),
    get: (clave: string) => {
        const valor = quizImageCacheRaw.get(clave);
        if (valor !== undefined) {
            // Refrescar posición: pasa a ser la entrada más reciente.
            quizImageCacheRaw.delete(clave);
            quizImageCacheRaw.set(clave, valor);
        }
        return valor;
    },
    set: (clave: string, valor: string) => {
        if (quizImageCacheRaw.has(clave)) quizImageCacheRaw.delete(clave);
        quizImageCacheRaw.set(clave, valor);
        while (quizImageCacheRaw.size > MAX_IMAGENES_EN_CACHE) {
            const masAntigua = quizImageCacheRaw.keys().next().value;
            if (masAntigua === undefined) break;
            quizImageCacheRaw.delete(masAntigua);
        }
    },
};

const quizPendingRequests = new Set<string>();

export function usePractice() {
    const navigate = useNavigate();
    const { courseId = "", semanaId = "", mode = "OPCION_MULTIPLE" } = useParams();
    const [searchParams] = useSearchParams();
    const cantidad = Number(searchParams.get("cantidad") ?? "5");
    const mongoId = searchParams.get("mongoId") ?? "";
    const tema = searchParams.get("tema") ?? "";

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isStudent = user?.role?.toLowerCase() === "student";
    const storageKey = `semantika.unfinished_attempt.${user.id}.${courseId}.${semanaId}.${mode}`;

    // Si está activada la opción de pruebas para ignorar la continuación, limpiamos el intento guardado
    if (localStorage.getItem("semantika.testing_ignorar_continuar") === "true") {
        localStorage.removeItem(storageKey);
    }

    const [respuestas, setRespuestas] = useState<Record<number, string>>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.respuestas || {};
            }
        } catch (e) {
            console.error("Error restoring respuestas", e);
        }
        return {};
    });

    const [evaluando, setEvaluando] = useState(false);

    const [resultados, setResultados] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.resultados || [];
            }
        } catch (e) {
            console.error("Error restoring resultados", e);
        }
        return [];
    });

    const [currentSlide, setCurrentSlide] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.currentSlide || 0;
            }
        } catch (e) {
            console.error("Error restoring currentSlide", e);
        }
        return 0;
    });

    const [finalizado, setFinalizado] = useState(false);

    // Streaming & Load state
    const [evaluacion, setEvaluacion] = useState<EvaluationResponse | null>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.evaluacion || null;
            }
        } catch (e) {
            console.error("Error restoring evaluacion", e);
        }
        return null;
    });

    const [isLoading, setIsLoading] = useState(() => {
        try {
            if (localStorage.getItem(storageKey)) {
                return false;
            }
        } catch (e) {}
        return true;
    });

    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [streamCompleted, setStreamCompleted] = useState(() => {
        try {
            if (localStorage.getItem(storageKey)) {
                return true;
            }
        } catch (e) {}
        return false;
    });

    const [imagenesCargadas, setImagenesCargadas] = useState<Record<string, string>>({});
    const [practiceStreamCompleted, setPracticeStreamCompleted] = useState(false);

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
        if (!practiceStreamCompleted) return;

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
                    const res = await archivosApi.generarImagen(p.prompt_imagen);
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
    }, [preguntas, mode, practiceStreamCompleted]);

    // Setup Evaluation Questions Fetching (with SSE Streaming falling back to direct HTTP post)
    useEffect(() => {
        if (!mongoId) {
            setIsLoading(false);
            return;
        }

        // If we already have the evaluation restored from localStorage, DO NOT fetch it again!
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const key = `semantika.unfinished_attempt.${user.id}.${courseId}.${semanaId}.${mode}`;
        if (localStorage.getItem(key)) {
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setErrorMsg(null);
        setStreamCompleted(false);
        setEvaluacion(null);
        setImagenesCargadas({});
        setPracticeStreamCompleted(false);

        let sseCompleted = false;
        let cleanUpStream: (() => void) | null = null;
        let accumulatedText = "";

        const handleFallback = async () => {
            try {
                const res = await evaluacionApi.generarPreguntas(mongoId, mode, cantidad, tema);
                if (isMounted.current) {
                    setEvaluacion(res);
                    setIsLoading(false);
                    setStreamCompleted(true);
                    setPracticeStreamCompleted(true);
                }
            } catch (err: any) {
                if (isMounted.current) {
                    setIsError(true);
                    setErrorMsg(err?.message || "Error al generar preguntas de evaluación.");
                    setIsLoading(false);
                    setStreamCompleted(true);
                    setPracticeStreamCompleted(true);
                }
            }
        };

        try {
            const token = localStorage.getItem("token") || "";
            cleanUpStream = generarPreguntasStream(
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
                        setPracticeStreamCompleted(true);
                    }
                },
                (err) => {
                    console.warn("SSE EventSource stream warning, launching fallback", err);
                    if (!sseCompleted) {
                        handleFallback();
                    } else if (isMounted.current) {
                        setStreamCompleted(true);
                        setPracticeStreamCompleted(true);
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

    // Guardar estado inacabado en localStorage
    useEffect(() => {
        if (!finalizado && evaluacion && preguntas.length > 0) {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (user.id) {
                const key = `semantika.unfinished_attempt.${user.id}.${courseId}.${semanaId}.${mode}`;
                const data = {
                    courseId,
                    semanaId,
                    mode,
                    cantidad,
                    mongoId,
                    tema,
                    evaluacion,
                    respuestas,
                    resultados,
                    currentSlide,
                    timestamp: Date.now()
                };
                localStorage.setItem(key, JSON.stringify(data));
            }
        }
    }, [finalizado, evaluacion, respuestas, resultados, currentSlide, courseId, semanaId, mode, cantidad, mongoId, tema, preguntas]);

    const handleVolver = () => {
        if (finalizado) {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const key = `semantika.unfinished_attempt.${user.id}.${courseId}.${semanaId}.${mode}`;
            localStorage.removeItem(key);
        }
        navigate(`/app/curso/${courseId}/semana/${semanaId}`);
    };

    const handleAnswerChange = (val: string) => {
        if (!resultados[currentSlide] && !evaluando) {
            setRespuestas((prev) => ({ ...prev, [currentSlide]: val }));
        }
    };

    /**
     * Criterio con el que se califica una pregunta. Se extrajo a una función porque ahora
     * se usa en dos sitios —al calificar y al guardar el intento— y tienen que dar
     * exactamente el mismo texto: lo que el alumno ve luego en su historial como "respuesta
     * correcta" debe ser lo que realmente se usó para corregirle, no una reconstrucción
     * parecida.
     */
    const respuestaEsperadaDe = (p: any): string => {
        if (mode === "ABIERTA") {
            let esperada = p.justificacion_pregunta || "";
            if (Array.isArray(p.opciones_o_respuesta)) {
                esperada += " Rúbrica: " + p.opciones_o_respuesta[0];
            }
            return esperada;
        }
        if (mode === "DETECCION_ERRORES") {
            return p.respuesta_correcta || "";
        }
        return p.respuesta_correcta || p.justificacion_pregunta || "";
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

        const respuestaEsperada = respuestaEsperadaDe(p);

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

            // Retroalimentación inmediata y no verbal. Se sintetiza, no se descarga: ver
            // lib/sonidos.ts. El de error es suave a propósito — lo oye alguien de 13 años
            // que acaba de equivocarse, y la idea es informarle, no avergonzarlo.
            if (res?.evaluacion?.esCorrecta) {
                reproducirAcierto();
            } else {
                reproducirError();
            }
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
                esCorrecta: res.evaluacion.esCorrecta,
                // Alimentan el mapa de conocimiento por concepto (backend:
                // ConocimientoBktService). nivelBloom es el mismo para todo el lote;
                // concepto es específico por pregunta.
                nivelBloom: evaluacion?.nivel_bloom || null,
                conceptos: preguntas[i].concepto || null,
                // Sin estos dos, el historial del alumno podía decirle que falló pero no
                // qué era lo correcto ni por qué: la parte que sirve para estudiar se
                // perdía al cerrar la pantalla del examen.
                respuestaCorrecta: respuestaEsperadaDe(preguntas[i]) || null,
                retroalimentacion: res?.evaluacion?.explicacion || null
            }));

            await intentosApi.guardar({
                usuarioId: Number(user.id),
                semanaId: semanaId,
                notaFinal: Number(notaCalculada.toFixed(2)),
                tecnica: mode,
                respuestas: respuestasDetalle
            });

            localStorage.setItem(`semantika.completed_mode.${user.id}.${semanaId}.${mode}`, "true");
            reproducirLogro();
            toast.success("¡Examen calificado y guardado en tu historial!");
            setFinalizado(true);

            // Eliminar el intento inacabado de localStorage al finalizar con éxito
            const key = `semantika.unfinished_attempt.${user.id}.${courseId}.${semanaId}.${mode}`;
            localStorage.removeItem(key);
        } catch (e) {
            console.error("Error while saving test attempt:", e);
            toast.error("Hubo un error al guardar el intento en el historial.");
            setFinalizado(true);

            // Eliminar el intento inacabado de localStorage también en caso de error en el guardado
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const key = `semantika.unfinished_attempt.${user.id}.${courseId}.${semanaId}.${mode}`;
            localStorage.removeItem(key);
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
