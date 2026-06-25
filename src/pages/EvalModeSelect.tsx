import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Loader2, Eye, Lock, FlaskConical, Brain, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import { useEvalModeSelect } from "../presentation/hooks/useEvalModeSelect";
import { getEvalModeIcon } from "@/lib/icon-mapper";

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

const isModeRecommended = (modeId: string, recs: string[]): boolean => {
    if (modeId === "adaptativa") return true; // Always unlocked
    const text = recs.join(" ").toLowerCase();
    switch (modeId) {
        case "avatar":
            return text.includes("avatar") || text.includes("aria") || text.includes("hablar") || text.includes("convers");
        case "video":
            return text.includes("video") || text.includes("explicativo") || text.includes("lección") || text.includes("narrac");
        case "OPCION_MULTIPLE":
            return text.includes("opción") || text.includes("alternativa") || text.includes("cuestionario") || text.includes("quiz") || text.includes("múltiple");
        case "VERDADERO_FALSO":
            return text.includes("verdadero") || text.includes("falso");
        case "ABIERTA":
            return text.includes("abierta") || text.includes("desarrollo") || text.includes("redacc");
        case "DETECCION_ERRORES":
            return text.includes("detección") || text.includes("error") || text.includes("correg");
        case "VISUAL_QUIZ":
            return text.includes("visual") || text.includes("imagen") || text.includes("diagrama") || text.includes("gráfico");
        default:
            return false;
    }
};

const iconColorMap = {
    primary: "bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
    lime: "bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
    coral: "bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
    muted: "bg-muted text-muted-foreground",
} as const;

