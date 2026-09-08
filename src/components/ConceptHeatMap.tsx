import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    TrendingUp,
    AlertTriangle,
    HelpCircle,
    Sparkles,
    Flame,
} from "lucide-react";

export interface TemaConocimiento {
    concepto: string;
    nivelBloom: string | null;
    probabilidadDominio: number;
    intensidadCalor: number;
    observaciones: number;
    confiable: boolean;
    nivel: "DOMINADO" | "EN_PROGRESO" | "DEBIL" | "DATOS_INSUFICIENTES";
    actualizadoEn: string | null;
}

export interface GrupoCursoConocimiento {
    cursoId: string | number | null;
    cursoNombre: string;
    cursoColor?: string;
    cursoEmoji?: string;
    totalTemas: number;
    temasDebiles: number;
    promedioDominio: number | null;
    temas: TemaConocimiento[];
}

/**
 * Cada nivel tiene un color semántico (coherente con el resto de la app: esmeralda =
 * dominado, ámbar = en progreso, rojo = débil) y una intensidad de "resplandor" que crece
 * con la urgencia — así el tema que más urge repasar es, literalmente, el que más brilla,
 * como el punto más caliente de un mapa de densidad.
 */
const NIVEL_VISUAL = {
    DOMINADO: {
        label: "Lo dominas",
        icon: CheckCircle2,
        ring: "ring-emerald-400/40 dark:ring-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-300",
        chipBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
        blobFrom: "#6ee7b7",
        blobTo: "#059669",
        glow: "rgba(16,185,129,0.35)",
    },
    EN_PROGRESO: {
        label: "En camino",
        icon: TrendingUp,
        ring: "ring-amber-400/50 dark:ring-amber-500/40",
        text: "text-amber-700 dark:text-amber-300",
        chipBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50",
        blobFrom: "#fde047",
        blobTo: "#f97316",
        glow: "rgba(249,115,22,0.45)",
    },
    DEBIL: {
        label: "Necesita repaso",
        icon: Flame,
        ring: "ring-red-400/60 dark:ring-red-500/50",
        text: "text-red-700 dark:text-red-300",
        chipBg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50",
        blobFrom: "#fb923c",
        blobTo: "#dc2626",
        glow: "rgba(220,38,38,0.55)",
    },
    DATOS_INSUFICIENTES: {
        label: "Aún reuniendo datos",
        icon: HelpCircle,
        ring: "ring-border",
        text: "text-muted-foreground",
        chipBg: "bg-muted/40 border-border/60",
        blobFrom: "#cbd5e1",
        blobTo: "#94a3b8",
        glow: "rgba(148,163,184,0.25)",
    },
} as const;

const BLOOM_LABEL: Record<string, string> = {
    Recordar: "Recordar",
    Comprender: "Comprender",
    Aplicar: "Aplicar",
    Analizar: "Analizar",
    Evaluar: "Evaluar",
    Crear: "Crear",
};

/** Tamaño del blob: los temas más calientes (más urgentes) se ven más grandes, a propósito —
 *  es lo primero en lo que el ojo se posa, igual que el punto rojo más grande del mapa de
 *  densidad de referencia es el que concentra más incidentes. */
function tamanoBlob(tema: TemaConocimiento): number {
    if (tema.nivel === "DATOS_INSUFICIENTES") return 84;
    const base = 76;
    const boost = tema.nivel === "DEBIL" ? 46 : tema.nivel === "EN_PROGRESO" ? 22 : 0;
    return Math.round(base + boost * tema.intensidadCalor);
}

