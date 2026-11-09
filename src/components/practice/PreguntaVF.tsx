import { cn } from "@/lib/utils";
import { Question } from "@/types/Evaluation";

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
            <p className="font-bold text-lg md:text-xl text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <div className="flex gap-4">
                {["VERDADERO", "FALSO"].map((op) => {
                    const esSeleccionado = valor === op;
                    const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
                    const isTrue = op === "VERDADERO";

                    const estado = tieneResultado
                        ? (esCorrecto ? "correcta" : esSeleccionado ? "incorrecta" : "apagada")
                        : esSeleccionado ? "elegida" : "libre";

                    return (
                        <label
                            key={op}
                            data-estado={estado}
                            aria-disabled={disabled}
                            className={cn(
                                "opcion-juego flex-1 flex flex-col items-center justify-center gap-1 py-5 font-juego text-xl font-extrabold",
                                disabled ? "cursor-not-allowed" : "cursor-pointer",
                            )}
                        >
                            <input
                                type="radio"
                                name={`q-${index}`}
                                value={op}
                                checked={esSeleccionado}
                                onChange={(e) => onChange(e.target.value)}
                                disabled={disabled}
                                className="sr-only"
                            />
                            <span className="ficha-letra w-12 h-12 text-2xl"
                                  style={estado === "apagada" ? { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                                      : estado === "correcta" ? { background: "#16A34A", color: "#fff" }
                                      : estado === "incorrecta" ? { background: "#E11D48", color: "#fff" }
                                      : { background: isTrue ? "#14B8A6" : "var(--j-fuego)", color: "#fff" }}>
                                {estado === "correcta" ? "✓" : estado === "incorrecta" ? "✗" : isTrue ? "V" : "F"}
                            </span>
                            <span>{isTrue ? "Verdadero" : "Falso"}</span>
                            {estado === "correcta" && <span className="text-sm">Correcta</span>}
                            {estado === "incorrecta" && <span className="text-sm">Tu respuesta</span>}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
