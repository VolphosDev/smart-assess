import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ArrowRight, BookOpen, Plus, X, MoreVertical, Edit2, Trash2, AlertTriangle, Loader2, GraduationCap, TrendingUp, BarChart2, Calendar, Filter, ChevronDown, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { coursesApi, intentosApi } from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/icon-mapper";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const iconColorMap = {
    primary: "bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
    lime: "bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
    coral: "bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
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

    const { data: rendimiento = [] } = useQuery({
        queryKey: ['teacher-rendimiento', teacherId],
        queryFn: () => coursesApi.rendimiento(teacherId),
        enabled: !!teacherId
    });

    // Estados para los modales
    const [openModal, setOpenModal] = useState<"create" | "edit" | "delete" | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null); // Para el dropdown de opciones

    const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("all");
    const [chartType, setChartType] = useState<"grades" | "activity">("grades");
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    const { data: allAttempts = [], isLoading: loadingAttempts, refetch: refetchAttempts } = useQuery({
        queryKey: ['teacher-attempts', teacherId],
        queryFn: async () => {
            const response = await intentosApi.todos();
            return response.data || response;
        },
        enabled: !!teacherId
    });

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

    // --- LÓGICA DE ANALÍTICAS DIVERSIFICADAS PARA DOCENTE ---
    const teacherCourseNames = courses.map((c: any) => c.name);
    const teacherAttempts = allAttempts.filter((att: any) => teacherCourseNames.includes(att.curso));
    const sortedAttempts = [...teacherAttempts].sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b).getTime());

    const filteredAttempts = sortedAttempts.filter((att: any) => {
        const matchCourse = selectedCourse === "all" || att.curso === selectedCourse;
        const matchStudent = selectedStudentNames.length === 0 || selectedStudentNames.includes(att.alumno);
        return matchCourse && matchStudent;
    });

    const studentList = Array.from(new Set(teacherAttempts.map((att: any) => att.alumno).filter(Boolean)));
    const courseList = teacherCourseNames;

    const uniqueDates = Array.from(new Set(filteredAttempts.map((att: any) => 
        new Date(att.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })
    )));

    const colorsPalette = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

    const getStudentColor = (key: string) => {
        if (key === "Promedio General" || key === "Total Intentos") return "#6366f1";
        const idx = studentList.indexOf(key);
        if (idx !== -1) return colorsPalette[idx % colorsPalette.length];
        return "#6366f1";
    };

    const chartDataGrades = uniqueDates.map(dateStr => {
        const dataPoint: any = { date: dateStr };
        const attemptsOnDate = filteredAttempts.filter((att: any) => 
            new Date(att.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) === dateStr
        );
        if (selectedStudentNames.length === 0) {
            const sum = attemptsOnDate.reduce((acc: number, att: any) => acc + att.nota, 0);
            dataPoint["Promedio General"] = attemptsOnDate.length > 0 ? Number((sum / attemptsOnDate.length).toFixed(1)) : 0;
        } else {
            selectedStudentNames.forEach(name => {
                const studentAttempts = attemptsOnDate.filter((att: any) => att.alumno === name);
                if (studentAttempts.length > 0) {
                    const sum = studentAttempts.reduce((acc: number, att: any) => acc + att.nota, 0);
                    dataPoint[name] = Number((sum / studentAttempts.length).toFixed(1));
                }
            });
        }
        return dataPoint;
    });

    const chartDataActivity = uniqueDates.map(dateStr => {
        const dataPoint: any = { date: dateStr };
        const attemptsOnDate = filteredAttempts.filter((att: any) => 
            new Date(att.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) === dateStr
        );
        if (selectedStudentNames.length === 0) {
            dataPoint["Total Intentos"] = attemptsOnDate.length;
        } else {
            selectedStudentNames.forEach(name => {
                const studentAttempts = attemptsOnDate.filter((att: any) => att.alumno === name);
                dataPoint[name] = studentAttempts.length;
            });
        }
        return dataPoint;
    });

    const activeKeys = selectedStudentNames.length === 0 
        ? (chartType === "grades" ? ["Promedio General"] : ["Total Intentos"]) 
        : selectedStudentNames;

    return (
        <div className="space-y-8 pb-20">
            <section className="bg-hero-gradient rounded-xl p-8 text-primary-foreground relative overflow-hidden shadow-sm">
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

            {/* Detailed Interactive Chart Section */}
            <section className="bg-card border border-border rounded-xl p-6 shadow-xs text-left space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h2 className="font-display font-bold text-xl flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" /> Analíticas Detalladas
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Evolución del desempeño y frecuencia de uso por alumno a lo largo del tiempo.</p>
                    </div>

                    <div className="flex bg-muted rounded-lg p-1 border border-border shrink-0 self-start md:self-auto">
                        <button
                            onClick={() => setChartType("grades")}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                                chartType === "grades"
                                    ? "bg-card shadow-xs text-foreground font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <TrendingUp className="w-3.5 h-3.5" /> Notas
                        </button>
                        <button
                            onClick={() => setChartType("activity")}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                                chartType === "activity"
                                    ? "bg-card shadow-xs text-foreground font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BarChart2 className="w-3.5 h-3.5" /> Actividad
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 relative">
                        <Label className="text-xs font-bold text-muted-foreground">Filtrar Estudiantes</Label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                                className="w-full flex items-center justify-between px-3 h-10 border border-border rounded-lg bg-background text-sm font-medium hover:bg-muted/40 transition-all text-left"
                            >
                                <span className="truncate pr-4">
                                    {selectedStudentNames.length === 0
                                        ? "Todos los estudiantes"
                                        : selectedStudentNames.length === 1
                                            ? selectedStudentNames[0]
                                            : `${selectedStudentNames.length} seleccionados`}
                                </span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            </button>

                            {showStudentDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowStudentDropdown(false)} />
                                    <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto p-2 z-50 space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedStudentNames([]);
                                                setShowStudentDropdown(false);
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted text-xs font-semibold text-primary transition-colors flex items-center justify-between"
                                        >
                                            Mostrar todos
                                            {selectedStudentNames.length === 0 && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                        <div className="border-t border-border/60 my-1" />
                                        {studentList.map((name: string) => {
                                            const isSelected = selectedStudentNames.includes(name);
                                            return (
                                                <label
                                                    key={name}
                                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-xs font-medium cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
                                                                setSelectedStudentNames(selectedStudentNames.filter(n => n !== name));
                                                            } else {
                                                                setSelectedStudentNames([...selectedStudentNames, name]);
                                                            }
                                                        }}
                                                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5 border-border"
                                                    />
                                                    <span className="truncate">{name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Curso</Label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full h-10 px-3 border border-border rounded-lg bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                        >
                            <option value="all">Todos los cursos</option>
                            {courseList.map((course: string) => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedStudentNames([]);
                                setSelectedCourse("all");
                                refetchAttempts();
                            }}
                            className="h-10 px-3.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 shrink-0"
                            title="Restablecer filtros"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Limpiar
                        </Button>
                    </div>
                </div>

                <div className="border border-border/80 rounded-xl p-4 bg-muted/10">
                    {loadingAttempts ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-xs font-semibold">Cargando analíticas...</span>
                        </div>
                    ) : allAttempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center gap-2">
                            <Calendar className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm font-semibold">Sin registros de actividad</p>
                            <p className="text-xs max-w-xs leading-normal">Tus alumnos aún no han completado prácticas.</p>
                        </div>
                    ) : filteredAttempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center gap-2">
                            <Filter className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm font-semibold">Sin coincidencias</p>
                            <p className="text-xs max-w-xs leading-normal">No se encontraron intentos para los filtros seleccionados.</p>
                        </div>
                    ) : (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === "grades" ? (
                                    <LineChart data={chartDataGrades} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600} />
                                        <YAxis domain={[0, 20]} stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600} />
                                        <Tooltip
                                            contentStyle={{
                                                background: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: 8,
                                                fontSize: 12
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 11, pt: 10 }} />
                                        {activeKeys.map((key) => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stroke={getStudentColor(key as string)}
                                                strokeWidth={2.5}
                                                activeDot={{ r: 6 }}
                                                connectNulls
                                            />
                                        ))}
                                    </LineChart>
                                ) : (
                                    <BarChart data={chartDataActivity} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600} />
                                        <Tooltip
                                            contentStyle={{
                                                background: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: 8,
                                                fontSize: 12
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 11, pt: 10 }} />
                                        {activeKeys.map((key) => (
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                fill={getStudentColor(key as string)}
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={50}
                                            />
                                        ))}
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Mis cursos</h2>
                    <Button
                        onClick={() => {
                            setForm({ name: "", description: "", weeks: 4, emoji: "📘", color: "primary" });
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
                                        className="block bg-card border border-border rounded-xl p-6 pt-8 shadow-xs hover:-translate-y-0.5 hover:shadow-xs hover:border-border/80 transition-all h-full relative overflow-hidden text-left"
                                    >
                                        {/* Accent Top Color Bar */}
                                        <div className={cn(
                                            "absolute top-0 left-0 right-0 h-1.5 transition-all duration-300",
                                            c.color === "lime" ? "bg-emerald-500" : c.color === "coral" ? "bg-rose-500" : "bg-indigo-600"
                                        )} />

                                        <div className="mb-4">
                                            <div className={cn(
                                                "w-11 h-11 rounded-lg grid place-items-center shadow-xs border transition-all",
                                                c.color === "lime" ? "bg-emerald-100/80 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400" : 
                                                c.color === "coral" ? "bg-rose-100/80 border-rose-300 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400" : 
                                                "bg-indigo-100/80 border-indigo-300 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400"
                                            )}>
                                                {getCourseIcon(c.emoji, "w-5.5 h-5.5")}
                                            </div>
                                        </div>

                                        <h3 className={cn(
                                            "font-display font-bold text-lg mb-1 transition-colors group-hover:underline text-left",
                                            c.color === "lime" ? "text-emerald-700 dark:text-emerald-400" : 
                                            c.color === "coral" ? "text-rose-700 dark:text-rose-400" : 
                                            "text-indigo-700 dark:text-indigo-400"
                                        )}>
                                            {c.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold mb-4 text-left">
                                            <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.weeks} semanas</span>
                                            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.studentCount} alumnos</span>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1 text-sm font-bold",
                                            c.color === "lime" ? "text-emerald-600 dark:text-emerald-400" : c.color === "coral" ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"
                                        )}>
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
                                            className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
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
                    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/45 p-4" onClick={() => setOpenModal(null)}>
                        <motion.form
                            initial={{ scale: 0.97, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.97, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={handleSubmit}
                            className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4 text-left"
                        >
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <h3 className="font-display font-bold text-lg">
                                    {openModal === "create" ? "Nuevo curso" : "Editar curso"}
                                </h3>
                                <button type="button" onClick={() => setOpenModal(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nombre del curso</Label>
                                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Química Orgánica" className="h-11 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Descripción (opcional)</Label>
                                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción del curso" className="h-11 rounded-lg" />
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
                                        className="h-11 rounded-lg"
                                        disabled={openModal === "edit"} // Deshabilitamos editar semanas para evitar conflictos con registros existentes
                                        title={openModal === "edit" ? "No se puede cambiar el número de semanas de un curso existente" : ""}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Color</Label>
                                    <div className="flex gap-2 h-11 items-center">
                                        {colors.map((col) => (
                                            <button key={col} type="button" onClick={() => setForm({ ...form, color: col })}
                                                    className={cn("w-9 h-9 rounded-lg border transition-all", iconColorMap[col], form.color === col ? "ring-2 ring-primary" : "")} />
                                        ))}
                                    </div>
                                </div>
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
                            <Button
                                type="submit"
                                disabled={editMutation.isPending}
                                className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold mt-2 shadow-sm"
                            >
                                {editMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (openModal === "create" ? "Crear curso" : "Guardar cambios")}
                            </Button>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmar Eliminación */}
            <AnimatePresence>
                {openModal === "delete" && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/45 p-4" onClick={() => setOpenModal(null)}>
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
                )}
            </AnimatePresence>
        </div>
    );
}