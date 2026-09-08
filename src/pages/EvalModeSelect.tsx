import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Loader2, Eye, Lock, FlaskConical, Brain, BookOpen, Sparkles, Check, Flame, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import { EvalTutorialModal } from "@/components/EvalTutorialModal";
import { useEvalModeSelect } from "@/hooks/useEvalModeSelect";
import { getEvalModeIcon } from "@/lib/icon-mapper";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { rendimientoApi } from "@/api";
import { adaptiveApi } from "@/api/courses";
import MapaCalorTemas from "@/components/MapaCalorTemas";
import type { GrupoCursoConocimiento } from "@/components/ConceptHeatMap";

/**
 * Herramientas de Test: visibles SOLO en desarrollo.
 *
 * Antes esto era `true` fijo, con un comentario recordando cambiarlo a mano antes de
 * publicar. Ese menú deja saltarse el bloqueo de exámenes, ignorar las prácticas obligatorias
 * y forzar la regeneración de preguntas: si llega a producción, cualquier alumno lo abre y se
 * salta las reglas del estudio — y con ello se cae la validez de los datos de la tesis.
 *
 * Depender de acordarse en el momento justo es la peor garantía posible, así que ahora lo
 * decide el modo de compilación: `npm run dev` lo enseña, `npm run build` lo elimina del
 * bundle. No hay nada que recordar.
 */
const SHOW_TESTING_TOOLS = import.meta.env.DEV;

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

/**
 * ¿Recomienda el comité este formato?
 *
 * Ahora se compara contra los CÓDIGOS que devuelve el comité (`modosRecomendados`). El
 * escaneo de palabras que había antes se conserva solo como respaldo para las deliberaciones
 * guardadas ANTES de este cambio, que no tienen códigos.
 *
 * Por qué se cambió: buscar "video" o "redacc" dentro de la prosa hacía que la recomendación
 * dependiera de qué palabras eligiera el modelo. "Que escriba un ensayo" no activaba ABIERTA
 * porque el buscador esperaba "redacc", y el alumno se quedaba sin recomendación sin que
 * nadie lo notara.
 */
