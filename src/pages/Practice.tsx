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
};

function PreguntaMultiple({
                              pregunta, index, valor, onChange, disabled,
                          }: {
    pregunta: Pregunta; index: number; valor: string; onChange: (val: string) => void; disabled?: boolean;
}) {
    const opcionesArray = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : (pregunta.opciones_o_respuesta || "").split(" | ");

    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <ul className="space-y-2">
                {opcionesArray.map((op, i) => (
                    <li key={i}>
                        <label className={cn(
                            "flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/20 transition-colors",
                            disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-secondary/40 cursor-pointer"
                        )}>
                            <input
                                type="radio"
                                name={`q-${index}`}
                                value={op}
                                checked={valor === op}
                                onChange={(e) => onChange(e.target.value)}
                                disabled={disabled}
                                className="mt-0.5 accent-primary shrink-0 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm">{op}</span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PreguntaVF({
                        pregunta, index, valor, onChange, disabled,
                    }: {
    pregunta: Pregunta; index: number; valor: string; onChange: (val: string) => void; disabled?: boolean;
}) {
    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <div className="flex gap-3">
                {["VERDADERO", "FALSO"].map((op) => (
                    <label
                        key={op}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors text-sm font-semibold",
                            disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                            valor === op
                                ? "border-primary bg-primary/10"
                                : "border-border bg-secondary/20 hover:bg-secondary/40"
                        )}
                    >
                        <input
                            type="radio"
                            name={`q-${index}`}
                            value={op}
                            checked={valor === op}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={disabled}
                            className="hidden"
                        />
                        {op}
                    </label>
                ))}
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

function PreguntaCard({
                          pregunta, index, tipo, valor, onChange, disabled,
                      }: {
    pregunta: Pregunta; index: number; tipo: string; valor: string; onChange: (val: string) => void; disabled?: boolean;
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
                <PreguntaMultiple pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} />
            )}
            {tipo === "VERDADERO_FALSO" && (
                <PreguntaVF pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} />
            )}
            {tipo === "ABIERTA" && (
                <PreguntaAbierta pregunta={pregunta} valor={valor} onChange={onChange} disabled={disabled} />
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

    const {
        data: evaluacion,
        isLoading,
        isError,
        error,
    } = useQuery<EvaluacionResponse>({
        queryKey: ["evaluacion", mongoId, mode, cantidad],
        queryFn: () => evaluacionApi.generarPreguntas(mongoId, mode, cantidad),
        enabled: !!mongoId,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const preguntas = evaluacion?.preguntas ?? [];
    const evaluacionCompleta = resultados.length === preguntas.length && preguntas.length > 0;

    // Al desmontar el componente, limpiar caché si el examen ya terminó
    useEffect(() => {
        return () => {
            if (evaluacionCompleta) {
                queryClient.removeQueries({
                    queryKey: ["evaluacion", mongoId, mode, cantidad],
                });
            }
        };
    }, [evaluacionCompleta]);

    const handleVolver = () => {
        // Limpiar caché siempre al volver — garantiza preguntas frescas la próxima vez
        queryClient.removeQueries({
            queryKey: ["evaluacion", mongoId, mode, cantidad],
        });
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
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
                <div>
                    <p className="font-display font-bold text-xl">Generando preguntas con IA…</p>
                    <p className="text-sm text-muted-foreground mt-1">Esto puede tardar unos segundos.</p>
                </div>
            </div>
        );
    }

    if (isError) {
        const errorMsg = (error as any)?.response?.data || (error as any)?.message || String(error);
        const isOverloaded = errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("Service Unavailable");
        const isRateLimited = errorMsg.includes("429") || errorMsg.includes("Too Many Requests") || errorMsg.includes("Quota exceeded");
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
                        : errorMsg}
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
                if (mode === "VERDADERO_FALSO" || mode === "OPCION_MULTIPLE") {
                    respuestaEsperada = p.justificacion_pregunta;
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