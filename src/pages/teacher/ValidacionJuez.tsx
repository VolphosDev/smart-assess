import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    Loader2, ShieldCheck, ScatterChart, AlertTriangle, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { validacionJuezApi, type CasoParaCalificar } from "@/api/validacionJuez";
import { reproducirClic } from "@/lib/sonidos";

/**
 * Calificación a ciegas para validar el juez de IA.
 *
 * La nota que puso la IA NO se muestra mientras el docente califica, y no es un descuido de
 * la interfaz: si la viera, tendería a confirmarla, y la concordancia resultante mediría la
 * sugestión en vez del acuerdo real. El backend tampoco la envía en este endpoint.
 */

type Origen = "PRACTICA" | "ARIA";

export default function ValidacionJuez() {
    const [origen, setOrigen] = useState<Origen>("PRACTICA");
    const [indice, setIndice] = useState(0);
    const [comentario, setComentario] = useState("");
    const [verResultados, setVerResultados] = useState(false);
    const queryClient = useQueryClient();

    const { data: pendientes = [], isLoading } = useQuery({
        queryKey: ["validacion-pendientes", origen],
        queryFn: () => validacionJuezApi.pendientes(origen, 30),
    });

    const { data: concordancia } = useQuery({
        queryKey: ["validacion-concordancia", origen],
        queryFn: () => validacionJuezApi.concordancia(origen),
    });

    const { data: desacuerdos = [] } = useQuery({
        queryKey: ["validacion-desacuerdos", origen],
        queryFn: () => validacionJuezApi.desacuerdos(origen),
        enabled: verResultados,
    });

    const construir = useMutation({
        mutationFn: () => validacionJuezApi.construirMuestra(origen, 150),
        onSuccess: (r) => {
            toast.success(r.mensaje);
            queryClient.invalidateQueries({ queryKey: ["validacion-pendientes", origen] });
            queryClient.invalidateQueries({ queryKey: ["validacion-concordancia", origen] });
        },
        onError: () => toast.error("No se pudo armar la muestra."),
    });

    const calificar = useMutation({
        mutationFn: ({ muestraId, puntuacion }: { muestraId: number; puntuacion: number }) =>
            validacionJuezApi.calificar(muestraId, puntuacion, comentario || undefined),
        onSuccess: () => {
            setComentario("");
            setIndice((i) => i + 1);
            queryClient.invalidateQueries({ queryKey: ["validacion-concordancia", origen] });
        },
        onError: (e: any) => toast.error(e?.message || "No se pudo guardar la calificación."),
    });

    const caso: CasoParaCalificar | undefined = pendientes[indice];

    const cambiarOrigen = (nuevo: Origen) => {
        setOrigen(nuevo);
        setIndice(0);
        setComentario("");
    };

    const etiquetaEscala = (valor: number, min: number, max: number) => {
        if (min === 0 && max === 1) return valor === 1 ? "Correcta" : "Incorrecta";
        return ["Deficiente", "Regular", "Buena", "Excelente"][valor - 1] ?? String(valor);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="font-display text-3xl font-bold flex items-center gap-2">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                    Validación del calificador automático
                </h1>
                <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
                    Califique estas respuestas como lo haría normalmente. No verá la nota que puso
                    la inteligencia artificial hasta el final: si la viera antes, tendería a
                    confirmarla y la comparación dejaría de ser válida.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {(["PRACTICA", "ARIA"] as Origen[]).map((o) => (
                    <button
                        key={o}
                        onClick={() => { reproducirClic(); cambiarOrigen(o); }}
                        className={`min-h-[44px] px-4 rounded-xl font-semibold text-sm border transition-colors ${
                            origen === o
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:bg-muted/60"
                        }`}
                    >
                        {o === "PRACTICA" ? "Respuestas de examen" : "Turnos con Aria"}
                    </button>
                ))}
                <button
                    onClick={() => { reproducirClic(); construir.mutate(); }}
                    disabled={construir.isPending}
                    className="min-h-[44px] px-4 rounded-xl font-semibold text-sm border border-border bg-card hover:bg-muted/60 inline-flex items-center gap-2 disabled:opacity-50"
                >
                    {construir.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />}
                    Armar muestra
                </button>
            </div>

            {/* Progreso */}
            {concordancia && (
                <div className="bg-card border border-border rounded-xl p-4 text-sm flex flex-wrap gap-x-6 gap-y-1">
                    <span><strong>{concordancia.casosEnMuestra}</strong> casos en la muestra</span>
                    <span><strong>{concordancia.calificacionesRecibidas}</strong> ya calificados</span>
                    <span><strong>{concordancia.docentesParticipantes}</strong> docentes participando</span>
                </div>
            )}

            {/* Caso a calificar */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : !caso ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg">No quedan casos pendientes</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        {pendientes.length === 0 && (concordancia?.casosEnMuestra ?? 0) === 0
                            ? "Pulse «Armar muestra» para seleccionar respuestas al azar."
                            : "Ya calificó todos los casos de esta muestra. Gracias."}
                    </p>
                </div>
            ) : (
                <motion.div
                    key={caso.muestraId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-xs"
                >
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Caso {indice + 1} de {pendientes.length}
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Pregunta</div>
                        <p className="font-semibold">{caso.pregunta}</p>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                            Respuesta del estudiante
                        </div>
                        <p className="bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                            {caso.respuestaAlumno}
                        </p>
                    </div>

                    {caso.respuestaCorrecta && (
                        <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">
                                Criterio esperado
                            </div>
                            <p className="text-sm text-muted-foreground">{caso.respuestaCorrecta}</p>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Comentario (opcional) — por qué califica así
                        </label>
                        <textarea
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                            placeholder="Sirve para revisar después los casos en que usted y la IA discreparon."
                        />
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Su calificación</div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(
                                { length: caso.escalaMax - caso.escalaMin + 1 },
                                (_, i) => caso.escalaMin + i
                            ).map((valor) => (
                                <button
                                    key={valor}
                                    disabled={calificar.isPending}
                                    onClick={() => {
                                        reproducirClic();
                                        calificar.mutate({ muestraId: caso.muestraId, puntuacion: valor });
                                    }}
                                    className="min-h-[44px] px-4 rounded-xl border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary font-semibold text-sm transition-colors disabled:opacity-50"
                                >
                                    {valor} · {etiquetaEscala(valor, caso.escalaMin, caso.escalaMax)}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Resultados */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                    onClick={() => { reproducirClic(); setVerResultados((v) => !v); }}
                    className="w-full p-5 flex items-center justify-between hover:bg-muted/40 transition-colors"
                >
                    <span className="font-display font-bold text-lg flex items-center gap-2">
                        <ScatterChart className="w-5 h-5 text-primary" />
                        Resultado de la concordancia
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {verResultados ? "Ocultar" : "Ver"}
                    </span>
                </button>

                {verResultados && concordancia && (
                    <div className="border-t border-border p-5 space-y-4">
                        <div className="grid sm:grid-cols-3 gap-3">
                            {[
                                { etiqueta: "Kappa ponderada", valor: concordancia.kappaCuadratica.toFixed(3), nota: "cifra principal" },
                                { etiqueta: "Acuerdo exacto", valor: `${(concordancia.acuerdoExacto * 100).toFixed(1)}%`, nota: "coincidencias" },
                                { etiqueta: "Sesgo medio", valor: concordancia.sesgoMedio.toFixed(2), nota: "IA menos docente" },
                            ].map((m) => (
                                <div key={m.etiqueta} className="bg-muted/40 rounded-lg p-4">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {m.etiqueta}
                                    </div>
                                    <div className="font-display font-bold text-2xl mt-1">{m.valor}</div>
                                    <div className="text-xs text-muted-foreground">{m.nota}</div>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                            <span>{concordancia.interpretacion}</span>
                        </p>

                        {desacuerdos.length > 0 && (
                            <div>
                                <h4 className="font-display font-bold mb-2">
                                    Desacuerdos ({desacuerdos.length})
                                </h4>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Aquí es donde se ve qué falla el calificador automático.
                                </p>
                                <ul className="space-y-2 max-h-80 overflow-y-auto">
                                    {desacuerdos.map((d) => (
                                        <li key={`${d.muestraId}-${d.docente}`}
                                            className="border border-border rounded-lg p-3 text-sm">
                                            <p className="font-semibold">{d.pregunta}</p>
                                            <p className="text-muted-foreground mt-1">{d.respuestaAlumno}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                                                    <XCircle className="w-3 h-3" /> IA: {d.puntuacionIa}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                                                    <CheckCircle2 className="w-3 h-3" /> {d.docente}: {d.puntuacionDocente}
                                                </span>
                                            </div>
                                            {d.comentario && (
                                                <p className="text-xs text-muted-foreground mt-2 italic">
                                                    “{d.comentario}”
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
