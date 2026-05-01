import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { courses, courseSyllabus, evalModes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const colorMap = {
  primary: "bg-primary-gradient",
  lime: "bg-lime-gradient",
  coral: "bg-coral-gradient",
  accent: "bg-hero-gradient",
} as const;

export default function EvalModeSelect() {
  const { courseId = "", week = "" } = useParams();
  const course = courses.find((c) => c.id === courseId);
  const topic = courseSyllabus[courseId]?.find((w) => String(w.week) === week);

  if (!course || !topic) {
    return (
      <div className="text-center py-20">
        <h1 className="font-display font-bold text-3xl mb-3">Tema no encontrado</h1>
        <Link to="/app" className="text-primary font-semibold hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link to={`/app/curso/${courseId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> {course.name}
      </Link>

      <header className="text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-secondary/40 text-xs font-bold uppercase tracking-wider">
          Semana {topic.week} · {course.name}
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-balance">{topic.title}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">¿Cómo te quieres evaluar hoy? Elige la modalidad que mejor se adapte a ti.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-5">
        {evalModes.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              to={`/app/curso/${courseId}/semana/${week}/evaluacion/${m.id}`}
              className="group block bg-card border border-border rounded-3xl p-6 shadow-soft hover:-translate-y-1 transition-all h-full"
            >
              <div className={cn("w-16 h-16 rounded-2xl grid place-items-center text-3xl shadow-soft mb-4", colorMap[m.color])}>
                {m.emoji}
              </div>
              <h3 className="font-display font-bold text-xl mb-1.5">{m.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{m.description}</p>
              <ul className="space-y-1.5 mb-5">
                {m.bullets.map((b) => (
                  <li key={b} className="text-xs font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {b}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {m.duration}
                </span>
                <span className="text-sm font-bold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Empezar <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}