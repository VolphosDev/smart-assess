import { cn } from "@/lib/utils";
import { Question } from "../../../domain/entities/Evaluation";
import { CheckCircle2, XCircle } from "lucide-react";

interface PreguntaDeteccionErroresProps {
    pregunta: Question;
    index: number;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    resultado?: any;
}

export function PreguntaDeteccionErrores({
    pregunta,
    index,
    valor,
    onChange,
    disabled,
    resultado
}: PreguntaDeteccionErroresProps) {
    const correcciones: Record<string, string> = (() => {
        try {
            return valor ? JSON.parse(valor) : {};
        } catch(e) {
            return {};
        }
    })();

    const updateCorreccion = (word: string, corr: string) => {
        const newCorr = { ...correcciones, [word]: corr };
        onChange(JSON.stringify(newCorr));
    };

    const incorrectWords = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : [];

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (incorrectWords.length === 0) return <div>{pregunta.enunciado}</div>;

    const regex = new RegExp(`(${incorrectWords.map(escapeRegExp).join('|')})`, 'gi');
    const parts = pregunta.enunciado.split(regex);
    const tieneResultado = !!resultado;
    const correctAnswers = (pregunta.respuesta_correcta || "")
        .split("|")
        .map(s => s.trim());

    const normalizar = (str: string) =>
        str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return (
        <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Haz clic en las palabras subrayadas en el texto para escribir la corrección adecuada:
            </p>
            <div className="p-5 rounded-2xl bg-secondary/15 border border-border/80 text-foreground leading-relaxed text-sm md:text-base font-medium font-display">
                {parts.map((part, idx) => {
                    const lowerPart = part.toLowerCase();
                    const targetWord = incorrectWords.find(w => w.toLowerCase() === lowerPart);

                    if (targetWord) {
                        const valorCorreccion = correcciones[targetWord] || "";
                        const tieneCorreccion = valorCorreccion.trim().length > 0;
                        
                        let wordStyle = "border-b-2 border-dashed border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer";
                        if (tieneResultado) {
                            wordStyle = "border-b border-solid border-border/40 opacity-90";
                        } else if (tieneCorreccion) {
                            wordStyle = "border-b-2 border-solid border-primary text-primary bg-primary/5";
                        }

                        const widthCh = Math.max(part.length, valorCorreccion.length, 8) + 2;
                        return (
                            <span key={idx} className="relative inline-block mx-1">
                                {tieneResultado ? (
                                    (() => {
                                        const corrEstudiante = correcciones[targetWord] || "";
                                        const targetWordIndex = incorrectWords.findIndex(w => w.toLowerCase() === targetWord.toLowerCase());
                                        const respuestaReal = correctAnswers[targetWordIndex] || "N/A";
                                        
                                        let esCorrecto = false;
                                        if (resultado?.evaluacion?.detalles && Array.isArray(resultado.evaluacion.detalles)) {
                                            const detalle = resultado.evaluacion.detalles.find((d: any) => 
                                                d.palabra_con_error?.toLowerCase().trim() === targetWord.toLowerCase().trim()
                                            );
                                            if (detalle) {
                                                esCorrecto = !!detalle.esCorrecto;
                                            } else {
                                                esCorrecto = corrEstudiante.trim() !== "" && 
                                                    normalizar(corrEstudiante) === normalizar(respuestaReal);
                                            }
                                        } else {
                                            esCorrecto = corrEstudiante.trim() !== "" && 
                                                normalizar(corrEstudiante) === normalizar(respuestaReal);
                                        }

                                        if (esCorrecto) {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-sm shadow-sm animate-fade-in">
                                                    {corrEstudiante}
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                </span>
                                            );
                                        } else if (corrEstudiante.trim().length > 0) {
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-destructive/5 border border-destructive/20 text-xs shadow-soft animate-fade-in">
                                                    <span className="line-through text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-xl">
                                                        {corrEstudiante}
                                                    </span>
                                                    <span className="text-muted-foreground/80 font-bold">→</span>
                                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-xl">
                                                        {respuestaReal}
                                                    </span>
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-destructive/5 border border-destructive/20 text-xs shadow-soft animate-fade-in">
                                                    <span className="line-through text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-xl">
                                                        {part}
                                                    </span>
                                                    <span className="text-muted-foreground/80 font-bold">→</span>
                                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-xl">
                                                        {respuestaReal}
                                                    </span>
                                                </span>
                                            );
                                        }
                                    })()
                                ) : (
                                    <input
                                        type="text"
                                        disabled={disabled}
                                        value={valorCorreccion}
                                        onChange={(e) => updateCorreccion(targetWord, e.target.value)}
                                        placeholder={part}
                                        style={{ width: `${widthCh}ch` }}
                                        title={`Haz clic para corregir '${part}'`}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition placeholder:text-amber-700/80 dark:placeholder:text-amber-300/80 placeholder:italic",
                                            wordStyle
                                        )}
                                    />
                                )}
                            </span>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </div>
        </div>
    );
}