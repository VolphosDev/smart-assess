import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, PlayCircle, Sparkles, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/api";

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
} as const;

export default function TeacherCourse() {
    const { courseId = "" } = useParams();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user.id;

    // 1. Busca el curso en la caché
    const { data: courses = [] } = useQuery({
        queryKey: ['teacher-courses', teacherId],
        queryFn: () => coursesApi.forTeacher(teacherId),
        enabled: !!teacherId,
    });
    const course = courses.find((c: any) => String(c.id) === String(courseId));

    // 2. Trae las semanas reales
    const { data: weeks = [], isLoading } = useQuery({
        queryKey: ['semanas', courseId],
        queryFn: () => coursesApi.weeks(courseId),
        enabled: !!courseId,
    });

    const sortedWeeks = [...weeks].sort((a: any, b: any) => {
        const numA = parseInt(a.numSem?.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.numSem?.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    if (!course) {
        return (
            <div className="text-center py-20">
                <h1 className="font-display font-bold text-3xl mb-3">Curso no encontrado</h1>
                <Link to="/docente" className="text-primary font-semibold hover:underline">Volver al inicio</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Link to="/docente" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Mis cursos
            </Link>

            {/* Hero */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden",
                    colorMap[course.color as keyof typeof colorMap] ?? "bg-primary-gradient"
                )}
            >
                <div className="absolute -right-6 -top-6 text-[10rem] opacity-20 select-none">{course.emoji}</div>
                <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
                    Curso · Semestre 2026-1
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-2xl">{course.name}</h1>
                <p className="opacity-90 max-w-xl">
                    {weeks.length} semanas · {course.studentCount ?? 0} alumnos matriculados
                </p>
            </motion.section>

            {/* Lista de semanas */}
            <section>
                <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Semanas del curso</h2>
                    <span className="text-sm text-muted-foreground font-semibold">Gestiona el material de cada semana</span>
                </div>

                {isLoading && <p className="text-muted-foreground text-sm">Cargando semanas...</p>}

                <ul className="space-y-3">
                    {sortedWeeks.map((w: any, i: number) => (
                        <motion.li
                            key={w.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                to={`/docente/curso/${courseId}/semana/${w.id}`}
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
                                            : "Sin material subido aún"}
                                    </h3>

                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <BookOpen className="w-3.5 h-3.5" /> {w.totalPreguntas ?? 0} preguntas
                                        </span>

                                        {w.materiales && w.materiales.length > 0 && (
                                            <span className="inline-flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" /> Material cargado
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden sm:flex items-center gap-2 text-primary font-semibold text-sm shrink-0">
                                    Gestionar <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                                </div>
                            </Link>
                        </motion.li>
                    ))}
                </ul>

                {!isLoading && weeks.length === 0 && (
                    <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center">
                        <p className="text-muted-foreground">Este curso no tiene semanas registradas aún.</p>
                    </div>
                )}
            </section>

            {/* Tip */}
            <section className="bg-card border border-border rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow shrink-0">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-display font-bold text-lg">Sube el material de cada semana</h3>
                    <p className="text-sm text-muted-foreground">Entra a cada semana para subir tus archivos y generar preguntas.</p>
                </div>
            </section>
        </div>
    );
}