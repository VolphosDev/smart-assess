import { motion } from "framer-motion";
import { Question } from "../../../domain/entities/Evaluation";
import { PreguntaMultiple } from "./PreguntaMultiple";
import { PreguntaVF } from "./PreguntaVF";
import { PreguntaAbierta } from "./PreguntaAbierta";
import { PreguntaDeteccionErrores } from "./PreguntaDeteccionErrores";
import VisualQuiz from "../../../pages/VisualQuiz";

interface PreguntaCardProps {
    pregunta: Question;
    index: number;
    tipo: string;
    valor: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    resultado?: any;
    imagenesCargadas: Record<string, string>;
}

export function PreguntaCard({
    pregunta,
    index,
    tipo,
    valor,
    onChange,
    disabled,
    resultado,
    imagenesCargadas
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
            className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4"
        >
            <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center shrink-0">
                    {index + 1}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Pregunta {index + 1}
                </span>
            </div>

            {tipo === "OPCION_MULTIPLE" && (
                <PreguntaMultiple pregunta={pregunta} index={index} valor={valor} onChange={onChange} disabled={disabled} resultado={resultado} />
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
