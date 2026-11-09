import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { gamificacionApi, type FilaLiga } from "@/services/gamificacion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PODIO: Record<number, { medalla: string; color: string; alto: string }> = {
    1: { medalla: "🥇", color: "var(--j-oro)", alto: "h-24" },
    2: { medalla: "🥈", color: "var(--j-plata)", alto: "h-16" },
    3: { medalla: "🥉", color: "var(--j-bronce)", alto: "h-12" },
};

function diasRestantes(hastaIso: string) {
    const [a, m, d] = hastaIso.split("-").map(Number);
    const fin = new Date(a, m - 1, d);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fin.getTime() - hoy.getTime()) / 86_400_000);
}

/**
 * Liga de la semana del curso. Compite el ESFUERZO de esta semana (todos empiezan en cero el
 * lunes) y los compañeros solo ven apodos, nunca nombres.
 */
export default function LigaSemanal() {
    const [cursoId, setCursoId] = useState<number | undefined>();
    const [editando, setEditando] = useState(false);
    const qc = useQueryClient();

    const { data: liga, isError } = useQuery({
        queryKey: ["gamificacion", "liga", cursoId ?? null],
        queryFn: () => gamificacionApi.liga(cursoId),
        retry: false,
    });

    const { data: opciones, refetch: otrasOpciones } = useQuery({
        queryKey: ["gamificacion", "apodos"],
        queryFn: gamificacionApi.opcionesApodo,
        enabled: editando,
    });

    const cambiar = useMutation({
        mutationFn: gamificacionApi.cambiarApodo,
        onSuccess: ({ apodo }) => {
            toast.success(`Ahora eres ${apodo}`);
            setEditando(false);
            qc.invalidateQueries({ queryKey: ["gamificacion"] });
        },
        onError: () => toast.error("No se pudo cambiar el apodo."),
    });

    if (isError || !liga) return null;

    const yo = liga.filas.find((f) => f.esTu);
    const encima = yo ? liga.filas.find((f) => f.orden === yo.orden - 1) : undefined;
    const podio = liga.filas.filter((f) => f.orden < 3 && f.xp > 0);
    const resto = liga.filas.filter((f) => !podio.includes(f));
    const quedan = diasRestantes(liga.hasta);

    return (
        <section data-guide="liga-semanal" className="pieza rounded-3xl bg-card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 bg-[var(--j-indigo)] text-white">
                <div>
                    <h2 className="font-juego text-2xl font-extrabold leading-none">Liga de la semana</h2>
                    <p className="text-sm text-white/80 mt-1">
                        {quedan <= 0 ? "Termina hoy a medianoche" : quedan === 1 ? "Termina mañana" : `Termina en ${quedan} días`}
                        {" "}y empieza otra desde cero
                    </p>
                </div>
                {liga.cursos.length > 1 && (
                    <select
                        value={liga.cursoId}
                        onChange={(e) => setCursoId(Number(e.target.value))}
                        className="h-9 rounded-xl border-2 border-[var(--j-tinta)] bg-white text-[var(--j-tinta)] px-2 text-sm font-semibold"
                        aria-label="Curso de la liga"
                    >
                        {liga.cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                )}
            </header>

            {/* Podio: el único movimiento de la tarjeta, sube una vez al cargar. */}
            {podio.length > 0 && (
                <div className="flex items-end justify-center gap-2 sm:gap-3 px-4 pt-5 bg-[linear-gradient(180deg,hsl(var(--muted))_0%,transparent_100%)]">
                    {[2, 1, 3].map((p) => {
                        const f = podio.find((x) => x.posicion === p && x.orden < 3);
                        if (!f) return <div key={p} className="w-24 sm:w-28" />;
                        return <ColumnaPodio key={p} fila={f} />;
                    })}
                </div>
            )}

            <ol className="px-4 pb-2 pt-3 space-y-2">
                {resto.map((f, i) => {
                    const salto = i > 0 && f.orden - resto[i - 1].orden > 1 || (i === 0 && podio.length > 0 && f.orden > 3);
                    return (
                        <li key={f.orden}>
                            {salto && <div className="text-center text-muted-foreground leading-none pb-1" aria-hidden>⋮</div>}
                            <Link to={rutaPerfil(f)} title={`Ver el perfil de ${f.esTu ? "tu Aria" : f.apodo}`} className={cn(
                                "flex items-center gap-3 rounded-2xl px-3 py-2 transition-transform hover:-translate-y-0.5",
                                f.esTu ? "pieza bg-[var(--j-indigo)] text-white" : "bg-muted/60 hover:bg-muted",
                            )}>
                                <span className="font-juego font-extrabold text-lg w-7 text-center tabular-nums">{f.posicion}</span>
                                <span className="flex-1 truncate font-semibold">
                                    {f.apodo}{f.esTu && <span className="ml-1.5 text-white/80 font-normal">(tú)</span>}
                                </span>
                                <span className="font-juego font-extrabold tabular-nums">{f.xp} XP</span>
                            </Link>
                        </li>
                    );
                })}
            </ol>

            <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pb-4 pt-1 text-sm">
                <p className="text-muted-foreground">
                    {liga.miXp === 0
                        ? "Haz una práctica hoy para entrar a la tabla."
                        : liga.xpParaSubir
                            ? <>Te faltan <b className="text-foreground">{liga.xpParaSubir} XP</b> para pasar a {encima?.apodo ?? "quien está encima"}.</>
                            : <>Vas <b className="text-foreground">primero</b>. Defiende tu puesto hasta el domingo.</>}
                </p>
                <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                    <Pencil className="w-3.5 h-3.5" /> Cambiar apodo
                </button>
            </footer>

            <Dialog open={editando} onOpenChange={setEditando}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-juego text-2xl">Elige tu apodo</DialogTitle>
                        <DialogDescription>
                            Así te verán tus compañeros en la liga. Tu nombre real nunca se muestra.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2.5">
                        {opciones?.opciones.map((o) => (
                            <button
                                key={o}
                                type="button"
                                disabled={cambiar.isPending}
                                onClick={() => cambiar.mutate(o)}
                                className={cn(
                                    "boton-juego px-3 py-2.5 text-sm",
                                    o === yo?.apodo ? "bg-[var(--j-indigo)] text-white" : "bg-card text-foreground",
                                )}
                            >
                                {o}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => otrasOpciones()}
                        className="text-sm font-semibold text-primary hover:underline justify-self-center"
                    >
                        Ver otras opciones
                    </button>
                </DialogContent>
            </Dialog>
        </section>
    );
}

const rutaPerfil = (f: FilaLiga) => `/app/perfil/${f.esTu ? "yo" : f.perfilId}`;

function ColumnaPodio({ fila }: { fila: FilaLiga }) {
    const p = PODIO[fila.posicion];
    return (
        <Link to={rutaPerfil(fila)} title={`Ver el perfil de ${fila.apodo}`} className="w-24 sm:w-28 flex flex-col items-center text-center">
            <span className="text-3xl leading-none" aria-hidden>{p.medalla}</span>
            <span className={cn("text-xs font-bold mt-1 truncate max-w-full", fila.esTu && "text-primary")}>
                {fila.apodo}{fila.esTu && " (tú)"}
            </span>
            <span className="font-juego font-extrabold text-sm tabular-nums">{fila.xp} XP</span>
            <div
                className={cn("pieza podio-sube w-full mt-1.5 rounded-t-2xl border-b-0 grid place-items-start justify-center pt-1", p.alto)}
                style={{ background: p.color, animationDelay: `${(3 - fila.posicion) * 0.12}s` }}
            >
                <span className="font-juego font-extrabold text-2xl text-[var(--j-tinta)]">{fila.posicion}</span>
            </div>
        </Link>
    );
}
