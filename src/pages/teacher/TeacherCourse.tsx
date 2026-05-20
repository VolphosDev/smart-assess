import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Upload, FileText, Image as ImageIcon, FileType,
  Trash2, Plus, Eye, X, UserPlus, Users, BarChart3, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  coursesApi, materialsApi,
  useStore, type MaterialRecord, type User, type GradeRecord,
} from "@/api";

const colorMap = {
  primary: "bg-primary-gradient",
  lime: "bg-lime-gradient",
  coral: "bg-coral-gradient",
} as const;

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.docx";

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="w-5 h-5 text-coral" />;
  if (ext === "docx") return <FileType className="w-5 h-5 text-primary" />;
  return <ImageIcon className="w-5 h-5 text-lime" />;
}

function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

type Tab = "materiales" | "alumnos" | "notas";

export default function TeacherCourse() {
  const { courseId = "" } = useParams();
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const allMaterials = useStore((s) => s.materials.filter((m) => m.courseId === courseId));
  const allUsers = useStore((s) => s.users);
  const allGrades = useStore((s) => s.grades.filter((g) => g.courseId === courseId));

  const [tab, setTab] = useState<Tab>("materiales");
  const [activeWeek, setActiveWeek] = useState(1);
  const [preview, setPreview] = useState<MaterialRecord | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (course && activeWeek > course.weeks) setActiveWeek(1);
  }, [course, activeWeek]);

  if (!course) {
    return (
      <div className="text-center py-20">
        <h1 className="font-display font-bold text-3xl mb-3">Curso no encontrado</h1>
        <Link to="/docente" className="text-primary font-semibold hover:underline">Volver</Link>
      </div>
    );
  }

  const weekMaterials = allMaterials.filter((m) => m.week === activeWeek);
  const enrolled = allUsers.filter((u) => course.studentIds.includes(u.id));
  const available = allUsers.filter((u) => u.role === "student" && !course.studentIds.includes(u.id));

  const onUpload = async (files: FileList | null) => {
    if (!files) return;
    const allowed = ["pdf", "jpg", "jpeg", "png", "docx"];
    let ok = 0;
    for (const f of Array.from(files)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowed.includes(ext)) { toast.error(`Formato no permitido: ${f.name}`); continue; }
      const dataUrl = await readAsDataUrl(f);
      await materialsApi.upload(courseId, activeWeek, {
        name: f.name, type: ext, size: `${(f.size / 1024).toFixed(0)} KB`, dataUrl,
      });
      ok++;
    }
    if (ok) toast.success(`${ok} archivo(s) subido(s) a Semana ${activeWeek}`);
  };

  const remove = async (id: string) => {
    await materialsApi.remove(courseId, activeWeek, id);
  };

  const addStudent = async (id: string) => {
    await coursesApi.addStudent(courseId, id);
    toast.success("Alumno matriculado");
  };
  const removeStudent = async (id: string) => {
    await coursesApi.removeStudent(courseId, id);
  };

  return (
    <div className="space-y-8">
      <Link to="/docente" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Mis cursos
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden", colorMap[course.color])}
      >
        <div className="absolute -right-6 -top-6 text-[10rem] opacity-20 select-none">{course.emoji}</div>
        <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
          Vista docente · Semestre 2026-1
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 max-w-2xl">{course.name}</h1>
        <p className="opacity-90">{course.weeks} semanas · {enrolled.length} alumnos inscritos</p>
      </motion.section>

      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1 w-fit shadow-soft">
        <TabBtn active={tab === "materiales"} onClick={() => setTab("materiales")} icon={FolderOpen} label="Materiales" />
        <TabBtn active={tab === "alumnos"} onClick={() => setTab("alumnos")} icon={Users} label={`Alumnos (${enrolled.length})`} />
        <TabBtn active={tab === "notas"} onClick={() => setTab("notas")} icon={BarChart3} label="Notas" />
      </div>

      {tab === "materiales" && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="bg-card border border-border rounded-3xl p-3 shadow-soft h-fit">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground px-3 py-2">Semanas</h3>
            <ul className="space-y-1">
              {Array.from({ length: course.weeks }, (_, i) => i + 1).map((w) => {
                const count = allMaterials.filter((m) => m.week === w).length;
                return (
                  <li key={w}>
                    <button
                      onClick={() => setActiveWeek(w)}
                      className={cn(
                        "w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all",
                        activeWeek === w ? "bg-primary text-primary-foreground shadow-glow" : "hover:bg-muted"
                      )}
                    >
                      <span className={cn("w-9 h-9 rounded-xl grid place-items-center font-bold text-sm shrink-0",
                        activeWeek === w ? "bg-background/20" : "bg-muted")}>{w}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold uppercase opacity-70">Semana {w}</div>
                        <div className="text-xs">{count} archivo(s)</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-soft flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Semana {activeWeek}</span>
                <h2 className="font-display text-2xl font-bold">Materiales de la semana</h2>
                <p className="text-sm text-muted-foreground mt-1">Sube los recursos que tus alumnos verán esta semana.</p>
              </div>
              <Button onClick={() => fileInput.current?.click()} className="rounded-full font-bold bg-primary-gradient shadow-glow">
                <Plus className="w-4 h-4 mr-1" /> Subir material
              </Button>
              <input ref={fileInput} type="file" multiple accept={ACCEPTED} className="hidden" onChange={(e) => onUpload(e.target.files)} />
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files); }}
              className="border-2 border-dashed border-border rounded-3xl p-10 text-center bg-card/50 hover:bg-card transition-all"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg">Arrastra y suelta tus archivos</h3>
              <p className="text-sm text-muted-foreground mt-1">Formatos aceptados: PDF, JPG, PNG, DOCX · Máx. 20 MB</p>
            </div>

            <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold">Materiales subidos</h3>
                <span className="text-xs font-bold text-muted-foreground">{weekMaterials.length} archivo(s)</span>
              </div>
              {weekMaterials.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Aún no hay materiales para esta semana.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {weekMaterials.map((m) => (
                    <li key={m.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center shrink-0">{fileIcon(m.name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground uppercase">{m.type} · {m.size}</div>
                      </div>
                      {m.dataUrl && (m.type === "pdf" || ["jpg", "jpeg", "png"].includes(m.type)) && (
                        <button onClick={() => setPreview(m)} className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10" title="Vista previa">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => remove(m.id)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "alumnos" && (
        <StudentsTab enrolled={enrolled} available={available} onAdd={addStudent} onRemove={removeStudent} />
      )}

      {tab === "notas" && (
        <GradesTab grades={allGrades} students={allUsers} weeks={course.weeks} />
      )}

      {preview && <PreviewModal material={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition",
        active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function StudentsTab({ enrolled, available, onAdd, onRemove }: {
  enrolled: User[]; available: User[]; onAdd: (id: string) => void; onRemove: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = available.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold">Alumnos matriculados</h3>
          <span className="text-xs font-bold text-muted-foreground">{enrolled.length}</span>
        </div>
        {enrolled.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Sin alumnos aún. Agrégalos desde la lista de la derecha.</div>
        ) : (
          <ul className="divide-y divide-border">
            {enrolled.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-gradient grid place-items-center text-lg shadow-soft">{s.avatar ?? "👤"}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                </div>
                <button onClick={() => onRemove(s.id)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold">Agregar alumnos</h3>
            <span className="text-xs font-bold text-muted-foreground">{available.length} disponibles</span>
          </div>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full h-10 rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Sin coincidencias.</div>
        ) : (
          <ul className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {filtered.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-10 h-10 rounded-2xl bg-muted grid place-items-center text-lg">{s.avatar ?? "👤"}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                </div>
                <Button size="sm" onClick={() => onAdd(s.id)} className="rounded-full font-bold bg-primary-gradient">
                  <UserPlus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function GradesTab({ grades, students, weeks }: { grades: GradeRecord[]; students: User[]; weeks: number }) {
  const enrolledIds = useMemo(() => Array.from(new Set(grades.map((g) => g.studentId))), [grades]);
  const rows = enrolledIds.map((sid) => {
    const student = students.find((u) => u.id === sid);
    const sg = grades.filter((g) => g.studentId === sid);
    const avg = sg.length ? (sg.reduce((a, g) => a + g.score, 0) / sg.length).toFixed(1) : "—";
    return { student, sg, avg };
  });
  return (
    <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-bold">Notas por alumno</h3>
        <span className="text-xs font-bold text-muted-foreground">{grades.length} intentos registrados</span>
      </div>
      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Aún no hay notas registradas en este curso.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3">Alumno</th>
                {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
                  <th key={w} className="px-3 py-3 text-center">S{w}</th>
                ))}
                <th className="px-6 py-3 text-right">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ student, sg, avg }) => (
                <tr key={student?.id}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-lime-gradient grid place-items-center text-base shadow-soft">{student?.avatar}</div>
                      <div>
                        <div className="font-semibold">{student?.name}</div>
                        <div className="text-xs text-muted-foreground">{student?.email}</div>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => {
                    const cell = sg.filter((g) => g.week === w);
                    const best = cell.length ? Math.max(...cell.map((c) => c.score)) : null;
                    return (
                      <td key={w} className="px-3 py-3 text-center">
                        {best == null ? <span className="text-muted-foreground">–</span> : (
                          <span className={cn("inline-block px-2 py-1 rounded-lg font-bold text-xs",
                            best >= 17 ? "bg-success/15 text-success" :
                            best >= 11 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                          )}>{best}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-3 text-right font-display font-bold text-lg">{avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PreviewModal({ material, onClose }: { material: MaterialRecord; onClose: () => void }) {
  const isImage = ["jpg", "jpeg", "png"].includes(material.type);
  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl shadow-glow w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {fileIcon(material.name)}
            <div className="min-w-0">
              <div className="font-semibold truncate">{material.name}</div>
              <div className="text-xs text-muted-foreground uppercase">{material.type} · {material.size}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 bg-muted/30 overflow-auto grid place-items-center">
          {material.dataUrl ? (
            isImage ? (
              <img src={material.dataUrl} alt={material.name} className="max-h-full max-w-full" />
            ) : (
              <iframe src={material.dataUrl} title={material.name} className="w-full h-full bg-white" />
            )
          ) : (
            <p className="text-muted-foreground text-sm p-8">Vista previa no disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}