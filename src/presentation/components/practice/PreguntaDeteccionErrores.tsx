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

    return (
        <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                Haz clic en las palabras subrayadas en el texto para escribir la corrección adecuada:
            </p>
            <div className="p-5 rounded-2xl bg-secondary/15 border border-border/80 text-foreground leading-relaxed text-sm md:text-base font-medium">
                {parts.map((part, idx) => {
                    const lowerPart = part.toLowerCase();
                    const targetWord = incorrectWords.find(w => w.toLowerCase() === lowerPart);

                    if (targetWord) {
                        const valorCorreccion = correcciones[targetWord] || "";
                        const tieneCorreccion = valorCorreccion.trim().length > 0;
                        
                        let wordStyle = "border-b-2 border-dashed border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer";
                        if (tieneResultado) {
                            wordStyle = "border-b-2 border-dashed border-border opacity-70";
                        } else if (tieneCorreccion) {
                            wordStyle = "border-b-2 border-solid border-primary text-primary bg-primary/5";
                        }

                        const widthCh = Math.max(part.length, valorCorreccion.length, 8) + 2;
                        return (
                            <span key={idx} className="relative inline-block mx-1">
                                {tieneResultado ? (
                                    <span className={cn("px-1 py-0.5 rounded font-bold", wordStyle)}>
                                        {part}
                                    </span>
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

            {tieneResultado && (
                <div className="space-y-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Revisión de tus respuestas:
                    </p>
                    <div className="grid gap-3">
                        {incorrectWords.map((word, idx) => {
                            const corrEstudiante = correcciones[word] || "";
                            const correctAnswers = (pregunta.respuesta_correcta || "")
                                .split("|")
                                .map(s => s.trim());
                            const respuestaReal = correctAnswers[idx] || "N/A";
                            
                            const normalizar = (str: string) =>
                                str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            
                            let esCorrecto = false;
                            if (resultado?.evaluacion?.detalles && Array.isArray(resultado.evaluacion.detalles)) {
                                const detalle = resultado.evaluacion.detalles.find((d: any) => 
                                    d.palabra_con_error?.toLowerCase().trim() === word.toLowerCase().trim()
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

                            return (
                                <div 
                                    key={word} 
                                    className={cn(
                                        "p-4 rounded-2xl border text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs",
                                        esCorrecto 
                                            ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/10 dark:border-emerald-800/30" 
                                            : "bg-destructive/5 border-destructive/20 dark:bg-red-950/10 dark:border-red-900/30"
                                    )}
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Palabra con error:</span>
                                            <span className="font-semibold text-destructive line-through bg-destructive/10 dark:bg-destructive/20 px-2 py-0.5 rounded-lg text-xs">
                                                {word}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Tu respuesta:</span>
                                            <span className={cn(
                                                "font-bold px-2 py-0.5 rounded-lg text-xs",
                                                esCorrecto 
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                                    : "bg-destructive/10 text-destructive dark:text-red-400"
                                            )}>
                                                {corrEstudiante || "(No respondido)"}
                                            </span>
                                            {esCorrecto ? (
                                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <XCircle className="w-4.5 h-4.5 text-destructive shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-background/60 backdrop-blur-sm p-3 rounded-xl border border-border/30 self-start md:self-center">
                                        <span className="text-xs font-bold text-muted-foreground uppercase block mb-0.5">Corrección correcta:</span>
                                        <span className="font-bold text-foreground text-sm">{respuestaReal}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