export default function EvalModeSelect() {
    const {
        courseId,
        semanaId: week,
        cantidad,
        setCantidad,
        selectedFile,
        setSelectedFile,
        selectedSubtemas,
        setSelectedSubtemas,
        semana,
        isLoading,
    } = useEvalModeSelect();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const savedRecsRaw = localStorage.getItem(`semantika.recomendaciones.${user?.id}.${week}`);
    const completedAdaptive = !!savedRecsRaw;
    const recommendations = savedRecsRaw ? JSON.parse(savedRecsRaw) : [];

    const [showTestingMenu, setShowTestingMenu] = useState(false);
    const [ignorarBloqueo, setIgnorarBloqueo] = useState(() => {
        return localStorage.getItem("semantika.testing_ignorar_bloqueo") === "true";
    });
    const [ignorarContinuar, setIgnorarContinuar] = useState(() => {
        return localStorage.getItem("semantika.testing_ignorar_continuar") === "true";
    });
    const [ignorarRecomendados, setIgnorarRecomendados] = useState(() => {
        return localStorage.getItem("semantika.testing_ignorar_recomendados") === "true";
    });
    const [ignorarObligacionPracticas, setIgnorarObligacionPracticas] = useState(() => {
        return localStorage.getItem("semantika.testing_ignorar_obligacion_practicas") === "true";
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

    const toggleIgnorarRecomendados = () => {
        const newValue = !ignorarRecomendados;
        setIgnorarRecomendados(newValue);
        localStorage.setItem("semantika.testing_ignorar_recomendados", String(newValue));
    };

    const toggleIgnorarObligacionPracticas = () => {
        const newValue = !ignorarObligacionPracticas;
        setIgnorarObligacionPracticas(newValue);
        localStorage.setItem("semantika.testing_ignorar_obligacion_practicas", String(newValue));
    };

    // Calculate if all recommended modes are completed
    const recommendedModeIds = evalModes
        .filter(m => m.id !== "adaptativa" && isModeRecommended(m.id, recommendations))
        .map(m => m.id);

    const allRecommendedCompleted = recommendedModeIds.length > 0 && recommendedModeIds.every(modeId => {
        return localStorage.getItem(`semantika.completed_mode.${user.id}.${week}.${modeId}`) === "true";
    });

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
                            "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer",
                            showTestingMenu
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold"
                                : "bg-card border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <FlaskConical className="w-4.5 h-4.5" />
                        Herramientas de Test
                    </button>

                    {showTestingMenu && (
                        <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl p-5 shadow-sm z-50 space-y-4 animate-fade-in text-left">
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

                            {/* Ignorar Recomendados */}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold block">Ignorar recomendados</span>
                                    <span className="text-[10px] text-muted-foreground leading-normal block">
                                        Habilita todos los métodos sin importar la recomendación.
                                    </span>
                                </div>
                                <button
                                    onClick={toggleIgnorarRecomendados}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer",
                                        ignorarRecomendados ? "bg-amber-500" : "bg-muted"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
                                            ignorarRecomendados ? "translate-x-6" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Ignorar Obligación de Prácticas */}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold block">Ignorar obligación</span>
                                    <span className="text-[10px] text-muted-foreground leading-normal block">
                                        Permite volver a evaluar sin completar las recomendadas.
                                    </span>
                                </div>
                                <button
                                    onClick={toggleIgnorarObligacionPracticas}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer",
                                        ignorarObligacionPracticas ? "bg-amber-500" : "bg-muted"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200",
                                            ignorarObligacionPracticas ? "translate-x-6" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center max-w-2xl mx-auto space-y-2">
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                    {semana.numSem}
                </h1>
                <p className="text-muted-foreground text-sm">
                    Revisa los materiales asignados y elige el método de evaluación para poner a prueba tus conocimientos.
                </p>
            </div>

            {/* Tarjeta de Materiales de Estudio (Estética y Profesional) */}
            <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xs max-w-2xl mx-auto text-left relative overflow-hidden">
                {/* Decoración lateral discreta */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pl-2">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary/5 text-primary border border-primary/10 grid place-items-center shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Material de lectura</span>
                            <h3 className="font-semibold text-base truncate pr-4 text-foreground/90 mt-0.5" title={materiales.length > 0 ? (materiales[0].nombreArchivo || "Material") : "Material de la semana"}>
                                {materiales.length > 0
                                    ? materiales[0].nombreArchivo.replace(/-/g, ' ').replace(/\.pdf$/i, '')
                                    : "Material de la semana"}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> {semana.totalPreguntas > 0 ? `${semana.totalPreguntas} preguntas` : "Sin preguntas"}
                                </span>
                                {materiales.length > 0 && (
                                    <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                        Disponible
                                    </span>
                                )}
                            </div>

                            {/* Botón de lectura colocado aquí para garantizar máxima visibilidad */}
                            {materiales.length > 0 && (
                                <div className="pt-3 flex flex-wrap gap-2">
                                    {materiales.map((mat: any, idx: number) => {
                                        const fileId = mat.mongoId || mat.id;
                                        return (
                                            <button
                                                key={fileId || idx}
                                                onClick={() => mat.visible && setSelectedFile({ id: fileId || "", name: mat.nombreArchivo })}
                                                disabled={!mat.visible}
                                                className={cn(
                                                    "inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-xs border cursor-pointer active:scale-95",
                                                    mat.visible
                                                        ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/95 animate-pulse"
                                                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                                )}
                                                title={!mat.visible ? "Material oculto por el docente" : ""}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                {materiales.length === 1
                                                    ? "Leer documento"
                                                    : `Leer Doc ${idx + 1}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtemas UI */}
            {completedAdaptive && materiales.length > 0 && materiales[0]?.subtemas && materiales[0].subtemas.length > 0 && (
                <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xs max-w-2xl mx-auto text-left mt-4">
                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Selecciona los temas a evaluar:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {materiales[0].subtemas.map((subtema: string) => {
                            const isSelected = selectedSubtemas.includes(subtema);
                            return (
                                <button
                                    key={subtema}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedSubtemas(selectedSubtemas.filter(s => s !== subtema));
                                        } else {
                                            setSelectedSubtemas([...selectedSubtemas, subtema]);
                                        }
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none",
                                        isSelected 
                                            ? "bg-primary text-primary-foreground border-primary" 
                                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                    )}
                                >
                                    {subtema}
                                </button>
                            );
                        })}
                    </div>
                    {selectedSubtemas.length === 0 && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                            *Si no seleccionas ninguno, se evaluará sobre todo el material por defecto.
                        </p>
                    )}
                </div>
            )}

            {materiales.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
                    <p className="text-muted-foreground">
                        Tu profesor aún no ha cargado el material de esta semana.
                    </p>
                </div>
            ) : materiales.every((mat: any) => !mat.visible) ? (
                <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center flex flex-col items-center justify-center gap-2">
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
                    {/* Banner de Evaluación Recomendadora */}
                    <div className="mb-8">
                        {!completedAdaptive ? (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                                <div className="flex items-start gap-4 text-left">
                                    <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 grid place-items-center shadow-xs shrink-0 animate-pulse">
                                        <Brain className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-display font-black text-lg text-foreground">Evaluación Recomendadora (Pendiente)</h3>
                                        <p className="text-xs text-muted-foreground leading-normal max-w-xl font-semibold">
                                            Completa esta evaluación inicial para que el comité de agentes IA diagnostique tu perfil y te recomiende los mejores métodos de retroalimentación de la semana.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to={`/app/curso/${courseId}/semana/${week}/evaluacion/adaptativa`}
                                    className="px-6 py-3 rounded-lg bg-amber-500 text-white font-extrabold text-xs tracking-wider shadow-sm hover:bg-amber-600 transition-all shrink-0 active:scale-95 text-center w-full md:w-auto cursor-pointer"
                                >
                                    Realizar Diagnóstico
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                                <div className="flex items-start gap-4 text-left flex-1">
                                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary grid place-items-center shadow-xs shrink-0">
                                        <Brain className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-display font-black text-lg text-foreground">Evaluación Recomendadora</h3>
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                                                Nivel: {user.nivelConocimiento || "PRINCIPIANTE"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-normal max-w-xl font-semibold">
                                            ¡Diagnóstico completado! El comité de agentes te recomienda utilizar los métodos indicados abajo con la etiqueta <span className="text-emerald-600 dark:text-emerald-400 font-black">Recomendado</span>.
                                        </p>
                                        {recommendations.length > 0 && (
                                             <div className="bg-background/40 border border-border/60 rounded-lg p-4 mt-2 grid md:grid-cols-2 gap-4">
                                                 <div>
                                                     <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1.5">Recomendaciones del Comité:</h4>
                                                     <ul className="space-y-1">
                                                         {recommendations.slice(0, 3).map((rec: string, index: number) => (
                                                             <li key={index} className="text-[11px] text-muted-foreground font-bold list-disc list-inside leading-normal text-balance">
                                                                 {rec}
                                                             </li>
                                                         ))}
                                                     </ul>
                                                 </div>
                                                 <div className="border-t md:border-t-0 md:border-l border-border/60 pt-2.5 md:pt-0 md:pl-4">
                                                     <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1.5">Progreso de Prácticas Recomendadas:</h4>
                                                     <div className="space-y-1.5">
                                                         {evalModes.filter(m => m.id !== "adaptativa" && isModeRecommended(m.id, recommendations)).map((m) => {
                                                             const isDone = localStorage.getItem(`semantika.completed_mode.${user.id}.${week}.${m.id}`) === "true";
                                                             return (
                                                                 <div key={m.id} className="flex items-center gap-2 text-[11px] font-bold">
                                                                     <span className={cn(
                                                                         "w-4.5 h-4.5 rounded-full flex items-center justify-center border text-[10px] font-black shrink-0 transition-all",
                                                                         isDone ? "bg-emerald-500 border-emerald-600 text-white" : "bg-muted border-border text-muted-foreground"
                                                                     )}>
                                                                         {isDone ? "✓" : "○"}
                                                                     </span>
                                                                     <span className={cn(
                                                                         "leading-tight transition-all",
                                                                         isDone ? "text-muted-foreground line-through opacity-60" : "text-foreground"
                                                                     )}>
                                                                         {m.title}
                                                                     </span>
                                                                 </div>
                                                             );
                                                         })}
                                                     </div>
                                                 </div>
                                             </div>
                                        )}
                                     </div>
                                 </div>
                                 <div className="flex flex-col gap-1.5 shrink-0 w-full md:w-auto items-center justify-center">
                                     {(!allRecommendedCompleted && !ignorarObligacionPracticas) ? (
                                         <button
                                             disabled
                                             className="px-5 py-2.5 rounded-lg border border-border bg-secondary/20 text-muted-foreground font-bold text-xs tracking-wider transition-all text-center cursor-not-allowed opacity-50 flex items-center gap-1.5"
                                             title="Completa todas las prácticas recomendadas de la semana para desbloquear"
                                         >
                                             <Lock className="w-3.5 h-3.5" /> Volver a evaluar
                                         </button>
                                     ) : (
                                         <Link
                                             to={`/app/curso/${courseId}/semana/${week}/evaluacion/adaptativa`}
                                             className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-black text-xs tracking-wider transition-all text-center active:scale-95 cursor-pointer shadow-sm shadow-violet-500/20"
                                         >
                                             Volver a evaluar
                                         </Link>
                                     )}
                                     {!allRecommendedCompleted && !ignorarObligacionPracticas && (
                                         <span className="text-[10px] text-muted-foreground/80 font-bold max-w-[150px] text-center leading-normal">
                                             Completa las prácticas recomendadas para reevaluarte.
                                         </span>
                                     )}
                                 </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">
                            Cantidad de preguntas:
                        </span>
                        <div className="flex rounded-lg border border-border overflow-hidden">
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
                            const isRecommended = isModeRecommended(m.id, recommendations);
                            const isLockedByAdaptive = !ignorarBloqueo && !ignorarRecomendados && (
                                (!completedAdaptive && m.id !== "adaptativa") ||
                                (completedAdaptive && m.id !== "adaptativa" && !isRecommended)
                            );

                            const isDisabled = m.disabled || isBlockedByOtherUnfinished || isLockedByAdaptive;

                            const cardContent = (
                                <div
                                    className={cn(
                                        "group block bg-card border rounded-xl p-5 shadow-xs h-full transition-all relative overflow-hidden",
                                        isDisabled
                                            ? "border-border opacity-50 grayscale cursor-not-allowed bg-secondary/5"
                                            : isUnfinished
                                                ? "border-amber-500/50 shadow-sm bg-amber-500/5 hover:-translate-y-0.5 cursor-pointer"
                                                : m.id === "adaptativa" && !completedAdaptive
                                                    ? "border-primary/50 shadow-sm bg-primary/5 animate-pulse hover:-translate-y-0.5 cursor-pointer"
                                                    : "border-border hover:-translate-y-0.5 cursor-pointer"
                                    )}
                                >
                                    {completedAdaptive && isRecommended && m.id !== "adaptativa" && (
                                        <div className="absolute top-3 right-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            ✨ Recomendado
                                        </div>
                                    )}
                                    
                                    {isLockedByAdaptive && (
                                        <div className="absolute top-3 right-3 bg-destructive/15 border border-destructive/30 text-destructive text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            {completedAdaptive ? "🔒 No Recomendado" : "🔒 Completar Adaptativa"}
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "w-11 h-11 rounded-lg grid place-items-center shadow-xs mb-4",
                                            iconColorMap[m.color] || iconColorMap.primary
                                        )}
                                    >
                                        {getEvalModeIcon(m.id, "w-5 h-5")}
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
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-sm">
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
                                        {isLockedByAdaptive && (
                                            <span className="text-xs font-semibold text-muted-foreground/60">
                                                {completedAdaptive ? "No recomendado" : "Requiere adaptativa primero"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );

                            const getTargetUrl = () => {
                                let temaParam = selectedSubtemas.length > 0 
                                    ? selectedSubtemas.join(", ") 
                                    : (materiales[0]?.nombreArchivo || "")
                                        .replace(/\.[^/.]+$/, "")
                                        .replace(/[-_]/g, " ")
                                        .trim();

                                if (m.id === "adaptativa" || m.id === "avatar" || m.id === "video") {
                                    return `/app/curso/${courseId}/semana/${week}/evaluacion/${m.id}?mongoId=${materiales[0]?.mongoId || materiales[0]?.id || ""}&tema=${encodeURIComponent(temaParam)}`;
                                }
                                return `/app/curso/${courseId}/semana/${week}/evaluacion/${m.id}?cantidad=${cantidad}&mongoId=${materiales[0]?.mongoId || materiales[0]?.id || ""}&tema=${encodeURIComponent(temaParam)}`;
                            };

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
                                        <Link to={getTargetUrl()}>
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