import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Flame, Target, TrendingUp, ArrowRight, GraduationCap, BookOpen, AlertTriangle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, intentosApi, rendimientoApi } from "@/api";
import { getCourseIcon } from "@/lib/icon-mapper";
import { cn } from "@/lib/utils";
import { useState } from "react";

const iconColorMap = {
    primary: "bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
    lime: "bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
    coral: "bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
} as const;

export default function Dashboard() {
    // 1. Obtenemos al estudiante logueado
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const studentId = user.id;

    // 2. Traemos sus cursos matriculados
    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['student-courses', studentId],
        queryFn: () => coursesApi.forStudent(studentId),
        enabled: !!studentId
    });

    // 3. Traemos los intentos de evaluación para estadísticas reales
    const { data: attempts = [] } = useQuery({
        queryKey: ['student-attempts', studentId],
        queryFn: async () => {
            const response = await intentosApi.misIntentos(studentId);
            return response.data || response;
        },
        enabled: !!studentId
    });

    // 4. Cálculos para estadísticas funcionales en tiempo real
    const gradedAttempts = attempts.filter((i: any) => i.nota !== undefined && i.nota !== null);
    const averageGrade = gradedAttempts.length > 0
        ? (gradedAttempts.reduce((sum: number, i: any) => sum + Number(i.nota), 0) / gradedAttempts.length).toFixed(1)
        : "—";

    // Calculadora de racha (días consecutivos practicando)
    const getStreak = (attemptsList: any[]) => {
        if (attemptsList.length === 0) return 0;
        const dates = Array.from(new Set(
            attemptsList.map(a => new Date(a.fecha).toISOString().split('T')[0])
        )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        if (dates.length === 0) return 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Si no practicó hoy ni ayer, racha es 0
        if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
            return 0;
        }
        
        let streak = 1;
        let currentDate = new Date(dates[0]);
        for (let i = 1; i < dates.length; i++) {
            const nextDate = new Date(dates[i]);
            const diffDays = Math.ceil(Math.abs(currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                streak++;
                currentDate = nextDate;
            } else if (diffDays > 1) {
                break; // Racha rota
            }
        }
        return streak;
    };
    const streakDays = getStreak(attempts);

    const recommendedCourse = courses.length > 0 ? courses[0] : null;

    // === Feature 2: Refuerzo Activo ===
    const { data: mapaCalor = [] } = useQuery({
        queryKey: ['mapa-calor-dashboard', studentId],
        queryFn: () => rendimientoApi.mapaCalor(studentId),
        enabled: !!studentId,
    });
    const temasDebiles = mapaCalor.filter((e: any) => e.nivel === "DEBIL");
    const [refuerzoDismissed, setRefuerzoDismissed] = useState(() => {
        return sessionStorage.getItem("semantika.refuerzo_dismissed") === "true";
    });
    const handleDismissRefuerzo = () => {
        setRefuerzoDismissed(true);
        sessionStorage.setItem("semantika.refuerzo_dismissed", "true");
    };

    return (
        <div className="space-y-8">
            {/* === Refuerzo Activo === */}
            <AnimatePresence>
                {false && temasDebiles.length > 0 && !refuerzoDismissed && (
                    <motion.section
                        initial={{ opacity: 0, y: -12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -12, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 relative">
                            <button
                                type="button"
                                onClick={handleDismissRefuerzo}
                                className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:bg-background/50 transition-colors"
                                title="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-display font-bold text-sm text-foreground">
                                        🎯 ARIA detectó temas que puedes reforzar
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        ¡Hola! Noté que tienes algunas áreas donde podrías mejorar.
                                        {temasDebiles.length === 1
                                            ? ` Específicamente en "${temasDebiles[0].numSem}" de ${temasDebiles[0].cursoNombre}.`
                                            : ` Hay ${temasDebiles.length} temas que necesitan más práctica.`}
                                        {" "}¿Qué tal un repaso rápido?
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {temasDebiles.slice(0, 3).map((tema: any) => (
                                            <Link
                                                key={tema.semanaId}
                                                to={`/app/curso/${tema.cursoId}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-800"
                                            >
                                                <AlertTriangle className="w-3 h-3" />
                                                {tema.cursoNombre} · {tema.numSem} ({tema.porcentaje}%)
                                            </Link>
                                        ))}
                                        {temasDebiles.length > 3 && (
                                            <Link
                                                to="/app/mapa-conocimiento"
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/20"
                                            >
                                                Ver todos →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Hero greeting */}
            <section className="grid lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-hero-gradient rounded-xl p-8 text-primary-foreground relative overflow-hidden shadow-sm"
                >
                    <GraduationCap className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 md:w-36 md:h-36 opacity-[0.25] select-none pointer-events-none text-white" />
                    <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-4 font-mono">
                        Hola, {user.name?.split(' ')[0] || 'estudiante'} 👋
                    </span>
                    {recommendedCourse ? (
                        <>
                            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-md text-left leading-tight">
                                ¿Repasamos el curso de {recommendedCourse.name} hoy?
                            </h1>
                            <p className="opacity-90 mb-6 max-w-md text-sm text-left">
                                Evalúa tus conocimientos, practica con ARIA o mira un video interactivo de la semana.
                            </p>
                            <Button asChild size="lg" className="rounded-lg bg-background text-foreground hover:bg-background/90 font-semibold h-11 px-5 shadow-xs text-sm">
                                <Link to={`/app/curso/${recommendedCourse.id}`}>
                                    <BookOpen className="w-4 h-4 mr-1.5" /> Ir al curso
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-md text-left leading-tight">
                                ¡Bienvenido a Semantika!
                            </h1>
                            <p className="opacity-90 mb-6 max-w-md text-sm text-left">
                                Para comenzar a evaluarte con Inteligencia Artificial, solicita a tu docente que te matricule en una asignatura.
                            </p>
                        </>
                    )}
                </motion.div>
 
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <StatCard icon={Flame} label="Racha" value={`${streakDays} ${streakDays === 1 ? "día" : "días"}`} tone="rose" />
                    <StatCard icon={Target} label="Promedio" value={averageGrade} tone="emerald" />
                    <StatCard icon={BookOpen} label="Evaluaciones" value={`${attempts.length} completadas`} tone="indigo" className="col-span-2 lg:col-span-1" />
                </div>
            </section>
 
            {/* Cursos */}
            <section>
                <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Tus cursos</h2>
                    <Link to="/app/historial" className="text-sm font-semibold text-primary hover:underline">Ver todo</Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {courses.map((c) => (
                        <Link
                            key={c.id}
                            to={`/app/curso/${c.id}`}
                            className="group bg-card border border-border/80 rounded-xl p-5 pt-7 shadow-xs hover:-translate-y-0.5 hover:shadow-xs hover:border-border transition-all flex flex-col justify-between relative overflow-hidden text-left"
                        >
                            {/* Accent Top Color Bar */}
                            <div className={cn(
                                "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
                                c.color === "lime" ? "bg-emerald-500" : c.color === "coral" ? "bg-rose-500" : "bg-indigo-600"
                            )} />
 
                            <div>
                                <div className={cn(
                                    "w-10 h-10 rounded-lg grid place-items-center shadow-xs border transition-all mb-4",
                                    c.color === "lime" ? "bg-emerald-100/80 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" : 
                                    c.color === "coral" ? "bg-rose-100/80 border-rose-300 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400" : 
                                    "bg-indigo-100/80 border-indigo-300 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400"
                                )}>
                                    {getCourseIcon(c.emoji, "w-5 h-5")}
                                </div>
                                <h3 className={cn(
                                    "font-display font-bold text-lg mb-1 transition-colors mt-2 text-left group-hover:underline",
                                    c.color === "lime" ? "text-emerald-700 dark:text-emerald-400" : 
                                    c.color === "coral" ? "text-rose-700 dark:text-rose-400" : 
                                    "text-indigo-700 dark:text-indigo-400"
                                )}>
                                    {c.name}
                                </h3>
                                {c.nextExam && (
                                    <p className="text-xs text-muted-foreground mb-4 text-left">Próximo: {c.nextExam}</p>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                    <BookOpen className="w-3.5 h-3.5" /> {c.weeks || 4} semanas
                                </span>
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-md border transition-all group-hover:translate-x-0.5",
                                    c.color === "lime" ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" :
                                    c.color === "coral" ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400" :
                                    "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400"
                                )}>
                                    Ver temas <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
 
function StatCard({
    icon: Icon,
    label,
    value,
    tone,
    className = "",
}: {
    icon: any;
    label: string;
    value: string;
    tone: "rose" | "emerald" | "indigo";
    className?: string;
}) {
    const toneClasses = {
        rose: "bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
        emerald: "bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
        indigo: "bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
    };
    return (
        <div className={`bg-card border border-border/80 rounded-xl p-5 shadow-xs flex items-center gap-4 ${className} text-left`}>
            <div className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${toneClasses[tone]}`}>
                <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</div>
                <div className="font-display font-bold text-xl">{value}</div>
            </div>
        </div>
    );
}