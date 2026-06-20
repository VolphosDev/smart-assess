import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Users, GraduationCap, BookOpenCheck, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usersApi } from "@/api";
import { intentosApi } from "@/api/courses";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const avatars = ["🦊", "🐼", "🦄", "🐯", "🦋", "🚀", "🐙", "🐵", "🦁", "🐨"];

export default function AdminDashboard() {
    const queryClient = useQueryClient();

    // 1. Estados del formulario
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { data: users = [], isLoading: loadingUsers } = useQuery<any[]>({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const response = await usersApi.getAll();
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

    return (
        <div className="space-y-8">
            <motion.section
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-hero-gradient rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden"
            >
                <div className="absolute -right-10 -top-10 text-[10rem] opacity-20 select-none">🛡️</div>
                <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
                    Panel administrador
                </span>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 relative z-10">
                    <div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 max-w-2xl">
                            Gestiona cuentas de alumnos y docentes
                        </h1>
                        <p className="opacity-90 max-w-xl">
                            Registra nuevas cuentas y asígnales una contraseña temporal.
                        </p>
                    </div>
                    <Button
                        onClick={downloadGlobalCSV}
                        className="bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold rounded-xl backdrop-blur-sm px-5 py-2.5 flex items-center gap-2 shrink-0 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <Download className="w-4.5 h-4.5" /> Descargar Notas
                    </Button>
                </div>
            </motion.section>

            {/* Stats */}
            <section className="grid sm:grid-cols-3 gap-4">
                <Stat icon={GraduationCap} label="Alumnos" value={students.length} tone="bg-lime-gradient" />
                <Stat icon={BookOpenCheck} label="Docentes" value={teachers.length} tone="bg-coral-gradient" />
                <Stat icon={Users} label="Total Usuarios" value={users.length} tone="bg-primary-gradient" />
            </section>

            <div className="grid lg:grid-cols-[380px_1fr] gap-6">
                {/* Formulario */}
                <form onSubmit={register} className="bg-card border border-border rounded-3xl p-6 shadow-soft h-fit space-y-4">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" /> Registrar usuario
                    </h3>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
                        {(["student", "teacher"] as const).map((r) => (
                            <button
                                key={r} type="button" onClick={() => setRole(r)}
                                className={cn(
                                    "py-2 rounded-xl text-sm font-bold transition",
                                    role === r ? "bg-card shadow-soft" : "text-muted-foreground"
                                )}
                            >
                                {r === "student" ? "Alumno" : "Docente"}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Nombre completo</Label>
                        <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Pérez" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Correo institucional</Label>
                        <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@upao.edu.pe" className="h-11 rounded-xl" />
                    </div>

                    {/* NUEVO CAMPO DE CONTRASEÑA */}
                    <div className="space-y-1.5">
                        <Label>Contraseña inicial</Label>
                        <Input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña segura" className="h-11 rounded-xl" />
                    </div>

                    <Button type="submit" disabled={createMutation.isPending} className="w-full h-11 rounded-xl bg-primary-gradient font-bold shadow-glow mt-2">
                        {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Registrar"}
                    </Button>
                </form>

                {/* Listas */}
                <div className="space-y-6">
                    {loadingUsers ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <>
                            <UserList title="Docentes" tone="coral" items={teachers} onRemove={(id) => deleteMutation.mutate(id)} isDeleting={deleteMutation.isPending} />
                            <UserList title="Alumnos" tone="lime" items={students} onRemove={(id) => deleteMutation.mutate(id)} isDeleting={deleteMutation.isPending} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, tone }: any) {
    // ... (Se mantiene igual que tu código original)
    return (
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${tone} grid place-items-center text-primary-foreground shadow-soft`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
                <div className="font-display font-bold text-2xl">{value}</div>
            </div>
        </div>
    );
}

function UserList({ title, tone, items, onRemove, isDeleting }: { title: string; tone: "lime" | "coral"; items: any[]; onRemove: (id: string) => void; isDeleting: boolean }) {
    const toneClass = tone === "lime" ? "bg-lime-gradient" : "bg-coral-gradient";
    return (
        <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold">{title}</h3>
                <span className="text-xs font-bold text-muted-foreground">{items.length}</span>
            </div>
            {items.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Sin registros aún.</div>
            ) : (
                <ul className="divide-y divide-border">
                    {items.map((u) => (
                        <li key={u.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                            <div className={`w-10 h-10 rounded-2xl ${toneClass} grid place-items-center text-lg shadow-soft shrink-0`}>
                                {u.avatar ?? "👤"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{u.nombre || u.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{u.correo || u.email}</div>
                            </div>
                            <button
                                onClick={() => onRemove(u.id)}
                                disabled={isDeleting}
                                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
