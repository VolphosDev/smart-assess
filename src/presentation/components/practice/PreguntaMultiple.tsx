import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Question } from "../../../domain/entities/Evaluation";

interface PreguntaMultipleProps {
    pregunta: Question;
    index: number;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    resultado?: any;
    esVisualQuiz?: boolean;
}

export function PreguntaMultiple({
    pregunta,
    index,
    valor,
    onChange,
    disabled,
    resultado,
    esVisualQuiz = false
}: PreguntaMultipleProps) {
    const opcionesArray = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : (pregunta.opciones_o_respuesta || "").split(" | ");

    const tieneResultado = !!resultado;
    const respuestaCorrecta = pregunta.respuesta_correcta || "";

    const renderOption = (op: string, i: number) => {
        const esSeleccionado = valor === op;
        const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
        
        const hasLetterPrefix = /^[A-D]\)/.test(op.trim());
        const letter = hasLetterPrefix ? op.trim().charAt(0) : String.fromCharCode(65 + i);
        const cleanText = hasLetterPrefix ? op.replace(/^[A-D]\)\s*/, "") : op;

        const colorClasses = [
            "bg-blue-50/70 text-blue-600 border-blue-200 hover:border-blue-400 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
            "bg-violet-50/70 text-violet-600 border-violet-200 hover:border-violet-400 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30",
            "bg-pink-50/70 text-pink-600 border-pink-200 hover:border-pink-400 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30",
            "bg-amber-50/70 text-amber-600 border-amber-200 hover:border-amber-400 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
        ][i % 4];

        const activeColorClasses = [
            "bg-blue-500 text-white font-bold border-transparent",
            "bg-violet-500 text-white font-bold border-transparent",
            "bg-pink-500 text-white font-bold border-transparent",
            "bg-amber-500 text-white font-bold border-transparent",
        ][i % 4];

        let cardStyle = "border-border bg-card hover:bg-muted/30 hover:scale-[1.01] active:scale-[0.99] hover:shadow-soft";
        let badgeStyle = colorClasses;
        let rightIcon = null;

        if (tieneResultado) {
            if (esCorrecto) {
                cardStyle = "border-emerald-500/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]";
                badgeStyle = "bg-emerald-500 text-white font-bold border-transparent";
                rightIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            } else if (esSeleccionado && !esCorrecto) {
                cardStyle = "border-destructive/80 bg-destructive/5 text-destructive dark:bg-red-950/20 dark:text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]";
                badgeStyle = "bg-destructive text-white font-bold border-transparent";
                rightIcon = <XCircle className="w-5 h-5 text-destructive shrink-0" />;
            } else {
                cardStyle = "border-border/60 bg-muted/10 opacity-40 select-none scale-[0.99]";
                badgeStyle = "bg-muted text-muted-foreground/50 border-border/30";
            }
        } else if (esSeleccionado) {
            cardStyle = "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20 scale-[1.01]";
            badgeStyle = activeColorClasses;
        }

        return (
            <li key={i} className="list-none relative">
                <label className={cn(
                    "relative flex items-center gap-4 p-4 pt-7 pb-4 rounded-2xl border transition-all text-sm md:text-base font-semibold",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                    cardStyle
                )}>
                    <input
                        type="radio"
                        name={`q-${index}`}
                        value={op}
                        checked={esSeleccionado}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        className="sr-only"
                    />
                    <span className={cn(
                        "w-9 h-9 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 border transition-all duration-200 shadow-sm",
                        badgeStyle
                    )}>
                        {letter}
                    </span>
                    <span className="flex-1 leading-snug pr-2">{cleanText}</span>
                    {rightIcon}
                    {tieneResultado && esCorrecto && (
                        <span className="absolute top-2 right-3 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none">
                            ✓ Correcta
                        </span>
                    )}
                    {tieneResultado && esSeleccionado && !esCorrecto && (
                        <span className="absolute top-2 right-3 text-[9px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 dark:bg-red-950/40 px-2 py-0.5 rounded-full select-none">
                            ✗ Tu respuesta
                        </span>
                    )}
                </label>
            </li>
        );
    };

    if (esVisualQuiz) {
        return (
            <div className="space-y-4">
                <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">
                    {pregunta.enunciado}
                </p>
                <ul className="grid sm:grid-cols-2 gap-3 p-0 m-0">
                    {opcionesArray.map((op, i) => renderOption(op, i))}
                </ul>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <ul className="space-y-3 p-0 m-0">
                {opcionesArray.map((op, i) => renderOption(op, i))}
            </ul>
        </div>
    );
}
