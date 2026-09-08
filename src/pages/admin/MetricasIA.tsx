import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    AlertTriangle, Download, Loader2, Activity, Layers, Search, Type,
    Image as ImageIcon, ShieldAlert, Gavel, Users,
} from "lucide-react";
import { metricasApi, type BloqueMetrica } from "@/api/metricas";
import { reproducirClic } from "@/lib/sonidos";

/**
 * Panel de métricas del canal de IA.
 *
 * Qué hace especial a estas cifras: no miden si el alumno aprendió, miden si el SISTEMA se
 * comporta como dice comportarse. Son las que permiten responder "¿cómo sabes que tus
 * preguntas no se repiten?" o "¿cuántas veces el contexto fue malo?" con un número en vez de
 * con una impresión.
 *
 * Cada bloque muestra su `interpretacion` tal como la escribe el backend, que incluye
 * deliberadamente qué NO demuestra la cifra. Una métrica sin su límite declarado se
 * sobreinterpreta, y en un informe de tesis eso se paga caro.
 */

const BLOQUES: Array<{ clave: string; titulo: string; icono: any; explicacion: string }> = [
    {
        clave: "generacion_bloom",
        titulo: "Conformidad con Bloom",
        icono: Layers,
        explicacion: "Qué proporción de las preguntas generadas declara cada nivel cognitivo, "
            + "y cuántas son de orden superior (analizar, evaluar, crear).",
    },
    {
        clave: "deduplicacion",
        titulo: "Deduplicación",
        icono: Search,
        explicacion: "Cuántas preguntas repetidas atrapó cada capa del filtro antes de llegar "
            + "al alumno.",
    },
    {
        clave: "rag",
        titulo: "Recuperación de contexto",
        icono: Activity,
        explicacion: "Con qué umbral se recuperó el material en cada generación, y en qué "
            + "porcentaje hubo que conformarse con contexto degradado.",
    },
    {
        clave: "calidad_textual",
        titulo: "Calidad del texto",
        icono: Type,
        explicacion: "Legibilidad (Fernández-Huerta) y riqueza léxica de los enunciados. "
            + "Indica si el lenguaje es adecuado para 2do de secundaria.",
    },
    {
        clave: "imagenes",
        titulo: "Imágenes pedagógicas",
        icono: ImageIcon,
        explicacion: "Qué proporción de las imágenes generadas pasó la validación del agente "
            + "crítico antes de mostrarse.",
    },
    {
        clave: "guardia_enunciado",
        titulo: "Guardia de enunciado",
        icono: ShieldAlert,
        explicacion: "Preguntas rechazadas por referirse a algo que el alumno no puede ver "
            + "(\"según la sección 3\"). Mide un defecto que antes llegaba a pantalla.",
    },
    {
        clave: "juez",
        titulo: "Agente juez",
        icono: Gavel,
        explicacion: "Latencia, coste en tokens y cuántas veces su respuesta se pudo leer sin "
            + "errores de formato.",
    },
    {
        clave: "comite",
        titulo: "Comité de agentes",
        icono: Users,
        explicacion: "Tasa de veto del Verificador, transiciones de nivel y tiempo de "
            + "deliberación. El veto es la garantía de que ninguna decisión depende solo del modelo.",
    },
];

/** Formatea un valor suelto para mostrarlo sin romper la maquetación. */
function formatear(v: unknown): string {
    if (v === null || v === undefined) return "—";
    if (typeof v === "number") {
        return Number.isInteger(v) ? String(v) : v.toFixed(3);
    }
    if (typeof v === "boolean") return v ? "sí" : "no";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}

function Bloque({ titulo, icono: Icono, explicacion, datos }: {
    titulo: string; icono: any; explicacion: string; datos?: BloqueMetrica;
}) {
    // Antes esto devolvia null. Un bloque que no llega desaparecia de la pantalla sin dejar
    // rastro, asi que un nombre de clave mal escrito se veia igual que "todavia no hay datos".
    // Se declara en pantalla: si falta, se ve que falta.
    if (!datos) {
        return (
            <section className="bg-card border border-dashed border-border rounded-xl p-5">
                <h3 className="font-display font-bold text-muted-foreground">{titulo}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    El backend no devolvió este bloque en <code>/metricas/resumen</code>.
                </p>
            </section>
        );
    }

    const { interpretacion, ...cifras } = datos;
    const entradas = Object.entries(cifras).filter(([, v]) => typeof v !== "object" || v === null);

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5 space-y-3"
        >
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Icono className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-display font-bold">{titulo}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{explicacion}</p>
                </div>
            </div>

            {entradas.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Sin datos todavía.</p>
            ) : (
                <dl className="grid sm:grid-cols-2 gap-2">
                    {entradas.map(([k, v]) => (
                        <div key={k} className="bg-muted/40 rounded-lg px-3 py-2 flex items-baseline justify-between gap-3">
                            <dt className="text-xs text-muted-foreground truncate">{k}</dt>
                            <dd className="font-display font-bold tabular-nums shrink-0">{formatear(v)}</dd>
                        </div>
                    ))}
                </dl>
            )}

            {/* La interpretación viene del backend y declara qué NO prueba la cifra. */}
            {interpretacion && (
                <p className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span className="leading-relaxed">{String(interpretacion)}</span>
                </p>
            )}
        </motion.section>
    );
}

export default function MetricasIA() {
    const { data: resumen, isLoading, isError } = useQuery({
        queryKey: ["metricas-resumen"],
        queryFn: () => metricasApi.resumen(),
    });

    const exportar = async () => {
        reproducirClic();
        try {
            await metricasApi.exportarCsv();
            toast.success("Telemetría exportada");
        } catch {
            toast.error("No se pudo exportar la telemetría");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold">Métricas del sistema de IA</h1>
                    <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
                        Estas cifras no miden cuánto aprendió el alumno: miden si el sistema se
                        comporta como afirma. Son las que permiten responder con un dato cuando
                        alguien pregunta cómo sabes que las preguntas no se repiten o cuántas
                        veces el contexto recuperado fue malo.
                    </p>
                </div>
                <button
                    onClick={exportar}
                    className="inline-flex items-center justify-center gap-2 shrink-0 min-h-[44px] px-4 rounded-xl border border-border bg-card font-semibold text-sm hover:bg-muted/60 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Exportar telemetría (CSV)
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                    No se pudieron cargar las métricas. Comprueba que el backend esté levantado.
                </div>
            )}

            {resumen && (
                <div className="grid gap-4">
                    {BLOQUES.map((b) => (
                        <Bloque
                            key={b.clave}
                            titulo={b.titulo}
                            icono={b.icono}
                            explicacion={b.explicacion}
                            datos={resumen[b.clave]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
