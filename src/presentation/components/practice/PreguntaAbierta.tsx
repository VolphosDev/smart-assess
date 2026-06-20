import { Question } from "../../../domain/entities/Evaluation";

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
            <p className="font-semibold text-foreground leading-relaxed">{pregunta.enunciado}</p>
            <textarea
                rows={4}
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}
