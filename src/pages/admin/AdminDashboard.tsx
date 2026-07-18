import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Users, GraduationCap, BookOpenCheck, Loader2, Download, ShieldCheck, TrendingUp, BarChart2, Calendar, Filter, ChevronDown, Check, RefreshCw, Unlock, Lock, Key, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usersApi } from "@/api";
import { intentosApi } from "@/api/courses";
import { API_CONFIG } from "@/api/config";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/lib/icon-mapper";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const avatars = ["🦊", "🐼", "🦄", "🐯", "🦋", "🚀", "🐙", "🐵", "🦁", "🐨"];

export default function AdminDashboard() {
    const queryClient = useQueryClient();

    // 1. Estados del formulario
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Estados de registro masivo
    const [activeTab, setActiveTab] = useState<"individual" | "masivo">("individual");
    const [bulkNames, setBulkNames] = useState("");
    const [bulkPreview, setBulkPreview] = useState<{ name: string; email: string; role: string; password: string }[]>([]);

    // Estados para cambio de contraseña
    const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState<any>(null);
    const [newPassword, setNewPassword] = useState("");

    const { data: users = [], isLoading: loadingUsers } = useQuery<any[]>({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const response = await usersApi.getAll();
            return response.data || response;
        },
    });

    // 2. Estados para filtros de analíticas
    const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("all");
    const [chartType, setChartType] = useState<"grades" | "activity">("grades");
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    // Cargar todos los intentos para analíticas dinámicas
    const { data: attempts = [], isLoading: loadingAttempts, refetch: refetchAttempts } = useQuery<any[]>({
        queryKey: ['admin-attempts'],
        queryFn: async () => {
            const response = await intentosApi.todos();
            return response.data || response;
        },
    });

    const downloadGlobalCSV = async () => {
        try {
            toast.loading("Generando reporte global...");
            const data = await intentosApi.todos();
            toast.dismiss();
            if (!data || data.length === 0) {
                toast.error("No hay notas registradas en el sistema");
                return;
            }

            const headers = ["ID Intento", "Alumno", "Correo", "Curso", "Semana", "Tecnica", "Nota", "Fecha"];
            const rows = data.map((i: any) => {
                let tecnicaLabel = i.tecnica || "Práctica";
                switch (tecnicaLabel.toLowerCase()) {
                    case "opcion_multiple": tecnicaLabel = "Opción múltiple"; break;
                    case "verdadero_falso": tecnicaLabel = "Verdadero / Falso"; break;
                    case "abierta": tecnicaLabel = "Pregunta abierta"; break;
                    case "deteccion_errores": tecnicaLabel = "Detección de errores"; break;
                    case "visual_quiz": tecnicaLabel = "Visual Quiz"; break;
                    case "avatar": tecnicaLabel = "Avatar Tutor"; break;
                    case "video": tecnicaLabel = "Video Tutor"; break;
                    case "adaptativa": tecnicaLabel = "Evaluación Recomendadora"; break;
                }
                return [
                    i.id,
                    i.alumno,
                    i.correo,
                    i.curso,
                    i.semana,
                    tecnicaLabel,
                    i.nota,
                    new Date(i.fecha).toLocaleString()
                ];
            });

            const csvRows = [
                headers.join(","),
                ...rows.map((row: any) => row.map((val: any) => {
                    const stringVal = val === null || val === undefined ? "" : String(val);
                    const escaped = stringVal.replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(","))
            ];
            const csvContent = csvRows.join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Reporte_Global_Notas_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Reporte global descargado correctamente");
        } catch (err: any) {
            toast.dismiss();
            toast.error("Error al descargar el reporte global: " + (err.message || err));
        }
    };

    // Filtramos por los roles que devuelve Java (STUDENT y TEACHER)
    const students = users.filter((u: any) => u.rol === "STUDENT");
    const teachers = users.filter((u: any) => u.rol === "TEACHER");

    // 3. Mutación para crear usuario
    const createMutation = useMutation({
        mutationFn: (userData: any) => usersApi.create(userData),
        onSuccess: () => {
            toast.success(`${role === "student" ? "Alumno" : "Docente"} registrado correctamente`);
            setName("");
            setEmail("");
            setPassword("");
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => {
            let msg = "Error al registrar";

            // Intentamos extraer el error limpio
            const rawError = error?.response?.data || error?.message;

            if (typeof rawError === "string") {
                try {
                    // Si viene como string '{"message": "..."}', lo parseamos
                    const parsed = JSON.parse(rawError);
                    msg = parsed.message || rawError;
                } catch (e) {
                    msg = rawError; // Si no es JSON, dejamos el texto tal cual
                }
            } else if (rawError?.message) {
                // Si ya es un objeto
                msg = rawError.message;
            }

            toast.error(msg);
        }
    });

    const bulkCreateMutation = useMutation({
        mutationFn: (usersList: any[]) => usersApi.crearMasivo(usersList),
        onSuccess: (res) => {
            toast.success(res?.data?.message || "Usuarios masivos registrados");
            setBulkNames("");
            setBulkPreview([]);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => {
            let msg = "Error al registrar masivamente";
            const rawError = error?.response?.data || error?.message;
            if (typeof rawError === "string") {
                try { msg = JSON.parse(rawError).message || rawError; } catch (e) { msg = rawError; }
            } else if (rawError?.message) { msg = rawError.message; }
            toast.error(msg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => usersApi.remove(id),
        onSuccess: () => {
            toast.success("Usuario eliminado");
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => {
            let msg = "Error al eliminar el usuario";
            const rawError = error?.response?.data || error?.message;

            if (typeof rawError === "string") {
                try {
                    msg = JSON.parse(rawError).message || rawError;
                } catch (e) {
                    msg = rawError;
                }
            } else if (rawError?.message) {
                msg = rawError.message;
            }

            toast.error(msg);
        }
    });

    const toggleBlockMutation = useMutation({
        mutationFn: (id: string | number) => usersApi.toggleBlock(id),
        onSuccess: (data: any) => {
            const status = data?.data?.cuentaBloqueada ? "bloqueada" : "desbloqueada";
            toast.success(`Cuenta ${status} exitosamente`);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => {
            let msg = "Error al cambiar el estado del usuario";
            const rawError = error?.response?.data || error?.message;
            if (typeof rawError === "string") {
                try { msg = JSON.parse(rawError).message || rawError; } catch (e) { msg = rawError; }
            } else if (rawError?.message) { msg = rawError.message; }
            toast.error(msg);
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: ({ id, password }: { id: string | number; password: string }) => usersApi.changePassword(id, password),
        onSuccess: () => {
            toast.success("Contraseña actualizada exitosamente");
            setSelectedUserForPasswordChange(null);
            setNewPassword("");
        },
        onError: (error: any) => {
            let msg = "Error al cambiar la contraseña";
            const rawError = error?.response?.data || error?.message;
            if (typeof rawError === "string") {
                try { msg = JSON.parse(rawError).message || rawError; } catch (e) { msg = rawError; }
            } else if (rawError?.message) { msg = rawError.message; }
            toast.error(msg);
        }
    });

    const backupDatabase = async () => {
        try {
            toast.loading("Generando copia de seguridad de la base de datos...", { id: "backup-toast" });
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_CONFIG.baseUrl}/admin/usuarios/backup`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = "Error al descargar el backup";
                try {
                    const parsed = JSON.parse(errorText);
                    errorMsg = parsed.message || errorMsg;
                } catch {
                    errorMsg = errorText || errorMsg;
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const disposition = response.headers.get("content-disposition");
            let filename = `colegio_db_backup_${new Date().toISOString().split('T')[0]}.sql`;
            if (disposition && disposition.indexOf("attachment") !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success("Copia de seguridad descargada y guardada en MongoDB", { id: "backup-toast" });
        } catch (err: any) {
            toast.error("Error al generar backup: " + err.message, { id: "backup-toast" });
        }
    };

    const register = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            name,
            email,
            role,
            password, // <-- Mandamos la contraseña a Java
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
        });
    };

    // Lógica para generar correos
    const handleGeneratePreview = () => {
        if (!bulkNames.trim()) return;
        const lines = bulkNames.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const existingEmails = new Set(users.map((u: any) => u.correo));
        const preview: { name: string; email: string; role: string; password: string }[] = [];

        lines.forEach(fullName => {
            const parts = fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").split(/\s+/);
            let base = "";
            if (parts.length >= 3) {
                base = parts[0].charAt(0) + parts[parts.length - 2] + parts[parts.length - 1].charAt(0);
            } else if (parts.length === 2) {
                base = parts[0].charAt(0) + parts[1];
            } else {
                base = parts[0];
            }
            
            let email = `${base}@semantika.edu.pe`;
            let num = 2;
            while (existingEmails.has(email)) {
                email = `${base}${num}@semantika.edu.pe`;
                num++;
            }
            existingEmails.add(email);
            
            preview.push({
                name: fullName,
                email: email,
                role: role,
                password: password || "123456" // Contraseña temporal por defecto
            });
        });
        setBulkPreview(preview);
    };

    const registerBulk = () => {
        if (bulkPreview.length === 0) return;
        bulkCreateMutation.mutate(bulkPreview);
    };
    // --- LÓGICA DE ANALÍTICAS DIVERSIFICADAS ---
    const sortedAttempts = [...attempts].sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Filtrado de intentos
    const filteredAttempts = sortedAttempts.filter((att: any) => {
        const matchCourse = selectedCourse === "all" || att.curso === selectedCourse;
        const matchStudent = selectedStudentNames.length === 0 || selectedStudentNames.includes(att.alumno);
        return matchCourse && matchStudent;
    });

    // Extraer lista única de estudiantes y cursos de forma dinámica
    const studentList = Array.from(new Set(students.map((s: any) => s.nombre || s.name).filter(Boolean)));
    const courseList = Array.from(new Set(attempts.map((att: any) => att.curso).filter(Boolean)));

    // Extraer fechas únicas formateadas de los intentos filtrados
    const uniqueDates = Array.from(new Set(filteredAttempts.map((att: any) => 
        new Date(att.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })
    )));

    // Paleta de colores para las líneas/barras del gráfico comparativo
    const colorsPalette = ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

    const getStudentColor = (key: string) => {
        if (key === "Promedio General" || key === "Total Intentos") {
            return "#6366f1"; // Indigo default for general stats
        }
        const idx = studentList.indexOf(key);
        if (idx !== -1) {
            return colorsPalette[idx % colorsPalette.length];
        }
        return "#6366f1"; // fallback
    };

    // Datos del gráfico: evolución de calificaciones
    const chartDataGrades = uniqueDates.map(dateStr => {
        const dataPoint: any = { date: dateStr };
        const attemptsOnDate = filteredAttempts.filter((att: any) => 
            new Date(att.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) === dateStr
        );
        
        if (selectedStudentNames.length === 0) {
            // Promedio General cuando no hay alumno específico seleccionado
            const sum = attemptsOnDate.reduce((acc: number, att: any) => acc + att.nota, 0);
            dataPoint["Promedio General"] = attemptsOnDate.length > 0 
                ? Number((sum / attemptsOnDate.length).toFixed(1)) 
                : 0;
        } else {
            // Línea individual por alumno seleccionado para comparar
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

    // Datos del gráfico: frecuencia de uso (cantidad de intentos)
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

    // Claves activas que se trazarán en el gráfico
    const activeKeys = selectedStudentNames.length === 0 
        ? (chartType === "grades" ? ["Promedio General"] : ["Total Intentos"]) 
        : selectedStudentNames;

    return (
        <div className="space-y-8">
            <motion.section
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-hero-gradient rounded-xl p-8 text-primary-foreground shadow-sm relative overflow-hidden"
            >
                <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 md:w-36 md:h-36 opacity-[0.25] select-none pointer-events-none text-white" />
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-3">
                    Panel administrador
                </span>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 relative z-10">
                    <div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 max-w-2xl">
                            Gestiona cuentas de alumnos y docentes
                        </h1>
                        <p className="opacity-90 max-w-xl text-sm">
                            Registra nuevas cuentas y asígnales una contraseña temporal.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                        <Button
                            onClick={backupDatabase}
                            className="bg-white/10 hover:bg-white/20 border border-white/40 text-white font-semibold rounded-lg px-5 py-2.5 flex items-center gap-2 active:scale-95 transition-all w-full sm:w-auto text-sm"
                        >
                            <Database className="w-4 h-4" /> Respaldar Base de Datos
                        </Button>
                        <Button
                            onClick={downloadGlobalCSV}
                            className="bg-white/10 hover:bg-white/20 border border-white/40 text-white font-semibold rounded-lg px-5 py-2.5 flex items-center gap-2 active:scale-95 transition-all w-full sm:w-auto text-sm"
                        >
                            <Download className="w-4.5 h-4.5" /> Descargar Notas
                        </Button>
                    </div>
                </div>
            </motion.section>

            {/* Stats */}
            <section className="grid sm:grid-cols-3 gap-4">
                <Stat icon={GraduationCap} label="Alumnos" value={students.length} tone="emerald" />
                <Stat icon={BookOpenCheck} label="Docentes" value={teachers.length} tone="rose" />
                <Stat icon={Users} label="Total Usuarios" value={users.length} tone="indigo" />
            </section>

            {/* Sección de Analíticas de Desempeño y Uso */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 text-left"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <h2 className="font-display font-bold text-xl flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" /> Analíticas de Alumnos
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Seguimiento del desempeño académico y la frecuencia de uso en tiempo real.</p>
                    </div>

                    {/* Botones de Cambio de Gráfico */}
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
                    {/* Filtro: Estudiante (Multi-selección dropdown) */}
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

                    {/* Filtro: Curso */}
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

                    {/* Botón Refrescar y Reset */}
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

                {/* Contenedor del Gráfico */}
                <div className="border border-border/80 rounded-xl p-4 bg-muted/10">
                    {loadingAttempts ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-xs font-semibold">Cargando analíticas...</span>
                        </div>
                    ) : attempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center gap-2">
                            <Calendar className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm font-semibold">Sin registros de actividad</p>
                            <p className="text-xs max-w-xs leading-normal">Los alumnos aún no han completado prácticas en la plataforma.</p>
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
                                                stroke={getStudentColor(key)}
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
                                                fill={getStudentColor(key)}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        ))}
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </motion.section>

            <div className="grid lg:grid-cols-[380px_1fr] gap-6">
                <div className="bg-card border border-border rounded-xl shadow-xs h-fit text-left flex flex-col">
                    <div className="flex border-b border-border">
                        <button 
                            className={cn("flex-1 py-4 text-sm font-bold transition-all", activeTab === "individual" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/50")}
                            onClick={() => setActiveTab("individual")}
                        >
                            Individual
                        </button>
                        <button 
                            className={cn("flex-1 py-4 text-sm font-bold transition-all", activeTab === "masivo" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/50")}
                            onClick={() => setActiveTab("masivo")}
                        >
                            Registro Masivo
                        </button>
                    </div>

                    {activeTab === "individual" ? (
                        <form onSubmit={register} className="p-6 space-y-4">
                            <h3 className="font-display font-bold text-lg flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" /> Registrar usuario
                            </h3>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                        {(["student", "teacher"] as const).map((r) => (
                            <button
                                key={r} type="button" onClick={() => setRole(r)}
                                className={cn(
                                    "py-2 rounded-lg text-sm font-bold transition",
                                    role === r ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {r === "student" ? "Alumno" : "Docente"}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Nombre completo</Label>
                        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Pérez" className="h-11 rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Correo electrónico</Label>
                        <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@gmail.com" className="h-11 rounded-lg" />
                    </div>

                    {/* NUEVO CAMPO DE CONTRASEÑA */}
                    <div className="space-y-1.5">
                        <Label>Contraseña inicial</Label>
                        <Input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña segura" className="h-11 rounded-lg" />
                    </div>

                            <Button type="submit" disabled={createMutation.isPending} className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold mt-2 shadow-sm">
                                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Registrar"}
                            </Button>
                        </form>
                    ) : (
                        <div className="p-6 space-y-4">
                            <h3 className="font-display font-bold text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" /> Registro Rápido
                            </h3>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                                {(["student", "teacher"] as const).map((r) => (
                                    <button
                                        key={r} type="button" onClick={() => setRole(r)}
                                        className={cn(
                                            "py-2 rounded-lg text-sm font-bold transition",
                                            role === r ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {r === "student" ? "Alumnos" : "Docentes"}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Lista de Nombres (uno por línea)</Label>
                                <textarea 
                                    className="w-full h-32 p-3 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    placeholder="Adriano Chacon Paredes&#10;Juan Perez Benites"
                                    value={bulkNames}
                                    onChange={(e) => setBulkNames(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Contraseña inicial genérica</Label>
                                <Input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ej: 123456" className="h-11 rounded-lg" />
                                <p className="text-xs text-muted-foreground">Se les pedirá cambiarla en su primer inicio de sesión.</p>
                            </div>

                            {bulkPreview.length === 0 ? (
                                <Button type="button" onClick={handleGeneratePreview} className="w-full h-11 bg-muted hover:bg-muted/80 text-foreground font-semibold">
                                    Generar Correos
                                </Button>
                            ) : (
                                <>
                                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg text-xs">
                                        <table className="w-full">
                                            <thead className="bg-muted sticky top-0">
                                                <tr>
                                                    <th className="p-2 text-left font-bold">Nombre</th>
                                                    <th className="p-2 text-left font-bold">Correo (Generado)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {bulkPreview.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-2 truncate max-w-[120px]">{item.name}</td>
                                                        <td className="p-2 truncate font-mono text-[10px] text-primary">{item.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => setBulkPreview([])} className="h-11 flex-1">
                                            Modificar
                                        </Button>
                                        <Button type="button" onClick={registerBulk} disabled={bulkCreateMutation.isPending} className="w-full flex-[2] h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm">
                                            {bulkCreateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Registrar ${bulkPreview.length} usuarios`}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Listas */}
                <div className="space-y-6">
                    {loadingUsers ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <>
                            <UserList 
                                title="Docentes" 
                                tone="coral" 
                                items={teachers} 
                                onRemove={(id) => deleteMutation.mutate(id)} 
                                isDeleting={deleteMutation.isPending}
                                onToggleBlock={(id) => toggleBlockMutation.mutate(id)}
                                isToggling={toggleBlockMutation.isPending}
                                onChangePassword={(u) => setSelectedUserForPasswordChange(u)}
                            />
                            <UserList 
                                title="Alumnos" 
                                tone="lime" 
                                items={students} 
                                onRemove={(id) => deleteMutation.mutate(id)} 
                                isDeleting={deleteMutation.isPending}
                                onToggleBlock={(id) => toggleBlockMutation.mutate(id)}
                                isToggling={toggleBlockMutation.isPending}
                                onChangePassword={(u) => setSelectedUserForPasswordChange(u)}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Dialog de Cambio de Contraseña */}
            <Dialog open={selectedUserForPasswordChange !== null} onOpenChange={(open) => { if (!open) setSelectedUserForPasswordChange(null); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Key className="w-5 h-5 text-primary" /> Cambiar Contraseña
                        </DialogTitle>
                    </DialogHeader>
                    {selectedUserForPasswordChange && (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!newPassword.trim()) {
                                toast.error("La contraseña no puede estar vacía");
                                return;
                            }
                            changePasswordMutation.mutate({
                                id: selectedUserForPasswordChange.id,
                                password: newPassword
                            });
                        }} className="space-y-4 py-2">
                            <div className="space-y-1 text-left">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Usuario</span>
                                <p className="text-sm font-semibold">{selectedUserForPasswordChange.nombre || selectedUserForPasswordChange.name}</p>
                                <p className="text-xs text-muted-foreground">{selectedUserForPasswordChange.correo || selectedUserForPasswordChange.email}</p>
                            </div>
                            <div className="space-y-1.5 text-left">
                                <Label htmlFor="new-password">Nueva Contraseña</Label>
                                <Input
                                    id="new-password"
                                    type="text"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Ingresa la nueva contraseña"
                                    className="h-11 rounded-lg"
                                />
                            </div>
                            <DialogFooter className="gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedUserForPasswordChange(null);
                                        setNewPassword("");
                                    }}
                                    className="h-11 flex-1 sm:flex-initial"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={changePasswordMutation.isPending}
                                    className="h-11 flex-1 sm:flex-initial"
                                >
                                    {changePasswordMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Guardar Cambios"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: any; tone: "rose" | "emerald" | "indigo" }) {
    const toneClasses = {
        rose: "bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
        emerald: "bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
        indigo: "bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
    };
    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg grid place-items-center shrink-0 ${toneClasses[tone]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</div>
                <div className="font-display font-bold text-xl">{value}</div>
            </div>
        </div>
    );
}

function UserList({ 
    title, 
    tone, 
    items, 
    onRemove, 
    isDeleting, 
    onToggleBlock, 
    isToggling,
    onChangePassword
}: { 
    title: string; 
    tone: "lime" | "coral"; 
    items: any[]; 
    onRemove: (id: string) => void; 
    isDeleting: boolean; 
    onToggleBlock: (id: string) => void; 
    isToggling: boolean; 
    onChangePassword: (user: any) => void;
}) {
    return (
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-base">{title}</h3>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/40">{items.length}</span>
            </div>
            {items.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Sin registros aún.</div>
            ) : (
                <ul className="divide-y divide-border">
                    {items.map((u) => (
                        <li key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <UserAvatar name={u.nombre || u.name || "Usuario"} className="w-9 h-9 shrink-0" />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold truncate text-sm">{u.nombre || u.name}</span>
                                        {u.cuentaBloqueada && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/20 animate-pulse shrink-0">
                                                Bloqueado
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">{u.correo || u.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:justify-end self-end sm:self-auto w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => onChangePassword(u)}
                                    className="p-1.5 rounded-lg border border-border/80 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                                    title="Cambiar contraseña"
                                >
                                    <Key className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Contraseña</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onToggleBlock(u.id)}
                                    disabled={isToggling}
                                    className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-semibold ${
                                        u.cuentaBloqueada 
                                        ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-border/80" 
                                        : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-border/80"
                                    }`}
                                    title={u.cuentaBloqueada ? "Desbloquear cuenta" : "Bloquear cuenta"}
                                >
                                    {u.cuentaBloqueada ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">{u.cuentaBloqueada ? "Desbloquear" : "Bloquear"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onRemove(u.id)}
                                    disabled={isDeleting}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-border transition-colors disabled:opacity-50"
                                    title="Eliminar usuario"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
