import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, ArrowRight, ChevronDown, FileText, Lock, PlayCircle, Sparkles, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "@/api";
import { useEffect, useState } from "react";
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import { getCourseIcon } from "@/lib/icon-mapper";
import { reproducirClic } from "@/lib/sonidos";

const colorMap = {
    primary: "bg-primary-gradient",
    lime: "bg-lime-gradient",
    coral: "bg-coral-gradient",
} as const;

/**
 * Clases completas y literales, no construidas con plantillas.
 *
 * Tailwind analiza el codigo como TEXTO para decidir que clases incluye en el CSS final. Una
 * clase armada como `bg-${acento}-600` nunca aparece escrita, asi que se purga del build y
 * el elemento se queda sin color: funciona en desarrollo y falla en produccion, que es la
 * peor forma de fallar.
 */
const ACENTOS = {
    lime: { chip: "bg-emerald-600", boton: "bg-emerald-600 hover:bg-emerald-700" },
    coral: { chip: "bg-rose-600", boton: "bg-rose-600 hover:bg-rose-700" },
    primary: { chip: "bg-indigo-600", boton: "bg-indigo-600 hover:bg-indigo-700" },
} as const;

/**
 * Vista del curso al estilo de un campus virtual: cada semana es una fila plegable que, al
 * abrirse, muestra su material y el botón para evaluarse.
 *
 * El motivo del cambio: la versión anterior mostraba todas las semanas expandidas con el
 * mismo peso visual, así que un curso de 16 semanas era una pared de tarjetas idénticas
 * donde nada indicaba por dónde seguir. Plegadas, la lista completa cabe en una pantalla y
 * el alumno abre la que le toca. Es la misma estructura que ya conocen de su campus.
 */
