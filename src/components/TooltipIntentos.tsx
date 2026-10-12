import { formatoPeru } from "@/lib/fechas";

const FORMATO_DIA = { day: "numeric", month: "short" } as const;
const MAX_FILAS = 10;

interface TooltipIntentosProps {
    /** Recharts los inyecta al usar este elemento como `content` del Tooltip. */
    active?: boolean;
    label?: string;
    /** Intentos ya filtrados por curso y alumno: son exactamente los que alimentan el gráfico. */
    intentos: any[];
    modo: "notas" | "actividad";
}

const hora = (fecha: string) => formatoPeru(fecha, { hour: "2-digit", minute: "2-digit" });

/**
 * Detalle de un punto del gráfico al pasar el mouse.
 *
 * En "notas" lista los intentos que forman el promedio de ese día, para que el docente vea
 * qué notas lo componen. En "actividad" lista qué alumnos hicieron intentos y la hora de su
 * último intento. Ojo: la actividad cuenta INTENTOS de evaluación, no inicios de sesión.
 */
export function TooltipIntentos({ active, label, intentos, modo }: TooltipIntentosProps) {
    if (!active || !label) return null;

    const delDia = intentos
        .filter((a) => formatoPeru(a.fecha, FORMATO_DIA) === label)
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    if (delDia.length === 0) return null;

    let filas: { clave: string; izquierda: string; derecha: string }[];
    let resumen: string;

    if (modo === "notas") {
        const notas = delDia.map((a) => Number(a.nota)).filter((n) => !Number.isNaN(n));
        const promedio = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : 0;
        resumen = `Promedio ${promedio.toFixed(1)} · ${notas.length} ${notas.length === 1 ? "nota" : "notas"}`;
        filas = delDia.map((a, i) => ({
            clave: `${a.alumno}-${a.fecha}-${i}`,
            izquierda: `${a.alumno}${a.curso ? ` · ${a.curso}` : ""}`,
            derecha: `${Number(a.nota)}/20`,
        }));
    } else {
        const porAlumno = new Map<string, { n: number; ultima: string }>();
        delDia.forEach((a) => {
            const actual = porAlumno.get(a.alumno) ?? { n: 0, ultima: a.fecha };
            actual.n += 1;
            if (String(a.fecha) > String(actual.ultima)) actual.ultima = a.fecha;
            porAlumno.set(a.alumno, actual);
        });
        resumen = `${porAlumno.size} ${porAlumno.size === 1 ? "alumno" : "alumnos"} · ${delDia.length} ${delDia.length === 1 ? "intento" : "intentos"}`;
        filas = Array.from(porAlumno, ([alumno, v]) => ({
            clave: alumno,
            izquierda: `${alumno} (${v.n})`,
            derecha: hora(v.ultima),
        }));
    }

    return (
        <div className="max-w-[300px] rounded-lg border border-border bg-card p-3 text-xs shadow-md">
            <p className="font-bold text-foreground">{label}</p>
            <p className="mb-2 text-muted-foreground">{resumen}</p>
            <ul className="space-y-1">
                {filas.slice(0, MAX_FILAS).map((f) => (
                    <li key={f.clave} className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-foreground">{f.izquierda}</span>
                        <span className="shrink-0 tabular-nums font-semibold text-muted-foreground">{f.derecha}</span>
                    </li>
                ))}
            </ul>
            {filas.length > MAX_FILAS && (
                <p className="mt-1 text-muted-foreground">y {filas.length - MAX_FILAS} más</p>
            )}
        </div>
    );
}
