import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowRight, BookOpen } from "lucide-react";
import { courses, courseSyllabus } from "@/lib/mock-data";

const colorMap = {
  primary: "bg-primary-gradient",
  lime: "bg-lime-gradient",
  coral: "bg-coral-gradient",
} as const;

export default function TeacherDashboard() {
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
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c, i) => {
            const weeks = courseSyllabus[c.id]?.length ?? 0;
            return (
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
                    <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {weeks} semanas</span>
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 28 alumnos</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    Ver sesiones <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
