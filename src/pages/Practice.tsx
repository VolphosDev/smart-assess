import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, BookOpen, Brain, CheckSquare } from "lucide-react";
import { evaluacionApi } from "@/api/courses.ts";
import { cn } from "@/lib/utils";


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


function PreguntaMultiple({ pregunta, index }: { pregunta: Pregunta; index: number }) {
    const opcionesArray = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : (pregunta.opciones_o_respuesta || "").split(" | ");

    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">
                {pregunta.enunciado}
            </p>
            <ul className="space-y-2">
                {opcionesArray.map((op, i) => (
                    <li key={i}>
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors">
                            <input
                                type="radio"
                                name={`q-${index}`}
                                className="mt-0.5 accent-primary shrink-0"
                            />
                            <span className="text-sm">{op}</span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PreguntaVF({ pregunta, index }: { pregunta: Pregunta; index: number }) {
    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <div className="flex gap-3">
                {["Verdadero", "Falso"].map((op) => (
                    <label
                        key={op}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors text-sm font-semibold"
                    >
                        <input type="radio" name={`q-${index}`} className="accent-primary" />
                        {op}
                    </label>
                ))}
            </div>
        </div>
    );
}

function PreguntaAbierta({ pregunta }: { pregunta: Pregunta }) {
    return (
        <div className="space-y-3">
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <textarea
                rows={4}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
        </div>
    );
}

function PreguntaCard({ pregunta, index, tipo }: { pregunta: Pregunta; index: number; tipo: string }) {
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

            {tipo === "OPCION_MULTIPLE" && <PreguntaMultiple pregunta={pregunta} index={index} />}
            {tipo === "VERDADERO_FALSO" && <PreguntaVF pregunta={pregunta} index={index} />}
            {tipo === "ABIERTA" && <PreguntaAbierta pregunta={pregunta} />}
        </motion.div>
    );
}

export default function Practice() {
    // mongoId llega directo desde la URL (puesto por EvalModeSelect en el Link)
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

    const preguntas = evaluacion?.preguntas ?? [];

    return (
        <div className="space-y-8 max-w-3xl mx-auto">

            <Link
                to={`/app/curso/${courseId}/semana/${semanaId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" /> Volver
            </Link>

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
                    {preguntas.map((p, i) => (
                        <PreguntaCard key={i} pregunta={p} index={i} tipo={mode} />
                    ))}
                </div>
            </AnimatePresence>

            {preguntas.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: preguntas.length * 0.07 + 0.1 }}
                    className="flex justify-end pt-4"
                >
                    <button
                        className="px-8 py-3 rounded-2xl bg-primary-gradient text-white font-bold shadow-soft hover:opacity-90 active:scale-95 transition-all"
                        onClick={() => {
                            alert("¡Evaluador próximamente!");
                        }}
                    >
                        Enviar respuestas
                    </button>
                </motion.div>
            )}
        </div>
    );
}