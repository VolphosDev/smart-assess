import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Flame, Target, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courses } from "@/lib/mock-data";

const colorMap = {
  primary: "bg-primary-gradient",
  lime: "bg-lime-gradient",
  coral: "bg-coral-gradient",
} as const;

export default function Dashboard() {
  return (
    <div className="space-y-10">
      {/* Hero greeting */}
      <section className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-hero-gradient rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 text-[10rem] opacity-20 select-none">🎯</div>
          <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-4">
            Hola, Alex 👋
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-md">
            Tienes un examen oral de Biología hoy.
          </h1>
          <p className="opacity-90 mb-6 max-w-md">
            Mitosis y meiosis. ¿Practicamos 5 preguntas antes de rendirlo?
          </p>
          <Button asChild size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90 font-bold h-12 px-6">
            <Link to="/app/curso/bio/semana/3">
              <Mic className="w-5 h-5 mr-1" /> Empezar evaluación
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <StatCard icon={Flame} label="Racha" value="7 días" tone="bg-coral-gradient" />
          <StatCard icon={Target} label="Promedio" value="16.4" tone="bg-lime-gradient" />
          <StatCard icon={TrendingUp} label="XP semanal" value="+340" tone="bg-primary-gradient" className="col-span-2 lg:col-span-1" />
        </div>
      </section>

      {/* Cursos */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Tus cursos</h2>
          <Link to="/app/historial" className="text-sm font-semibold text-primary hover:underline">Ver todo</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/app/curso/${c.id}`}
              className="group bg-card border border-border rounded-3xl p-6 shadow-soft hover:-translate-y-1 transition-all"
            >
              <div className={`w-14 h-14 rounded-2xl ${colorMap[c.color]} grid place-items-center text-3xl shadow-soft mb-4`}>
                {c.emoji}
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{c.name}</h3>
              {c.nextExam && (
                <p className="text-xs text-muted-foreground mb-4">Próximo: {c.nextExam}</p>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${colorMap[c.color]} rounded-full`} style={{ width: `${c.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{c.progress}%</span>
              </div>
              <div className="flex items-center justify-between mt-4 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition">
                Ver temas <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Daily challenge */}
      <section className="bg-card border border-border rounded-3xl p-7 shadow-soft flex flex-col md:flex-row items-center gap-6">
        <div className="text-6xl">🏆</div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-display font-bold text-xl mb-1">Reto del día</h3>
          <p className="text-muted-foreground">Responde 3 preguntas orales seguidas con más de 15/20 y gana <span className="font-bold text-foreground">+100 XP</span>.</p>
        </div>
        <Button asChild className="rounded-full h-12 px-6 font-bold bg-foreground text-background hover:bg-foreground/90">
          <Link to="/app/curso/bio/semana/3/evaluacion/conversation">Aceptar reto</Link>
        </Button>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  className = "",
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  tone: string;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-3xl p-5 shadow-soft flex items-center gap-4 ${className}`}>
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