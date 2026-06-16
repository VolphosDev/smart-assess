import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Pregunta {
    enunciado: string;
    opciones_o_respuesta: string[] | string;
    justificacion_pregunta: string;
    respuesta_correcta?: string;
    base64_imagen?: string;
    prompt_imagen?: string;
}

interface VisualQuizProps {
    pregunta: Pregunta;
    index: number;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    resultado?: any;
    base64Imagen?: string;
}

// Sophisticated custom colors (A: Blue, B: Violet, C: Pink, D: Amber) avoiding Kahoot branding
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

export default function VisualQuiz({
    pregunta,
    index,
    valor,
    onChange,
    disabled,
    resultado,
    base64Imagen,
}: VisualQuizProps) {
    const opcionesArray = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : (pregunta.opciones_o_respuesta || "").split(" | ");

    const tieneResultado = !!resultado;
    const respuestaCorrecta = pregunta.respuesta_correcta || "";
    
    // Choose which image source to display: preloaded state from parent or initial prop
    const imageToShow = base64Imagen || pregunta.base64_imagen;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-stretch space-y-6 md:space-y-8"
        >
            {/* Header / Enunciado */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-600/10 text-coral-600 text-xs font-bold uppercase tracking-wider select-none">
                    🖼️ Pregunta {index + 1}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-foreground font-display max-w-3xl mx-auto leading-relaxed text-balance">
                    {pregunta.enunciado}
                </h2>
            </div>

            {/* Ilustración de IA Centrada */}
            {(pregunta.prompt_imagen || imageToShow) && (
                <div className="flex justify-center max-w-xl mx-auto w-full px-2">
                    <div className="relative rounded-3xl overflow-hidden border border-border/85 bg-gradient-to-br from-card to-muted/20 p-3 shadow-md hover:shadow-lg transition-all duration-300 w-full flex items-center justify-center min-h-[220px] md:min-h-[280px]">
                        <span className="absolute top-3.5 left-3.5 bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm z-10 select-none">
                            Ilustración del Quiz
                        </span>
                        {imageToShow ? (
                            <img
                                src={`data:image/png;base64,${imageToShow}`}
                                alt="Pregunta visual"
                                className="w-full h-auto object-contain max-h-[260px] md:max-h-[340px] rounded-2xl transition-transform duration-300"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 w-full h-[220px] md:h-[280px]">
                                <Loader2 className="w-9 h-9 animate-spin text-primary" />
                                <div className="space-y-1">
                                    <h4 className="font-display font-black text-sm text-foreground">El Tutor IA está diseñando la ilustración...</h4>
                                    <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed mx-auto">Generando elementos explicativos para esta pregunta.</p>
                                </div>
                                <div className="w-24 bg-secondary/50 rounded-full h-1 overflow-hidden relative border border-border/10">
                                    <div className="bg-primary h-1 rounded-full animate-pulse w-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Alternativas en Rejilla 2x2 */}
            <div className="w-full max-w-3xl mx-auto">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-0 m-0">
                    {opcionesArray.map((op, i) => {
                        const esSeleccionado = valor === op;
                        const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
                        
                        const hasLetterPrefix = /^[A-D]\)/.test(op.trim());
                        const cleanText = hasLetterPrefix ? op.replace(/^[A-D]\)\s*/, "") : op;

                        const colors = optionColors[i % 4];
                        const letter = String.fromCharCode(65 + i);

                        let cardStyle = cn(
                            "border bg-card",
                            disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200",
                            colors.bg
                        );
                        let badgeStyle = colors.badge;
                        let rightIcon = null;

                        if (tieneResultado) {
                            if (esCorrecto) {
                                cardStyle = "border-emerald-500/80 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]";
                                badgeStyle = "bg-emerald-500 text-white font-bold border-transparent";
                                rightIcon = <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 shrink-0" />;
                            } else if (esSeleccionado && !esCorrecto) {
                                cardStyle = "border-destructive/80 bg-destructive/5 text-destructive dark:bg-red-950/20 dark:text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                                badgeStyle = "bg-destructive text-white font-bold border-transparent";
                                rightIcon = <XCircle className="w-5.5 h-5.5 text-destructive shrink-0" />;
                            } else {
                                cardStyle = "border-border/50 bg-muted/10 opacity-30 select-none scale-[0.98]";
                                badgeStyle = "bg-muted text-muted-foreground/40 border-border/20";
                            }
                        } else if (esSeleccionado) {
                            cardStyle = colors.active;
                        }

                        return (
                            <li key={i} className="list-none relative">
                                <label className={cn(
                                    "relative flex items-center gap-4 p-5 pt-8 pb-5 rounded-2xl border transition-all text-base font-semibold shadow-sm min-h-[76px]",
                                    cardStyle
                                )}>
                                    <input
                                        type="radio"
                                        name={`visual-q-${index}`}
                                        value={op}
                                        checked={esSeleccionado}
                                        onChange={() => onChange(op)}
                                        disabled={disabled}
                                        className="sr-only"
                                    />
                                    
                                    {/* Academic letter choice badge (A, B, C, D) instead of Kahoot shapes */}
                                    <span className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent shadow-xs transition-all duration-200 font-display font-black text-lg",
                                        badgeStyle
                                    )}>
                                        {letter}
                                    </span>

                                    <span className="flex-1 leading-snug break-words pr-2">{cleanText}</span>
                                    {rightIcon}

                                    {/* Badges de corrección absolutos para evitar romper la cuadrícula y superponerse */}
                                    {tieneResultado && esCorrecto && (
                                        <span className="absolute top-2.5 right-3 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none border border-emerald-200/50">
                                            ✓ Correcta
                                        </span>
                                    )}
                                    {tieneResultado && esSeleccionado && !esCorrecto && (
                                        <span className="absolute top-2.5 right-3 text-[9px] font-black uppercase tracking-wider text-destructive bg-destructive/10 dark:bg-red-950/40 px-2 py-0.5 rounded-full select-none border border-destructive/20">
                                            ✗ Tu Selección
                                        </span>
                                    )}
                                </label>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </motion.div>
    );
}
