import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Loader2, Eye, Lock, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import { useEvalModeSelect } from "../presentation/hooks/useEvalModeSelect";

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
        id: "DETECCION_ERRORES",
        emoji: "🔍",
        color: "lime" as const,
        title: "Detección de errores",
        description: "Encuentra y corrige los enunciados incorrectos en un texto sobre el tema.",
        bullets: ["Fomenta el análisis crítico", "Corrige errores en tiempo real", "Retroalimentación conceptual"],
        duration: "10–15 min",
        disabled: false,
    },
    {
        id: "VISUAL_QUIZ",
        emoji: "🖼️",
        color: "coral" as const,
        title: "Visual Quiz con IA",
        description: "Responde preguntas basadas en imágenes y diagramas explicativos generados por IA.",
        bullets: ["Codificación dual (visual+texto)", "Imágenes generadas al instante", "Ideal para conceptos complejos"],
        duration: "10–15 min",
        disabled: false,
    },
    {
        id: "avatar",
        emoji: "🤖",
        color: "primary" as const,
        title: "Hablar con el avatar",
        description: "Practica respondiendo en voz alta con ARIA, tu tutora IA.",
        bullets: ["Conversación por voz", "Retroalimentación inmediata", "Preguntas del material real"],
        duration: "10–15 min",
        disabled: false,
    },
    {
        id: "video",
        emoji: "🎬",
        color: "primary" as const,
        title: "Video Explicativo",
        description: "Aprende con una videolección animada generada por IA sobre el tema y ponte a prueba al finalizar.",
        bullets: ["Diapositivas animadas e interactivas", "Narración explicativa con voz IA (TTS)", "Cuestionario de control al finalizar"],
        duration: "5–10 min",
        disabled: false,
    },
];

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
    muted: "bg-muted",
} as const;

