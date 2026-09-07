import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Target, ArrowRight, BookOpen, Sparkles, Play, CheckCircle2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import TarjetaProgreso from "@/components/TarjetaProgreso";
import { coursesApi, intentosApi, rendimientoApi } from "@/api";
import { getCourseIcon } from "@/lib/icon-mapper";
import { cn } from "@/lib/utils";
import type { GrupoCursoConocimiento } from "@/components/ConceptHeatMap";

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const studentId = user.id;
    const primerNombre = user.name?.split(" ")[0] || "estudiante";

    const { data: courses = [] } = useQuery({
        queryKey: ["student-courses", studentId],
        queryFn: () => coursesApi.forStudent(studentId),
        enabled: !!studentId,
    });

    const { data: attempts = [] } = useQuery({
        queryKey: ["student-attempts", studentId],
        queryFn: async () => {
            // misIntentos ya devuelve el arreglo; el `.data` del código anterior era un
            // resto de una versión previa del cliente HTTP y TypeScript lo marcaba como error.
            const response = await intentosApi.misIntentos(studentId);
            return Array.isArray(response) ? response : [];
        },
        enabled: !!studentId,
    });

    /**
     * Temas concretos que conviene repasar, por nombre. Antes el dashboard tenía un bloque
     * parecido pero apagado con `false &&` (código muerto), y aun encendido solo podía
     * decir "Semana 3" porque era lo único que el backend sabía agrupar. Ahora usa el mapa
     * de conocimiento por concepto: le dice al alumno "Fotosíntesis", no "Semana 3".
     */
    const { data: mapaConocimiento = [] } = useQuery<GrupoCursoConocimiento[]>({
        queryKey: ["mapa-conocimiento-dashboard", studentId],
        queryFn: () => rendimientoApi.mapaConocimiento(studentId),
        enabled: !!studentId,
    });

    const temasParaRepasar = mapaConocimiento
        .flatMap((curso) =>
            curso.temas
                .filter((t) => t.nivel === "DEBIL" && t.confiable)
                .map((t) => ({ ...t, cursoNombre: curso.cursoNombre, cursoId: curso.cursoId, cursoEmoji: curso.cursoEmoji }))
        )
        .sort((a, b) => b.intensidadCalor - a.intensidadCalor)
        .slice(0, 3);

    const gradedAttempts = attempts.filter((i: any) => i.nota !== undefined && i.nota !== null);
    const averageGrade =
        gradedAttempts.length > 0
            ? (gradedAttempts.reduce((sum: number, i: any) => sum + Number(i.nota), 0) / gradedAttempts.length).toFixed(1)
            : "—";

    const streakDays = calcularRacha(attempts);
    const cursoSugerido = courses.length > 0 ? courses[0] : null;

    // Un alumno recién matriculado no tiene nada que "continuar": el primer paso es otro.
    const esPrimeraVez = attempts.length === 0;

    return (
        <div className="space-y-6 md:space-y-8">
            {/* ── Saludo + el ÚNICO paso siguiente ──────────────────────────── */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-hero-gradient rounded-2xl p-6 md:p-8 shadow-sm"
            >
                <p className="text-sm md:text-base opacity-90 font-medium">
                    Hola, {primerNombre} 👋
                </p>

                {cursoSugerido ? (
                    <>
                        <h1 className="font-display text-2xl md:text-4xl font-bold mt-2 mb-2 leading-tight max-w-xl">
                            {esPrimeraVez
                                ? "Empecemos por tu primera práctica"
                                : temasParaRepasar.length > 0
                                    ? `Hoy te toca repasar ${temasParaRepasar[0].concepto}`
                                    : "¿Seguimos practicando?"}
                        </h1>
                        <p className="opacity-90 text-sm md:text-base mb-5 max-w-lg leading-relaxed">
                            {esPrimeraVez
                                ? "Elige un tema, responde unas preguntas y la plataforma te dirá en qué estás bien y qué conviene reforzar."
                                : temasParaRepasar.length > 0
                                    ? `Es el tema donde más te cuesta ahora mismo, en ${temasParaRepasar[0].cursoNombre}. Unas cuantas preguntas y verás la diferencia.`
                                    : "No tienes temas pendientes de refuerzo. Buen momento para avanzar con algo nuevo."}
                        </p>

                        {/* Un solo botón grande: el paso siguiente, sin ambigüedad */}
                        <Button
                            asChild
                            size="lg"
                            className="rounded-xl bg-background text-foreground hover:bg-background/90 font-bold h-12 md:h-13 px-6 text-sm md:text-base w-full sm:w-auto shadow-sm"
                        >
                            <Link
                                to={
                                    temasParaRepasar.length > 0 && temasParaRepasar[0].cursoId
                                        ? `/app/curso/${temasParaRepasar[0].cursoId}`
                                        : `/app/curso/${cursoSugerido.id}`
                                }
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {esPrimeraVez ? "Hacer mi primera práctica" : "Empezar a practicar"}
                            </Link>
                        </Button>
                    </>
                ) : (
                    <>
                        <h1 className="font-display text-2xl md:text-4xl font-bold mt-2 mb-2 leading-tight">
                            ¡Bienvenido a Semantika!
                        </h1>
                        <p className="opacity-90 text-sm md:text-base max-w-lg leading-relaxed">
                            Todavía no estás matriculado en ninguna asignatura. Pídele a tu profesor
                            que te agregue y aquí aparecerán tus cursos.
                        </p>
                    </>
                )}
            </motion.section>

            {/* ── Temas para reforzar, con nombre concreto ──────────────────── */}
            {temasParaRepasar.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-card border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 md:p-6"
                >
                    <div className="flex items-center gap-2.5 mb-4">
                        <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </span>
                        <div>
                            <h2 className="font-display font-bold text-base md:text-lg leading-tight">
                                Estos temas te están costando
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Empieza por el primero: es donde más vas a notar el avance.
                            </p>
                        </div>
                    </div>

                    <ol className="space-y-2.5">
                        {temasParaRepasar.map((tema, i) => (
                            <li key={`${tema.cursoId}-${tema.concepto}`}>
                                <Link
                                    to={tema.cursoId ? `/app/curso/${tema.cursoId}` : "/app/mapa-conocimiento"}
                                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-border transition-colors group min-h-[56px]"
                                >
                                    <span className="w-7 h-7 rounded-lg bg-background border border-border grid place-items-center text-xs font-black shrink-0">
                                        {i + 1}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block font-bold text-sm leading-tight truncate">
                                            {tema.concepto}
                                        </span>
                                        <span className="block text-[11px] text-muted-foreground truncate">
                                            {tema.cursoEmoji} {tema.cursoNombre}
                                        </span>
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ol>

                    <Link
                        to="/app/mapa-conocimiento"
                        className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-primary hover:underline"
                    >
                        <Compass className="w-3.5 h-3.5" />
                        Ver todos mis temas en el mapa
                    </Link>
                </motion.section>
            )}

            {/* ── Progreso: tres números, sin jerga ─────────────────────────── */}
            <section className="grid grid-cols-3 gap-3 md:gap-4">
                <StatCard icon={Flame} label="Días seguidos" value={String(streakDays)} tone="rose" />
                <StatCard icon={Target} label="Tu promedio" value={averageGrade} tone="emerald" />
                <StatCard icon={CheckCircle2} label="Prácticas" value={String(attempts.length)} tone="indigo" />
            </section>

            {/* ── Progreso ──────────────────────────────────────────────────────
                Va antes de los cursos: el alumno ve primero cómo va y luego decide
                adónde ir. Son PUNTOS, no nivel de dominio — ver TarjetaProgreso. */}
            {user?.id && <TarjetaProgreso usuarioId={user.id} />}

            {/* ── Cursos ────────────────────────────────────────────────────── */}
            {courses.length > 0 && (
            <section>
                    <h2 className="font-display text-xl md:text-2xl font-bold mb-4">Tus cursos</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map((c) => (
                            <Link
                                key={c.id}
                                to={`/app/curso/${c.id}`}
                                className="group bg-card border border-border/80 rounded-2xl p-5 hover:border-border hover:shadow-sm transition-all flex items-center gap-4 min-h-[80px]"
                            >
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl grid place-items-center border shrink-0",
                                        c.color === "lime"
                                            ? "bg-emerald-100/80 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                                            : c.color === "coral"
                                                ? "bg-rose-100/80 border-rose-300 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
                                                : "bg-indigo-100/80 border-indigo-300 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400"
                                    )}
                                >
                                    {getCourseIcon(c.emoji, "w-6 h-6")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-display font-bold text-base leading-tight truncate group-hover:underline">
                                        {c.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <BookOpen className="w-3.5 h-3.5" /> {c.weeks || 4} temas
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

/** Días consecutivos con al menos una práctica. Se corta si no practicó ni hoy ni ayer. */
function calcularRacha(attemptsList: any[]): number {
    if (attemptsList.length === 0) return 0;

    const fechas = Array.from(
        new Set(attemptsList.map((a) => new Date(a.fecha).toISOString().split("T")[0]))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (fechas.length === 0) return 0;

    const hoy = new Date().toISOString().split("T")[0];
    const ayer = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
    if (fechas[0] !== hoy && fechas[0] !== ayer) return 0;

    let racha = 1;
    let actual = new Date(fechas[0]);
    for (let i = 1; i < fechas.length; i++) {
        const siguiente = new Date(fechas[i]);
        const dias = Math.ceil(Math.abs(actual.getTime() - siguiente.getTime()) / 86_400_000);
        if (dias === 1) {
            racha++;
            actual = siguiente;
        } else if (dias > 1) {
            break;
        }
    }
    return racha;
}

function StatCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: any;
    label: string;
    value: string;
    tone: "rose" | "emerald" | "indigo";
}) {
    const toneClasses = {
        rose: "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
        indigo: "bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400",
    };
    return (
        <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
            <div className={cn("w-9 h-9 rounded-xl grid place-items-center border shrink-0", toneClasses[tone])}>
                <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
                <div className="font-display font-bold text-xl leading-none">{value}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                    {label}
                </div>
            </div>
        </div>
    );
}
