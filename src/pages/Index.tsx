import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, GraduationCap, BookOpenCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Role = "student" | "teacher";

export default function Index() {
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(role === "student" ? "/app" : "/docente");
  };

  return (
    <div className="min-h-screen bg-background bg-mesh grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-hero-gradient text-primary-foreground relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 text-[22rem] opacity-15 select-none leading-none">🎓</div>
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl relative">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-background/20 backdrop-blur">
            <Sparkles className="w-5 h-5" />
          </span>
          Vocali
        </Link>
        <div className="relative space-y-4 max-w-md">
          <h1 className="font-display text-5xl font-bold leading-tight">
            Aprende hablando, evalúa con IA.
          </h1>
          <p className="opacity-90 text-lg">
            Plataforma educativa para docentes y alumnos. Practica oralmente, recibe retroalimentación inmediata y sigue tu progreso semana a semana.
          </p>
        </div>
        <div className="relative text-sm opacity-80">© 2026 Vocali · Educación generativa</div>
      </div>

      {/* Right: login */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 font-display font-bold text-2xl mb-8">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
              <Sparkles className="w-5 h-5" />
            </span>
            Vocali
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">Iniciar sesión</h2>
          <p className="text-muted-foreground mb-6">Elige tu rol y continúa.</p>

          {/* Role tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl mb-6">
            <RoleTab active={role === "student"} onClick={() => setRole("student")} icon={GraduationCap} label="Alumno" />
            <RoleTab active={role === "teacher"} onClick={() => setRole("teacher")} icon={BookOpenCheck} label="Docente" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo institucional</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder={role === "student" ? "alumno@colegio.edu" : "docente@colegio.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
            <Button type="submit" size="lg" className="w-full h-12 rounded-2xl bg-primary-gradient font-bold shadow-glow">
              Entrar como {role === "student" ? "alumno" : "docente"} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Aún no tienes cuenta? <a className="font-semibold text-primary hover:underline" href="#">Solicita acceso</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function RoleTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
        active ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