export default function ConceptHeatMap({ cursos }: { cursos: GrupoCursoConocimiento[] }) {
    const [seleccionado, setSeleccionado] = useState<{ curso: GrupoCursoConocimiento; tema: TemaConocimiento } | null>(null);

    const hayCursosConTemas = cursos.some((c) => c.temas.length > 0);

    if (!hayCursosConTemas) {
        return (
            <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <h3 className="font-display font-bold text-base">Tu mapa por temas se está construyendo</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    A medida que respondas evaluaciones, cada pregunta se va uniendo a su tema.
                    Completa un par de prácticas más y aquí empezarán a aparecer los temas que
                    dominas y los que conviene repasar.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {cursos.filter((c) => c.temas.length > 0).map((curso) => (
                <div key={String(curso.cursoId ?? curso.cursoNombre)} className="bg-card border border-border/80 rounded-xl p-6 shadow-xs">
                    {/* Encabezado del curso */}
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                            <span className="text-2xl leading-none" role="img" aria-label={curso.cursoNombre}>
                                {curso.cursoEmoji || "📚"}
                            </span>
                            <div>
                                <h3 className="font-display font-bold text-lg leading-tight">{curso.cursoNombre}</h3>
                                <p className="text-[11px] text-muted-foreground">
                                    {curso.totalTemas} {curso.totalTemas === 1 ? "tema evaluado" : "temas evaluados"}
                                </p>
                            </div>
                        </div>
                        {curso.temasDebiles > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-full px-3 py-1.5">
                                <Flame className="w-3.5 h-3.5" />
                                {curso.temasDebiles} {curso.temasDebiles === 1 ? "tema necesita repaso" : "temas necesitan repaso"}
                            </span>
                        )}
                    </div>

                    {/* Campo de temas: burbujas de calor, más calientes primero */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {curso.temas.map((tema) => {
                            const visual = NIVEL_VISUAL[tema.nivel];
                            const size = tamanoBlob(tema);
                            const activo = seleccionado?.tema.concepto === tema.concepto
                                && seleccionado.curso.cursoNombre === curso.cursoNombre;

                            return (
                                <button
                                    key={tema.concepto + tema.nivelBloom}
                                    onClick={() => setSeleccionado({ curso, tema })}
                                    title={`${tema.concepto} — ${visual.label}`}
                                    style={{ width: size, height: size }}
                                    className={cn(
                                        "relative shrink-0 rounded-full grid place-items-center p-2 transition-all duration-300",
                                        "hover:scale-110 focus-visible:outline-none focus-visible:scale-110",
                                        "ring-2",
                                        visual.ring,
                                        activo && "scale-110"
                                    )}
                                >
                                    {/* Halo difuso: da la sensación de "punto caliente" del mapa de referencia */}
                                    <span
                                        aria-hidden
                                        className="absolute inset-[-30%] rounded-full blur-xl -z-10 transition-opacity"
                                        style={{
                                            background: `radial-gradient(circle, ${visual.glow} 0%, transparent 70%)`,
                                            opacity: tema.nivel === "DATOS_INSUFICIENTES" ? 0.3 : 0.55 + tema.intensidadCalor * 0.35,
                                        }}
                                    />
                                    {/* Núcleo del blob */}
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: tema.nivel === "DATOS_INSUFICIENTES"
                                                ? `repeating-linear-gradient(45deg, ${visual.blobFrom}, ${visual.blobFrom} 6px, ${visual.blobTo} 6px, ${visual.blobTo} 12px)`
                                                : `radial-gradient(circle at 35% 30%, ${visual.blobFrom}, ${visual.blobTo})`,
                                            opacity: tema.nivel === "DATOS_INSUFICIENTES" ? 0.25 : 0.92,
                                        }}
                                    />
                                    <span className="relative z-10 text-center leading-tight font-bold text-white drop-shadow-sm px-1"
                                          style={{ fontSize: size < 90 ? "10px" : "11px" }}>
                                        {tema.concepto}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Leyenda compacta */}
                    <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border/40">
                        {(Object.keys(NIVEL_VISUAL) as (keyof typeof NIVEL_VISUAL)[]).map((key) => {
                            const v = NIVEL_VISUAL[key];
                            const Icon = v.icon;
                            return (
                                <div key={key} className="flex items-center gap-1.5">
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ background: `radial-gradient(circle at 35% 30%, ${v.blobFrom}, ${v.blobTo})` }}
                                    />
                                    <Icon className={cn("w-3.5 h-3.5", v.text)} />
                                    <span className="text-[10px] font-semibold text-muted-foreground">{v.label}</span>
                                </div>
                            );
                        })}
                        <span className="text-[10px] text-muted-foreground/70 ml-auto italic">
                            El tema más grande y brillante es el que más te conviene repasar
                        </span>
                    </div>
                </div>
            ))}

            {/* Panel de detalle del tema seleccionado */}
            <AnimatePresence>
                {seleccionado && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className={cn(
                            "bg-card border rounded-xl p-6 shadow-md",
                            NIVEL_VISUAL[seleccionado.tema.nivel].ring.replace("ring-", "border-")
                        )}
                    >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                                    {seleccionado.curso.cursoEmoji} {seleccionado.curso.cursoNombre}
                                </span>
                                <h4 className="font-display font-extrabold text-xl leading-snug mt-1">
                                    {seleccionado.tema.concepto}
                                </h4>
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 px-3.5 py-2 rounded-xl border shrink-0",
                                NIVEL_VISUAL[seleccionado.tema.nivel].chipBg
                            )}>
                                {(() => {
                                    const Icon = NIVEL_VISUAL[seleccionado.tema.nivel].icon;
                                    return <Icon className={cn("w-5 h-5", NIVEL_VISUAL[seleccionado.tema.nivel].text)} />;
                                })()}
                                <span className={cn("text-xs font-black uppercase tracking-wider", NIVEL_VISUAL[seleccionado.tema.nivel].text)}>
                                    {NIVEL_VISUAL[seleccionado.tema.nivel].label}
                                </span>
                            </div>
                        </div>

                        {seleccionado.tema.confiable ? (
                            <div className="mt-5 space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-foreground">Probabilidad de dominio</span>
                                    <span className="font-display font-black text-2xl text-primary">
                                        {Math.round(seleccionado.tema.probabilidadDominio * 100)}%
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${seleccionado.tema.probabilidadDominio * 100}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="h-full rounded-full"
                                        style={{
                                            background: `linear-gradient(90deg, ${NIVEL_VISUAL[seleccionado.tema.nivel].blobFrom}, ${NIVEL_VISUAL[seleccionado.tema.nivel].blobTo})`,
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="mt-5 text-xs text-muted-foreground bg-muted/30 border border-border/50 rounded-lg px-3.5 py-2.5">
                                Todavía respondiste pocas preguntas de este tema ({seleccionado.tema.observaciones}
                                {seleccionado.tema.observaciones === 1 ? " vez" : " veces"}). Necesitamos un par más
                                para calcular con confianza cuánto lo dominas.
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-border/50 text-xs">
                            <div className="space-y-0.5">
                                <span className="text-muted-foreground font-semibold block">Nivel de Bloom</span>
                                <span className="font-bold text-foreground">
                                    {seleccionado.tema.nivelBloom
                                        ? (BLOOM_LABEL[seleccionado.tema.nivelBloom] ?? seleccionado.tema.nivelBloom)
                                        : "Sin registrar"}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-muted-foreground font-semibold block">Preguntas respondidas</span>
                                <span className="font-bold text-foreground">{seleccionado.tema.observaciones}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
