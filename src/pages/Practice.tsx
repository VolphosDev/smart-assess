import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, RotateCcw, Type, Volume2, ArrowRight, X, AlertTriangle, Check, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar2D from "@/components/Avatar2D";
import { courses, courseSyllabus, evalModes, examQuestions, type EvalMode, type Question } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Link, useParams, useSearchParams } from "react-router-dom";

/* ---------- Question banks per mode ---------- */
const mcqBank: Question[] = [
  { id: "m1", type: "mcq", prompt: "¿En qué fase del ciclo celular ocurre la replicación del ADN?", options: ["Fase G1", "Fase S", "Fase G2", "Fase M"], expectedHint: "Fase S" },
  { id: "m2", type: "mcq", prompt: "¿Cuál estructura separa los cromosomas durante la mitosis?", options: ["Ribosoma", "Huso mitótico", "Aparato de Golgi", "Lisosoma"], expectedHint: "Huso mitótico" },
  { id: "m3", type: "mcq", prompt: "La meiosis produce:", options: ["2 células iguales", "4 células haploides", "1 célula diploide", "8 células haploides"], expectedHint: "4 células haploides" },
  { id: "m4", type: "mcq", prompt: "¿Cuántos cromosomas tiene una célula humana somática?", options: ["23", "46", "48", "92"], expectedHint: "46" },
  { id: "m5", type: "mcq", prompt: "La citocinesis es:", options: ["División del núcleo", "División del citoplasma", "Replicación de ADN", "Síntesis de proteínas"], expectedHint: "División del citoplasma" },
];
const tfBank: Question[] = [
  { id: "t1", type: "tf", prompt: "La citocinesis es la división del núcleo en dos núcleos hijos.", options: ["Verdadero", "Falso"], expectedHint: "Falso" },
  { id: "t2", type: "tf", prompt: "La mitosis produce dos células hijas genéticamente idénticas.", options: ["Verdadero", "Falso"], expectedHint: "Verdadero" },
  { id: "t3", type: "tf", prompt: "Los gametos se forman por mitosis.", options: ["Verdadero", "Falso"], expectedHint: "Falso" },
  { id: "t4", type: "tf", prompt: "El ADN se replica durante la fase S.", options: ["Verdadero", "Falso"], expectedHint: "Verdadero" },
  { id: "t5", type: "tf", prompt: "Las células de la piel se renuevan por meiosis.", options: ["Verdadero", "Falso"], expectedHint: "Falso" },
];
const classicBank: Question[] = [examQuestions[0], mcqBank[0], tfBank[1], examQuestions[1], mcqBank[2]];

function pickQuestions(mode: EvalMode): Question[] {
  switch (mode) {
    case "conversation": return examQuestions.filter((q) => q.type === "open");
    case "quiz": return mcqBank;
    case "tf": return tfBank;
    case "classic": return classicBank;
  }
}

export default function Practice() {
  const { courseId, week, mode: modeParam } = useParams();
  const [search] = useSearchParams();
  const mode: EvalMode = (modeParam as EvalMode) ?? (search.get("mode") as EvalMode) ?? "conversation";

  const course = courseId ? courses.find((c) => c.id === courseId) : undefined;
  const topic = courseId && week ? courseSyllabus[courseId]?.find((w) => String(w.week) === week) : undefined;
  const modeMeta = evalModes.find((m) => m.id === mode);

  const questions = useMemo(() => pickQuestions(mode), [mode]);
  const backHref = courseId && week ? `/app/curso/${courseId}/semana/${week}` : "/app";

  if (mode === "conversation") {
    return <ConversationFlow questions={questions} title={topic?.title ?? "Práctica oral"} subtitle={course?.name ?? "Práctica libre"} backHref={backHref} />;
  }
  return <SelectAnswerFlow questions={questions} mode={mode} title={topic?.title ?? modeMeta?.title ?? "Evaluación"} subtitle={course?.name ?? ""} backHref={backHref} />;
}

/* =====================================================================
   CONVERSATION MODE — Avatar talks first, mic ENABLES after TTS ends
   ===================================================================== */

type ConvPhase = "intro" | "speaking" | "ready" | "listening" | "thinking" | "feedback" | "done";

