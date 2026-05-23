import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { semanasApi } from "@/api/courses.ts";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Eye } from "lucide-react";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";

const evalModes = [
    {
        id: "OPCION_MULTIPLE",
        emoji: "☑️",
        color: "primary" as const,
        title: "Opción múltiple",
        description: "Responde preguntas con 4 alternativas generadas a partir del material.",
        bullets: ["Preguntas generadas por IA", "Retroalimentación inmediata", "Registra tu puntaje"],
        duration: "10–15 min",
        disabled: false,
    },
    {
        id: "VERDADERO_FALSO",
        emoji: "⚖️",
        color: "lime" as const,
        title: "Verdadero / Falso",
        description: "Evalúa si los enunciados del tema son correctos o incorrectos.",
        bullets: ["Basado en el material del docente", "Rápido y directo", "Ideal para repasar"],
        duration: "5–10 min",
        disabled: false,
    },
    {
        id: "ABIERTA",
        emoji: "✍️",
        color: "coral" as const,
        title: "Pregunta abierta",
        description: "Desarrolla tu respuesta con tus propias palabras.",
        bullets: ["Evalúa comprensión profunda", "Respuesta libre", "Corrección automática por IA"],
        duration: "15–20 min",
        disabled: false,
    },
    {
        id: "avatar",
        emoji: "🤖",
        color: "muted" as const,
        title: "Hablar con el avatar",
        description: "Practica respondiendo en voz alta con un avatar conversacional.",
        bullets: ["Evaluación por voz", "Retroalimentación en tiempo real", "Próximamente disponible"],
        duration: "Próximamente",
        disabled: true,
    },
];

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
    muted: "bg-muted",
} as const;

export default function EvalModeSelect() {
    const { courseId = "", semanaId: week = "" } = useParams();
    const [cantidad, setCantidad] = useState(5);
    const [previewMongoId, setPreviewMongoId] = useState<string | null>(null);

    const { data: semana, isLoading } = useQuery({
        queryKey: ["semana", week],
        queryFn: () => semanasApi.get(week),
        enabled: !!week,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!semana) {
        return (
            <div className="text-center py-20">
                <h1 className="font-display font-bold text-3xl mb-3">Semana no encontrada</h1>
                <Link to="/app" className="text-primary font-semibold hover:underline">
                    Volver al inicio
                </Link>
            </div>
        );
    }

    const materiales = semana.materiales || [];

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <Link
                to={`/app/curso/${courseId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" /> Volver al curso
            </Link>

            <header className="text-center space-y-3">
                <span className="inline-block px-3 py-1 rounded-full bg-secondary/40 text-xs font-bold uppercase tracking-wider">
                    {semana.numSem}
                </span>

                <h1 className="font-display text-4xl md:text-5xl font-bold text-balance">
                    {materiales.length > 0
                        ? materiales.length === 1
                            ? materiales[0].nombreArchivo
                            : `Materiales de la semana (${materiales.length})`
                        : "Material de la semana"}
                </h1>

                {/* Botón por cada documento disponible */}
                {materiales.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {materiales.map((mat: any, idx: number) =>
                            mat.mongoId ? (
                                <button
                                    key={mat.mongoId}
                                    onClick={() => setPreviewMongoId(mat.mongoId)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary text-sm font-bold rounded-xl transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    {materiales.length === 1
                                        ? "Leer documento antes de empezar"
                                        : `Documento ${idx + 1}: ${mat.nombreArchivo}`}
                                </button>
                            ) : null
                        )}
                    </div>
                )}

                <p className="text-muted-foreground max-w-xl mx-auto">
                    ¿Cómo te quieres evaluar hoy? Elige la modalidad que mejor se adapte a ti.
                </p>
                {semana.totalPreguntas > 0 && (
                    <p className="text-sm font-semibold text-primary">
                        {semana.totalPreguntas} preguntas disponibles
                    </p>
                )}
            </header>

            {materiales.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center">
                    <p className="text-muted-foreground">
                        Tu profesor aún no ha cargado el material de esta semana.
                    </p>
                </div>
            ) : (
                <>
                    {/* Selector de cantidad */}
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">
                            Cantidad de preguntas:
                        </span>
                        <div className="flex rounded-2xl border border-border overflow-hidden">
                            {[5, 10].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setCantidad(n)}
                                    className={cn(
                                        "px-5 py-2 text-sm font-bold transition-all",
                                        cantidad === n
                                            ? "bg-primary text-white"
                                            : "bg-card text-muted-foreground hover:bg-secondary/40"
                                    )}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards de modalidad */}
                    <div className="grid sm:grid-cols-2 gap-5">
                        {evalModes.map((m, i) => {
                            const cardContent = (
                                <div
                                    className={cn(
                                        "group block bg-card border rounded-3xl p-6 shadow-soft h-full transition-all",
                                        m.disabled
                                            ? "border-border opacity-50 grayscale cursor-not-allowed"
                                            : "border-border hover:-translate-y-1 cursor-pointer"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-16 h-16 rounded-2xl grid place-items-center text-3xl shadow-soft mb-4",
                                            colorMap[m.color]
                                        )}
                                    >
                                        {m.emoji}
                                    </div>

                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h3 className="font-display font-bold text-xl">{m.title}</h3>
                                        {m.disabled && (
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                Pronto
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-4">{m.description}</p>

                                    <ul className="space-y-1.5 mb-5">
                                        {m.bullets.map((b) => (
                                            <li key={b} className="text-xs font-semibold flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{" "}
                                                {b}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <span className="text-xs font-bold text-muted-foreground inline-flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> {m.duration}
                                        </span>
                                        {!m.disabled && (
                                            <span className="text-sm font-bold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Empezar <ArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );

                            return (
                                <motion.div
                                    key={m.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                >
                                    {m.disabled ? (
                                        <div>{cardContent}</div>
                                    ) : (
                                        <Link
                                            to={`/app/curso/${courseId}/semana/${week}/evaluacion/${m.id}?cantidad=${cantidad}&mongoId=${materiales[0]?.mongoId ?? ""}`}
                                        >
                                            {cardContent}
                                        </Link>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            <PdfPreviewModal
                mongoId={previewMongoId || ""}
                isOpen={!!previewMongoId}
                onClose={() => setPreviewMongoId(null)}
            />
        </div>
    );
}