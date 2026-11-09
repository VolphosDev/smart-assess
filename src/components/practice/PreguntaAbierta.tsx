import { Question } from "@/types/Evaluation";
import { AriaNubecita } from "@/components/AriaNubecita";

interface PreguntaAbiertaProps {
    pregunta: Question;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}

export function PreguntaAbierta({
    pregunta,
    valor,
    onChange,
    disabled
}: PreguntaAbiertaProps) {
    return (
        <div className="space-y-3">
            <p className="font-bold text-lg md:text-xl text-foreground leading-relaxed">{pregunta.enunciado}</p>
            {!disabled && <AriaNubecita />}
            <textarea
                rows={4}
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Escribe tu respuesta aquí..."
                className="pieza w-full rounded-2xl bg-card p-4 text-base resize-none focus:outline-none focus:ring-4 focus:ring-[var(--j-oro)]/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}