function ConversationFlow({ questions, title, subtitle, backHref }: { questions: Question[]; title: string; subtitle: string; backHref: string }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<ConvPhase>("intro");
  const [textMode, setTextMode] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [scores, setScores] = useState<number[]>([]);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [recordTime, setRecordTime] = useState(0);
  const recordTimer = useRef<number | null>(null);

  const q = questions[index];
  const total = questions.length;
  const progress = (index / total) * 100;

  // Mock TTS: avatar habla 2.8s y luego pasa a "ready" (esperando que el alumno encienda el micro)
  useEffect(() => {
    if (phase === "speaking") {
      const t = setTimeout(() => setPhase("ready"), 2800);
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

  const startListening = () => setPhase("listening");

  const submitAnswer = () => {
    setPhase("thinking");
    setTimeout(() => {
      const score = Math.round(13 + Math.random() * 7);
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
    setPhase("listening");
  };

  if (phase === "done") return <Results scores={scores} backHref={backHref} onRestart={() => { setIndex(0); setScores([]); setPhase("intro"); }} />;

  const avatarState =
    phase === "speaking" ? "speaking" :
    phase === "listening" ? "listening" :
    phase === "thinking" ? "thinking" : "idle";

  return (
    <div className="space-y-6">
      <PracticeHeader title={title} subtitle={subtitle} progress={progress} index={index} total={total} backHref={backHref} />

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-soft lg:sticky lg:top-24">
          <Avatar2D state={avatarState} />
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            <Button
              variant="outline" size="sm" onClick={repeatQuestion}
              disabled={phase === "intro" || phase === "speaking" || phase === "thinking" || phase === "feedback"}
              className="rounded-full font-semibold"
            >
              <Volume2 className="w-4 h-4" /> Repetir pregunta
            </Button>
            {!textMode && (phase === "ready" || phase === "listening") && (
              <Button variant="outline" size="sm" onClick={() => { setTextMode(true); setPhase("listening"); }} className="rounded-full font-semibold">
                <Type className="w-4 h-4" /> Responder por texto
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            {phase === "speaking" && "🔊 Tu tutor está hablando…"}
            {phase === "ready" && "👂 Listo para escucharte"}
            {phase === "listening" && !textMode && "🎤 Grabando tu respuesta"}
            {phase === "thinking" && "🧠 Analizando…"}
            {phase === "intro" && "Pulsa para empezar"}
          </p>
        </div>

        <div className="space-y-6">
          <QuestionCard q={q} index={index} total={total} />

          <AnimatePresence mode="wait">
            {phase === "intro" && (
              <ActionCard key="intro">
                <p className="text-muted-foreground mb-4">
                  Cuando estés listo, el tutor te leerá la pregunta en voz alta. Solo podrás encender el micrófono <b>cuando termine de hablar</b>.
                </p>
                <Button onClick={startQuestion} size="lg" className="rounded-full h-14 px-7 bg-primary-gradient hover:opacity-90 font-bold shadow-glow">
                  <Sparkles className="w-5 h-5" /> Escuchar pregunta
                </Button>
              </ActionCard>
            )}

            {phase === "speaking" && (
              <ActionCard key="speaking">
                <div className="flex items-center gap-3 text-primary font-semibold mb-3">
                  <span className="relative flex w-3 h-3">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
                    <span className="relative inline-flex w-3 h-3 rounded-full bg-primary" />
                  </span>
                  El tutor está hablando…
                </div>
                <TalkingBars />
                <p className="text-xs text-muted-foreground mt-4">El micrófono se activará en cuanto termine.</p>
              </ActionCard>
            )}

            {phase === "ready" && (
              <ActionCard key="ready">
                <div className="text-center space-y-4">
                  <div className="text-5xl">🎤</div>
                  <h3 className="font-display font-bold text-2xl">Tu turno</h3>
                  <p className="text-muted-foreground">El tutor terminó. Enciende el micrófono cuando estés listo para responder.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button onClick={startListening} size="lg" className="rounded-full h-14 px-7 bg-primary-gradient hover:opacity-90 font-bold shadow-glow">
                      <Mic className="w-5 h-5" /> Encender micrófono
                    </Button>
                    <Button onClick={repeatQuestion} variant="outline" size="lg" className="rounded-full h-14 px-6 font-semibold border-2">
                      <Volume2 className="w-5 h-5" /> Repetir
                    </Button>
                  </div>
                </div>
              </ActionCard>
            )}

            {phase === "listening" && !textMode && (
              <RecordingCard key="rec" time={recordTime} onStop={submitAnswer} onFail={triggerAudioFail} />
            )}

            {phase === "listening" && textMode && (
              <TextAnswerCard key="text" value={textAnswer} onChange={setTextAnswer} onSubmit={submitAnswer} forced={audioFailed} />
            )}

            {phase === "thinking" && (
              <ActionCard key="thinking">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="w-3 h-3 bg-primary rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
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

/* =====================================================================
   QUIZ / TF / CLASSIC — Selección o respuesta directa
   ===================================================================== */

function SelectAnswerFlow({ questions, mode, title, subtitle, backHref }: { questions: Question[]; mode: EvalMode; title: string; subtitle: string; backHref: string }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [openText, setOpenText] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const total = questions.length;
  const progress = (index / total) * 100;

  const submit = () => {
    let score = 10;
    if (q.type === "mcq" || q.type === "tf") {
      score = selected && q.expectedHint && selected.toLowerCase() === q.expectedHint.toLowerCase() ? 20 : 8;
    } else {
      score = openText.trim().length > 20 ? Math.round(14 + Math.random() * 6) : 10;
    }
    setScores((s) => [...s, score]);
    setRevealed(true);
  };

  const next = () => {
    if (index + 1 >= total) return setDone(true);
    setIndex((i) => i + 1);
    setSelected(null);
    setOpenText("");
    setRevealed(false);
  };

  if (done) return <Results scores={scores} backHref={backHref} onRestart={() => { setIndex(0); setScores([]); setSelected(null); setOpenText(""); setRevealed(false); setDone(false); }} />;

  const correct = q.expectedHint && selected && selected.toLowerCase() === q.expectedHint.toLowerCase();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PracticeHeader title={title} subtitle={subtitle} progress={progress} index={index} total={total} backHref={backHref} />

      <QuestionCard q={q} index={index} total={total} hideOptions />

      {/* Opciones MCQ / TF */}
      {(q.type === "mcq" || q.type === "tf") && q.options && (
        <div className={cn("grid gap-3", q.type === "tf" ? "grid-cols-2" : "sm:grid-cols-2")}>
          {q.options.map((opt, i) => {
            const isSelected = selected === opt;
            const isCorrect = revealed && q.expectedHint?.toLowerCase() === opt.toLowerCase();
            const isWrong = revealed && isSelected && !isCorrect;
            return (
              <button
                key={opt}
                disabled={revealed}
                onClick={() => setSelected(opt)}
                className={cn(
                  "text-left px-5 py-4 rounded-2xl border-2 font-semibold transition-all",
                  isCorrect ? "border-success bg-success/10 text-success" :
                  isWrong ? "border-destructive bg-destructive/10 text-destructive" :
                  isSelected ? "border-primary bg-primary/10" :
                  "border-border bg-card hover:border-primary/50"
                )}
              >
                <span className="text-primary mr-2 font-bold">{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Pregunta abierta dentro del modo clásico */}
      {q.type === "open" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
          <label className="text-sm font-semibold text-muted-foreground mb-2 block">Tu respuesta</label>
          <Textarea
            value={openText}
            onChange={(e) => setOpenText(e.target.value)}
            disabled={revealed}
            placeholder="Escribe tu respuesta aquí…"
            className="min-h-[140px] rounded-2xl border-2 text-base"
            maxLength={1000}
          />
          <div className="text-xs text-muted-foreground text-right mt-2">{openText.length}/1000</div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-muted-foreground capitalize">
          {mode === "quiz" && "🔤 Opción múltiple"}
          {mode === "tf" && "✅ Verdadero o Falso"}
          {mode === "classic" && "📝 Examen clásico"}
        </span>
        {!revealed ? (
          <Button
            onClick={submit}
            disabled={(q.type === "open" ? openText.trim().length < 3 : !selected)}
            size="lg"
            className="rounded-full h-12 px-7 bg-primary-gradient font-bold shadow-glow"
          >
            Confirmar respuesta <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={next} size="lg" className="rounded-full h-12 px-7 bg-primary-gradient font-bold shadow-glow">
            {index + 1 >= total ? "Ver resultados" : "Siguiente"} <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {revealed && (q.type === "mcq" || q.type === "tf") && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={cn("rounded-2xl p-4 border-2", correct ? "bg-success/10 border-success/40 text-success" : "bg-destructive/10 border-destructive/40 text-destructive")}
        >
          <div className="font-bold mb-1">{correct ? "✅ ¡Correcto!" : "❌ Incorrecto"}</div>
          <div className="text-sm text-foreground/80">Respuesta esperada: <b>{q.expectedHint}</b></div>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- Shared UI ---------- */

function PracticeHeader({ title, subtitle, progress, index, total, backHref }: { title: string; subtitle: string; progress: number; index: number; total: number; backHref: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link to={backHref} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> {subtitle || "Salir"}
        </Link>
        <Link to={backHref} className="grid place-items-center w-9 h-9 rounded-full bg-card border border-border hover:bg-muted">
          <X className="w-4 h-4" />
        </Link>
      </div>
      <h1 className="font-display font-bold text-xl md:text-2xl text-balance">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary-gradient rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <span className="text-sm font-bold text-muted-foreground tabular-nums">{index + 1}/{total}</span>
      </div>
    </div>
  );
}

function QuestionCard({ q, index, total, hideOptions }: { q: Question; index: number; total: number; hideOptions?: boolean }) {
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
      {!hideOptions && q.options && (
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
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
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

function TextAnswerCard({ value, onChange, onSubmit, forced }: { value: string; onChange: (v: string) => void; onSubmit: () => void; forced: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
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

function FeedbackCard({ score, hint, onNext, isLast }: { score: number; hint: string; onNext: () => void; isLast: boolean }) {
  const great = score >= 17;
  const good = score >= 14;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className={cn("rounded-3xl p-7 shadow-glow text-primary-foreground",
        great ? "bg-lime-gradient" : good ? "bg-primary-gradient" : "bg-coral-gradient")}
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

function Results({ scores, onRestart, backHref }: { scores: number[]; onRestart: () => void; backHref: string }) {
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = scores.length ? Math.round((total / scores.length) * 10) / 10 : 0;
  const xp = total * 5;
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="font-display text-5xl font-bold mb-2">¡Lo lograste!</h1>
        <p className="text-muted-foreground mb-8">Completaste tu evaluación.</p>
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
          <Link to={backHref}>Volver</Link>
        </Button>
      </div>
    </div>
  );
}