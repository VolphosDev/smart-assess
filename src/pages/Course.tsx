import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, PlayCircle, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/api";
import { useState } from "react";
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import { getCourseIcon } from "@/lib/icon-mapper";

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
} as const;

export default function Course() {
    const { courseId = "" } = useParams();

    // Estado para controlar el modal de previsualización
    const [selectedFile, setSelectedFile] = useState<{ id: string, name: string } | null>(null);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // 1. Traemos el curso
    const { data: courses = [], isLoading: loadingCourses } = useQuery({
        queryKey: ['student-courses', user.id],
        queryFn: () => coursesApi.forStudent(user.id),
        enabled: !!user.id,
    });
    const course = courses.find((c: any) => String(c.id) === String(courseId));

    // 2. Traemos las semanas reales desde la API
    const { data: weeks = [], isLoading: loadingWeeks } = useQuery({
        queryKey: ['semanas', courseId],
        queryFn: () => coursesApi.weeks(courseId),
        enabled: !!courseId,
    });

    const openPreview = (id: string, name: string) => {
        setSelectedFile({ id, name });
    };

    if (loadingCourses) {
        return (
            <div className="flex items-center justify-center py-32 text-muted-foreground font-semibold">
                Cargando información del curso...
            </div>
        );
    }

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
                className={cn("rounded-xl p-8 text-primary-foreground shadow-sm relative overflow-hidden", colorMap[course.color as keyof typeof colorMap] ?? "bg-primary-gradient")}
            >
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.25] select-none text-white pointer-events-none">
                    {getCourseIcon(course.emoji, "w-36 h-36 md:w-40 md:h-40")}
                </div>
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-3">
                    Curso · Semestre 2026-1
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-2xl">{course.name}</h1>
                <p className="opacity-90 max-w-xl mb-5 text-sm">
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
                    {weeks.map((w: any, i: number) => {
                        const user = JSON.parse(localStorage.getItem("user") || "{}");
                        const unfinishedKeys = Object.keys(localStorage).filter(key =>
                            key.startsWith(`semantika.unfinished_attempt.${user.id}.${courseId}.${w.id}.`)
                        );
                        const hasUnfinished = unfinishedKeys.length > 0;

                        return (
                            <motion.li
                                key={w.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="group flex items-center gap-5 bg-card border border-border/80 rounded-xl p-5 shadow-xs transition-all hover:-translate-y-0.5">

                                    <div className={cn(
                                        "w-12 h-12 rounded-lg grid place-items-center font-display font-bold text-lg shrink-0 text-white",
                                        course.color === "lime" ? "bg-emerald-600" : course.color === "coral" ? "bg-rose-600" : "bg-indigo-600"
                                    )}>
                                        {i + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                {w.numSem}
                                            </span>
                                            {hasUnfinished && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-extrabold uppercase tracking-wider animate-pulse shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> En curso
                                                </span>
                                            )}
                                        </div>

                                        {/* Lógica de los materiales modificada para manejar la visibilidad */}
                                        {w.materiales && w.materiales.length > 0 ? (
                                            w.materiales[0].visible ? (
                                                <button
                                                    onClick={() => openPreview(w.materiales[0].mongoId, w.materiales[0].nombreArchivo)}
                                                    className="font-display font-bold text-lg leading-tight truncate flex items-center gap-2 hover:text-primary transition-colors text-left w-full mt-1"
                                                    title="Ver documento"
                                                >
                                                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    <span className="truncate hover:underline">
                                                        {w.materiales.length === 1
                                                            ? w.materiales[0].nombreArchivo
                                                            : `${w.materiales.length} archivos subidos`}
                                                    </span>
                                                </button>
                                            ) : (
                                                <div className="font-display font-bold text-lg leading-tight truncate flex items-center gap-2 text-muted-foreground/50 text-left w-full mt-1 cursor-not-allowed" title="El profesor ocultó este material">
                                                    <Lock className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">
                                                        {w.materiales.length === 1
                                                            ? w.materiales[0].nombreArchivo
                                                            : `${w.materiales.length} archivos subidos`}
                                                    </span>
                                                </div>
                                            )
                                        ) : (
                                            <h3 className="font-display font-bold text-lg leading-tight truncate text-muted-foreground mt-1">
                                                Sin material aún
                                            </h3>
                                        )}

                                        <p className="text-sm text-muted-foreground mt-1">
                                            {w.totalPreguntas ?? 0} preguntas disponibles
                                        </p>
                                    </div>

                                    {/* El enlace a la vista de la semana se mantiene solo en el botón de Evaluarme */}
                                    <Link
                                        to={`/app/curso/${courseId}/semana/${w.id}`}
                                        className={cn(
                                            "hidden sm:flex items-center gap-2 font-semibold text-xs shrink-0 px-4 py-2 rounded-lg transition-all border border-transparent",
                                            hasUnfinished
                                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 animate-pulse shadow-xs"
                                                : course.color === "lime"
                                                    ? "text-emerald-600 hover:bg-emerald-600/5 hover:border-emerald-600/10"
                                                    : course.color === "coral"
                                                        ? "text-rose-600 hover:bg-rose-600/5 hover:border-rose-600/10"
                                                        : "text-indigo-600 hover:bg-indigo-600/5 hover:border-indigo-600/10"
                                        )}
                                    >
                                        <PlayCircle className="w-4 h-4" /> {hasUnfinished ? "Continuar prueba" : "Evaluarme"} <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </motion.li>
                        );
                    })}
                </ul>
            </section>

            <section className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-center gap-5">
                <div className="w-12 h-12 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-display font-bold text-lg">¿No sabes por dónde empezar?</h3>
                    <p className="text-sm text-muted-foreground">Te recomendamos seguir con la semana en curso para mantener tu racha.</p>
                </div>
            </section>

            {/* Aquí inyectamos el modal para que flote sobre todo */}
            <UniversalPreviewModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                mongoId={selectedFile?.id || ""}
                fileName={selectedFile?.name || ""}
            />
        </div>
    );
}