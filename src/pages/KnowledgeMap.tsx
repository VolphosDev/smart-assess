import { useQuery } from "@tanstack/react-query";
import { rendimientoApi } from "@/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Brain, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle, ArrowRight, BookOpen, Calendar, HelpCircle as InfoIcon, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/icon-mapper";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend
} from "recharts";

const nivelConfig = {
    DOMINADO: {
        label: "Dominado",
        icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-200 dark:border-emerald-800/60",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        cellColor: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10",
        bar: "bg-emerald-500",
        glow: "shadow-emerald-100 dark:shadow-emerald-900/20",
    },
    EN_PROGRESO: {
        label: "En progreso",
        icon: TrendingUp,
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-amber-200 dark:border-amber-800/60",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        cellColor: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10",
        bar: "bg-amber-500",
        glow: "shadow-amber-100 dark:shadow-amber-900/20",
    },
    DEBIL: {
        label: "Necesita refuerzo",
        icon: AlertTriangle,
        bg: "bg-red-50 dark:bg-red-950/20",
        border: "border-red-200 dark:border-red-800/60",
        text: "text-red-700 dark:text-red-400",
        badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        cellColor: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10",
        bar: "bg-rose-500",
        glow: "shadow-red-100 dark:shadow-red-900/20",
    },
    SIN_DATOS: {
        label: "Sin datos",
        icon: HelpCircle,
        bg: "bg-muted/10",
        border: "border-border/60",
        text: "text-muted-foreground",
        badge: "bg-muted text-muted-foreground",
        cellColor: "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700",
        bar: "bg-muted-foreground/30",
        glow: "",
    },
} as const;

