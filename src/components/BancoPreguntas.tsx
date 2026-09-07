import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Loader2, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Search,
} from "lucide-react";
import { bancoPreguntasApi, type PreguntaDelBanco } from "@/api/bancoPreguntas";
import { cn } from "@/lib/utils";
import { reproducirClic } from "@/lib/sonidos";

/**
 * Banco de preguntas de la semana, para el docente.
 *
 * Muestra cada reactivo que generó la IA con su nivel de Bloom declarado, la respuesta que se
 * usó para calificar, y —al desplegarlo— qué contestó cada alumno junto con la
 * retroalimentación literal que le dio el agente juez.
 *
 * El motivo de que exista: antes las preguntas se guardaban pero solo las veía el alumno que
 * las respondió. Nadie podía auditar al generador. Si el modelo producía un enunciado mal
 * planteado, el único aviso posible era la queja de un alumno en clase.
 *
 * Sobre la tasa de acierto: se muestra siempre acompañada del número de respuestas sobre el
 * que se calculó, y por debajo de 5 el backend se niega a leerla como dificultad. Un "0% de
 * acierto" sobre una sola respuesta no dice nada de la pregunta.
 */

const COLOR_BLOOM: Record<string, string> = {
    RECORDAR: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
    COMPRENDER: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    APLICAR: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    ANALIZAR: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    EVALUAR: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    CREAR: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function chipBloom(nivel: string | null) {
    const clave = (nivel ?? "").toUpperCase();
    return COLOR_BLOOM[clave] ?? "bg-muted text-muted-foreground";
}

function Fila({ p }: { p: PreguntaDelBanco }) {
    const [abierta, setAbierta] = useState(false);

    return (
        <li className="border-b border-border last:border-b-0">
            <button
                type="button"
                onClick={() => { reproducirClic(); setAbierta((v) => !v); }}
                className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
            >
                {abierta
                    ? <ChevronDown className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />}

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{p.enunciado}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {p.nivelBloom && (
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md", chipBloom(p.nivelBloom))}>
                                {p.nivelBloom}
                            </span>
                        )}
                        {p.tipo && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                {p.tipo}
                            </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                            {p.vecesRespondida === 0
                                ? "sin responder"
                                : `${p.aciertos}/${p.vecesRespondida} aciertos`}
                        </span>
                        {!p.respuestaCorrecta && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                sin respuesta guardada
                            </span>
                        )}
                    </div>
                </div>
            </button>

            {abierta && (
                <div className="px-4 pb-4 pl-11 space-y-3">
                    <p className="text-xs text-muted-foreground italic">{p.lecturaDificultad}</p>

                    {p.opciones.length > 0 && (
                        <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Opciones</h4>
                            <ul className="text-sm space-y-0.5">
                                {p.opciones.map((o, i) => (
                                    <li key={i} className="text-muted-foreground">· {o}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Respuesta usada para calificar
                        </h4>
                        <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">
                            {p.respuestaCorrecta ?? (
                                <span className="text-muted-foreground italic">
                                    No se guardó. Las preguntas anteriores a este cambio no la tienen,
                                    y sin ella el alumno ve "incorrecto" sin saber qué era lo correcto.
                                </span>
                            )}
                        </p>
                    </div>

                    {p.conceptos && (
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Conceptos:</span> {p.conceptos}
                        </p>
                    )}

                    <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Respuestas de los alumnos ({p.respuestas.length})
                        </h4>
                        {p.respuestas.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">Nadie la ha respondido todavía.</p>
                        ) : (
                            <ul className="space-y-2">
                                {p.respuestas.map((r, i) => (
                                    <li key={i} className="border border-border rounded-lg p-3 text-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            {r.correcta
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                                            <span className="font-semibold">{r.alumno}</span>
                                            {r.fecha && (
                                                <span className="text-[11px] text-muted-foreground ml-auto">
                                                    {new Date(r.fecha).toLocaleDateString("es-PE")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{r.respuesta}</p>
                                        {r.retroalimentacion && (
                                            <p className="text-xs mt-2 pt-2 border-t border-border text-muted-foreground">
                                                <span className="font-semibold">Juez de IA:</span> {r.retroalimentacion}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </li>
    );
}

export default function BancoPreguntas({ semanaId }: { semanaId: string | number }) {
    const [filtro, setFiltro] = useState("");
    const [nivel, setNivel] = useState<string>("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["banco-preguntas", semanaId],
        queryFn: () => bancoPreguntasApi.porSemana(semanaId),
        enabled: !!semanaId,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <p className="text-sm text-muted-foreground py-4">
                No se pudo cargar el banco de preguntas de esta semana.
            </p>
        );
    }

    if (!data || data.total === 0) {
        return (
            <p className="text-sm text-muted-foreground py-4">
                {data?.nota ?? "Todavía no se ha generado ninguna pregunta para esta semana."}
            </p>
        );
    }

    const texto = filtro.trim().toLowerCase();
    const visibles = data.preguntas.filter((p) => {
        if (nivel && (p.nivelBloom ?? "").toUpperCase() !== nivel) return false;
        if (!texto) return true;
        return p.enunciado.toLowerCase().includes(texto)
            || (p.conceptos ?? "").toLowerCase().includes(texto);
    });

    const niveles = Object.keys(data.porNivelBloom).filter((n) => n !== "sin etiqueta");

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {Object.entries(data.porNivelBloom).map(([n, c]) => (
                    <span key={n} className={cn(
                        "text-[11px] font-semibold px-2.5 py-1 rounded-lg",
                        chipBloom(n))}>
                        {n}: {c}
                    </span>
                ))}
            </div>

            {data.sinRespuestaCorrecta > 0 && (
                <p className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                        {data.sinRespuestaCorrecta} de {data.total} preguntas no tienen guardada su
                        respuesta correcta. A esos alumnos el historial les dice si acertaron, pero
                        no qué era lo correcto.
                    </span>
                </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        placeholder="Buscar por enunciado o concepto..."
                        className="w-full min-h-[42px] pl-9 pr-3 rounded-xl border border-border bg-card text-sm"
                    />
                </div>
                <select
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value)}
                    className="min-h-[42px] px-3 rounded-xl border border-border bg-card text-sm font-semibold"
                >
                    <option value="">Todos los niveles</option>
                    {niveles.map((n) => <option key={n} value={n.toUpperCase()}>{n}</option>)}
                </select>
            </div>

            <ul className="border border-border rounded-xl overflow-hidden bg-card">
                {visibles.length === 0 ? (
                    <li className="px-4 py-6 text-sm text-muted-foreground text-center">
                        Ninguna pregunta coincide con el filtro.
                    </li>
                ) : visibles.map((p) => <Fila key={p.id} p={p} />)}
            </ul>
        </div>
    );
}
