import { cn } from "@/lib/utils";
import { Question } from "@/types/Evaluation";

interface PreguntaMultipleProps {
    pregunta: Question;
    index: number;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    resultado?: any;
    esVisualQuiz?: boolean;
    /** Alternativas descartadas por el poder 50/50: se muestran tachadas y no se pueden elegir. */
    ocultas?: string[];
}

export function PreguntaMultiple({
    pregunta,
    index,
    valor,
    onChange,
    disabled,
    resultado,
    esVisualQuiz = false,
    ocultas = []
}: PreguntaMultipleProps) {
    const opcionesArray = Array.isArray(pregunta.opciones_o_respuesta)
        ? pregunta.opciones_o_respuesta
        : (pregunta.opciones_o_respuesta || "").split(" | ");

    const tieneResultado = !!resultado;
    const respuestaCorrecta = pregunta.respuesta_correcta || "";

    const renderOption = (op: string, i: number) => {
        const esSeleccionado = valor === op;
        const descartada = ocultas.includes(op) && !tieneResultado;
        const esCorrecto = op === respuestaCorrecta || op.trim() === respuestaCorrecta.trim();
        
        const hasLetterPrefix = /^[A-D]\)/.test(op.trim());
        const letter = hasLetterPrefix ? op.trim().charAt(0) : String.fromCharCode(65 + i);
        const cleanText = hasLetterPrefix ? op.replace(/^[A-D]\)\s*/, "") : op;

        // Cada alternativa tiene su color de ficha, como en la clase en vivo.
        const colorFicha = ["var(--j-indigo)", "var(--j-fuego)", "var(--j-oro)", "#14B8A6"][i % 4];
        const textoFicha = i % 4 === 2 ? "var(--j-tinta)" : "#fff";

        const estado = tieneResultado
            ? (esCorrecto ? "correcta" : esSeleccionado ? "incorrecta" : "apagada")
            : descartada ? "descartada" : esSeleccionado ? "elegida" : "libre";

        return (
            <li key={i} className="list-none relative">
                <label
                    data-estado={estado}
                    aria-disabled={disabled || descartada}
                    className={cn(
                        "opcion-juego flex items-center gap-4 px-4 py-3.5 text-base md:text-lg font-semibold",
                        disabled || descartada ? "cursor-not-allowed" : "cursor-pointer",
                        descartada && "line-through",
                    )}
                >
                    <input
                        type="radio"
                        name={`q-${index}`}
                        value={op}
                        checked={esSeleccionado}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled || descartada}
                        className="sr-only"
                    />
                    <span
                        className="ficha-letra"
                        style={estado === "apagada" || estado === "descartada"
                            ? { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                            : estado === "correcta" ? { background: "#16A34A", color: "#fff" }
                            : estado === "incorrecta" ? { background: "#E11D48", color: "#fff" }
                            : { background: colorFicha, color: textoFicha }}
                    >
                        {estado === "correcta" ? "✓" : estado === "incorrecta" ? "✗" : letter}
                    </span>
                    <span className="flex-1 leading-snug pr-2">{cleanText}</span>
                    {descartada && <Rasgunos />}
                    {estado === "correcta" && (
                        <span className="font-juego text-sm font-extrabold shrink-0">Correcta</span>
                    )}
                    {estado === "incorrecta" && (
                        <span className="font-juego text-sm font-extrabold shrink-0">Tu respuesta</span>
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
            <p className="font-bold text-lg md:text-xl text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <ul className="space-y-3.5 p-0 m-0">
                {opcionesArray.map((op, i) => renderOption(op, i))}
            </ul>
        </div>
    );
}

/** Media luna afilada de (x0,y0) a (x1,y1): gruesa al centro y punzante en los extremos. */
function tajo(x0: number, y0: number, x1: number, y1: number, ancho: number) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
    const nx = -dy / l, ny = dx / l;
    return `M${x0},${y0} Q${mx + nx * ancho},${my + ny * ancho} ${x1},${y1} Q${mx - nx * ancho * 0.3},${my - ny * ancho * 0.3} ${x0},${y0} Z`;
}

/**
 * Rasguños del zarpazo de Aria (comodín 50/50): tres heridas con relieve (contorno oscuro,
 * interior naranja y un filo de luz) que se revelan de izquierda a derecha, como el golpe.
 */
function Rasgunos() {
    const marcas = [[40, 50, 360, 14], [60, 62, 380, 26], [24, 38, 330, 4]] as const;
    return (
        <svg viewBox="0 0 400 66" preserveAspectRatio="none" aria-hidden className="absolute inset-0 w-full h-full pointer-events-none">
            {marcas.map(([x0, y0, x1, y1], i) => (
                <g key={i} className="rasguno">
                    <path d={tajo(x0, y0, x1, y1, 15)} fill="#2B2140" />
                    <path d={tajo(x0 + 10, y0 - 1, x1 - 12, y1 + 1, 9)} fill="#FF7A2F" />
                    <path d={tajo(x0 + 34, y0 - 4, x1 - 44, y1 - 2, 3)} fill="#FFE4CC" />
                </g>
            ))}
        </svg>
    );
}
