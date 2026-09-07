import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, Reorder, useDragControls } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    Sparkles,
    BookOpen,
    FileText,
    Users,
    Plus,
    Pencil,
    Eye,
    EyeOff,
    Trash2,
    GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi, semanasApi } from "@/api";
import { getCourseIcon } from "@/lib/icon-mapper";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const colorMap = {
    primary: "bg-indigo-600",
    lime: "bg-emerald-600",
    coral: "bg-rose-600",
} as const;

function parseWeekNumber(numSem?: string | null): number {
    if (!numSem) return 0;
    const match = numSem.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

interface TeacherWeekItemProps {
    week: any;
    index: number;
    courseColor?: string;
    courseId: string;
    onEditTitle: (w: any) => void;
    onToggleHabilitada: (id: string) => void;
    onEliminar: (id: string, numSem: string) => void;
    onDragEnd: () => void;
    togglePending: boolean;
    eliminarPending: boolean;
}

function TeacherWeekItem({
    week: w,
    index,
    courseColor,
    courseId,
    onEditTitle,
    onToggleHabilitada,
    onEliminar,
    onDragEnd,
    togglePending,
    eliminarPending,
}: TeacherWeekItemProps) {
    const isHabilitada = w.habilitada !== false;
    const tieneMaterial = w.materiales && w.materiales.length > 0;
    const sinContenido = !tieneMaterial && (w.totalPreguntas ?? 0) === 0;

    return (
        <Reorder.Item
            value={w}
            id={String(w.id)}
            onDragEnd={onDragEnd}
            whileDrag={{
                scale: 1.015,
                boxShadow: "0 12px 28px -4px rgba(0,0,0,0.18)",
                zIndex: 50,
            }}
            className="list-none select-none touch-none cursor-grab active:cursor-grabbing"
        >
            <div
                className={cn(
                    "group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border rounded-xl p-4 sm:p-5 shadow-xs transition-all",
                    isHabilitada ? "border-border hover:shadow-sm" : "border-border/60 bg-muted/20 opacity-90"
                )}
            >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-4 min-w-0 flex-1 w-full pointer-events-none">
                    {/* Indicador visual para arrastrar */}
                    <div
                        className="p-1.5 -ml-1 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0"
                        title="Arrastra para mover la semana de posición"
                    >
                        <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Badge con el número de semana */}
                    <div className={cn(
                        "w-11 h-11 sm:w-12 sm:h-12 rounded-lg grid place-items-center font-display font-bold text-base sm:text-lg shrink-0 text-white transition-colors shadow-2xs",
                        !isHabilitada
                            ? "bg-muted-foreground/60"
                            : courseColor === "lime"
                                ? "bg-emerald-600"
                                : courseColor === "coral"
                                    ? "bg-rose-600"
                                    : "bg-indigo-600"
                    )}>
                        {index + 1}
                    </div>

                    {/* Información del tema */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                {w.numSem}
                            </span>
                            {isHabilitada ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    <Eye className="w-3 h-3" /> Habilitada
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                    <EyeOff className="w-3 h-3" /> Inhabilitada
                                </span>
                            )}
                        </div>

                        {/* Título de la semana */}
                        <h3 className="font-display font-bold text-base sm:text-lg leading-snug truncate text-foreground">
                            {w.nombreTema || (tieneMaterial
                                ? (w.materiales.length === 1 ? w.materiales[0].nombreArchivo : `${w.materiales.length} archivos subidos`)
                                : "Sin tema asignado")}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                            <span className="inline-flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" /> {w.totalPreguntas ?? 0} preguntas
                            </span>

                            {tieneMaterial ? (
                                <span className="inline-flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5" /> {w.materiales.length} archivo(s)
                                </span>
                            ) : (
                                <span className="text-muted-foreground/70">Sin material aún</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de acción del docente (a la derecha) - Se aísla el pointer para no interferir con el drag */}
                <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 self-end md:self-center shrink-0 w-full sm:w-auto justify-end pt-2 md:pt-0 border-t border-border/40 md:border-t-0 cursor-default"
                >
                    {/* Botón de lapiz a la derecha dentro de un circulito */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditTitle(w);
                        }}
                        title="Editar título o tema de la semana"
                        className="w-8 h-8 rounded-full border border-border/80 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 flex items-center justify-center text-muted-foreground transition-all shadow-2xs shrink-0 cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón Inhabilitar / Habilitar */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleHabilitada(w.id);
                        }}
                        disabled={togglePending}
                        title={isHabilitada ? "Inhabilitar semana para los alumnos" : "Habilitar semana para los alumnos"}
                        className={cn(
                            "gap-1.5 text-xs font-semibold rounded-lg h-8 px-3 cursor-pointer",
                            !isHabilitada && "text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                        )}
                    >
                        {isHabilitada ? (
                            <>
                                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> Inhabilitar
                            </>
                        ) : (
                            <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" /> Habilitar
                            </>
                        )}
                    </Button>

                    {/* Botón Eliminar si no tiene material ni preguntas */}
                    {sinContenido && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEliminar(w.id, w.numSem);
                            }}
                            disabled={eliminarPending}
                            title="Eliminar semana vacía"
                            className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 w-8 h-8 p-0 rounded-lg shrink-0 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}

                    {/* Botón Gestionar */}
                    <Link
                        to={`/docente/curso/${courseId}/semana/${w.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8 rounded-lg font-semibold text-xs text-white shadow-xs transition hover:opacity-95 shrink-0 cursor-pointer",
                            courseColor === "lime" ? "bg-emerald-600" : courseColor === "coral" ? "bg-rose-600" : "bg-indigo-600"
                        )}
                    >
                        Gestionar <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </Reorder.Item>
    );
}

export default function TeacherCourse() {
    const { courseId = "" } = useParams();
    const queryClient = useQueryClient();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user.id;

    // Estados para modales
    const [openCrearModal, setOpenCrearModal] = useState(false);
    const [nuevoTema, setNuevoTema] = useState("");
    const [semanaAEditar, setSemanaAEditar] = useState<any | null>(null);
    const [editandoTitulo, setEditandoTitulo] = useState("");

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

    // 3. Estado local para permitir arrastrar y reordenar
    const [orderedWeeks, setOrderedWeeks] = useState<any[]>([]);

    useEffect(() => {
        if (weeks && weeks.length > 0) {
            const sorted = [...weeks].sort((a: any, b: any) => {
                return parseWeekNumber(a.numSem) - parseWeekNumber(b.numSem);
            });
            setOrderedWeeks(sorted);
        } else {
            setOrderedWeeks([]);
        }
    }, [weeks]);

    // Mutación: Reordenar semanas por arrastre
    const reordenarMutation = useMutation({
        mutationFn: (semanaIds: string[]) => coursesApi.reordenarSemanas(courseId, semanaIds),
        onSuccess: () => {
            toast.success("Nuevo orden de semanas guardado");
            queryClient.invalidateQueries({ queryKey: ['semanas', courseId] });
        },
        onError: () => {
            toast.error("Error al guardar el nuevo orden");
            queryClient.invalidateQueries({ queryKey: ['semanas', courseId] });
        },
    });

    const handleReorder = (newOrder: any[]) => {
        // Solo actualizamos el estado visual inmediato para que el arrastre sea 100% fluido (sin llamadas HTTP que cancelen el drag)
        setOrderedWeeks(newOrder);
    };

    const handleDragEnd = () => {
        // Solo cuando el usuario suelta la semana recalculamos números y guardamos en la base de datos
        setOrderedWeeks((prev) => {
            const updated = prev.map((w, index) => ({
                ...w,
                numSem: `Semana ${index + 1}`,
            }));
            const ids = updated.map((w) => String(w.id));
            reordenarMutation.mutate(ids);
            return updated;
        });
    };

    // Mutación: Crear semana
    const crearSemanaMutation = useMutation({
        mutationFn: (tema?: string) => semanasApi.crear(courseId, tema),
        onSuccess: () => {
            toast.success("Nueva semana agregada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['semanas', courseId] });
            queryClient.invalidateQueries({ queryKey: ['teacher-courses', teacherId] });
            setOpenCrearModal(false);
            setNuevoTema("");
        },
        onError: (err: any) => {
            toast.error(err?.message || "Error al crear la semana");
        },
    });

    // Mutación: Renombrar semana
    const renombrarMutation = useMutation({
        mutationFn: ({ semanaId, nombreTema }: { semanaId: string; nombreTema: string }) =>
            semanasApi.renombrar(semanaId, nombreTema),
        onSuccess: () => {
            toast.success("Título de la semana actualizado");
            queryClient.invalidateQueries({ queryKey: ['semanas', courseId] });
            setSemanaAEditar(null);
            setEditandoTitulo("");
        },
        onError: (err: any) => {
            toast.error(err?.message || "Error al actualizar el título");
        },
    });

    // Mutación: Toggle habilitada
    const toggleHabilitadaMutation = useMutation({
        mutationFn: (semanaId: string) => semanasApi.toggleHabilitada(semanaId),
        onSuccess: (res: any) => {
            const estaHabilitada = res?.habilitada;
            toast.success(
                estaHabilitada
                    ? "Semana habilitada para los alumnos"
                    : "Semana inhabilitada para los alumnos"
            );
            queryClient.invalidateQueries({ queryKey: ['semanas', courseId] });
        },
        onError: (err: any) => {
            toast.error(err?.message || "Error al cambiar el estado de la semana");
        },
    });

    // Mutación: Eliminar semana
    const eliminarMutation = useMutation({
        mutationFn: (semanaId: string) => semanasApi.eliminar(semanaId),
        onSuccess: () => {
            toast.success("Semana eliminada exitosamente");
            queryClient.invalidateQueries({ queryKey: ['semanas', courseId] });
            queryClient.invalidateQueries({ queryKey: ['teacher-courses', teacherId] });
        },
        onError: (err: any) => {
            toast.error(err?.message || "No se pudo eliminar la semana. Ya contiene intentos o materiales.");
        },
    });

    const handleCrearSemanaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        crearSemanaMutation.mutate(nuevoTema.trim() || undefined);
    };

    const handleRenombrarSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!semanaAEditar) return;
        const nombre = editandoTitulo.trim();
        if (!nombre) {
            toast.warning("El título no puede estar vacío");
            return;
        }
        renombrarMutation.mutate({
            semanaId: semanaAEditar.id,
            nombreTema: nombre,
        });
    };

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
                    "rounded-xl p-6 sm:p-8 text-primary-foreground shadow-sm relative overflow-hidden",
                    colorMap[course.color as keyof typeof colorMap] ?? "bg-primary-gradient"
                )}
            >
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.25] select-none text-white pointer-events-none">
                    {getCourseIcon(course.emoji, "w-36 h-36 md:w-40 md:h-40")}
                </div>
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-3">
                    Curso · Semestre 2026-1
                </span>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 relative z-10">
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 max-w-2xl">{course.name}</h1>
                        <p className="opacity-90 max-w-xl text-sm">
                            {weeks.length} semanas · {course.studentCount ?? 0} alumnos matriculados
                        </p>
                    </div>

                    {/* Botón para ir a gestionar alumnos */}
                    <Link
                        to={`/docente/curso/${courseId}/alumnos`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/40 transition-all text-white font-semibold rounded-lg shrink-0 self-start md:self-auto text-sm"
                    >
                        <Users className="w-4 h-4" /> Gestionar clase
                    </Link>
                </div>
            </motion.section>

            {/* Lista de semanas */}
            <section>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
                    <div>
                        <h2 className="font-display text-2xl md:text-3xl font-bold">Semanas del curso</h2>
                        <span className="text-sm text-muted-foreground font-semibold">
                            Gestiona el material, título y visibilidad. Arrastra las semanas para cambiar su orden.
                        </span>
                    </div>

                    <Button
                        onClick={() => {
                            setNuevoTema("");
                            setOpenCrearModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl font-bold text-sm shrink-0 self-start sm:self-auto shadow-xs"
                    >
                        <Plus className="w-4 h-4" /> Agregar semana
                    </Button>
                </div>

                {isLoading && <p className="text-muted-foreground text-sm">Cargando semanas...</p>}

                {/* Lista reordenable con Framer Motion */}
                <Reorder.Group
                    axis="y"
                    values={orderedWeeks}
                    onReorder={handleReorder}
                    className="space-y-3 list-none p-0 m-0"
                >
                    {orderedWeeks.map((w: any, i: number) => (
                        <TeacherWeekItem
                            key={w.id}
                            week={w}
                            index={i}
                            courseColor={course.color}
                            courseId={courseId}
                            onEditTitle={(weekToEdit) => {
                                setSemanaAEditar(weekToEdit);
                                setEditandoTitulo(weekToEdit.nombreTema || "");
                            }}
                            onToggleHabilitada={(id) => toggleHabilitadaMutation.mutate(id)}
                            onEliminar={(id, numSem) => {
                                if (window.confirm(`¿Estás seguro de eliminar la ${numSem}?`)) {
                                    eliminarMutation.mutate(id);
                                }
                            }}
                            onDragEnd={handleDragEnd}
                            togglePending={toggleHabilitadaMutation.isPending}
                            eliminarPending={eliminarMutation.isPending}
                        />
                    ))}
                </Reorder.Group>

                {!isLoading && weeks.length === 0 && (
                    <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
                        <p className="text-muted-foreground text-sm mb-3">Este curso no tiene semanas registradas aún.</p>
                        <Button
                            onClick={() => {
                                setNuevoTema("");
                                setOpenCrearModal(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl font-bold text-sm"
                        >
                            <Plus className="w-4 h-4" /> Agregar primera semana
                        </Button>
                    </div>
                )}
            </section>

            {/* Tip */}
            <section className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-center gap-5">
                <div className="w-12 h-12 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-display font-bold text-lg">Organiza y sube el material</h3>
                    <p className="text-sm text-muted-foreground">
                        Puedes arrastrar las semanas usando el icono a la izquierda para reordenarlas. Entra a cada semana para subir tus archivos y generar preguntas.
                    </p>
                </div>
            </section>

            {/* Modal: Crear Semana */}
            <Dialog open={openCrearModal} onOpenChange={setOpenCrearModal}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleCrearSemanaSubmit}>
                        <DialogHeader>
                            <DialogTitle>Agregar nueva semana</DialogTitle>
                            <DialogDescription>
                                Se creará la <strong>Semana {weeks.length + 1}</strong> para este curso. Puedes asignarle un tema ahora o dejarlo para después.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nuevoTema">Tema o Título (opcional)</Label>
                                <Input
                                    id="nuevoTema"
                                    placeholder="Ej. Introducción a la Semántica"
                                    value={nuevoTema}
                                    onChange={(e) => setNuevoTema(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpenCrearModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={crearSemanaMutation.isPending}
                            >
                                {crearSemanaMutation.isPending ? "Creando..." : "Crear semana"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar Título de la Semana */}
            <Dialog open={!!semanaAEditar} onOpenChange={(open) => !open && setSemanaAEditar(null)}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleRenombrarSubmit}>
                        <DialogHeader>
                            <DialogTitle>Editar título de {semanaAEditar?.numSem}</DialogTitle>
                            <DialogDescription>
                                Modifica el nombre del tema que verán los estudiantes para esta semana.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="editandoTitulo">Título o tema de la semana</Label>
                                <Input
                                    id="editandoTitulo"
                                    placeholder="Ej. El signo lingüístico y relaciones semánticas"
                                    value={editandoTitulo}
                                    onChange={(e) => setEditandoTitulo(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSemanaAEditar(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={renombrarMutation.isPending}
                            >
                                {renombrarMutation.isPending ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}