import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, PlayCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/api";

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
} as const;

export default function Course() {
    const { courseId = "" } = useParams();

    // 1. Traemos el curso (ya lo tienes en caché del dashboard, pero lo pedimos igual)
    const { data: courses = [] } = useQuery({
        queryKey: ['student-courses'],
        queryFn: () => {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return coursesApi.forStudent(user.id);
        },
    });
    const course = courses.find((c: any) => String(c.id) === String(courseId));

    // 2. Traemos las semanas reales desde la API
    const { data: weeks = [], isLoading: loadingWeeks } = useQuery({
        queryKey: ['semanas', courseId],
        queryFn: () => coursesApi.weeks(courseId),
        enabled: !!courseId,
    });

    if (!course) {
        return (
            <div className="text-center py-20">
                <h1 className="font-display font-bold text-3xl mb-3">Curso no encontrado</h1>
                <Link to="/app" className="text-primary font-semibold hover:underline">Volver al inicio</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Link to="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Mis cursos
            </Link>

            {/* Hero del curso */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden", colorMap[course.color as keyof typeof colorMap] ?? "bg-primary-gradient")}
            >
                <div className="absolute -right-6 -top-6 text-[10rem] opacity-20 select-none">{course.emoji}</div>
                <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
          Curso · Semestre 2026-1
        </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-2xl">{course.name}</h1>
                <p className="opacity-90 max-w-xl mb-5">
                    {weeks.length} semanas
                </p>
            </motion.section>

            {/* Lista de semanas */}
            <section>
                <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Temas por semana</h2>
                    <span className="text-sm text-muted-foreground font-semibold">Elige un tema para evaluarte</span>
                </div>

                {loadingWeeks && (
                    <p className="text-muted-foreground text-sm">Cargando semanas...</p>
                )}

                <ul className="space-y-3">
                    {weeks.map((w: any, i: number) => (
                        <motion.li
                            key={w.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                to={`/app/curso/${courseId}/semana/${w.id}`}
                                className="group flex items-center gap-5 bg-card border border-border rounded-3xl p-5 shadow-soft transition-all hover:-translate-y-0.5"
                            >
                                <div className="w-14 h-14 rounded-2xl grid place-items-center font-display font-bold text-xl shadow-soft shrink-0 bg-primary-gradient text-primary-foreground">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        {w.numSem}
                                    </span>

                                    <h3 className="font-display font-bold text-lg leading-tight truncate">
                                        {w.materiales && w.materiales.length > 0
                                            ? (w.materiales.length === 1
                                                ? w.materiales[0].nombreArchivo
                                                : `${w.materiales.length} archivos subidos`)
                                            : "Sin material aún"}
                                    </h3>

                                    <p className="text-sm text-muted-foreground mt-1">
                                        {w.totalPreguntas ?? 0} preguntas disponibles
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-primary font-semibold text-sm shrink-0">
                                    <PlayCircle className="w-5 h-5" /> Evaluarme <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>
                        </motion.li>
                    ))}
                </ul>
            </section>

            <section className="bg-card border border-border rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow shrink-0">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-display font-bold text-lg">¿No sabes por dónde empezar?</h3>
                    <p className="text-sm text-muted-foreground">Te recomendamos seguir con la semana en curso para mantener tu racha.</p>
                </div>
            </section>
        </div>
    );
}