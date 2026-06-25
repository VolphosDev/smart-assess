import { useQuery } from "@tanstack/react-query";
import { rendimientoApi } from "@/api";
import { motion } from "framer-motion";
import { Loader2, Brain, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/icon-mapper";

const nivelConfig = {
    DOMINADO: {
        label: "Dominado",
        icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
        bar: "bg-emerald-500",
        glow: "shadow-emerald-100 dark:shadow-emerald-900/20",
    },
    EN_PROGRESO: {
        label: "En progreso",
        icon: TrendingUp,
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        bar: "bg-amber-500",
        glow: "shadow-amber-100 dark:shadow-amber-900/20",
    },
    DEBIL: {
        label: "Necesita refuerzo",
        icon: AlertTriangle,
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-400",
        badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        bar: "bg-red-500",
        glow: "shadow-red-100 dark:shadow-red-900/20",
    },
    SIN_DATOS: {
        label: "Sin datos",
        icon: HelpCircle,
        bg: "bg-muted/30",
        border: "border-border",
        text: "text-muted-foreground",
        badge: "bg-muted text-muted-foreground",
        bar: "bg-muted-foreground/30",
        glow: "",
    },
} as const;

const courseColorMap: Record<string, { accent: string; accentBg: string }> = {
    primary: { accent: "border-l-indigo-500", accentBg: "bg-indigo-500" },
    lime: { accent: "border-l-emerald-500", accentBg: "bg-emerald-500" },
    coral: { accent: "border-l-rose-500", accentBg: "bg-rose-500" },
};

export default function KnowledgeMap() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const studentId = user.id;

    const { data: mapaCalor = [], isLoading } = useQuery({
        queryKey: ["mapa-calor", studentId],
        queryFn: () => rendimientoApi.mapaCalor(studentId),
        enabled: !!studentId,
    });

    // Agrupar por curso
    const cursos: Record<string, any[]> = {};
    mapaCalor.forEach((entry: any) => {
        const key = entry.cursoNombre || "Sin curso";
        if (!cursos[key]) cursos[key] = [];
        cursos[key].push(entry);
    });

    // Estadísticas generales
    const totalTemas = mapaCalor.length;
    const dominados = mapaCalor.filter((e: any) => e.nivel === "DOMINADO").length;
    const enProgreso = mapaCalor.filter((e: any) => e.nivel === "EN_PROGRESO").length;
    const debiles = mapaCalor.filter((e: any) => e.nivel === "DEBIL").length;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Analizando tu rendimiento...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-display text-4xl font-bold mb-1 flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
                        <Brain className="w-6 h-6" />
                    </span>
                    Mapa de Conocimiento
                </h1>
                <p className="text-muted-foreground text-sm ml-14">
                    Visualiza tu nivel de dominio en cada tema. Verde = dominas, amarillo = en progreso, rojo = necesita refuerzo.
                </p>
            </div>

            {/* Stats summary */}
            {totalTemas > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <StatMini label="Temas evaluados" value={totalTemas} tone="indigo" />
                    <StatMini label="Dominados" value={dominados} tone="emerald" />
                    <StatMini label="En progreso" value={enProgreso} tone="amber" />
                    <StatMini label="Necesitan refuerzo" value={debiles} tone="red" />
                </motion.div>
            )}

            {/* No data */}
            {totalTemas === 0 && (
                <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center space-y-3">
                    <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <h3 className="font-display font-bold text-lg">Aún no tienes datos de rendimiento</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Completa evaluaciones en tus cursos para ver tu mapa de conocimiento aquí. Cada tema que practiques se reflejará con su nivel de dominio.
                    </p>
                </div>
            )}

            {/* Courses grouped */}
            {Object.entries(cursos).map(([cursoNombre, entries]) => {
                const sample = entries[0];
                const courseColor = courseColorMap[sample?.cursoColor] || courseColorMap.primary;

                return (
                    <motion.section
                        key={cursoNombre}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Course header */}
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-9 h-9 rounded-lg grid place-items-center text-white shrink-0",
                                courseColor.accentBg
                            )}>
                                {getCourseIcon(sample?.cursoEmoji || "📚", "w-5 h-5")}
                            </div>
                            <div>
                                <h2 className="font-display font-bold text-xl">{cursoNombre}</h2>
                                <p className="text-xs text-muted-foreground">{entries.length} temas evaluados</p>
                            </div>
                        </div>

                        {/* Heatmap grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {entries.map((entry: any, i: number) => {
                                const config = nivelConfig[entry.nivel as keyof typeof nivelConfig] || nivelConfig.SIN_DATOS;
                                const Icon = config.icon;
                                return (
                                    <motion.div
                                        key={entry.semanaId}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={cn(
                                            "relative overflow-hidden rounded-xl border-l-4 p-4 transition-all hover:-translate-y-0.5",
                                            "bg-card border border-border shadow-xs",
                                            courseColor.accent,
                                            config.glow && `hover:${config.glow}`
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    {entry.numSem}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Icon className={cn("w-4 h-4 shrink-0", config.text)} />
                                                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", config.badge)}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-display font-black text-2xl leading-none">
                                                    {entry.porcentaje}%
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-semibold">aciertos</span>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-3 h-2 rounded-full bg-muted/60 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${entry.porcentaje}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                                                className={cn("h-full rounded-full", config.bar)}
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground font-semibold">
                                            <span>{entry.correctas}/{entry.totalPreguntas} correctas</span>
                                            <span>{entry.totalIntentos} {entry.totalIntentos === 1 ? "intento" : "intentos"}</span>
                                            {entry.promedioNota > 0 && (
                                                <span className="font-bold">Nota: {entry.promedioNota}/20</span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.section>
                );
            })}

            {/* Legend */}
            {totalTemas > 0 && (
                <section className="bg-card border border-border rounded-xl p-5 shadow-xs">
                    <h3 className="font-display font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Leyenda de niveles</h3>
                    <div className="flex flex-wrap gap-4">
                        {(["DOMINADO", "EN_PROGRESO", "DEBIL"] as const).map(nivel => {
                            const c = nivelConfig[nivel];
                            const Icon = c.icon;
                            return (
                                <div key={nivel} className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-sm", c.bar)} />
                                    <Icon className={cn("w-3.5 h-3.5", c.text)} />
                                    <span className="text-xs font-semibold text-foreground">{c.label}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        ({nivel === "DOMINADO" ? "≥75%" : nivel === "EN_PROGRESO" ? "50-74%" : "<50%"})
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
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
        <div className={cn("rounded-xl border p-4 text-center", toneMap[tone])}>
            <div className="font-display font-black text-3xl">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">{label}</div>
        </div>
    );
}