const isModeRecommended = (modeId: string, recs: string[], codigos?: string[]): boolean => {
    if (modeId === "adaptativa") return true; // Always unlocked

    if (codigos && codigos.length > 0) {
        return codigos.includes(modeId.toUpperCase());
    }

    // ── Respaldo heredado: solo para debates sin códigos ──────────────────
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
    const navigate = useNavigate();
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

    const [pendingTutorial, setPendingTutorial] = useState<{ modeId: string; url: string } | null>(null);

    /**
     * Las opciones que ahora mismo no están disponibles se ocultan tras un botón, en vez
     * de mostrarse como seis tarjetas grises con "BLOQUEADO" y "NO RECOMENDADO".
     * Un alumno de secundaria lee esa pared de gris como un castigo, no como una guía —
     * y además vuelve imposible ver de un vistazo qué SÍ puede hacer.
     */
    const [mostrarNoDisponibles, setMostrarNoDisponibles] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isStudent = user?.role?.toLowerCase() === "student";

    const semanaTitulo = semana?.nombreTema || semana?.numSem || "esta semana";

    // Mapa de calor de ESTA semana. Se pide el mapa completo del alumno (ya está en caché de
    // TanStack Query si viene del Mapa de Conocimiento) y el componente filtra por semana.
    const { data: mapaConocimiento = [] } = useQuery<GrupoCursoConocimiento[]>({
        queryKey: ["mapa-conocimiento", user?.id],
        queryFn: () => rendimientoApi.mapaConocimiento(user.id),
        enabled: !!user?.id && isStudent,
    });
    /**
     * Si la evaluación recomendadora ya está hecha, lo dice el SERVIDOR.
     *
     * Antes se leía de localStorage, que vive en un navegador concreto: al entrar desde el
     * móvil —o tras limpiar el navegador— reaparecía como "Pendiente" algo ya hecho y
     * guardado en la base de datos. El estado de un alumno no puede depender del dispositivo
     * desde el que se conecte.
     */
    const { data: estadoSemana } = useQuery({
        queryKey: ["estado-semana", user?.id, week],
        queryFn: () => adaptiveApi.estadoSemana(week),
        enabled: !!user?.id && isStudent && !!week,
    });

    // localStorage queda solo como respaldo mientras la consulta viaja, para que la tarjeta
    // no parpadee de "Pendiente" a "hecha" en cada carga.
    const savedRecsRaw = localStorage.getItem(`semantika.recomendaciones.${user?.id}.${week}`);
    const completedAdaptive = estadoSemana
        ? estadoSemana.recomendadoraCompletada
        : !!savedRecsRaw;
    const modosRecomendados = estadoSemana?.modosRecomendados ?? [];
    const deliberacionReal = estadoSemana?.deliberacionReal ?? true;
    const recommendations = estadoSemana?.recomendadoraCompletada
        ? (estadoSemana.recomendaciones ?? [])
        : (savedRecsRaw ? JSON.parse(savedRecsRaw) : []);

    const [showTestingMenu, setShowTestingMenu] = useState(false);
    const [ignorarBloqueo, setIgnorarBloqueo] = useState(() => {
        return SHOW_TESTING_TOOLS && localStorage.getItem("semantika.testing_ignorar_bloqueo") === "true";
    });
    const [ignorarContinuar, setIgnorarContinuar] = useState(() => {
        return SHOW_TESTING_TOOLS && localStorage.getItem("semantika.testing_ignorar_continuar") === "true";
    });
    const [ignorarRecomendados, setIgnorarRecomendados] = useState(() => {
        return SHOW_TESTING_TOOLS && localStorage.getItem("semantika.testing_ignorar_recomendados") === "true";
    });
    const [ignorarObligacionPracticas, setIgnorarObligacionPracticas] = useState(() => {
        return SHOW_TESTING_TOOLS && localStorage.getItem("semantika.testing_ignorar_obligacion_practicas") === "true";
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
        .filter(m => m.id !== "adaptativa" && isModeRecommended(m.id, recommendations, modosRecomendados))
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
    const visibleMateriales = materiales.filter((m: any) => m.visible);
    const allSubtemas = visibleMateriales.flatMap((m: any) => m.subtemas || []);


    /** Un modo no está disponible ahora mismo (sea por bloqueo, por recomendación o porque aún no existe). */
    const esModoNoDisponible = (m: any) => {
        const isUnfinished = m.id === unfinishedMode;
        const isBlockedByOtherUnfinished = !ignorarBloqueo && unfinishedMode !== null && !isUnfinished;
        const isRecommended = isModeRecommended(m.id, recommendations, modosRecomendados);
        // Solo se exige la evaluacion de ubicacion inicial. Una vez hecha, TODOS los modos
        // quedan disponibles: los recomendados se destacan y dan puntos extra, pero no se
        // bloquea ninguno.
        //
        // Por que se quito el bloqueo: la motivacion intrinseca se sostiene sobre la
        // autonomia, y una pantalla con seis tarjetas apagadas y sin explicacion la elimina.
        // Convertir la restriccion en incentivo conserva la guia del sistema y devuelve la
        // decision al alumno. Ademas, si puede desviarse, se puede MEDIR cuanto sigue la
        // recomendacion; si se le obliga, ese dato no existe.
        const faltaUbicacion = !ignorarBloqueo && !completedAdaptive && m.id !== "adaptativa";
        return m.disabled || isBlockedByOtherUnfinished || faltaUbicacion;
    };

    /** Renderiza una tarjeta de modo de evaluación. */
    const renderModo = (m: any, i: number) => {
const isUnfinished = m.id === unfinishedMode;
                            const isBlockedByOtherUnfinished = !ignorarBloqueo && unfinishedMode !== null && !isUnfinished;
                            const isRecommended = isModeRecommended(m.id, recommendations, modosRecomendados);
                            // Ver la nota en esModoNoDisponible: solo bloquea la ubicacion inicial.
                            const faltaUbicacion = !ignorarBloqueo && !completedAdaptive && m.id !== "adaptativa";

                            const isDisabled = m.disabled || isBlockedByOtherUnfinished || faltaUbicacion;

                            const cardContent = (
                                <div
                                    className={cn(
                                        "group block bg-card border rounded-xl p-5 shadow-xs h-full transition-all relative overflow-hidden",
                                        isDisabled
                                            ? "border-border/60 opacity-70 cursor-not-allowed bg-muted/20"
                                            : isUnfinished
                                                ? "border-amber-500/50 shadow-sm bg-amber-500/5 hover:-translate-y-0.5 cursor-pointer"
                                                : m.id === "adaptativa" && !completedAdaptive
                                                    ? "border-primary/50 shadow-sm bg-primary/5 animate-pulse hover:-translate-y-0.5 cursor-pointer"
                                                    : "border-border hover:-translate-y-0.5 cursor-pointer"
                                    )}
                                >
                                    {/*
                                        UNA sola insignia por tarjeta, con prioridad explícita.

                                        Antes había tres bloques independientes y dos de ellos se
                                        activaban con la misma condición (`isRecommended`), los dos
                                        en `absolute top-3 right-3`: se dibujaban uno encima del
                                        otro y se leía "RECOMENDADAECOMENDADOS". Cada bloque era
                                        correcto por separado; el fallo estaba en que nadie
                                        decidía cuál gana cuando coinciden.

                                        Con un if/else esa colisión no puede volver a ocurrir: hay
                                        una sola ranura y siempre la ocupa exactamente uno.
                                    */}
                                    {faltaUbicacion ? (
                                        <div className="absolute top-3 right-3 bg-destructive/15 border border-destructive/30 text-destructive text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            Empieza por la adaptativa
                                        </div>
                                    ) : isRecommended && m.id !== "adaptativa" ? (
                                        /* Se destaca como incentivo, no como restricción: no estar
                                           recomendada ya no bloquea la tarjeta, solo deja de sumar. */
                                        <div className="absolute top-3 right-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            ✨ Recomendada · +puntos
                                        </div>
                                    ) : null}

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
                                                En espera
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
                                                Termina la que dejaste a medias
                                            </span>
                                        )}
                                        {faltaUbicacion && (
                                            <span className="text-xs font-semibold text-muted-foreground/60">
                                                Primero la evaluación adaptativa
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );

                            const getTargetUrl = () => {
                                let temaParam = selectedSubtemas.length > 0 
                                    ? selectedSubtemas.join(", ") 
                                    : (visibleMateriales.length > 0
                                        ? visibleMateriales.map((m: any) => (m.nombreArchivo || "").replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim()).join(", ")
                                        : "");

                                const targetMat = visibleMateriales[0] || materiales[0];
                                const mongoIdParam = targetMat?.mongoId || targetMat?.id || "";

                                if (m.id === "adaptativa" || m.id === "avatar" || m.id === "video") {
                                    return `/app/curso/${courseId}/semana/${week}/evaluacion/${m.id}?mongoId=${mongoIdParam}&tema=${encodeURIComponent(temaParam)}`;
                                }
                                return `/app/curso/${courseId}/semana/${week}/evaluacion/${m.id}?cantidad=${cantidad}&mongoId=${mongoIdParam}&tema=${encodeURIComponent(temaParam)}`;
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
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const url = getTargetUrl();
                                                const userId = user.id || "guest";
                                                const shouldSkip = localStorage.getItem(`semantika.skip_tutorial.${userId}.${m.id}`) === "true";
                                                if (shouldSkip) {
                                                    navigate(url);
                                                } else {
                                                    setPendingTutorial({ modeId: m.id, url });
                                                }
                                            }}
                                        >
                                            {cardContent}
                                        </div>
                                    )}
                                </motion.div>
                            );
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <Link
                    to={`/app/curso/${courseId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al curso
                </Link>

                {/* Acceso al mapa de calor de ESTA semana, entre los dos extremos de la
                    cabecera. `min-w-0` en el contenedor y `truncate` en el texto son lo que
                    hace que un titulo largo se corte con puntos suspensivos en vez de empujar
                    el boton de la derecha fuera de la pantalla en un movil. */}
                {isStudent && (
                    <a
                        href="#mapa-calor-semana"
                        title={`Ver cómo llevas los temas de ${semanaTitulo}`}
                        className="hidden sm:flex items-center gap-2 min-w-0 max-w-[46%] mx-3 pl-3 pr-2.5 py-2 rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-rose-500/40 transition-colors group"
                    >
                        <span className="w-6 h-6 rounded-lg bg-rose-500/10 grid place-items-center shrink-0">
                            <Flame className="w-3.5 h-3.5 text-rose-500" />
                        </span>
                        <span className="text-sm font-semibold truncate">
                            Mapa de calor de {semanaTitulo}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground group-hover:translate-y-0.5 transition-transform" />
                    </a>
                )}

                {SHOW_TESTING_TOOLS && (
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

                                {/* Restablecer tutoriales */}
                                <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            const userId = user.id || "guest";
                                            Object.keys(localStorage).forEach(key => {
                                                if (key.startsWith(`semantika.skip_tutorial.${userId}.`)) {
                                                    localStorage.removeItem(key);
                                                }
                                            });
                                            // El alert() nativo bloquea la página y muestra
                                            // "localhost:8081 dice", que rompe la ilusión de
                                            // producto. sonner ya está montado en App.tsx.
                                            toast.success("Se restablecieron todos los tutoriales.");
                                        }}
                                        className="w-full text-center py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Restablecer tutoriales
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/*
                Cabecera como banda de color, igual que la vista de curso.

                Antes era un título centrado suelto sobre el fondo de la página: correcto, pero
                sin nada que anclara la vista ni la distinguiera de cualquier otra pantalla. Al
                darle el mismo tratamiento que ya tiene el curso, el alumno reconoce dónde está
                sin leer, y la aplicación deja de parecer una sucesión de listas.

                Los colores van en blanco explícito y no con tokens de tema: este fondo es
                siempre oscuro, así que `text-muted-foreground` — que sigue al tema claro/oscuro
                del sistema — se volvería ilegible en modo claro.
            */}
            <section className="relative overflow-hidden rounded-2xl bg-primary-gradient p-6 sm:p-8">
                <div className="absolute -right-8 -top-10 opacity-[0.12] pointer-events-none select-none">
                    <BookOpen className="w-48 h-48" />
                </div>

                <div className="relative">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/15 text-[11px] font-bold uppercase tracking-wider">
                        {semana.numSem}
                    </span>

                    {/* El nombre del tema lo define el docente (SemanaDTO.nombreTema). Si aún
                        no lo puso, se cae al ordinal "Semana N" para no dejar esto vacío. */}
                    <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mt-3 max-w-2xl">
                        {semana.nombreTema || semana.numSem}
                    </h1>
                    {/* Blanco puro, no `text-white/75`. Sobre --primary en modo oscuro
                        (250 85% 65%) hasta el blanco puro se queda en 4.70:1, asi que
                        cualquier transparencia baja de 4.5:1 y este texto de 14px dejaria de
                        cumplir AA. La jerarquia la da el tamano, no la opacidad. */}
                    <p className="text-sm text-white mt-2 max-w-xl">
                        Son tres pasos: lee el material, elige el tema y decide cómo quieres
                        practicar.
                    </p>

                    {/* Los tres pasos, navegables. NO indican cuáles llevas hechos: la
                        aplicación no sabe si de verdad leíste el material, y pintar un paso
                        como completado sin saberlo sería mentirle al alumno en la cara. */}
                    <nav className="flex flex-wrap items-center gap-1.5 mt-5">
                        {[
                            { n: 1, texto: "Lee el material", ancla: "#paso-material", activo: true },
                            {
                                n: 2,
                                texto: "Elige el tema",
                                ancla: "#paso-elegir-tema",
                                activo: completedAdaptive && allSubtemas.length > 0,
                            },
                            { n: 3, texto: "Practica", ancla: "#paso-elegir-metodo", activo: true },
                        ].map((paso, i, todos) => (
                            <div key={paso.n} className="flex items-center gap-1.5">
                                {paso.activo ? (
                                    <a
                                        href={paso.ancla}
                                        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-white/25 grid place-items-center text-[11px] font-black">
                                            {paso.n}
                                        </span>
                                        <span className="text-xs font-bold">{paso.texto}</span>
                                    </a>
                                ) : (
                                    /* Un paso que todavía no existe en la página se muestra
                                       apagado en vez de ocultarse: si desapareciera, el alumno
                                       vería "1 y 3" y creería haberse saltado algo. */
                                    <span
                                        title="Disponible después del diagnóstico"
                                        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-white/5 text-white/70"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-[11px] font-black">
                                            {paso.n}
                                        </span>
                                        <span className="text-xs font-bold">{paso.texto}</span>
                                    </span>
                                )}
                                {i < todos.length - 1 && (
                                    <span className="w-3 h-px bg-white/25 hidden sm:block" />
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </section>

            {/* Tarjeta de Materiales de Estudio (Estética y Profesional) */}
            <div id="paso-material" className="bg-card border border-border/80 rounded-xl p-6 shadow-xs text-left relative overflow-hidden scroll-mt-24">
                {/* Decoración lateral discreta */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pl-2">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary/5 text-primary border border-primary/10 grid place-items-center shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="inline-flex items-center gap-2 text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                                <span className="w-5 h-5 rounded-md bg-primary text-primary-foreground grid place-items-center text-[10px] font-black">
                                    1
                                </span>
                                Primero, lee el material
                            </span>
                            <h3 className="font-semibold text-base truncate pr-4 text-foreground/90 mt-0.5" title={visibleMateriales.map((m: any) => m.nombreArchivo || "").join("\n")}>
                                {visibleMateriales.length > 0
                                    ? (visibleMateriales.length === 1
                                        ? visibleMateriales[0].nombreArchivo.replace(/-/g, ' ').replace(/\.pdf$/i, '').replace(/\.docx$/i, '')
                                        : `${visibleMateriales[0].nombreArchivo.replace(/-/g, ' ').replace(/\.pdf$/i, '').replace(/\.docx$/i, '')} y ${visibleMateriales.length - 1} más`)
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
                                                    // Objetivo táctil de 44px y sin animate-pulse: el parpadeo
                                                    // constante distrae más de lo que llama la atención.
                                                    "inline-flex items-center justify-center gap-2 px-4 min-h-[44px] text-sm font-bold rounded-lg transition-all shadow-xs border cursor-pointer active:scale-95 max-w-full",
                                                    mat.visible
                                                        ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/95"
                                                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                                )}
                                                title={!mat.visible ? "Material oculto por el docente" : mat.nombreArchivo}
                                            >
                                                <Eye className="w-4 h-4 shrink-0" />
                                                {/* "Leer Doc 2" no le dice nada al alumno: no sabe qué
                                                    documento es el 2. Ahora se lee el nombre real. */}
                                                <span className="truncate">
                                                    {materiales.length === 1
                                                        ? "Abrir y leer el material"
                                                        : `Leer: ${(mat.nombreArchivo || `Documento ${idx + 1}`)
                                                            .replace(/\.(pdf|docx?|pptx?)$/i, "")
                                                            .replace(/[-_]/g, " ")}`}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paso 2 — Subtemas.
                En las pruebas con alumnos, nadie descubrió que estos chips se podían tocar:
                parecían etiquetas decorativas. Ahora cada uno lleva una casilla visible, que
                es la señal universal de "esto se marca", y el encabezado dice explícitamente
                que es opcional para que nadie se quede atascado creyendo que debe elegir. */}
            {completedAdaptive && allSubtemas.length > 0 && (
                <div id="paso-elegir-tema" className="bg-card border border-border/80 rounded-xl p-5 sm:p-6 shadow-xs text-left mt-4 scroll-mt-24">
                    <div className="flex items-start gap-3 mb-4">
                        <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground grid place-items-center text-xs font-black shrink-0">
                            2
                        </span>
                        <div>
                            <h4 className="text-sm font-bold text-foreground leading-tight">
                                ¿Sobre qué tema quieres que te pregunte?
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Toca los que quieras practicar. Si no eliges ninguno, entran todos.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {allSubtemas.map((subtema: string) => {
                            const isSelected = selectedSubtemas.includes(subtema);
                            return (
                                <button
                                    key={subtema}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedSubtemas(selectedSubtemas.filter(s => s !== subtema));
                                        } else {
                                            setSelectedSubtemas([...selectedSubtemas, subtema]);
                                        }
                                    }}
                                    className={cn(
                                        "inline-flex items-center gap-2 pl-2.5 pr-3.5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all cursor-pointer select-none min-h-[44px]",
                                        isSelected
                                            ? "bg-primary/10 text-primary border-primary"
                                            : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted/40"
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "w-5 h-5 rounded-md border-2 grid place-items-center shrink-0 transition-colors",
                                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"
                                        )}
                                    >
                                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                                    </span>
                                    {subtema}
                                </button>
                            );
                        })}
                    </div>

                    {selectedSubtemas.length > 0 && (
                        <p className="text-xs text-primary font-semibold mt-3">
                            {selectedSubtemas.length} {selectedSubtemas.length === 1 ? "tema elegido" : "temas elegidos"}
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
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                                <div className="flex items-start gap-4 text-left">
                                    <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 text-primary dark:text-primary-glow grid place-items-center shadow-xs shrink-0 animate-pulse">
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
                                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-extrabold text-xs tracking-wider shadow-sm hover:bg-primary/90 transition-all shrink-0 active:scale-95 text-center w-full md:w-auto cursor-pointer"
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
                                                     {/* El rótulo cambia si la deliberación no llegó a ocurrir.
                                                         Llamar "Recomendaciones del Comité" a un texto de
                                                         emergencia hacía que dos frases fijas, idénticas para
                                                         todos los alumnos, pasaran por una decisión personalizada. */}
                                                     <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1.5">
                                                         {deliberacionReal
                                                             ? "Recomendaciones del Comité:"
                                                             : "Sugerencia general (el comité no pudo revisar tu evaluación):"}
                                                     </h4>
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
                                                         {evalModes.filter(m => m.id !== "adaptativa" && isModeRecommended(m.id, recommendations, modosRecomendados)).map((m) => {
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

                    {/* Cómo lleva el alumno los temas de ESTA semana, justo antes de elegir
                        cómo practicar: es el momento en que la información le sirve para
                        decidir, y no una pantalla aparte a la que hay que ir a buscarla. */}
                    {isStudent && (
                        <div id="mapa-calor-semana" className="pt-2 scroll-mt-24">
                            <div className="flex items-start gap-3 mb-3">
                                <span className="w-9 h-9 rounded-xl bg-rose-500/10 grid place-items-center shrink-0">
                                    <Flame className="w-4.5 h-4.5 text-rose-500" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="font-display font-bold text-lg leading-tight">
                                        Cómo llevas esta semana
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Solo los temas de {semanaTitulo}. Lo azul ya lo dominas; lo rojo
                                        conviene repasarlo.
                                    </p>
                                </div>
                            </div>
                            <MapaCalorTemas cursos={mapaConocimiento} soloSemanaId={week} compacto />
                            {/* La vista completa sigue estando, pero como salida explicita y
                                secundaria: desde aqui el alumno decide si quiere comparar con
                                el resto del curso. Antes esto era el destino del boton de
                                arriba, que es lo que hacia parecer que la semana no tenia
                                mapa propio. */}
                            <Link
                                to="/app/mapa-conocimiento"
                                className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                                Ver el mapa completo del curso
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}

                    {/* Paso 3 — el que los alumnos no encontraban porque quedaba bajo el fold.
                        Ahora lleva número, ancla y un encabezado propio. */}
                    {/*
                        Sin material no hay nada sobre lo que evaluar.

                        Las preguntas se generan a partir del contenido que subió el profesor.
                        Si no hay, el servidor se niega — y con razón: buscar sin material
                        producía evaluaciones armadas con fragmentos de OTRA semana, que
                        parecían correctas y entraban en el historial del alumno como suyas.

                        Aquí se corta antes, para que el alumno lea una explicación en vez de
                        chocar con un error después de elegir un método.
                    */}
                    {visibleMateriales.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-2">
                            <Lock className="w-6 h-6 mx-auto text-muted-foreground" />
                            <h3 className="font-display font-bold">
                                Todavía no puedes practicar esta semana
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Las preguntas se crean a partir del material de tu profesor, y esta
                                semana aún no tiene ninguno disponible. Vuelve cuando lo suba.
                            </p>
                        </div>
                    )}

                    <div
                        id="paso-elegir-metodo"
                        className={cn(
                            "flex items-start gap-3 pt-2 scroll-mt-24",
                            visibleMateriales.length === 0 && "hidden"
                        )}
                    >
                        <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground grid place-items-center text-xs font-black shrink-0">
                            3
                        </span>
                        <div>
                            <h3 className="font-display font-bold text-lg leading-tight">
                                Elige cómo quieres practicar
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Todas evalúan lo mismo; cambia la forma. Elige la que más te guste.
                            </p>
                        </div>
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

                    {/* Aviso único cuando hay algo a medio terminar, en vez de bloquear
                        visualmente todo lo demás sin explicar por qué. */}
                    {unfinishedMode !== null && !ignorarBloqueo && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
                            <span className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0 mt-0.5">
                                <Clock className="w-5 h-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-amber-900 dark:text-amber-200">
                                    Tienes una prueba a medio hacer
                                </p>
                                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                                    Termínala y las demás formas de practicar se desbloquean solas.
                                    No pierdes nada de lo que ya respondiste.
                                </p>
                            </div>
                        </div>
                    )}

                    {(() => {
                        // Se separan en dos grupos para que el alumno vea primero — y sin
                        // ruido — aquello en lo que puede hacer clic ahora mismo.
                        const disponibles = evalModes.filter((m) => !esModoNoDisponible(m));
                        const noDisponibles = evalModes.filter((m) => esModoNoDisponible(m));
                        return (
                            <>
                                <div className="grid sm:grid-cols-2 gap-5">
                                    {disponibles.map((m, i) => renderModo(m, i))}
                                </div>

                                {noDisponibles.length > 0 && (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setMostrarNoDisponibles((v) => !v)}
                                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                                        >
                                            {mostrarNoDisponibles ? "Ocultar" : "Ver"} las otras {noDisponibles.length} formas de practicar
                                            <ArrowRight className={cn("w-3.5 h-3.5 transition-transform", mostrarNoDisponibles && "rotate-90")} />
                                        </button>
                                        {mostrarNoDisponibles && (
                                            <div className="grid sm:grid-cols-2 gap-5 mt-4">
                                                {noDisponibles.map((m, i) => renderModo(m, i))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}

                </>
            )}

            <UniversalPreviewModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                mongoId={selectedFile?.id || ""}
                fileName={selectedFile?.name || ""}
            />

            {/* Modal de tutorial previo a la evaluación */}
            <EvalTutorialModal
                modeId={pendingTutorial?.modeId ?? ""}
                isOpen={!!pendingTutorial}
                onConfirm={() => {
                    if (pendingTutorial) {
                        navigate(pendingTutorial.url);
                    }
                    setPendingTutorial(null);
                }}
                onClose={() => setPendingTutorial(null)}
            />
        </div>
    );
}