import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, Type, Volume2, ArrowRight, X, AlertTriangle, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar2D from "@/components/Avatar2D";
import { examQuestions, type Question } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Phase = "intro" | "speaking" | "listening" | "thinking" | "feedback" | "done";

export default function Practice() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [textMode, setTextMode] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [scores, setScores] = useState<number[]>([]);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [recordTime, setRecordTime] = useState(0);
  const recordTimer = useRef<number | null>(null);

  const q = examQuestions[index];
  const total = examQuestions.length;
  const progress = (index / total) * 100;

  // Auto-advance from speaking → listening (mock TTS duration)
  useEffect(() => {
    if (phase === "speaking") {
      const t = setTimeout(() => setPhase("listening"), 2800);
      return () => clearTimeout(t);
    }
    if (phase === "listening" && !textMode) {
      recordTimer.current = window.setInterval(() => setRecordTime((r) => r + 1), 1000);
      return () => {
        if (recordTimer.current) window.clearInterval(recordTimer.current);
        setRecordTime(0);
      };
    }
  }, [phase, textMode]);

  const startQuestion = () => {
    setPhase("speaking");
    setTextAnswer("");
    setLastScore(null);
  };

  const submitAnswer = () => {
    setPhase("thinking");
    setTimeout(() => {
      const score = Math.round(13 + Math.random() * 7); // 13–20
      setLastScore(score);
      setScores((s) => [...s, score]);
      setPhase("feedback");
    }, 1600);
  };

  const next = () => {
    if (index + 1 >= total) return setPhase("done");
    setIndex((i) => i + 1);
    setPhase("intro");
  };

  const repeatQuestion = () => setPhase("speaking");

  const triggerAudioFail = () => {
    setAudioFailed(true);
    setTextMode(true);
  };

  if (phase === "done") return <Results scores={scores} onRestart={() => { setIndex(0); setScores([]); setPhase("intro"); }} />;

  const avatarState =
    phase === "speaking" ? "speaking" :
    phase === "listening" ? "listening" :
    phase === "thinking" ? "thinking" : "idle";

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <Link to="/app" className="grid place-items-center w-10 h-10 rounded-full bg-card border border-border hover:bg-muted">
          <X className="w-5 h-5" />
        </Link>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-gradient rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground tabular-nums">
          {index + 1}/{total}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        {/* Avatar side */}
        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-soft sticky top-24">
          <Avatar2D state={avatarState} />
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={repeatQuestion} className="rounded-full font-semibold" disabled={phase === "thinking" || phase === "feedback"}>
              <Volume2 className="w-4 h-4" /> Repetir pregunta
            </Button>
            {!textMode && (
              <Button variant="outline" size="sm" onClick={() => setTextMode(true)} className="rounded-full font-semibold">
                <Type className="w-4 h-4" /> Responder por texto
              </Button>
            )}
          </div>
        </div>

        {/* Question + answer side */}
        <div className="space-y-6">
          <QuestionCard q={q} index={index} total={total} />

          <AnimatePresence mode="wait">
            {phase === "intro" && (
              <ActionCard key="intro">
                <p className="text-muted-foreground mb-4">
                  Cuando estés listo, el tutor te leerá la pregunta en voz alta. Después podrás responder hablando.
                </p>
                <Button onClick={startQuestion} size="lg" className="rounded-full h-14 px-7 bg-primary-gradient hover:opacity-90 font-bold shadow-glow">
                  <Sparkles className="w-5 h-5" /> Escuchar pregunta
                </Button>
              </ActionCard>
            )}

            {phase === "speaking" && (
              <ActionCard key="speaking">
                <div className="flex items-center gap-3 text-primary font-semibold mb-2">
                  <span className="relative flex w-3 h-3">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
                    <span className="relative inline-flex w-3 h-3 rounded-full bg-primary" />
                  </span>
                  El tutor está hablando…
                </div>
                <TalkingBars />
              </ActionCard>
            )}

            {phase === "listening" && !textMode && (
              <RecordingCard key="rec" time={recordTime} onStop={submitAnswer} onFail={triggerAudioFail} />
            )}

            {phase === "listening" && textMode && (
              <TextAnswerCard
                key="text"
                value={textAnswer}
                onChange={setTextAnswer}
                onSubmit={submitAnswer}
                forced={audioFailed}
              />
            )}

            {phase === "thinking" && (
              <ActionCard key="thinking">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-3 h-3 bg-primary rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">Calificando tu respuesta…</span>
                </div>
              </ActionCard>
            )}

            {phase === "feedback" && lastScore !== null && (
              <FeedbackCard key="fb" score={lastScore} hint={q.expectedHint ?? ""} onNext={next} isLast={index + 1 >= total} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ q, index, total }: { q: Question; index: number; total: number }) {
  return (
    <motion.div
      key={q.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl p-7 shadow-soft"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 rounded-full bg-secondary/40 text-xs font-bold uppercase tracking-wider">
          Pregunta {index + 1} de {total}
        </span>
        <span className="px-3 py-1 rounded-full bg-muted text-xs font-bold">
          {q.type === "open" ? "✍️ Abierta" : q.type === "mcq" ? "🔤 Opción múltiple" : "✅ V/F"}
        </span>
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight text-balance">{q.prompt}</h2>
      {q.options && (
        <div className="grid sm:grid-cols-2 gap-2 mt-5">
          {q.options.map((o, i) => (
            <div key={o} className="px-4 py-3 rounded-2xl border border-border bg-muted/40 font-semibold text-sm">
              <span className="text-primary mr-2">{String.fromCharCode(65 + i)}.</span> {o}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ActionCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-3xl p-7 shadow-soft"
    >
      {children}
    </motion.div>
  );
}

function TalkingBars() {
  return (
    <div className="flex items-end gap-1 h-12">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1.5 bg-primary-gradient rounded-full"
          animate={{ height: ["20%", "100%", "40%", "80%", "30%"] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }}
          style={{ height: "20%" }}
        />
      ))}
    </div>
  );
}

function RecordingCard({ time, onStop, onFail }: { time: number; onStop: () => void; onFail: () => void }) {
  const mm = String(Math.floor(time / 60)).padStart(2, "0");
  const ss = String(time % 60).padStart(2, "0");
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-foreground text-background rounded-3xl p-7 shadow-glow"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="relative flex w-3 h-3">
            <span className="absolute inline-flex w-full h-full rounded-full bg-destructive opacity-70 animate-ping" />
            <span className="relative inline-flex w-3 h-3 rounded-full bg-destructive" />
          </span>
          <span className="font-bold uppercase text-xs tracking-widest">Grabando</span>
        </div>
        <span className="font-display font-bold text-2xl tabular-nums">{mm}:{ss}</span>
      </div>

      <div className="flex items-end justify-center gap-1 h-20 mb-6">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-1.5 bg-secondary rounded-full"
            animate={{ height: [`${20 + Math.random() * 30}%`, `${50 + Math.random() * 50}%`, `${20 + Math.random() * 30}%`] }}
            transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.02 }}
            style={{ height: "30%" }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onStop} size="lg" className="rounded-full h-14 px-7 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
          <Check className="w-5 h-5" /> Terminé de responder
        </Button>
        <Button onClick={onFail} variant="ghost" size="sm" className="text-background/70 hover:text-background hover:bg-background/10 rounded-full">
          <AlertTriangle className="w-4 h-4" /> Mi micro falla
        </Button>
      </div>
    </motion.div>
  );
}

