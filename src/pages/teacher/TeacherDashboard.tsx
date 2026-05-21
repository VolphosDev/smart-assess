import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowRight, BookOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { coursesApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
} as const;

const emojis = ["📘", "🧬", "🏛️", "📐", "📚", "🧪", "🌍", "🎨", "💻", "🎵"];
const colors: Array<"primary" | "lime" | "coral"> = ["primary", "lime", "coral"];

export default function TeacherDashboard() {
    // 1. Obtenemos el usuario real que inició sesión
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user.id;

    // 2. Traemos los cursos reales con React Query
    const { data: courses = [], refetch } = useQuery({
        queryKey: ['teacher-courses', teacherId],
        queryFn: () => coursesApi.forTeacher(teacherId),
        enabled: !!teacherId // Solo busca si hay un ID válido
    });

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<{ name: string; description: string; weeks: number; emoji: string; color: "primary" | "lime" | "coral" }>({
        name: "", description: "", weeks: 4, emoji: "📘", color: "primary",
    });

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await coursesApi.create({
                nombre: form.name, // ⚠️ Ajustado a los nombres que espera tu Java Map
                descripcion: form.description,
                emoji: form.emoji,
                color: form.color,
                profesorId: teacherId,
                gradoId: 1, // TEMPORAL: Luego puedes poner un <select> en tu formulario
                seccionId: 1, // TEMPORAL: Luego puedes poner un <select> en tu formulario
                semanas: form.weeks
            });

            toast.success("Curso creado exitosamente");
            setOpen(false);
            setForm({ name: "", description: "", weeks: 4, emoji: "📘", color: "primary" });

            // ¡Recargamos la lista automáticamente!
            refetch();
        } catch (err) {
            toast.error("Error al crear el curso");
        }
    };

  return (
    <div className="space-y-10">
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
          <Button onClick={() => setOpen(true)} className="rounded-full font-bold bg-primary-gradient shadow-glow">
            <Plus className="w-4 h-4 mr-1" /> Crear curso
          </Button>
        </div>
        {courses.length === 0 && (
          <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center">
            <p className="text-muted-foreground">Aún no tienes cursos. Crea tu primer curso para comenzar.</p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  to={`/docente/curso/${c.id}`}
                  className="group block bg-card border border-border rounded-3xl p-6 shadow-soft hover:-translate-y-1 transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl ${colorMap[c.color]} grid place-items-center text-3xl shadow-soft mb-4`}>
                    {c.emoji}
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1">{c.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold mb-4">
                    <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.weeks} semanas</span>
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.studentCount} alumnos</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    Ver sesiones <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              </motion.div>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="bg-card border border-border rounded-3xl shadow-glow w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl">Nuevo curso</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
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
                <Input type="number" min={1} max={20} value={form.weeks} onChange={(e) => setForm({ ...form, weeks: Number(e.target.value) })} className="h-11 rounded-xl" />
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
            <Button type="submit" className="w-full h-11 rounded-xl bg-primary-gradient font-bold shadow-glow">Crear curso</Button>
          </form>
        </div>
      )}
    </div>
  );
}
