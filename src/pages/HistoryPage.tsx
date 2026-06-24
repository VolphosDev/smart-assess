import { useQuery } from "@tanstack/react-query";
import { intentosApi } from "@/api/courses";
import { useState } from "react";
import { Loader2, Eye } from "lucide-react";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import { motion } from "framer-motion";
import { getCourseIcon } from "@/lib/icon-mapper";

export default function HistoryPage() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [intentoAbierto, setIntentoAbierto] = useState<any | null>(null);

    const { data: intentos = [], isLoading } = useQuery({
        queryKey: ["mis-intentos", user.id],
        queryFn: () => intentosApi.misIntentos(Number(user.id)),
        enabled: !!user.id,
    });

    const avg = intentos.length
        ? (intentos.reduce((a: number, b: any) => a + b.nota, 0) / intentos.length).toFixed(1)
        : "0.0";

    const getTecnicaLabel = (tecnica: string) => {
        if (!tecnica) return "Práctica";
        switch (tecnica.toLowerCase()) {
            case "opcion_multiple": return "Opción múltiple";
            case "verdadero_falso": return "Verdadero / Falso";
            case "abierta": return "Pregunta abierta";
            case "deteccion_errores": return "Detección de errores";
            case "visual_quiz": return "Visual Quiz";
            case "avatar": return "Avatar Tutor";
            case "video": return "Video Tutor";
            case "adaptativa": return "Evaluación Recomendadora";
            default: return tecnica;
        }
    };

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

    const data = processedChronological.map((h: any) => ({
        name: `Sem ${h.semana}`,
        score: h.nota,
    }));

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-4xl font-bold mb-1">Tu progreso</h1>
                <p className="text-muted-foreground text-sm">Revisa cada intento y descubre tus puntos a reforzar.</p>
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
                <div className="bg-hero-gradient rounded-xl p-6 shadow-sm text-primary-foreground flex flex-col justify-center">
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
                    <div className="bg-card rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
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
                                {intentoAbierto.semana} · {getTecnicaLabel(intentoAbierto.tecnica)} (Intento #{intentoAbierto.attemptNumber})
                            </p>
                        </div>
                        <ul className="space-y-3">
                            {intentoAbierto.respuestas.map((r: any, i: number) => (
                                <li key={i} className={`p-4 rounded-xl border text-sm space-y-1 ${r.esCorrecta ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                                    <p className="font-semibold text-foreground">{i + 1}. {r.pregunta}</p>
                                    <p className="text-muted-foreground">Tu respuesta: <span className="font-medium text-foreground">{r.respuesta}</span></p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${r.esCorrecta ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                                        {r.esCorrecta ? "Correcto" : "Incorrecto"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setIntentoAbierto(null)}
                                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}