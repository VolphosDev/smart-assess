import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ArrowRight, BookOpen, Plus, X, MoreVertical, Edit2, Trash2, AlertTriangle, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { coursesApi } from "@/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/icon-mapper";
import { ModalPortal } from "@/components/ModalPortal";
import { SelectorBannerCurso, SelectorColorCurso, VistaPreviaCurso } from "@/components/curso/EditorAparienciaCurso";
import { useBannerCurso } from "@/lib/bannerCurso";
import { variablesCurso } from "@/lib/colorCurso";

const iconColorMap = {
    primary: "bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
    lime: "bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
    coral: "bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
} as const;

const emojis = ["📘", "🧬", "🏛️", "📐", "📚", "🧪", "🌍", "🎨", "💻", "🎵"];

export default function TeacherDashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user.id;
    const queryClient = useQueryClient();

    const { data: courses = [], refetch, isLoading: loadingCourses } = useQuery({
        queryKey: ['teacher-courses', teacherId],
        queryFn: () => coursesApi.forTeacher(teacherId),
        enabled: !!teacherId
    });

    const { data: rendimiento = [] } = useQuery({
        queryKey: ['teacher-rendimiento', teacherId],
        queryFn: () => coursesApi.rendimiento(teacherId),
        enabled: !!teacherId
    });

    // Estados para los modales
    const [openModal, setOpenModal] = useState<"create" | "edit" | "delete" | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null); // Para el dropdown de opciones



    const [form, setForm] = useState<{ name: string; description: string; weeks: number; emoji: string; color: string }>({
        name: "", description: "", weeks: 4, emoji: "📘", color: "#4F46E5",
    });

    /**
     * Portada pendiente de guardar. `blob` = imagen nueva ya recortada; `quitar` = el docente
     * borró la que había. Se sube DESPUÉS de crear/guardar el curso, porque al crear todavía
     * no existe un id al que colgarla.
     */
    const [banner, setBanner] = useState<{ blob: Blob | null; url: string | null; quitar: boolean }>({ blob: null, url: null, quitar: false });
    const [guardando, setGuardando] = useState(false);
    const cursoEditado = courses.find((c: any) => c.id === activeCourseId);
    const bannerActual = useBannerCurso(openModal === "edit" ? activeCourseId : null, cursoEditado?.bannerVersion);
    const vistaBanner = banner.quitar ? null : banner.url ?? bannerActual;

    const aplicarBanner = async (cursoId: string | number) => {
        if (banner.blob) await coursesApi.subirBanner(cursoId, banner.blob);
        else if (banner.quitar) await coursesApi.eliminarBanner(cursoId);
    };

    // Mutación para Editar
    const editMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await coursesApi.update(activeCourseId!, data);
            try {
                await aplicarBanner(activeCourseId!);
            } catch {
                toast.error("El curso se guardó, pero no se pudo actualizar la portada");
            }
            return res;
        },
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
            setGuardando(true);
            try {
                const creado = await coursesApi.create(payload);
                if (creado?.id && banner.blob) {
                    try {
                        await aplicarBanner(creado.id);
                    } catch {
                        toast.error("El curso se creó, pero no se pudo subir la portada");
                    }
                }
                toast.success("Curso creado exitosamente");
                setOpenModal(null);
                refetch();
            } catch (err) {
                toast.error("Error al crear el curso");
            } finally {
                setGuardando(false);
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
            color: course.color || "primary",
        });
        setBanner({ blob: null, url: null, quitar: false });
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
        <div className="space-y-8 pb-20">
            <section className="bg-hero-gradient rounded-xl p-8 relative overflow-hidden shadow-sm">
                <GraduationCap className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 md:w-36 md:h-36 opacity-[0.25] select-none pointer-events-none text-white" />
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-4">
                    Hola, profesor 👋
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-md">
                    Tus cursos y materiales
                </h1>
                <p className="opacity-90 max-w-md text-sm">
                    Gestiona las sesiones de cada semana y sube los materiales para tus alumnos.
                </p>
            </section>


            <section>
                <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Mis cursos</h2>
                    <Button
                        onClick={() => {
                            setForm({ name: "", description: "", weeks: 4, emoji: "📘", color: "#4F46E5" });
                            setBanner({ blob: null, url: null, quitar: false });
                            setOpenModal("create");
                        }}
                        className="rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm h-10 px-4"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Crear curso
                    </Button>
                </div>

                {loadingCourses ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : courses.length === 0 ? (
                    <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
                        <p className="text-muted-foreground text-sm">Aún no tienes cursos. Crea tu primer curso para comenzar.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {courses.map((c: any, i: number) => (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className="relative group/card h-full">

                                    <Link
                                        to={`/docente/curso/${c.id}`}
                                        style={variablesCurso(c.color)}
                                        className="block bg-card border border-border rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-xs hover:border-border/80 transition-all h-full relative overflow-hidden text-left"
                                    >
                                        <PortadaTarjeta cursoId={c.id} bannerVersion={c.bannerVersion} />

                                        <div className="p-6 pt-0 -mt-6 relative">
                                        <div className="mb-4">
                                            <div className="w-12 h-12 rounded-xl grid place-items-center shadow-sm border-2 border-card text-white bg-[var(--curso-fuerte)]">
                                                {getCourseIcon(c.emoji, "w-5.5 h-5.5")}
                                            </div>
                                        </div>

                                        <h3 className="font-display font-bold text-lg mb-1 transition-colors group-hover:underline text-left text-[var(--curso-tinta)] dark:text-[var(--curso-tinta-osc)]">
                                            {c.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold mb-4 text-left">
                                            <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.weeks} semanas</span>
                                            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.studentCount} alumnos</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-bold text-[var(--curso-tinta)] dark:text-[var(--curso-tinta-osc)]">
                                            Ver sesiones <ArrowRight className="w-4 h-4 group-hover/card:translate-x-0.5 transition" />
                                        </div>
                                        </div>
                                    </Link>

                                    <div className="absolute top-3 right-3 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === c.id ? null : c.id);
                                            }}
                                            className="p-1.5 rounded-lg transition-colors bg-black/30 text-white hover:bg-black/50 backdrop-blur"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        <AnimatePresence>
                                            {menuOpenId === c.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute right-0 top-10 w-36 bg-card border border-border shadow-md rounded-xl overflow-hidden py-1 z-50 animate-fade-in"
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
                    <ModalPortal>
                    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpenModal(null)}>
                        <motion.form
                            initial={{ scale: 0.97, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.97, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={handleSubmit}
                            className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col text-left overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border shrink-0">
                                <h3 className="font-display font-bold text-lg">
                                    {openModal === "create" ? "Nuevo curso" : "Editar curso"}
                                </h3>
                                <button type="button" onClick={() => setOpenModal(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Cerrar"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="px-5 sm:px-6 py-4 space-y-4 overflow-y-auto">
                                <VistaPreviaCurso nombre={form.name} color={form.color} emoji={form.emoji} banner={vistaBanner} />

                                <div className="space-y-1.5">
                                    <Label>Nombre del curso</Label>
                                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Química Orgánica" className="h-11 rounded-lg" />
                                </div>
                                <div className="grid sm:grid-cols-[1fr_120px] gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Descripción (opcional)</Label>
                                        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción del curso" className="h-11 rounded-lg" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Nº de semanas</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={form.weeks}
                                            onChange={(e) => setForm({ ...form, weeks: Number(e.target.value) })}
                                            className="h-11 rounded-lg"
                                            disabled={openModal === "edit"} // Deshabilitamos editar semanas para evitar conflictos con registros existentes
                                            title={openModal === "edit" ? "No se puede cambiar el número de semanas de un curso existente" : ""}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Color</Label>
                                    <SelectorColorCurso valor={form.color} onChange={(hex) => setForm({ ...form, color: hex })} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Portada (opcional)</Label>
                                    <SelectorBannerCurso
                                        vistaPrevia={vistaBanner}
                                        onElegir={(blob, url) => setBanner({ blob, url, quitar: false })}
                                        onQuitar={() => setBanner({ blob: null, url: null, quitar: true })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Ícono del curso</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {emojis.map((e) => (
                                            <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                                                    className={cn("w-10 h-10 rounded-lg grid place-items-center border transition-all", form.emoji === e ? "border-primary bg-primary/10 text-primary ring-1 ring-primary font-bold shadow-xs" : "border-border bg-card text-muted-foreground hover:bg-muted")}
                                                    title={e}
                                            >
                                                {getCourseIcon(e, "w-5 h-5")}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 sm:px-6 py-4 border-t border-border shrink-0">
                                <Button
                                    type="submit"
                                    disabled={editMutation.isPending || guardando}
                                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm"
                                >
                                    {editMutation.isPending || guardando ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (openModal === "create" ? "Crear curso" : "Guardar cambios")}
                                </Button>
                            </div>
                        </motion.form>
                    </div>
                    </ModalPortal>
                )}
            </AnimatePresence>

            {/* Modal de Confirmar Eliminación */}
            <AnimatePresence>
                {openModal === "delete" && (
                    <ModalPortal>
                    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpenModal(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-xl shadow-lg w-full max-w-sm p-6 space-y-5 text-center"
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
                                    className="flex-1 rounded-lg"
                                    onClick={() => setOpenModal(null)}
                                    disabled={deleteMutation.isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 rounded-lg font-semibold"
                                    onClick={() => deleteMutation.mutate(activeCourseId!)}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, eliminar"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                    </ModalPortal>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Franja superior de la tarjeta: la portada si existe, o una banda del color del curso. */
function PortadaTarjeta({ cursoId, bannerVersion }: { cursoId: string | number; bannerVersion?: number | null }) {
    const url = useBannerCurso(cursoId, bannerVersion);
    return (
        <div
            className="h-20 w-full bg-[var(--curso-fuerte)] bg-cover bg-center"
            style={url ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,.25), transparent), url("${url}")` } : undefined}
        />
    );
}
