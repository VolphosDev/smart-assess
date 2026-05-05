import { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, FileText, Image as ImageIcon, FileType, Trash2, Plus } from "lucide-react";
import { courses, courseSyllabus } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const colorMap = {
  primary: "bg-primary-gradient",
  lime: "bg-lime-gradient",
  coral: "bg-coral-gradient",
} as const;

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.docx";

type Material = { id: string; name: string; type: string; size: string };

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="w-5 h-5 text-coral" />;
  if (ext === "docx") return <FileType className="w-5 h-5 text-primary" />;
  return <ImageIcon className="w-5 h-5 text-lime" />;
}

export default function TeacherCourse() {
  const { courseId = "" } = useParams();
  const course = courses.find((c) => c.id === courseId);
  const weeks = courseSyllabus[courseId] ?? [];
  const [activeWeek, setActiveWeek] = useState<number>(weeks[0]?.week ?? 1);
  const [materials, setMaterials] = useState<Record<number, Material[]>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  if (!course) {
    return (
      <div className="text-center py-20">
        <h1 className="font-display font-bold text-3xl mb-3">Curso no encontrado</h1>
        <Link to="/docente" className="text-primary font-semibold hover:underline">Volver</Link>
      </div>
    );
  }

  const onUpload = (files: FileList | null) => {
    if (!files) return;
    const allowed = ["pdf", "jpg", "jpeg", "png", "docx"];
    const newOnes: Material[] = [];
    Array.from(files).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowed.includes(ext)) {
        toast.error(`Formato no permitido: ${f.name}`);
        return;
      }
      newOnes.push({
        id: crypto.randomUUID(),
        name: f.name,
        type: ext,
        size: `${(f.size / 1024).toFixed(0)} KB`,
      });
    });
    if (newOnes.length) {
      setMaterials((m) => ({ ...m, [activeWeek]: [...(m[activeWeek] ?? []), ...newOnes] }));
      toast.success(`${newOnes.length} archivo(s) subido(s) a Semana ${activeWeek}`);
    }
  };

  const remove = (id: string) => {
    setMaterials((m) => ({ ...m, [activeWeek]: (m[activeWeek] ?? []).filter((x) => x.id !== id) }));
  };

  const current = materials[activeWeek] ?? [];

  return (
    <div className="space-y-8">
      <Link to="/docente" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Mis cursos
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden", colorMap[course.color])}
      >
        <div className="absolute -right-6 -top-6 text-[10rem] opacity-20 select-none">{course.emoji}</div>
        <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
          Vista docente · Semestre 2026-1
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 max-w-2xl">{course.name}</h1>
        <p className="opacity-90">{weeks.length} semanas · 28 alumnos inscritos</p>
      </motion.section>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Week list */}
        <aside className="bg-card border border-border rounded-3xl p-3 shadow-soft h-fit">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground px-3 py-2">Sesiones por semana</h3>
          <ul className="space-y-1">
            {weeks.map((w) => (
              <li key={w.week}>
                <button
                  onClick={() => setActiveWeek(w.week)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all",
                    activeWeek === w.week ? "bg-primary text-primary-foreground shadow-glow" : "hover:bg-muted"
                  )}
                >
                  <span className={cn(
                    "w-9 h-9 rounded-xl grid place-items-center font-bold text-sm shrink-0",
                    activeWeek === w.week ? "bg-background/20" : "bg-muted"
                  )}>
                    {w.week}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase opacity-70">Semana {w.week}</div>
                    <div className="text-sm font-semibold truncate">{w.title}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Materials panel */}
        <section className="space-y-5">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Semana {activeWeek}</span>
                <h2 className="font-display text-2xl font-bold">{weeks.find((w) => w.week === activeWeek)?.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {weeks.find((w) => w.week === activeWeek)?.subtopics.join(" · ")}
                </p>
              </div>
              <Button
                onClick={() => fileInput.current?.click()}
                className="rounded-full font-bold bg-primary-gradient shadow-glow"
              >
                <Plus className="w-4 h-4 mr-1" /> Subir material
              </Button>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => onUpload(e.target.files)}
              />
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-border rounded-3xl p-10 text-center bg-card/50 hover:bg-card transition-all"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg">Arrastra y suelta tus archivos</h3>
            <p className="text-sm text-muted-foreground mt-1">Formatos aceptados: PDF, JPG, PNG, DOCX · Máx. 20 MB</p>
          </div>

          {/* Materials list */}
          <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-bold">Materiales subidos</h3>
              <span className="text-xs font-bold text-muted-foreground">{current.length} archivo(s)</span>
            </div>
            {current.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Aún no hay materiales para esta semana.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {current.map((m) => (
                  <li key={m.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center shrink-0">
                      {fileIcon(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{m.type} · {m.size}</div>
                    </div>
                    <button
                      onClick={() => remove(m.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
