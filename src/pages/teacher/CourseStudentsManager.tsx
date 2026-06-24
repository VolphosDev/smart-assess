import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/api/courses.ts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Users, UserPlus, UserMinus, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
} as const;

export default function CourseStudentsManager() {
    const { courseId = "" } = useParams();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user.id;

    // 1. Obtener la lista de alumnos
    const { data: alumnos = [], isLoading } = useQuery({
        queryKey: ["courseStudents", courseId],
        queryFn: () => coursesApi.students(courseId),
        enabled: !!courseId,
    });

    // Obtener los cursos del docente para hallar el color
    const { data: courses = [] } = useQuery({
        queryKey: ['teacher-courses', teacherId],
        queryFn: () => coursesApi.forTeacher(teacherId),
        enabled: !!teacherId,
    });
    const course = courses.find((c: any) => String(c.id) === String(courseId));

    const { data: searchResults = [], isLoading: isSearching } = useQuery({
        queryKey: ["buscarEstudiantes", searchTerm],
        queryFn: () => coursesApi.buscarEstudiantes(searchTerm),
    });

    const enrollMutation = useMutation({
        mutationFn: (studentId: string) => coursesApi.addStudent(courseId, studentId),
        onSuccess: () => {
            toast.success("Alumno matriculado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["courseStudents", courseId] });
        },
        onError: (error: any) => {
            let msg = "Error al matricular al alumno";
            try {
                const parsedError = JSON.parse(error.message);
                msg = parsedError.message || msg;
            } catch (e) {
                msg = error?.response?.data?.message || error?.message || msg;
            }
            toast.error(msg);
        },
    });

    const unenrollMutation = useMutation({
        mutationFn: (studentId: number) => coursesApi.removeStudent(courseId, studentId),
        onSuccess: () => {
            toast.success("Alumno retirado del curso");
            queryClient.invalidateQueries({ queryKey: ["courseStudents", courseId] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || "No se pudo retirar al alumno";
            toast.error(errorMessage);
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Link
                to={`/docente/curso/${courseId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Volver al curso
            </Link>

            {/* Header del Gestor */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "rounded-xl p-8 text-primary-foreground shadow-sm relative overflow-hidden",
                    colorMap[course?.color as keyof typeof colorMap] ?? "bg-primary-gradient"
                )}
            >
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.25] select-none pointer-events-none text-white">
                    <Users className="w-32 h-32 md:w-36 md:h-36" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
                    Gestión de Aula
                </span>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
                    Alumnos Matriculados
                </h1>
                <p className="opacity-80 text-sm">
                    {alumnos.length} {alumnos.length === 1 ? "estudiante" : "estudiantes"} en este curso
                </p>
            </motion.div>

            <div className="grid md:grid-cols-[1fr_300px] gap-6 items-start">

                {/* Lista de Alumnos */}
                <motion.section
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-xl shadow-soft overflow-hidden"
                >
                    <div className="p-6 border-b border-border bg-muted/20">
                        <h2 className="font-display font-bold text-lg">Lista de clase</h2>
                    </div>

                    <div className="p-3">
                        {alumnos.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-muted-foreground">No hay alumnos matriculados aún.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {alumnos.map((alumno: any) => (
                                        <motion.div
                                            key={alumno.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                                                {alumno.nombre?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{alumno.nombre}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{alumno.correo}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                                onClick={() => unenrollMutation.mutate(alumno.id)}
                                                disabled={unenrollMutation.isPending}
                                                title="Retirar alumno"
                                            >
                                                {unenrollMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserMinus className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Formulario para Agregar */}
                <motion.section
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-xl p-6 shadow-soft space-y-4 font-semibold"
                >
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <h3 className="font-display font-bold text-lg">Matricular</h3>
                    </div>

                    <p className="text-xs text-muted-foreground leading-normal">
                        Busca al estudiante por su nombre para añadirlo al curso.
                    </p>

                    <div className="space-y-3 pt-2">
                        <input
                            type="text"
                            placeholder="Buscar alumno por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all text-xs"
                        />

                        {isSearching ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                        ) : searchResults.length > 0 ? (
                            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border rounded-xl p-2 bg-muted/20">
                                {searchResults.map((estudiante: any) => {
                                    const yaMatriculado = alumnos.some((a: any) => String(a.id) === String(estudiante.id));
                                    return (
                                        <div key={estudiante.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60 hover:bg-muted/40 transition text-xs">
                                            <div className="min-w-0 pr-2">
                                                <p className="font-bold text-foreground truncate">{estudiante.nombre}</p>
                                                <p className="text-muted-foreground text-[10px] truncate">{estudiante.correo}</p>
                                            </div>
                                            {yaMatriculado ? (
                                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg uppercase tracking-wider text-[9px] shrink-0">
                                                    Matriculado
                                                </span>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => enrollMutation.mutate(String(estudiante.id))}
                                                    disabled={enrollMutation.isPending}
                                                    className="rounded-lg bg-primary h-7 px-3 text-[11px] font-bold text-white shrink-0"
                                                >
                                                    Añadir
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : searchTerm.trim() !== "" ? (
                            <p className="text-center py-4 text-xs text-muted-foreground font-semibold">No se encontraron alumnos.</p>
                        ) : (
                            <p className="text-center py-4 text-xs text-muted-foreground/60 font-medium">Escribe el nombre del alumno para buscar.</p>
                        )}
                    </div>
                </motion.section>

            </div>
        </div>
    );
}