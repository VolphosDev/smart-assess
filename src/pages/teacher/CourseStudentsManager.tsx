import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/api/courses.ts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Users, UserPlus, UserMinus, Loader2, Mail } from "lucide-react";

export default function CourseStudentsManager() {
    const { courseId = "" } = useParams();
    const queryClient = useQueryClient();
    const [newStudentId, setNewStudentId] = useState("");

    // 1. Obtener la lista de alumnos
    const { data: alumnos = [], isLoading } = useQuery({
        queryKey: ["courseStudents", courseId],
        queryFn: () => coursesApi.students(courseId),
        enabled: !!courseId,
    });

    const enrollMutation = useMutation({
        mutationFn: (studentId: string) => coursesApi.addStudent(courseId, studentId),
        onSuccess: () => {
            toast.success("Alumno matriculado exitosamente");
            setNewStudentId("");
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

    const handleEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentId.trim()) return;
        enrollMutation.mutate(newStudentId);
    };

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
                className="rounded-[2rem] p-8 bg-primary-gradient text-primary-foreground shadow-glow relative overflow-hidden"
            >
                <div className="absolute -right-4 -bottom-4 text-[12rem] opacity-10 select-none pointer-events-none">
                    <Users />
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
                    className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden"
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
                                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors group"
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
                                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
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
                    className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4"
                >
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <h3 className="font-display font-bold text-lg">Matricular</h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Ingresa el ID del estudiante para añadirlo al curso.
                    </p>

                    <form onSubmit={handleEnroll} className="space-y-3 pt-2">
                        <input
                            type="number"
                            placeholder="Ej. 1042"
                            value={newStudentId}
                            onChange={(e) => setNewStudentId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            required
                        />
                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-primary-gradient font-bold"
                            disabled={enrollMutation.isPending || !newStudentId}
                        >
                            {enrollMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Añadir al curso
                        </Button>
                    </form>
                </motion.section>

            </div>
        </div>
    );
}