export default function EvalModeSelect() {
    const {
        courseId,
        semanaId: week,
        cantidad,
        setCantidad,
        selectedFile,
        setSelectedFile,
        semana,
        isLoading,
    } = useEvalModeSelect();

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [showTestingMenu, setShowTestingMenu] = useState(false);
    const [ignorarBloqueo, setIgnorarBloqueo] = useState(() => {
        return localStorage.getItem("semantika.testing_ignorar_bloqueo") === "true";
    });
    const [ignorarContinuar, setIgnorarContinuar] = useState(() => {
        return localStorage.getItem("semantika.testing_ignorar_continuar") === "true";
    });

    const toggleIgnorarBloqueo = () => {
        const newValue = !ignorarBloqueo;
        setIgnorarBloqueo(newValue);
        localStorage.setItem("semantika.testing_ignorar_bloqueo", String(newValue));
    };

    const toggleIgnorarContinuar = () => {
        const newValue = !ignorarContinuar;
        setIgnorarContinuar(newValue);
        localStorage.setItem("semantika.testing_ignorar_continuar", String(newValue));
    };

    // Buscar si hay alguna evaluación incompleta para este usuario, curso y semana
    const unfinishedKeys = Object.keys(localStorage).filter(key =>
        key.startsWith(`semantika.unfinished_attempt.${user.id}.${courseId}.${week}.`)
    );
    let unfinishedMode: string | null = null;
    if (!ignorarContinuar && unfinishedKeys.length > 0) {
        const parts = unfinishedKeys[0].split(".");
        unfinishedMode = parts[parts.length - 1];
    }

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
            <div className="flex items-center justify-between flex-wrap gap-4">
                <Link
                    to={`/app/curso/${courseId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al curso
                </Link>

                <div className="relative">
                    <button
                        onClick={() => setShowTestingMenu(!showTestingMenu)}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all shadow-soft cursor-pointer",
                            showTestingMenu
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold"
                                : "bg-card border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <FlaskConical className="w-4.5 h-4.5" />
                        Herramientas de Test
                    </button>

                    {showTestingMenu && (
                        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-3xl p-5 shadow-soft z-50 space-y-4 animate-fade-in text-left">
                            <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <FlaskConical className="w-4.5 h-4.5 text-amber-500" />
                                <h4 className="font-display font-bold text-sm">Pruebas & Configuración</h4>
                            </div>
                            
                            {/* Ignorar Bloqueo */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold block">Ignorar bloqueo</span>
                                    <span className="text-[10px] text-muted-foreground leading-normal block">
                                        Permite acceder a otros modos aun con exámenes activos.
                                    </span>
                                </div>
                                <button
                                    onClick={toggleIgnorarBloqueo}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer",
                                        ignorarBloqueo ? "bg-amber-500" : "bg-muted"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
                                            ignorarBloqueo ? "translate-x-6" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Ignorar Continuar */}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold block">Ignorar "continuar"</span>
                                    <span className="text-[10px] text-muted-foreground leading-normal block">
                                        Fuerza la generación de preguntas desde 0.
                                    </span>
                                </div>
                                <button
                                    onClick={toggleIgnorarContinuar}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer",
                                        ignorarContinuar ? "bg-amber-500" : "bg-muted"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
                                            ignorarContinuar ? "translate-x-6" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

                {materiales.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {materiales.map((mat: any, idx: number) =>
                            mat.mongoId ? (
                                <button
                                    key={mat.mongoId}
                                    onClick={() => mat.visible && setSelectedFile({ id: mat.mongoId, name: mat.nombreArchivo })}
                                    disabled={!mat.visible}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors",
                                        mat.visible
                                            ? "bg-secondary/50 hover:bg-secondary cursor-pointer"
                                            : "bg-secondary/20 text-muted-foreground/50 cursor-not-allowed"
                                    )}
                                    title={!mat.visible ? "Material oculto por el docente" : ""}
                                >
                                    {mat.visible ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
            ) : materiales.every((mat: any) => !mat.visible) ? (
                <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-2">
                    <Lock className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-semibold">
                        El material de esta semana se encuentra oculto.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        No puedes iniciar evaluaciones hasta que el docente lo habilite.
                    </p>
                </div>
            ) : (
                <>
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

                    <div className="grid sm:grid-cols-2 gap-5">
                        {evalModes.map((m, i) => {
                            const isUnfinished = m.id === unfinishedMode;
                            const isBlockedByOtherUnfinished = !ignorarBloqueo && unfinishedMode !== null && !isUnfinished;
                            const isDisabled = m.disabled || isBlockedByOtherUnfinished;

                            const cardContent = (
                                <div
                                    className={cn(
                                        "group block bg-card border rounded-3xl p-6 shadow-soft h-full transition-all",
                                        isDisabled
                                            ? "border-border opacity-50 grayscale cursor-not-allowed"
                                            : isUnfinished
                                                ? "border-amber-500/50 shadow-glow bg-amber-500/5 hover:-translate-y-1 cursor-pointer"
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
                                        {isBlockedByOtherUnfinished && (
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                Bloqueado
                                            </span>
                                        )}
                                        {isUnfinished && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-glow-sm">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Continuar
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
                                        {!isDisabled && (
                                            isUnfinished ? (
                                                <span className="text-sm font-bold text-amber-500 inline-flex items-center gap-1 group-hover:gap-2 transition-all animate-pulse">
                                                    Continuar examen <ArrowRight className="w-4 h-4" />
                                                </span>
                                            ) : (
                                                <span className="text-sm font-bold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Empezar <ArrowRight className="w-4 h-4" />
                                                </span>
                                            )
                                        )}
                                        {isBlockedByOtherUnfinished && (
                                            <span className="text-xs font-semibold text-muted-foreground/60">
                                                Prueba en curso pendiente
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
                                    {isDisabled ? (
                                        <div>{cardContent}</div>
                                    ) : (
                                        <Link
                                            to={`/app/curso/${courseId}/semana/${week}/evaluacion/${m.id}?cantidad=${cantidad}&mongoId=${materiales[0]?.mongoId ?? ""}&tema=${encodeURIComponent(
                                                (materiales[0]?.nombreArchivo || "")
                                                    .replace(/\.[^/.]+$/, "")
                                                    .replace(/[-_]/g, " ")
                                                    .trim()
                                            )}`}
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

            <UniversalPreviewModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                mongoId={selectedFile?.id || ""}
                fileName={selectedFile?.name || ""}
            />
        </div>
    );
}