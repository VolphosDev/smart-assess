import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Users, GraduationCap, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStore, usersApi, type Role } from "@/api";
import { cn } from "@/lib/utils";

const avatars = ["🦊", "🐼", "🦄", "🐯", "🦋", "🚀", "🐙", "🐵", "🦁", "🐨"];

export default function AdminDashboard() {
  const users = useStore((s) => s.users);
  const courses = useStore((s) => s.courses);
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.create({
        name,
        email,
        role,
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
      });
      toast.success(`${role === "student" ? "Alumno" : "Docente"} registrado`);
      setName(""); setEmail("");
    } catch (e: any) {
      toast.error(e?.message ?? "Error al registrar");
    } finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    await usersApi.remove(id);
    toast.success("Usuario eliminado");
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
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 max-w-2xl">
          Gestiona alumnos, docentes y cursos
        </h1>
        <p className="opacity-90 max-w-xl">
          Registra nuevas cuentas. Los docentes podrán crear sus cursos y matricular a sus alumnos.
        </p>
      </motion.section>

      {/* Stats */}
      <section className="grid sm:grid-cols-3 gap-4">
        <Stat icon={GraduationCap} label="Alumnos" value={students.length} tone="bg-lime-gradient" />
        <Stat icon={BookOpenCheck} label="Docentes" value={teachers.length} tone="bg-coral-gradient" />
        <Stat icon={Users} label="Cursos" value={courses.length} tone="bg-primary-gradient" />
      </section>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Formulario */}
        <form onSubmit={register} className="bg-card border border-border rounded-3xl p-6 shadow-soft h-fit space-y-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Registrar usuario
          </h3>
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
            {(["student", "teacher"] as Role[]).map((r) => (
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
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@colegio.edu" className="h-11 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary-gradient font-bold shadow-glow">
            {loading ? "Registrando..." : "Registrar"}
          </Button>
        </form>

        {/* Listas */}
        <div className="space-y-6">
          <UserList title="Docentes" tone="coral" items={teachers} onRemove={remove} />
          <UserList title="Alumnos" tone="lime" items={students} onRemove={remove} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
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

function UserList({ title, tone, items, onRemove }: { title: string; tone: "lime" | "coral"; items: any[]; onRemove: (id: string) => void }) {
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
            <li key={u.id} className="flex items-center gap-4 px-6 py-3">
              <div className={`w-10 h-10 rounded-2xl ${toneClass} grid place-items-center text-lg shadow-soft`}>
                {u.avatar ?? "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.name}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
              <button onClick={() => onRemove(u.id)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}