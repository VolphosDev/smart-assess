import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ArrowRight, BookOpen, Plus, X, MoreVertical, Edit2, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { coursesApi } from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
} as const;

const emojis = ["📘", "🧬", "🏛️", "📐", "📚", "🧪", "🌍", "🎨", "💻", "🎵"];
const colors: Array<"primary" | "lime" | "coral"> = ["primary", "lime", "coral"];

export default function TeacherDashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user.id;
    const queryClient = useQueryClient();

    const { data: courses = [], refetch, isLoading: loadingCourses } = useQuery({
        queryKey: ['teacher-courses', teacherId],
        queryFn: () => coursesApi.forTeacher(teacherId),
        enabled: !!teacherId
    });

    // Estados para los modales
    const [openModal, setOpenModal] = useState<"create" | "edit" | "delete" | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null); // Para el dropdown de opciones

    const [form, setForm] = useState<{ name: string; description: string; weeks: number; emoji: string; color: "primary" | "lime" | "coral" }>({
        name: "", description: "", weeks: 4, emoji: "📘", color: "primary",
    });

    // Mutación para Editar
    const editMutation = useMutation({
        mutationFn: (data: any) => coursesApi.update(activeCourseId!, data),
        onSuccess: () => {
            toast.success("Curso actualizado exitosamente");
            setOpenModal(null);
            refetch();
        },
        onError: () => toast.error("Error al actualizar el curso")
    });

    // Mutación para Eliminar
    const deleteMutation = useMutation({
        mutationFn: (id: number) => coursesApi.delete(id),
        onSuccess: () => {
            toast.success("Curso eliminado");
            setOpenModal(null);
            refetch();
        },
        onError: () => toast.error("Error al eliminar el curso")
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            nombre: form.name,
            descripcion: form.description,
            emoji: form.emoji,
            color: form.color,
            semanas: form.weeks,
            // Solo necesarios para crear:
            profesorId: teacherId,
            gradoId: 1,
            seccionId: 1,
        };

        if (openModal === "create") {
            try {
                await coursesApi.create(payload);
                toast.success("Curso creado exitosamente");
                setOpenModal(null);
                refetch();
            } catch (err) {
                toast.error("Error al crear el curso");
            }
        } else if (openModal === "edit") {
            editMutation.mutate(payload);
        }
    };

    const openEditModal = (e: React.MouseEvent, course: any) => {
        e.preventDefault();
        e.stopPropagation();
        setForm({
            name: course.name,
            description: course.description || "",
            weeks: course.weeks,
            emoji: course.emoji,
            color: course.color as "primary" | "lime" | "coral",
        });
        setActiveCourseId(course.id);
        setMenuOpenId(null);
        setOpenModal("edit");
    };

    const openDeleteModal = (e: React.MouseEvent, courseId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveCourseId(courseId);
        setMenuOpenId(null);
        setOpenModal("delete");
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Hero */}
            <section className="bg-hero-gradient rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden">
                <div className="absolute -right-10 -top-10 text-[10rem] opacity-20 select-none">📚</div>
                <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-4">
                    Hola, profesor 👋
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-md">
                    Tus cursos y materiales
                </h1>
                <p className="opacity-90 max-w-md">
                    Gestiona las sesiones de cada semana y sube los materiales para tus alumnos.
                </p>
            </section>

            <section>
                <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Mis cursos</h2>
                    <Button
                        onClick={() => {
                            setForm({ name: "", description: "", weeks: 4, emoji: "📘", color: "primary" });
                            setOpenModal("create");
                        }}
                        className="rounded-full font-bold bg-primary-gradient shadow-glow"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Crear curso
                    </Button>
                </div>

                {loadingCourses ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : courses.length === 0 ? (
                    <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center">
                        <p className="text-muted-foreground">Aún no tienes cursos. Crea tu primer curso para comenzar.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {courses.map((c: any, i: number) => (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className="relative group/card h-full">

                                    <Link
                                        to={`/docente/curso/${c.id}`}
                                        className="block bg-card border border-border rounded-3xl p-6 shadow-soft hover:-translate-y-1 transition-all h-full"
                                    >
                                        <div className="mb-4">
                                            <div className={`w-14 h-14 rounded-2xl ${colorMap[c.color as keyof typeof colorMap]} grid place-items-center text-3xl shadow-soft`}>
                                                {c.emoji}
                                            </div>
                                        </div>

                                        <h3 className="font-display font-bold text-lg mb-1">{c.name}</h3>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold mb-4">
                                            <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.weeks} semanas</span>
                                            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.studentCount} alumnos</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-bold text-primary">
                                            Ver sesiones <ArrowRight className="w-4 h-4 group-hover/card:translate-x-0.5 transition" />
                                        </div>
                                    </Link>

                                    <div className="absolute top-6 right-6 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === c.id ? null : c.id);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        <AnimatePresence>
                                            {menuOpenId === c.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute right-0 top-10 w-36 bg-card border border-border shadow-lg rounded-xl overflow-hidden py-1 z-50"
                                                >
                                                    <button
                                                        onClick={(e) => openEditModal(e, c)}
                                                        className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-muted flex items-center gap-2"
                                                    >
                                                        <Edit2 className="w-4 h-4" /> Editar
                                                    </button>
                                                    <button
                                                        onClick={(e) => openDeleteModal(e, c.id)}
                                                        className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-destructive/10 text-destructive flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Eliminar
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {menuOpenId === c.id && (
                                        <div className="fixed inset-0 z-10" onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(null);
                                        }} />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal de Crear / Editar */}
            <AnimatePresence>
                {(openModal === "create" || openModal === "edit") && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setOpenModal(null)}>
                        <motion.form
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={handleSubmit}
                            className="bg-card border border-border rounded-3xl shadow-glow w-full max-w-lg p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-display font-bold text-xl">
                                    {openModal === "create" ? "Nuevo curso" : "Editar curso"}
                                </h3>
                                <button type="button" onClick={() => setOpenModal(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nombre del curso</Label>
                                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Química Orgánica" className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Descripción (opcional)</Label>
                                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción del curso" className="h-11 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Nº de semanas</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={form.weeks}
                                        onChange={(e) => setForm({ ...form, weeks: Number(e.target.value) })}
                                        className="h-11 rounded-xl"
                                        disabled={openModal === "edit"} // Deshabilitamos editar semanas para evitar conflictos con registros existentes
                                        title={openModal === "edit" ? "No se puede cambiar el número de semanas de un curso existente" : ""}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Color</Label>
                                    <div className="flex gap-2 h-11 items-center">
                                        {colors.map((col) => (
                                            <button key={col} type="button" onClick={() => setForm({ ...form, color: col })}
                                                    className={cn("w-9 h-9 rounded-xl", colorMap[col], form.color === col ? "ring-2 ring-foreground" : "")} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Ícono</Label>
                                <div className="flex flex-wrap gap-2">
                                    {emojis.map((e) => (
                                        <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                                                className={cn("w-10 h-10 rounded-xl text-xl grid place-items-center bg-muted", form.emoji === e ? "ring-2 ring-primary" : "")}>{e}</button>
                                    ))}
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={editMutation.isPending}
                                className="w-full h-11 rounded-xl bg-primary-gradient font-bold shadow-glow mt-2"
                            >
                                {editMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (openModal === "create" ? "Crear curso" : "Guardar cambios")}
                            </Button>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmar Eliminación */}
            <AnimatePresence>
                {openModal === "delete" && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setOpenModal(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-3xl shadow-glow w-full max-w-sm p-6 space-y-5 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-xl mb-2">¿Eliminar este curso?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Esta acción es irreversible. Se eliminarán todas las semanas, materiales y alumnos matriculados.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl"
                                    onClick={() => setOpenModal(null)}
                                    disabled={deleteMutation.isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 rounded-xl font-bold"
                                    onClick={() => deleteMutation.mutate(activeCourseId!)}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, eliminar"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}