import { useQuery } from "@tanstack/react-query";
import { intentosApi } from "@/api/courses";
import { useState } from "react";
import { Loader2, Eye, Download, Printer, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import {
    etiquetaTecnica,
    exportarHistorialCompleto,
    exportarIntento,
    totalPreguntas,
} from "@/lib/exportar-historial";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import { motion } from "framer-motion";
import { getCourseIcon } from "@/lib/icon-mapper";

export default function HistoryPage() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [intentoAbierto, setIntentoAbierto] = useState<any | null>(null);

    const { data: rawIntentos = [], isLoading } = useQuery({
        queryKey: ["mis-intentos", user.id],
        queryFn: () => intentosApi.misIntentos(Number(user.id)),
        enabled: !!user.id,
    });

    const intentos = rawIntentos.filter((h: any) => 
        h.tipoEvaluacion !== "DIAGNOSTICA" && 
        h.tecnica?.toLowerCase() !== "adaptativa"
    );

    const avg = intentos.length
        ? (intentos.reduce((a: number, b: any) => a + b.nota, 0) / intentos.length).toFixed(1)
        : "0.0";

    // `etiquetaTecnica` vive ahora en lib/exportar-historial: la usan también las descargas,
    // y tener dos copias del mismo switch era garantía de que se separaran con el tiempo.
    const getTecnicaLabel = etiquetaTecnica;

    const sortedChronological = [...intentos].reverse();
    const counters: Record<string, number> = {};
    const processedChronological = sortedChronological.map((h: any) => {
        const key = `${h.cursoNombre}_${h.semana}_${h.tecnica || "PRAC"}`;
        counters[key] = (counters[key] || 0) + 1;
        return {
            ...h,
            attemptNumber: counters[key]
        };
    });
    const intentosProcesados = [...processedChronological].reverse();

    const descargarTodo = () => {
        if (totalPreguntas(intentosProcesados) === 0) {
            toast.warning("Todavía no tienes preguntas registradas para descargar.");
            return;
        }
        exportarHistorialCompleto(intentosProcesados, user?.nombre);
        toast.success("Descargamos tus preguntas y respuestas.");
    };

    const data = processedChronological.map((h: any) => ({
        name: `Sem ${h.semana}`,
        score: h.nota,
    }));

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-4xl font-bold mb-1">Tu progreso</h1>
                    <p className="text-muted-foreground text-sm">Revisa cada intento y descubre tus puntos a reforzar.</p>
                </div>
                <button
                    onClick={descargarTodo}
                    className="inline-flex items-center justify-center gap-2 shrink-0 min-h-[44px] px-4 rounded-xl border border-border bg-card font-semibold text-sm hover:bg-muted/60 transition-colors shadow-xs"
                >
                    <Download className="w-4 h-4" />
                    Descargar mis preguntas y respuestas
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display font-bold text-xl">Evolución de notas</h3>
                        <span className="text-sm text-muted-foreground">Últimos {intentos.length} intentos</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer>
                            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <YAxis domain={[0, 20]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8,
                                    }}
                                />
                                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-hero-gradient rounded-xl p-6 shadow-sm flex flex-col justify-center">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Promedio general</div>
                    <div className="font-display font-bold text-5xl mb-1">{avg}</div>
                    <div className="opacity-90 text-sm">de un total de 20 puntos · Avance constante</div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h3 className="font-display font-bold text-lg">Intentos recientes</h3>
                </div>
                <ul className="divide-y divide-border">
                    {intentosProcesados.map((h: any, i: number) => (
                        <motion.li key={h.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: i * 0.04 }}
                                   className="flex items-center gap-4 p-5 hover:bg-muted/40 transition cursor-pointer"
                                   onClick={() => setIntentoAbierto(h)}
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                                {getCourseIcon(h.cursoEmoji || "📘", "w-5 h-5")}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-sm">
                                    {h.cursoNombre} · {h.semana} · {getTecnicaLabel(h.tecnica)} (Intento #{h.attemptNumber})
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(h.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver respuestas
                                </span>
                                <span className="flex sm:hidden items-center justify-center text-xs font-semibold text-primary border border-primary/20 bg-primary/5 p-2 rounded-lg hover:bg-primary/10 transition-colors" title="Ver respuestas anteriores">
                                    <Eye className="w-4 h-4" />
                                </span>
                                <div className={`px-3.5 py-1.5 rounded-full font-display font-bold text-sm ${h.nota >= 17 ? "bg-green-100 text-green-800" : h.nota >= 14 ? "bg-indigo-100 text-indigo-800" : "bg-red-100 text-red-800"}`}>
                                    {h.nota}/20
                                </div>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            </div>

            {/* Modal de detalle */}
            {intentoAbierto && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                     onClick={() => setIntentoAbierto(null)}>
                    <div id="hoja-imprimible"
                         className="bg-card rounded-xl shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4"
                         onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 border-b border-border pb-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                                    <span className="text-primary">{getCourseIcon(intentoAbierto.cursoEmoji || "📘", "w-5 h-5")}</span>
                                    <span className="truncate max-w-[280px]">{intentoAbierto.cursoNombre}</span>
                                </h3>
                                <span className="font-bold text-primary text-lg shrink-0">{intentoAbierto.nota}/20</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-semibold">
                                {intentoAbierto.nombreTema || intentoAbierto.semana} · {getTecnicaLabel(intentoAbierto.tecnica)} (Intento #{intentoAbierto.attemptNumber})
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(intentoAbierto.fecha).toLocaleString("es-PE")}{" · "}
                                {intentoAbierto.respuestas.filter((r: any) => r.esCorrecta).length} de{" "}
                                {intentoAbierto.respuestas.length} correctas
                            </p>
                        </div>

                        <ul className="space-y-3">
                            {intentoAbierto.respuestas.map((r: any, i: number) => (
                                <li key={i} className={`p-4 rounded-xl border text-sm space-y-2 ${r.esCorrecta ? "border-green-300 bg-green-50/60" : "border-red-300 bg-red-50/60"}`}>
                                    <div className="flex items-start gap-2">
                                        {r.esCorrecta
                                            ? <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                                            : <XCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />}
                                        <p className="font-semibold text-foreground flex-1">{i + 1}. {r.pregunta}</p>
                                    </div>

                                    <p className="text-muted-foreground">
                                        Tu respuesta: <span className="font-medium text-foreground">{r.respuesta}</span>
                                    </p>

                                    {/* Lo que antes faltaba: saber que fallaste no enseña nada;
                                        lo que enseña es ver cuál era la correcta. Solo se muestra
                                        cuando el alumno falló — repetirla cuando acertó es ruido. */}
                                    {!r.esCorrecta && r.respuestaCorrecta && (
                                        <p className="text-green-900 bg-green-100/70 border border-green-200 rounded-lg px-3 py-2">
                                            <span className="font-bold">Lo correcto era:</span> {r.respuestaCorrecta}
                                        </p>
                                    )}

                                    {r.retroalimentacion && (
                                        <p className="flex items-start gap-2 text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                                            <span>{r.retroalimentacion}</span>
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${r.esCorrecta ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"}`}>
                                            {r.esCorrecta ? "Correcto" : "Incorrecto"}
                                        </span>
                                        {r.conceptos && (
                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">
                                                {r.conceptos}
                                            </span>
                                        )}
                                    </div>

                                    {/* Aviso solo para intentos anteriores a que se guardara este dato:
                                        una tarjeta sin "lo correcto era" parecería un fallo de la app. */}
                                    {!r.esCorrecta && !r.respuestaCorrecta && (
                                        <p className="text-xs text-muted-foreground italic">
                                            Este intento es anterior a que guardáramos la respuesta correcta, por eso no aparece aquí.
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-col sm:flex-row gap-2 no-imprimir">
                            <button onClick={() => { exportarIntento(intentoAbierto); toast.success("Descargamos este intento."); }}
                                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-border bg-card font-semibold text-sm hover:bg-muted/60 transition-colors">
                                <Download className="w-4 h-4" /> Descargar
                            </button>
                            <button onClick={() => window.print()}
                                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-border bg-card font-semibold text-sm hover:bg-muted/60 transition-colors">
                                <Printer className="w-4 h-4" /> Imprimir o guardar PDF
                            </button>
                            <button onClick={() => setIntentoAbierto(null)}
                                    className="flex-1 min-h-[44px] rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}