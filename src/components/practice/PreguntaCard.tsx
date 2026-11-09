import { motion } from "framer-motion";
import { Question } from "@/types/Evaluation";
import { PreguntaMultiple } from "./PreguntaMultiple";
import { PreguntaVF } from "./PreguntaVF";
import { PreguntaAbierta } from "./PreguntaAbierta";
import { PreguntaDeteccionErrores } from "./PreguntaDeteccionErrores";
import VisualQuiz from "@/pages/VisualQuiz";
import { AriaAcompana } from "@/components/AriaAcompana";

interface PreguntaCardProps {
    pregunta: Question;
    index: number;
    tipo: string;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    resultado?: any;
    imagenesCargadas: Record<string, string>;
    /** Alternativas descartadas por el poder 50/50 del contrarreloj. */
    ocultas?: string[];
}

export function PreguntaCard({
    pregunta,
    index,
    tipo,
    valor,
    onChange,
    disabled,
    resultado,
    imagenesCargadas,
    ocultas
}: PreguntaCardProps) {
    if (tipo === "VISUAL_QUIZ") {
        return (
            <VisualQuiz
                pregunta={pregunta}
                index={index}
                valor={valor}
                onChange={onChange}
                disabled={disabled}
                resultado={resultado}
                base64Imagen={pregunta.prompt_imagen ? imagenesCargadas[pregunta.prompt_imagen] : undefined}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="pieza bg-card rounded-[1.75rem] p-5 md:p-7 space-y-5"
        >
            <div className="flex items-center gap-2.5">
                <span className="pieza grid place-items-center w-10 h-10 rounded-xl bg-[var(--j-indigo)] text-white font-juego text-xl font-extrabold shrink-0">
                    {index + 1}
                </span>
                <span className="font-juego text-lg font-extrabold text-muted-foreground">
                    Pregunta {index + 1}
                </span>
                <AriaAcompana className="ml-auto" />
            </div>

            {tipo === "OPCION_MULTIPLE" && (
                <PreguntaMultiple pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} ocultas={ocultas} />
            )}
            {tipo === "VERDADERO_FALSO" && (
                <PreguntaVF pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} />
            )}
            {tipo === "ABIERTA" && (
                <PreguntaAbierta pregunta={pregunta} valor={valor} onChange={onChange} disabled={disabled} />
            )}
            {tipo === "DETECCION_ERRORES" && (
                <PreguntaDeteccionErrores pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} />
            )}
        </motion.div>
    );
}
export default PreguntaCard;
