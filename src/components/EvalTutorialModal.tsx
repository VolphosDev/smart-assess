import { useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, CheckCircle2, Lightbulb, ChevronRight, HelpCircle, Bot, Target, Zap, 
    BarChart4, ClipboardList, Search, Timer, Brain, Edit3, MessageSquare, 
    Pencil, Puzzle, Palette, Eye, Image, Star, Mic, RefreshCw, Video, 
    Volume2, Pause, TrendingUp, Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEvalModeIcon } from "@/lib/icon-mapper";

/* Mapeador de emojis de pasos a iconos Lucide */
const getStepIcon = (emoji: string, className = "w-5 h-5") => {
    const map: Record<string, React.ComponentType<any>> = {
        "🤖": Bot,
        "🎯": Target,
        "⚡": Zap,
        "📊": BarChart4,
        "📝": ClipboardList,
        "✅": CheckCircle2,
        "🔍": Search,
        "🔎": Search,
        "⏱️": Timer,
        "🧠": Brain,
        "✍️": Edit3,
        "💬": MessageSquare,
        "✏️": Pencil,
        "🧩": Puzzle,
        "🎨": Palette,
        "👁️": Eye,
        "🖼️": Image,
        "🌟": Star,
        "🎙️": Mic,
        "🔄": RefreshCw,
        "📽️": Video,
        "🔊": Volume2,
        "⏸️": Pause,
        "📋": ClipboardList,
        "📈": TrendingUp,
        "✨": Sparkles,
    };
    const IconComponent = map[emoji] || HelpCircle;
    return <IconComponent className={className} />;
};

/* ─── Datos por modo ─────────────────────────────── */
export interface TutorialStep {
    icon: string;
    title: string;
    body: string;
}

export interface ModeTutorial {
    accentClass: string;
    emoji: string;
    title: string;
    subtitle: string;
    tip: string;
    steps: TutorialStep[];
}

