import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Question } from "../../../domain/entities/Evaluation";

interface PreguntaVFProps {
    pregunta: Question;
    index: number;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    resultado?: any;
}

export function PreguntaVF({
    pregunta,
    index,
    valor,
    onChange,
    disabled,
    resultado
}: PreguntaVFProps) {
    const tieneResultado = !!resultado;
    const respuestaCorrecta = pregunta.respuesta_correcta || "";

    return (
        <div className="space-y-4">
            <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <div className="flex gap-4">
                {["VERDADERO", "FALSO"].map((op) => {
                    const esSeleccionado = valor === op;
                    const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
                    const isTrue = op === "VERDADERO";

                    const baseColorStyle = isTrue
                        ? "bg-blue-50/60 border-blue-200 text-blue-600 hover:bg-blue-100/50 hover:border-blue-400 dark:bg-blue-950/10 dark:border-blue-900/30 dark:text-blue-400"
                        : "bg-rose-50/60 border-rose-200 text-rose-600 hover:bg-rose-100/50 hover:border-rose-400 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-400";

                    let cardStyle = `${baseColorStyle} hover:scale-[1.01] active:scale-[0.99] hover:shadow-soft bg-card`;
                    let rightIcon = null;

                    if (tieneResultado) {
                        if (esCorrecto) {
                            cardStyle = "border-emerald-500/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]";
                            rightIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
                        } else if (esSeleccionado && !esCorrecto) {
                            cardStyle = "border-destructive/80 bg-destructive/5 text-destructive dark:bg-red-950/20 dark:text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]";
                            rightIcon = <XCircle className="w-5 h-5 text-destructive shrink-0" />;
                        } else {
                            cardStyle = "border-border/60 bg-muted/10 opacity-40 select-none scale-[0.99]";
                        }
                    } else if (esSeleccionado) {
                        cardStyle = isTrue
                            ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 scale-[1.01] font-bold"
                            : "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 scale-[1.01] font-bold";
                    }

                    return (
                        <label
                            key={op}
                            className={cn(
                                "relative flex-1 flex items-center justify-center gap-3 p-4 pt-7 pb-4 rounded-2xl border transition-all text-sm md:text-base font-semibold cursor-pointer",
                                disabled ? "cursor-not-allowed" : "active:scale-[0.98]",
                                cardStyle
                            )}
                        >
                            <input
                                type="radio"
                                name={`q-${index}`}
                                value={op}
                                checked={esSeleccionado}
                                onChange={(e) => onChange(e.target.value)}
                                disabled={disabled}
                                className="hidden"
                            />
                            <span>{op}</span>
                            {rightIcon}
                            {tieneResultado && esCorrecto && (
                                <span className="absolute top-1.5 right-2.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full select-none">
                                    ✓ Correcto
                                </span>
                            )}
                            {tieneResultado && esSeleccionado && !esCorrecto && (
                                <span className="absolute top-1.5 right-2.5 text-[9px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 dark:bg-red-950/40 px-2 py-0.5 rounded-full select-none">
                                    ✗ Marcado
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