export default function KnowledgeMap() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const studentId = user.id;

    const { data: mapaCalor = [], isLoading } = useQuery({
        queryKey: ["mapa-calor", studentId],
        queryFn: () => rendimientoApi.mapaCalor(studentId),
        enabled: !!studentId,
    });

    const [selectedCell, setSelectedCell] = useState<any>(null);

    // Obtener todas las semanas ordenadas
    const semanasSet = new Set<string>();
    mapaCalor.forEach((entry: any) => {
        if (entry.numSem) semanasSet.add(entry.numSem);
    });

    const todasLasSemanas = Array.from(semanasSet).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.replace(/\D/g, "")) || 0;
        return numA - numB;
    });

    const semanasLista = todasLasSemanas.length > 0 ? todasLasSemanas : ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];

    // Agrupar cursos únicos
    const cursosMap: Record<string, { emoji: string; color: string; id: string; name: string }> = {};
    mapaCalor.forEach((entry: any) => {
        if (entry.cursoNombre && !cursosMap[entry.cursoNombre]) {
            cursosMap[entry.cursoNombre] = {
                emoji: entry.cursoEmoji || "📚",
                color: entry.cursoColor || "primary",
                id: entry.cursoId,
                name: entry.cursoNombre
            };
        }
    });

    const cursosLista = Object.values(cursosMap);

    // Encontrar entrada en la matriz
    const getMatrixEntry = (cursoNombre: string, numSem: string) => {
        return mapaCalor.find((e: any) => e.cursoNombre === cursoNombre && e.numSem === numSem);
    };

    // Auto-seleccionar la primera celda disponible
    useEffect(() => {
        if (mapaCalor.length > 0 && !selectedCell) {
            setSelectedCell(mapaCalor[0]);
        }
    }, [mapaCalor, selectedCell]);

    // Estadísticas generales
    const totalTemas = mapaCalor.length;
    const dominados = mapaCalor.filter((e: any) => e.nivel === "DOMINADO").length;
    const enProgreso = mapaCalor.filter((e: any) => e.nivel === "EN_PROGRESO").length;
    const debiles = mapaCalor.filter((e: any) => e.nivel === "DEBIL").length;

    // Datos de progreso para el gráfico temporal
    const chartData = todasLasSemanas.map((sem) => {
        const entries = mapaCalor.filter((e: any) => e.numSem === sem && e.promedioNota > 0);
        const promedio = entries.length > 0
            ? entries.reduce((sum: number, e: any) => sum + e.promedioNota, 0) / entries.length
            : 0;
        return {
            name: sem,
            Nota: parseFloat(promedio.toFixed(1)),
        };
    }).filter(d => d.Nota > 0);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Analizando tu rendimiento cognitivo...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-left">
                <h1 className="font-display text-4xl font-bold mb-1 flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
                        <Brain className="w-6 h-6" />
                    </span>
                    Mapa de Conocimiento
                </h1>
                <p className="text-muted-foreground text-sm ml-14 max-w-2xl leading-relaxed">
                    Visualiza y haz clic en cada celda del mapa de calor para obtener un diagnóstico pedagógico preciso de tus fortalezas y debilidades.
                </p>
            </div>

            {/* Stats summary */}
            {totalTemas > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <StatMini label="Temas Evaluados" value={totalTemas} tone="indigo" />
                    <StatMini label="Dominados (≥75%)" value={dominados} tone="emerald" />
                    <StatMini label="En Progreso (50-74%)" value={enProgreso} tone="amber" />
                    <StatMini label="Necesitan Refuerzo (<50%)" value={debiles} tone="red" />
                </motion.div>
            )}

            {/* No data state */}
            {totalTemas === 0 && (
                <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center space-y-3">
                    <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <h3 className="font-display font-bold text-lg">Aún no tienes datos de rendimiento</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Completa evaluaciones recomendadoras y formativas en tus cursos para ver el mapa de calor bidimensional aquí.
                    </p>
                </div>
            )}

            {totalTemas > 0 && (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Heatmap Matrix Block */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* ── TRUE HEAT MAP ───────────────────────────────────── */}
                        <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs">🔥</span>
                                    Mapa de Calor de Conocimiento
                                </h3>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    Menor ← intensidad → Mayor dominio
                                </span>
                            </div>

                            {/* Heatmap Grid: rows = cursos, cols = semanas */}
                            <div className="overflow-x-auto">
                                <div className="min-w-[400px] space-y-2.5 pb-1">
                                    {/* Column headers (semanas) */}
                                    <div className="flex items-center gap-2 pl-[148px] mb-1">
                                        {semanasLista.map((sem) => (
                                            <div key={sem} className="w-14 text-center text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest shrink-0">
                                                S{sem.replace(/\D/g, "")}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Row = curso */}
                                    {cursosLista.map((curso) => (
                                        <div key={curso.name} className="flex items-center gap-2">
                                            {/* Row label */}
                                            <div className="w-[140px] shrink-0 flex items-center gap-1.5 pr-2">
                                                <span className="text-lg shrink-0">{curso.emoji}</span>
                                                <span className="text-[11px] font-bold text-foreground/80 truncate leading-tight" title={curso.name}>{curso.name}</span>
                                            </div>

                                            {/* Cells */}
                                            {semanasLista.map((sem) => {
                                                const entry = getMatrixEntry(curso.name, sem);
                                                const pct = entry ? entry.porcentaje : null;
                                                const isSelected = selectedCell && entry && selectedCell.semanaId === entry.semanaId;

                                                // Color intensity based on percentage
                                                const cellBg = pct === null
                                                    ? "bg-muted/30 dark:bg-muted/10 border border-border/30"
                                                    : pct >= 85
                                                    ? "bg-emerald-500 dark:bg-emerald-500 shadow-emerald-500/30 shadow-sm"
                                                    : pct >= 75
                                                    ? "bg-emerald-400 dark:bg-emerald-400"
                                                    : pct >= 65
                                                    ? "bg-amber-400 dark:bg-amber-400"
                                                    : pct >= 50
                                                    ? "bg-amber-500 dark:bg-amber-500"
                                                    : pct >= 35
                                                    ? "bg-rose-400 dark:bg-rose-400"
                                                    : "bg-rose-600 dark:bg-rose-600";

                                                return (
                                                    <button
                                                        key={sem}
                                                        onClick={() => entry && setSelectedCell(entry)}
                                                        disabled={!entry}
                                                        title={entry ? `${curso.name} · ${sem}: ${pct}% aciertos` : "Sin datos"}
                                                        className={cn(
                                                            "w-14 h-14 shrink-0 rounded-lg transition-all duration-200 relative group flex flex-col items-center justify-center gap-0.5",
                                                            cellBg,
                                                            entry ? "cursor-pointer hover:scale-105 hover:z-10 hover:shadow-lg" : "cursor-not-allowed opacity-40",
                                                            isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-background scale-105 z-10"
                                                        )}
                                                    >
                                                        {entry ? (
                                                            <>
                                                                <span className="text-[11px] font-black text-white leading-none">{pct}%</span>
                                                                <span className="text-[8px] text-white/70 font-semibold leading-none">{entry.totalIntentos}int</span>
                                                            </>
                                                        ) : (
                                                            <HelpCircle className="w-4 h-4 text-muted-foreground/30" />
                                                        )}
                                                        {/* Tooltip */}
                                                        {entry && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-foreground text-background rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                                                {curso.name} · {sem}<br/><span className="font-black text-sm">{pct}%</span> aciertos
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Heatmap gradient legend */}
                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/40">
                                <span className="text-[10px] text-muted-foreground font-semibold">Sin datos / Bajo</span>
                                <div className="flex gap-1 items-center">
                                    {[
                                        { bg: "bg-muted/40 border border-border/40", label: "Sin datos" },
                                        { bg: "bg-rose-600", label: "<35%" },
                                        { bg: "bg-rose-400", label: "35%" },
                                        { bg: "bg-amber-500", label: "50%" },
                                        { bg: "bg-amber-400", label: "65%" },
                                        { bg: "bg-emerald-400", label: "75%" },
                                        { bg: "bg-emerald-500", label: "≥85%" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex flex-col items-center gap-0.5">
                                            <div className={cn("w-6 h-6 rounded", item.bg)} />
                                            <span className="text-[8px] text-muted-foreground/60 font-semibold">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-semibold">Alto dominio</span>
                            </div>
                        </div>
                        {/* ── END TRUE HEAT MAP ───────────────────────────────── */}

                        <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xs relative overflow-hidden">

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" /> Matriz de Progreso de Cursos
                                </h3>
                                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                    <InfoIcon className="w-3.5 h-3.5" /> Haz clic en cualquier cuadrante
                                </div>
                            </div>

                            {/* Matrix Table */}
                            <div className="overflow-x-auto">
                                <div className="min-w-[500px] space-y-3 pb-2">
                                    {/* Weeks Header Row */}
                                    <div className="grid grid-cols-12 items-center text-center">
                                        <div className="col-span-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">
                                            Asignaturas
                                        </div>
                                        <div className="col-span-8 grid" style={{ gridTemplateColumns: `repeat(${semanasLista.length}, minmax(0, 1fr))` }}>
                                            {semanasLista.map((sem) => (
                                                <div key={sem} className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                                    Sem {sem.replace(/\D/g, "")}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Course Matrix Rows */}
                                    {cursosLista.map((curso) => (
                                        <div key={curso.name} className="grid grid-cols-12 items-center bg-muted/20 dark:bg-muted/5 border border-border/40 rounded-lg p-2.5 transition-all hover:bg-muted/30 dark:hover:bg-muted/10">
                                            {/* Course Title */}
                                            <div className="col-span-4 flex items-center gap-2 text-left min-w-0 pr-2">
                                                <span className="text-xl shrink-0" role="img" aria-label={curso.name}>
                                                    {curso.emoji}
                                                </span>
                                                <span className="font-bold text-sm truncate text-foreground/90" title={curso.name}>
                                                    {curso.name}
                                                </span>
                                            </div>

                                            {/* Week Cells */}
                                            <div className="col-span-8 grid gap-2" style={{ gridTemplateColumns: `repeat(${semanasLista.length}, minmax(0, 1fr))` }}>
                                                {semanasLista.map((sem) => {
                                                    const entry = getMatrixEntry(curso.name, sem);
                                                    const config = entry ? nivelConfig[entry.nivel as keyof typeof nivelConfig] : nivelConfig.SIN_DATOS;
                                                    const isSelected = selectedCell && entry && selectedCell.semanaId === entry.semanaId;

                                                    return (
                                                        <button
                                                            key={sem}
                                                            onClick={() => entry && setSelectedCell(entry)}
                                                            disabled={!entry}
                                                            className={cn(
                                                                "h-12 w-full rounded-md transition-all flex flex-col items-center justify-center relative cursor-pointer group shadow-2xs border border-transparent",
                                                                config.cellColor,
                                                                !entry && "opacity-40 cursor-not-allowed",
                                                                isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-background scale-102 border-white"
                                                            )}
                                                            title={entry ? `${curso.name} - ${sem}: ${entry.porcentaje}% aciertos` : "Sin datos"}
                                                        >
                                                            {entry ? (
                                                                <>
                                                                    <span className="font-display font-black text-xs text-white">
                                                                        {entry.porcentaje}%
                                                                    </span>
                                                                    <span className="text-[8px] text-white/80 font-bold leading-none mt-0.5">
                                                                        {entry.totalIntentos} int
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <HelpCircle className="w-4 h-4 text-muted-foreground/40" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Legend in Heatmap Card */}
                            <div className="border-t border-border/50 pt-5 mt-6 flex flex-wrap justify-center gap-6">
                                {(["DOMINADO", "EN_PROGRESO", "DEBIL", "SIN_DATOS"] as const).map((nivel) => {
                                    const c = nivelConfig[nivel];
                                    const Icon = c.icon;
                                    return (
                                        <div key={nivel} className="flex items-center gap-2">
                                            <div className={cn("w-4 h-4 rounded-md shadow-xs", c.bar || "bg-slate-200 dark:bg-slate-800")} />
                                            <Icon className={cn("w-4 h-4 shrink-0", c.text)} />
                                            <span className="text-xs font-semibold text-foreground">{c.label}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {nivel === "DOMINADO" ? "(≥75%)" : nivel === "EN_PROGRESO" ? "(50-74%)" : nivel === "DEBIL" ? "(<50%)" : ""}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Weekly Progression Chart Card */}
                        {chartData.length > 0 && (
                            <div className="bg-card border border-border/80 rounded-xl p-6 shadow-xs text-left">
                                <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-indigo-500" /> Curva de Progreso Académico
                                </h3>
                                <p className="text-xs text-muted-foreground mb-6">
                                    Muestra el promedio de notas obtenido semana a semana en todas tus asignaturas.
                                </p>
                                <div className="h-60 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.08)" />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis domain={[0, 20]} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                            <ChartTooltip
                                                contentStyle={{
                                                    backgroundColor: "var(--card)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="Nota"
                                                stroke="var(--primary)"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorNota)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detailed Sidebar Block */}
                    <div className="lg:col-span-1">
                        <AnimatePresence mode="wait">
                            {selectedCell ? (
                                <motion.div
                                    key={selectedCell.semanaId}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={cn(
                                        "bg-card border rounded-xl p-6 shadow-xs text-left h-full flex flex-col justify-between relative overflow-hidden",
                                        nivelConfig[selectedCell.nivel as keyof typeof nivelConfig]?.border
                                    )}
                                >
                                    {/* Glass gradient background */}
                                    <div className="absolute inset-0 bg-linear-gradient opacity-10 pointer-events-none" />

                                    <div className="space-y-6 relative z-10">
                                        {/* Tag and Title */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                                                Detalle de Rendimiento
                                            </span>
                                            <span className="text-xl" role="img" aria-label={selectedCell.cursoNombre}>
                                                {selectedCell.cursoEmoji}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="font-display font-extrabold text-xl leading-snug">
                                                {selectedCell.cursoNombre}
                                            </h4>
                                            <p className="text-xs font-black text-primary uppercase tracking-widest">
                                                {selectedCell.numSem}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={cn(
                                            "flex items-center gap-2 p-3.5 rounded-xl border",
                                            nivelConfig[selectedCell.nivel as keyof typeof nivelConfig]?.bg,
                                            nivelConfig[selectedCell.nivel as keyof typeof nivelConfig]?.border,
                                        )}>
                                            {(() => {
                                                const config = nivelConfig[selectedCell.nivel as keyof typeof nivelConfig];
                                                const Icon = config.icon;
                                                return (
                                                    <>
                                                        <Icon className={cn("w-5 h-5 shrink-0", config.text)} />
                                                        <div>
                                                            <p className={cn("text-xs font-black uppercase tracking-wider", config.text)}>
                                                                {config.label}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                                                {selectedCell.porcentaje}% de respuestas correctas
                                                            </p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* Habilidades Bloom */}
                                        <div className="space-y-3.5 pt-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-foreground">Porcentaje de Aciertos</span>
                                                <span className="font-display font-black text-2xl text-primary">{selectedCell.porcentaje}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className={cn("h-full rounded-full transition-all duration-500", nivelConfig[selectedCell.nivel as keyof typeof nivelConfig]?.bar)}
                                                    style={{ width: `${selectedCell.porcentaje}%` }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 text-xs">
                                                <div className="space-y-0.5">
                                                    <span className="text-muted-foreground font-semibold block">Preguntas</span>
                                                    <span className="font-bold text-foreground">{selectedCell.correctas} de {selectedCell.totalPreguntas}</span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-muted-foreground font-semibold block">Intentos</span>
                                                    <span className="font-bold text-foreground">{selectedCell.totalIntentos} exámenes</span>
                                                </div>
                                                {selectedCell.promedioNota > 0 && (
                                                    <div className="space-y-0.5 col-span-2 border-t border-border/30 pt-2">
                                                        <span className="text-muted-foreground font-semibold block">Nota Promedio</span>
                                                        <span className="font-black text-base text-foreground">{selectedCell.promedioNota} de 20</span>
                                                    </div>
                                                )}
                                            </div>
                                    </div>
                                </div>
                            </motion.div>
                            ) : (
                                <div className="bg-card border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center h-full text-muted-foreground">
                                    <Brain className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                    <span className="text-xs font-semibold">Selecciona una celda para ver el desglose</span>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatMini({ label, value, tone }: { label: string; value: number; tone: "indigo" | "emerald" | "amber" | "red" }) {
    const toneMap = {
        indigo: "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
        amber: "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400",
        red: "bg-red-50 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400",
    };
    return (
        <div className={cn("rounded-xl border p-4 text-center shadow-2xs transition-all hover:scale-[1.01]", toneMap[tone])}>
            <div className="font-display font-black text-3xl">{value}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider mt-1.5 opacity-80">{label}</div>
        </div>
    );
}
