import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Info, Sparkles, Wand2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PreguntaMultiple } from "@/components/practice/PreguntaMultiple";
import { PreguntaVF } from "@/components/practice/PreguntaVF";
import { PreguntaAbierta } from "@/components/practice/PreguntaAbierta";
import {
    CURSO_DEMO_ID, PREGUNTAS_DEMO, RESPUESTA_ABIERTA_EJEMPLO, SEMANA_DEMO_ID, type PreguntaDemo,
} from "@/lib/tourDemo";

interface Resultado {
    esCorrecta: boolean;
    explicacion: string;
}

/**
 * Práctica SIMULADA del recorrido de Aria.
 *
 * Usa los mismos componentes de pregunta que la práctica real (PreguntaMultiple, PreguntaVF,
 * PreguntaAbierta) para que lo que el alumno aprende aquí sea exactamente lo que verá
 * después. Lo único distinto es que nada sale del navegador: la corrección es local, no hay
 * intento guardado ni nota en el historial.
 */
export default function PracticaDemo() {
    const [actual, setActual] = useState(0);
    const [respuestas, setRespuestas] = useState<string[]>(() => PREGUNTAS_DEMO.map(() => ""));
    const [resultados, setResultados] = useState<(Resultado | null)[]>(() => PREGUNTAS_DEMO.map(() => null));
    const [finalizado, setFinalizado] = useState(false);

    const pregunta = PREGUNTAS_DEMO[actual];
    const resultado = resultados[actual];
    const ultima = actual === PREGUNTAS_DEMO.length - 1;
    const aciertos = resultados.filter((r) => r?.esCorrecta).length;
    const nota = Math.round((aciertos / PREGUNTAS_DEMO.length) * 20);

    const responder = (valor: string) =>
        setRespuestas((prev) => prev.map((r, i) => (i === actual ? valor : r)));

    const comprobar = () => {
        const r = corregir(pregunta, respuestas[actual]);
        setResultados((prev) => prev.map((x, i) => (i === actual ? r : x)));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link
                to={`/app/curso/${CURSO_DEMO_ID}/semana/${SEMANA_DEMO_ID}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" /> Volver a la semana de ejemplo
            </Link>

            <div data-guide="demo-cabecera" className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
                    <Info className="w-4 h-4 shrink-0" />
                    Práctica de ejemplo del recorrido: no se guarda ni cuenta para tu nota.
                </div>
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">El signo lingüístico</p>
                        <h1 className="font-display text-2xl font-bold">Práctica de ejemplo</h1>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground tabular-nums">
                        {finalizado ? PREGUNTAS_DEMO.length : actual + 1} / {PREGUNTAS_DEMO.length}
                    </span>
                </div>
                <div className="flex gap-1.5">
                    {PREGUNTAS_DEMO.map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                "h-2 flex-1 rounded-full transition-colors",
                                resultados[i]
                                    ? resultados[i]!.esCorrecta ? "bg-emerald-500" : "bg-rose-500"
                                    : i === actual && !finalizado ? "bg-primary" : "bg-border"
                            )}
                        />
                    ))}
                </div>
            </div>

            {!finalizado ? (
                <div data-guide="demo-zona" className="space-y-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={actual}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            <div
                                data-guide="demo-pregunta"
                                data-respondida={resultado ? "" : undefined}
                                className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm"
                            >
                                <span className="inline-block mb-3 px-2.5 py-1 rounded-lg bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {etiquetaTipo(pregunta.tipo)}
                                </span>
                                {pregunta.tipo === "OPCION_MULTIPLE" && (
                                    <PreguntaMultiple pregunta={pregunta} index={actual} valor={respuestas[actual]} onChange={responder} disabled={!!resultado} resultado={resultado} />
                                )}
                                {pregunta.tipo === "VERDADERO_FALSO" && (
                                    <PreguntaVF pregunta={pregunta} index={actual} valor={respuestas[actual]} onChange={responder} disabled={!!resultado} resultado={resultado} />
                                )}
                                {pregunta.tipo === "ABIERTA" && (
                                    <div className="space-y-3">
                                        <PreguntaAbierta pregunta={pregunta} valor={respuestas[actual]} onChange={responder} disabled={!!resultado} />
                                        {!resultado && (
                                            <button
                                                type="button"
                                                data-guide="demo-ejemplo"
                                                onClick={() => responder(RESPUESTA_ABIERTA_EJEMPLO)}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                                            >
                                                <Wand2 className="w-3.5 h-3.5" /> Usar una respuesta de ejemplo
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {resultado && (
                                <motion.div
                                    data-guide="demo-retro"
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "p-5 rounded-3xl border flex gap-3",
                                        resultado.esCorrecta
                                            ? "bg-emerald-500/5 border-emerald-500/25"
                                            : "bg-rose-500/5 border-rose-500/25"
                                    )}
                                >
                                    <span className={cn(
                                        "w-9 h-9 rounded-2xl grid place-items-center shrink-0 text-white",
                                        resultado.esCorrecta ? "bg-emerald-500" : "bg-rose-500"
                                    )}>
                                        <Sparkles className="w-4.5 h-4.5" />
                                    </span>
                                    <div>
                                        <p className="font-display font-bold text-sm">
                                            {resultado.esCorrecta ? "¡Correcto!" : "Casi: repasemos esta idea"}
                                        </p>
                                        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{resultado.explicacion}</p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-between items-center bg-card rounded-3xl p-4 sm:p-5 border border-border shadow-sm">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Pregunta {actual + 1} de {PREGUNTAS_DEMO.length}
                        </span>
                        {!resultado ? (
                            <button
                                type="button"
                                data-guide="demo-comprobar"
                                onClick={comprobar}
                                disabled={!respuestas[actual].trim()}
                                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Comprobar
                            </button>
                        ) : ultima ? (
                            <button
                                type="button"
                                data-guide="demo-siguiente"
                                onClick={() => setFinalizado(true)}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                            >
                                Ver resultados
                            </button>
                        ) : (
                            <button
                                type="button"
                                data-guide="demo-siguiente"
                                onClick={() => setActual((a) => a + 1)}
                                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                            >
                                Siguiente
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <motion.div
                    data-guide="demo-resultado"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5"
                >
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                        <div>
                            <h2 className="font-display text-2xl font-bold">Evaluación completada</h2>
                            <p className="text-sm text-muted-foreground">Así se ve tu resumen al terminar una práctica real.</p>
                        </div>
                        <div className="text-3xl font-black text-primary bg-primary/5 border border-primary/20 px-5 py-2.5 rounded-2xl tabular-nums">
                            {nota} / 20
                        </div>
                    </div>
                    <ul className="space-y-3">
                        {PREGUNTAS_DEMO.map((p, i) => (
                            <li key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-border/80 bg-background/50">
                                {resultados[i]?.esCorrecta
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    : <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-snug">{p.enunciado}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tu respuesta: <span className="font-bold text-foreground">{respuestas[i] || "No respondió"}</span>
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}

function etiquetaTipo(tipo: PreguntaDemo["tipo"]) {
    return tipo === "OPCION_MULTIPLE" ? "Opción múltiple" : tipo === "VERDADERO_FALSO" ? "Verdadero o falso" : "Pregunta abierta";
}

function corregir(pregunta: PreguntaDemo, respuesta: string): Resultado {
    if (pregunta.tipo === "ABIERTA") {
        const texto = respuesta.toLowerCase();
        const menciona = (pregunta.claves ?? []).some((c) => texto.includes(c));
        return {
            esCorrecta: menciona && texto.trim().length >= 15,
            explicacion: pregunta.explicacion,
        };
    }
    const esCorrecta = respuesta.trim() === (pregunta.respuesta_correcta || "").trim();
    return {
        esCorrecta,
        explicacion: esCorrecta
            ? pregunta.explicacion
            : `La respuesta correcta era «${pregunta.respuesta_correcta}». ${pregunta.explicacion}`,
    };
}
