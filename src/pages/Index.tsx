import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Sparkles, Zap, Trophy, BookOpen, ArrowRight, Play } from "lucide-react";
import Avatar2D from "@/components/Avatar2D";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-mesh overflow-hidden">
      {/* Nav */}
      <header className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-2 font-display font-bold text-2xl">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
            <Sparkles className="w-5 h-5" />
          </span>
          Vocali
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app" className="hidden sm:inline text-sm font-semibold text-muted-foreground hover:text-foreground">
            Iniciar sesión
          </Link>
          <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold px-5">
            <Link to="/app">Empieza gratis</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container grid lg:grid-cols-2 gap-12 items-center pt-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/40 border border-secondary text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" /> Evaluación oral con IA
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] text-balance mb-6">
            Aprende{" "}
            <span className="relative inline-block">
              <span className="relative z-10">hablando</span>
              <span className="absolute inset-x-0 bottom-2 h-4 bg-secondary/70 -z-0 -rotate-1" />
            </span>{" "}
            con tu tutor <span className="bg-hero-gradient bg-clip-text text-transparent">IA</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
            Practica para tus exámenes conversando con un avatar que te escucha, te corrige y te motiva. Sin notas frías, solo feedback que entiendes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full h-14 px-7 text-base font-bold bg-primary-gradient hover:opacity-90 shadow-glow">
              <Link to="/app/practica">
                <Mic className="w-5 h-5 mr-1" /> Empezar a practicar
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-6 text-base font-bold border-2">
              <Link to="/app">
                <Play className="w-4 h-4 mr-1" /> Ver demo
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-6 mt-10 pt-6 border-t border-border/60">
            <div>
              <div className="font-display font-bold text-2xl">+12k</div>
              <div className="text-xs text-muted-foreground">alumnos activos</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="font-display font-bold text-2xl">94%</div>
              <div className="text-xs text-muted-foreground">mejoran sus notas</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="font-display font-bold text-2xl">4.9★</div>
              <div className="text-xs text-muted-foreground">en reseñas</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <Avatar2D state="speaking" />
          {/* Floating chips */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-6 -left-2 bg-card border border-border rounded-2xl p-3 shadow-soft max-w-[220px]"
          >
            <div className="text-xs font-semibold text-muted-foreground mb-1">Tutor IA</div>
            <div className="text-sm font-medium">¿Puedes explicarme la mitosis con tus propias palabras?</div>
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="absolute bottom-10 -right-2 bg-foreground text-background rounded-2xl p-3 shadow-soft max-w-[200px]"
          >
            <div className="text-xs font-semibold opacity-70 mb-1">Tú 🎙️</div>
            <div className="text-sm font-medium">Es la división celular en la que…</div>
          </motion.div>
          <motion.div
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-2 left-6 bg-secondary text-secondary-foreground rounded-2xl px-3 py-2 shadow-pop font-bold text-sm"
          >
            +25 XP 🎉
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-3">Todo en uno para clavar tus exámenes</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Desde practicar oralmente hasta competir con tu salón. Vocali te acompaña en cada paso.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Mic, title: "Habla, no escribas", text: "Responde con voz natural y recibe feedback al instante.", grad: "bg-primary-gradient" },
            { icon: BookOpen, title: "Tu material, tus preguntas", text: "La IA genera exámenes desde el contenido de tu profe.", grad: "bg-lime-gradient" },
            { icon: Trophy, title: "Compite y mejora", text: "Sube en el ranking del curso y mantén tu racha viva.", grad: "bg-coral-gradient" },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-3xl p-7 shadow-soft hover:-translate-y-1 transition-transform">
              <div className={`w-14 h-14 rounded-2xl ${f.grad} grid place-items-center text-primary-foreground shadow-glow mb-4`}>
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="bg-hero-gradient rounded-[2.5rem] p-10 md:p-16 text-center text-primary-foreground shadow-glow relative overflow-hidden">
          <div className="absolute top-6 left-10 text-4xl animate-float">📚</div>
          <div className="absolute bottom-8 right-12 text-4xl animate-float [animation-delay:-2s]">🎓</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">¿Listo para hablar con tu tutor?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Empieza tu primera evaluación oral en 30 segundos. Sin tarjeta, sin instalar nada.
          </p>
          <Button asChild size="lg" className="rounded-full h-14 px-8 text-base font-bold bg-background text-foreground hover:bg-background/90">
            <Link to="/app/practica">
              Probar ahora <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="container py-8 border-t border-border/60 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
        <span>© 2026 Vocali · Hecho con 💜 para estudiantes</span>
        <span>Privacidad · Términos · Contacto</span>
      </footer>
    </div>
  );
};

export default Index;
