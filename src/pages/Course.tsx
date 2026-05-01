import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, PlayCircle, Sparkles } from "lucide-react";
import { courses, courseSyllabus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const colorMap = {
  primary: "bg-primary-gradient",
  lime: "bg-lime-gradient",
  coral: "bg-coral-gradient",
} as const;

export default function Course() {
  const { courseId = "" } = useParams();
  const course = courses.find((c) => c.id === courseId);
  const weeks = courseSyllabus[courseId] ?? [];

  if (!course) {
    return (
      <div className="text-center py-20">
        <h1 className="font-display font-bold text-3xl mb-3">Curso no encontrado</h1>
        <Link to="/app" className="text-primary font-semibold hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link to="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Mis cursos
      </Link>

      {/* Hero del curso */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden", colorMap[course.color])}
      >
        <div className="absolute -right-6 -top-6 text-[10rem] opacity-20 select-none">{course.emoji}</div>
        <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
          Curso · Semestre 2026-1
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-2xl">{course.name}</h1>
        <p className="opacity-90 max-w-xl mb-5">
          {weeks.length} semanas · Avance {course.progress}% · Promedio actual 16.2/20
        </p>
        <div className="h-2 bg-background/25 rounded-full overflow-hidden max-w-md">
          <div className="h-full bg-background rounded-full" style={{ width: `${course.progress}%` }} />
        </div>
      </motion.section>

      {/* Lista de semanas */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl md:text-3xl font-bold">Temas por semana</h2>
          <span className="text-sm text-muted-foreground font-semibold">Elige un tema para evaluarte</span>
        </div>
        <ul className="space-y-3">
          {weeks.map((w, i) => {
            const locked = w.status === "bloqueado";
            const done = w.status === "completado";
            const inCourse = w.status === "en-curso";
            const Wrapper: any = locked ? "div" : Link;
            const wrapperProps = locked ? {} : { to: `/app/curso/${courseId}/semana/${w.week}` };
            return (
              <motion.li
                key={w.week}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Wrapper
                  {...wrapperProps}
                  className={cn(
                    "group flex items-center gap-5 bg-card border rounded-3xl p-5 shadow-soft transition-all",
                    locked ? "opacity-60 cursor-not-allowed border-border" :
                    inCourse ? "border-primary/40 hover:-translate-y-0.5" :
                    "border-border hover:-translate-y-0.5"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl grid place-items-center font-display font-bold text-xl shadow-soft shrink-0",
                    done ? "bg-lime-gradient text-primary-foreground" :
                    inCourse ? "bg-primary-gradient text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {done ? <CheckCircle2 className="w-7 h-7" /> : locked ? <Lock className="w-6 h-6" /> : w.week}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Semana {w.week}</span>
                      {inCourse && <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase">En curso</span>}
                      {done && w.bestScore && <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase">Mejor: {w.bestScore}/20</span>}
                    </div>
                    <h3 className="font-display font-bold text-lg leading-tight">{w.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{w.subtopics.join(" · ")}</p>
                  </div>
                  {!locked && (
                    <div className="hidden sm:flex items-center gap-2 text-primary font-semibold text-sm shrink-0">
                      <PlayCircle className="w-5 h-5" /> Evaluarme <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Wrapper>
              </motion.li>
            );
          })}
        </ul>
      </section>

      <section className="bg-card border border-border rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-display font-bold text-lg">¿No sabes por dónde empezar?</h3>
          <p className="text-sm text-muted-foreground">Te recomendamos seguir con la semana en curso para mantener tu racha.</p>
        </div>
      </section>
    </div>
  );
}