const tutorials: Record<string, ModeTutorial> = {
    OPCION_MULTIPLE: {
        accentClass: "from-indigo-500 to-violet-500",
        emoji: "☑️",
        title: "Opción Múltiple",
        subtitle: "Responde preguntas con 4 alternativas generadas a partir del material del curso.",
        tip: "Lee cada opción con calma antes de elegir. ¡Las distractoras están bien diseñadas!",
        steps: [
            { icon: "🤖", title: "Generación automática", body: "La IA analiza el material del docente y genera preguntas relevantes al instante." },
            { icon: "🎯", title: "Elige la correcta", body: "Cada pregunta tiene 4 alternativas; solo una es correcta. Selecciónala y avanza." },
            { icon: "⚡", title: "Retroalimentación inmediata", body: "Al responder verás si acertaste o fallaste, con una breve explicación del concepto." },
            { icon: "📊", title: "Puntaje final", body: "Al terminar obtendrás tu nota, el porcentaje de aciertos y el tiempo empleado." },
        ],
    },
    VERDADERO_FALSO: {
        accentClass: "from-emerald-500 to-teal-500",
        emoji: "⚖️",
        title: "Verdadero / Falso",
        subtitle: "Decide si cada enunciado sobre el tema es correcto o incorrecto.",
        tip: "¡Cuidado con las afirmaciones que son casi verdaderas! Los detalles importan.",
        steps: [
            { icon: "📝", title: "Enunciados del material", body: "Cada afirmación está basada directamente en el contenido de lectura de la semana." },
            { icon: "✅", title: "Verdadero o Falso", body: "Solo tienes dos opciones. Decide rápido, pero con seguridad." },
            { icon: "🔍", title: "Análisis de errores", body: "Si fallas, verás exactamente qué parte del enunciado era incorrecta." },
            { icon: "⏱️", title: "Ritmo rápido", body: "Este modo es el más corto. Ideal para repasar antes de un examen." },
        ],
    },
    ABIERTA: {
        accentClass: "from-rose-500 to-pink-500",
        emoji: "✍️",
        title: "Pregunta Abierta",
        subtitle: "Desarrolla tu respuesta con tus propias palabras. La IA evaluará tu comprensión profunda.",
        tip: "Sé específico y usa los conceptos clave del material. La extensión no reemplaza la precisión.",
        steps: [
            { icon: "🧠", title: "Comprensión profunda", body: "No se trata de memorizar; deberás explicar conceptos con coherencia y precisión." },
            { icon: "✍️", title: "Respuesta libre", body: "Escribe con tus propias palabras. No hay opciones guiadas, solo tu conocimiento." },
            { icon: "🤖", title: "Corrección por IA", body: "Un agente IA revisa tu respuesta, evalúa la cobertura conceptual y asigna una nota." },
            { icon: "💬", title: "Retroalimentación detallada", body: "Recibirás comentarios específicos: qué estuvo bien, qué faltó y cómo mejorar." },
        ],
    },
    DETECCION_ERRORES: {
        accentClass: "from-amber-500 to-orange-500",
        emoji: "🔍",
        title: "Detección de Errores",
        subtitle: "Lee un texto con enunciados incorrectos y corrígelos para demostrar tu dominio del tema.",
        tip: "No todos los enunciados tienen errores. Confirma bien antes de corregir.",
        steps: [
            { icon: "📄", title: "Texto con errores ocultos", body: "Se te presentará un párrafo sobre el tema que contiene afirmaciones incorrectas intencionadas." },
            { icon: "🔎", title: "Identifica los errores", body: "Localiza las frases o palabras que son incorrectas según el material de estudio." },
            { icon: "✏️", title: "Corrige y justifica", body: "Propón la versión correcta del enunciado y, si puedes, explica por qué es el error." },
            { icon: "🧩", title: "Fomenta el análisis crítico", body: "Este modo entrena tu pensamiento crítico: no basta saber lo correcto, debes detectar lo incorrecto." },
        ],
    },
    VISUAL_QUIZ: {
        accentClass: "from-fuchsia-500 to-purple-500",
        emoji: "🖼️",
        title: "Visual Quiz con IA",
        subtitle: "Responde preguntas relacionadas con imágenes y diagramas generados por inteligencia artificial.",
        tip: "Observa bien cada imagen antes de responder. Los detalles visuales son parte de la pregunta.",
        steps: [
            { icon: "🎨", title: "Imágenes generadas al instante", body: "La IA crea diagramas, esquemas o ilustraciones del concepto a evaluar en tiempo real." },
            { icon: "👁️", title: "Codificación dual", body: "Combinar texto e imagen mejora la retención. Leer y ver activa distintas áreas cognitivas." },
            { icon: "🖼️", title: "Preguntas visuales", body: "Cada pregunta está vinculada a una imagen específica. Analiza bien antes de elegir." },
            { icon: "🌟", title: "Ideal para conceptos complejos", body: "Procesos, ciclos, estructuras y relaciones se entienden mejor de forma visual." },
        ],
    },
    avatar: {
        accentClass: "from-sky-500 to-blue-600",
        emoji: "🤖",
        title: "Hablar con ARIA",
        subtitle: "Practica respondiendo en voz alta con ARIA, tu tutora IA conversacional.",
        tip: "Habla con claridad y menciona términos técnicos del material. ARIA los reconoce.",
        steps: [
            { icon: "🎙️", title: "Activa tu micrófono", body: "Necesitarás permitir el acceso al micrófono. Habla en un lugar sin mucho ruido de fondo." },
            { icon: "💬", title: "Conversación natural", body: "ARIA te hará preguntas del material. Responde como si explicaras a un compañero." },
            { icon: "⚡", title: "Retroalimentación en tiempo real", body: "Después de cada respuesta, ARIA te dirá si fue correcta y qué podrías agregar." },
            { icon: "🔄", title: "Ritmo adaptativo", body: "Si tu respuesta es incompleta, ARIA puede reformular la pregunta o darte una pista." },
        ],
    },
    video: {
        accentClass: "from-red-500 to-rose-600",
        emoji: "🎬",
        title: "Video Explicativo",
        subtitle: "Aprende con una videolección animada generada por IA, luego pon a prueba lo aprendido.",
        tip: "Toma notas mentales durante el video. Habrá un cuestionario al finalizar.",
        steps: [
            { icon: "📽️", title: "Diapositivas animadas", body: "La IA genera una presentación visual interactiva sobre el tema de la semana." },
            { icon: "🔊", title: "Narración por voz IA (TTS)", body: "Un narrador sintético explica cada concepto de forma clara y estructurada." },
            { icon: "⏸️", title: "Control total", body: "Puedes pausar, retroceder y avanzar el video a tu propio ritmo." },
            { icon: "📋", title: "Cuestionario final", body: "Al terminar el video, se activa un quiz de control para evaluar lo aprendido." },
        ],
    },
    adaptativa: {
        accentClass: "from-violet-500 to-indigo-600",
        emoji: "🧠",
        title: "Evaluación Adaptativa",
        subtitle: "El comité de agentes IA analiza tu desempeño y adapta las preguntas a tu nivel de conocimiento.",
        tip: "Responde honestamente. Cuanto más preciso seas, mejor será la recomendación del comité.",
        steps: [
            { icon: "🤖", title: "Comité de agentes IA", body: "Un grupo de agentes especializados analiza tus respuestas en paralelo para un diagnóstico preciso." },
            { icon: "📈", title: "Dificultad dinámica", body: "Las preguntas se ajustan según tus respuestas anteriores, siendo más fáciles o más difíciles." },
            { icon: "🎯", title: "Diagnóstico personalizado", body: "Al finalizar, obtendrás un perfil de conocimiento detallado por subtema." },
            { icon: "✨", title: "Recomendaciones a medida", body: "El comité te sugerirá los modos de evaluación que más beneficiarán tu aprendizaje." },
        ],
    },
};