function TextAnswerCard({
  value, onChange, onSubmit, forced,
}: { value: string; onChange: (v: string) => void; onSubmit: () => void; forced: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-3xl p-7 shadow-soft"
    >
      {forced && (
        <div className="flex items-start gap-3 p-3 mb-4 rounded-2xl bg-warning/15 border border-warning/40 text-sm">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <span><b>Detectamos un problema con tu micrófono.</b> Puedes responder por texto para no detener tu evaluación.</span>
        </div>
      )}
      <label className="text-sm font-semibold text-muted-foreground mb-2 block">Tu respuesta</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe tu respuesta aquí…"
        className="min-h-[140px] rounded-2xl border-2 text-base"
        maxLength={1000}
      />
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">{value.length}/1000</span>
        <Button
          onClick={onSubmit}
          disabled={value.trim().length < 3}
          size="lg"
          className="rounded-full h-12 px-6 bg-primary-gradient hover:opacity-90 font-bold shadow-glow"
        >
          Enviar respuesta <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function FeedbackCard({
  score, hint, onNext, isLast,
}: { score: number; hint: string; onNext: () => void; isLast: boolean }) {
  const great = score >= 17;
  const good = score >= 14;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "rounded-3xl p-7 shadow-glow text-primary-foreground",
        great ? "bg-lime-gradient" : good ? "bg-primary-gradient" : "bg-coral-gradient"
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl">{great ? "🎉" : good ? "👏" : "💪"}</div>
        <div>
          <div className="text-sm font-bold uppercase tracking-widest opacity-90">
            {great ? "¡Excelente!" : good ? "Buen trabajo" : "Sigue practicando"}
          </div>
          <div className="font-display font-bold text-4xl">{score}/20</div>
        </div>
      </div>
      <div className="bg-background/15 rounded-2xl p-4 mb-5">
        <div className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1">Pista del tutor</div>
        <p className="text-sm leading-relaxed">{hint}</p>
      </div>
      <Button onClick={onNext} size="lg" className="w-full rounded-full h-12 bg-background text-foreground hover:bg-background/90 font-bold">
        {isLast ? "Ver resultados" : "Siguiente pregunta"} <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

function Results({ scores, onRestart }: { scores: number[]; onRestart: () => void }) {
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = scores.length ? Math.round((total / scores.length) * 10) / 10 : 0;
  const xp = total * 5;
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="font-display text-5xl font-bold mb-2">¡Lo lograste!</h1>
        <p className="text-muted-foreground mb-8">Completaste tu evaluación oral.</p>
      </motion.div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Promedio</div>
          <div className="font-display font-bold text-3xl mt-1">{avg}</div>
        </div>
        <div className="bg-lime-gradient rounded-3xl p-5 shadow-soft text-primary-foreground">
          <div className="text-xs font-bold uppercase tracking-widest opacity-90">Aciertos</div>
          <div className="font-display font-bold text-3xl mt-1">{scores.filter((s) => s >= 14).length}/{scores.length}</div>
        </div>
        <div className="bg-coral-gradient rounded-3xl p-5 shadow-soft text-primary-foreground">
          <div className="text-xs font-bold uppercase tracking-widest opacity-90">XP ganado</div>
          <div className="font-display font-bold text-3xl mt-1">+{xp}</div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onRestart} size="lg" className="rounded-full h-12 px-6 bg-primary-gradient font-bold shadow-glow">
          <RotateCcw className="w-4 h-4" /> Volver a intentar
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 font-bold border-2">
          <Link to="/app/historial">Ver historial</Link>
        </Button>
      </div>
    </div>
  );
}

// silence unused import warning if any
void MicOff;