export default function Course() {
    const { courseId = "" } = useParams();
    const [selectedFile, setSelectedFile] = useState<{ id: string; name: string } | null>(null);
    const [abiertas, setAbiertas] = useState<Set<string>>(new Set());

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const { data: courses = [], isLoading: loadingCourses } = useQuery({
        queryKey: ["student-courses", user.id],
        queryFn: () => coursesApi.forStudent(user.id),
        enabled: !!user.id,
    });
    const course = courses.find((c: any) => String(c.id) === String(courseId));

    const { data: weeks = [], isLoading: loadingWeeks } = useQuery({
        queryKey: ["semanas", courseId],
        queryFn: () => coursesApi.weeks(courseId),
        enabled: !!courseId,
    });

    /**
     * Se abre sola la semana en curso, o la primera con material si no hay ninguna empezada.
     * Un acordeón que arranca entero cerrado obliga a adivinar dónde hay algo, que es el
     * fallo clásico de este patrón.
     */
    useEffect(() => {
        if (weeks.length === 0 || abiertas.size > 0) return;

        const conIntentoPendiente = weeks.find((w: any) =>
            Object.keys(localStorage).some((k) =>
                k.startsWith(`semantika.unfinished_attempt.${user.id}.${courseId}.${w.id}.`)));

        const conMaterial = weeks.find((w: any) => (w.materiales?.length ?? 0) > 0);
        const inicial = conIntentoPendiente || conMaterial || weeks[0];
        if (inicial) setAbiertas(new Set([String(inicial.id)]));
        // Solo al cargar las semanas: si dependiera de `abiertas`, se reabriría al plegarlas.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weeks]);

    const alternar = (id: string) => {
        reproducirClic();
        setAbiertas((prev) => {
            const copia = new Set(prev);
            if (copia.has(id)) copia.delete(id);
            else copia.add(id);
            return copia;
        });
    };

    if (loadingCourses) {
        return (
            <div className="flex items-center justify-center py-32 text-muted-foreground font-semibold">
                Cargando información del curso...
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-20">
                <h1 className="font-display font-bold text-3xl mb-3">Curso no encontrado</h1>
                <Link to="/app" className="text-primary font-semibold hover:underline">Volver al inicio</Link>
            </div>
        );
    }

    const acento = ACENTOS[course.color as keyof typeof ACENTOS] ?? ACENTOS.primary;

    return (
        <div className="space-y-8">
            <Link to="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Mis cursos
            </Link>

            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "rounded-xl p-8 shadow-sm relative overflow-hidden",
                    colorMap[course.color as keyof typeof colorMap] ?? "bg-primary-gradient"
                )}
            >
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.25] select-none text-white pointer-events-none">
                    {getCourseIcon(course.emoji, "w-36 h-36 md:w-40 md:h-40")}
                </div>
                <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-3">
                    Curso · Semestre 2026-1
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 max-w-2xl">{course.name}</h1>
                <p className="opacity-90 max-w-xl text-sm">{weeks.length} semanas</p>
            </motion.section>

            <section>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <h2 className="font-display text-2xl md:text-3xl font-bold">Temas por semana</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                reproducirClic();
                                setAbiertas(abiertas.size === weeks.length
                                    ? new Set()
                                    : new Set(weeks.map((w: any) => String(w.id))));
                            }}
                            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                        >
                            {abiertas.size === weeks.length ? "Cerrar todas" : "Abrir todas"}
                        </button>
                    </div>
                </div>

                {loadingWeeks && <p className="text-muted-foreground text-sm">Cargando semanas...</p>}

                <ul className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-card">
                    {weeks.map((w: any, i: number) => {
                        const id = String(w.id);
                        const abierta = abiertas.has(id);
                        const habilitada = w.habilitada !== false;
                        const materiales = w.materiales ?? [];
                        const hayPendiente = Object.keys(localStorage).some((k) =>
                            k.startsWith(`semantika.unfinished_attempt.${user.id}.${courseId}.${id}.`));

                        return (
                            <li key={id}>
                                {/* Cabecera plegable. Toda la fila es el objetivo táctil, no
                                    solo el icono: en móvil acertar una flecha de 16 px es una
                                    de las causas de abandono más tontas que hay.

                                    El hueco a la derecha (pr-*) reserva sitio para el botón de
                                    evaluarse, que va superpuesto: así el título se corta con
                                    puntos suspensivos en vez de pasar por debajo del botón. */}
                                <button
                                    onClick={() => alternar(id)}
                                    aria-expanded={abierta}
                                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-muted/40 transition-colors min-h-[64px]"
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg grid place-items-center font-display font-bold shrink-0 text-white",
                                        acento.chip
                                    )}>
                                        {i + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                {w.numSem}
                                            </span>
                                            {hayPendiente && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-extrabold uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> En curso
                                                </span>
                                            )}
                                            {!habilitada && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                                    <Lock className="w-3 h-3" /> Cerrada
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-display font-bold text-base sm:text-lg leading-tight truncate">
                                            {w.nombreTema || w.numSem}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {materiales.length > 0
                                                ? `${materiales.length} ${materiales.length === 1 ? "material" : "materiales"}`
                                                : "Sin material aún"}
                                            {" · "}
                                            {w.totalPreguntas ?? 0} preguntas
                                        </p>
                                    </div>

                                    <ChevronDown className={cn(
                                        "w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200",
                                        abierta && "rotate-180"
                                    )} />
                                </button>

                                <AnimatePresence initial={false}>
                                    {abierta && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden bg-muted/25"
                                        >
                                            <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 border-l-4 border-primary/40 ml-4 sm:ml-5">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                                        Material de estudio
                                                    </h4>
                                                    {materiales.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">
                                                            El profesor aún no ha subido material para esta semana.
                                                        </p>
                                                    ) : (
                                                        <ul className="space-y-1.5">
                                                            {materiales.map((m: any) => (
                                                                <li key={m.id}>
                                                                    {m.visible ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                reproducirClic();
                                                                                setSelectedFile({ id: m.mongoId, name: m.nombreArchivo });
                                                                            }}
                                                                            className="w-full flex items-center gap-2 min-h-[44px] px-3 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                                                                        >
                                                                            <FileText className="w-4 h-4 shrink-0 text-primary" />
                                                                            <span className="text-sm font-medium truncate">{m.nombreArchivo}</span>
                                                                        </button>
                                                                    ) : (
                                                                        <span className="flex items-center gap-2 min-h-[44px] px-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
                                                                            <Lock className="w-4 h-4 shrink-0" />
                                                                            <span className="truncate">{m.nombreArchivo} · oculto por el profesor</span>
                                                                        </span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {/* El botón de evaluarse vive ahora en la fila
                                                    de la semana, arriba. Aquí solo queda el aviso
                                                    de semana cerrada, que sí necesita explicarse
                                                    con palabras: una fila sin botón, sin más,
                                                    parecería que la aplicación está rota. */}
                                                {/*
                                                    La acción va ABAJO y a lo ancho, debajo del
                                                    material.

                                                    Se probó ponerla superpuesta a la derecha de
                                                    la fila para no gastar altura, y se lee mal:
                                                    el orden natural es leer el material y luego
                                                    evaluarse, así que el botón tiene que estar
                                                    después de él, no al lado del título.

                                                    Un examen a medias NUNCA queda escondido: la
                                                    semana con intento pendiente se abre sola al
                                                    entrar al curso (ver el efecto de arriba), así
                                                    que "Continuar" siempre está a la vista sin
                                                    necesidad de un botón flotante.
                                                */}
                                                {!habilitada ? (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Lock className="w-4 h-4" />
                                                        El profesor cerró esta semana temporalmente.
                                                    </p>
                                                ) : materiales.length === 0 ? (
                                                    /* Se dice POR QUÉ no se puede practicar. Una
                                                       fila sin botón y sin explicación parece que
                                                       la aplicación está rota. */
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Lock className="w-4 h-4 shrink-0" />
                                                        Todavía no puedes evaluarte en esta semana: el profesor
                                                        aún no ha subido material.
                                                    </p>
                                                ) : (
                                                    <Link
                                                        to={`/app/curso/${courseId}/semana/${id}`}
                                                        onClick={() => reproducirClic()}
                                                        className={cn(
                                                            "inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 rounded-xl font-bold text-sm shadow-xs transition-all text-white",
                                                            hayPendiente ? "bg-amber-500 hover:bg-amber-600" : acento.boton
                                                        )}
                                                    >
                                                        {hayPendiente ? <PlayCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                        {hayPendiente ? "Continuar mi prueba" : "Ponte a prueba"}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-center gap-5">
                <div className="w-12 h-12 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-display font-bold text-lg">¿No sabes por dónde empezar?</h3>
                    <p className="text-sm text-muted-foreground">
                        Abrimos por ti la semana que tienes a medias. Si ya la terminaste, sigue con la siguiente.
                    </p>
                </div>
                <Link
                    to="/app/mapa-conocimiento"
                    className="shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-border font-semibold text-sm hover:bg-muted/60 transition-colors"
                >
                    Ver mi mapa de calor <ArrowRight className="w-4 h-4" />
                </Link>
            </section>

            <UniversalPreviewModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                mongoId={selectedFile?.id || ""}
                fileName={selectedFile?.name || ""}
            />
        </div>
    );
}