/* ─── Componente ─────────────────────────────────── */
interface EvalTutorialModalProps {
    modeId: string;
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function EvalTutorialModal({ modeId, isOpen, onConfirm, onClose }: EvalTutorialModalProps) {
    const [step, setStep] = useState(0);
    const tutorial = tutorials[modeId];

    const handleClose = () => {
        setStep(0);
        onClose();
    };

    const handleConfirm = () => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user.id || "guest";
        localStorage.setItem(`semantika.skip_tutorial.${userId}.${modeId}`, "true");
        setStep(0);
        onConfirm();
    };

    if (!tutorial) {
        if (isOpen) onConfirm();
        return null;
    }

    const totalSteps = tutorial.steps.length;
    const currentStep = tutorial.steps[step];
    const isLastStep = step === totalSteps - 1;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xl"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 10 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        <div
                            className="pointer-events-auto w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Accent bar */}
                            <div className={cn("h-1.5 w-full bg-gradient-to-r", tutorial.accentClass)} />

                            <div className="p-6 space-y-5">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl grid place-items-center shadow-xs text-white bg-gradient-to-br shrink-0",
                                            tutorial.accentClass
                                        )}>
                                            {getEvalModeIcon(modeId, "w-5 h-5")}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                                                    Tutorial
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r text-white leading-none"
                                                    , tutorial.accentClass
                                                )}>
                                                    {step + 1}/{totalSteps}
                                                </span>
                                            </div>
                                            <h2 className="font-display font-extrabold text-xl leading-tight text-foreground">
                                                {tutorial.title}
                                            </h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="shrink-0 w-8 h-8 rounded-lg hover:bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        aria-label="Cerrar tutorial"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Subtitle — only on first step */}
                                {step === 0 && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-muted-foreground leading-relaxed -mt-1"
                                    >
                                        {tutorial.subtitle}
                                    </motion.p>
                                )}

                                {/* Step card */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -16 }}
                                        transition={{ duration: 0.18 }}
                                        className="bg-secondary/30 border border-border/60 rounded-xl p-5"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg grid place-items-center bg-background border border-border/80 text-foreground shadow-xs shrink-0 mt-0.5">
                                                {getStepIcon(currentStep.icon, "w-4 h-4")}
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <h3 className="font-display font-bold text-base text-foreground">
                                                    {currentStep.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {currentStep.body}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Step dots */}
                                <div className="flex items-center justify-center gap-1.5">
                                    {tutorial.steps.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setStep(i)}
                                            className={cn(
                                                "rounded-full transition-all duration-300 cursor-pointer",
                                                i === step
                                                    ? cn("w-6 h-2 bg-gradient-to-r", tutorial.accentClass)
                                                    : "w-2 h-2 bg-border hover:bg-muted-foreground/40"
                                            )}
                                            aria-label={`Paso ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                {/* Tip (last step only) */}
                                {isLastStep && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4"
                                    >
                                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                                            <span className="text-amber-600 dark:text-amber-400 font-black">Consejo: </span>
                                            {tutorial.tip}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <button
                                        onClick={handleConfirm}
                                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1.5 rounded-lg hover:bg-secondary/40"
                                    >
                                        Omitir tutorial
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {step > 0 && (
                                            <button
                                                onClick={() => setStep(s => s - 1)}
                                                className="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-card hover:bg-secondary/40 transition-all cursor-pointer"
                                            >
                                                Atrás
                                            </button>
                                        )}
                                        {isLastStep ? (
                                            <button
                                                onClick={handleConfirm}
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black text-white transition-all active:scale-95 cursor-pointer shadow-sm bg-gradient-to-r",
                                                    tutorial.accentClass
                                                )}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                ¡Comenzar!
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setStep(s => s + 1)}
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all active:scale-95 cursor-pointer bg-gradient-to-r hover:brightness-95",
                                                    tutorial.accentClass
                                                )}
                                            >
                                                Siguiente <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
