import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { AriaSvg } from "@/components/Aria";
import { gamificacionApi, type PerfilJugador as Perfil } from "@/services/gamificacion";
import type { VarianteAria } from "@/lib/ariaAccesorios";
import { cn } from "@/lib/utils";

/** Escenario de cada estilo de Aria, como en "Tu Aria" de la tienda. */
const FONDO: Record<VarianteAria, string> = {
    clasica: "#EDE9FE",
    nocturna: "#CCFBF1",
    perro: "#FFEDD5",
};

const COLECCION: { id: string; nombre: string; emoji: string }[] = [
    { id: "bufanda", nombre: "Bufanda", emoji: "🧣" },
    { id: "gorro", nombre: "Gorro de lana", emoji: "🧶" },
    { id: "audifonos", nombre: "Audífonos", emoji: "🎧" },
    { id: "corona", nombre: "Corona", emoji: "👑" },
    { id: "dorada", nombre: "Aria dorada", emoji: "✨" },
];

/** Cómo se ve su Aria según la racha. Nunca triste: el perfil lo ven otros. */
function fraseDeAnimo(p: Perfil): string {
    const quien = p.esTu ? "Tu Aria" : "Su Aria";
    const racha = p.racha ?? 0;
    if (p.aria?.animo === "orgullosa") return `${quien} está orgullosa: ${racha} días seguidos practicando juntos.`;
    if (p.aria?.animo === "feliz") return `${quien} está contenta: ${racha === 1 ? "hoy o ayer hubo práctica" : `${racha} días seguidos de práctica`}.`;
    return p.esTu ? "Tu Aria se quedó dormida. Una práctica la despierta." : "Su Aria está tomando una siesta.";
}

/**
 * Perfil de juego de un alumno, el propio ("yo") o el de un compañero de curso. Muestra cómo
 * cuida a su Aria, sus rachas y sus medallas de la liga. Nunca nombres ni notas.
 */
export default function PerfilJugador() {
    const { perfilId = "yo" } = useParams();
    const qc = useQueryClient();
    const { data: p, isLoading, isError } = useQuery({
        queryKey: ["gamificacion", "perfil", perfilId],
        queryFn: () => gamificacionApi.perfil(perfilId),
        retry: false,
    });
    const visibilidad = useMutation({
        mutationFn: (visible: boolean) => gamificacionApi.ajustarPerfil({ visible }),
        onSuccess: ({ visible }) => {
            toast.success(visible ? "Tus compañeros pueden ver tu perfil." : "Tu perfil ahora es privado.");
            qc.invalidateQueries({ queryKey: ["gamificacion", "perfil"] });
            qc.invalidateQueries({ queryKey: ["gamificacion", "resumen"] });
        },
        onError: () => toast.error("No se pudo guardar. Inténtalo de nuevo."),
    });

    const volver = (
        <Link to="/app" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
    );

    if (isLoading) return <div className="max-w-4xl mx-auto space-y-4">{volver}<div className="pieza rounded-3xl bg-card h-72 animate-pulse" /></div>;
    if (isError || !p) return (
        <div className="max-w-4xl mx-auto space-y-4">
            {volver}
            <div className="pieza rounded-3xl bg-card p-8 text-center">
                <p className="font-juego text-2xl font-extrabold">Este perfil no está en tu curso</p>
                <p className="text-muted-foreground mt-1">Solo puedes ver los perfiles de tus compañeros de clase.</p>
            </div>
        </div>
    );

    if (p.privado) return (
        <div className="max-w-4xl mx-auto space-y-4">
            {volver}
            <div className="pieza rounded-3xl bg-card p-8 text-center">
                <span className="mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-muted mb-3"><Lock className="w-8 h-8 text-muted-foreground" /></span>
                <p className="font-juego text-2xl font-extrabold">{p.apodo}</p>
                <p className="text-muted-foreground mt-1">Prefiere mantener su perfil en privado.</p>
            </div>
        </div>
    );

    const aria = p.aria!;
    const medallas = p.medallas ?? { oro: 0, plata: 0, bronce: 0 };
    const totalMedallas = medallas.oro + medallas.plata + medallas.bronce;
    const datos: { emoji: string; valor: number | string; texto: string; color: string }[] = [
        { emoji: "🔥", valor: p.racha ?? 0, texto: "días de racha", color: "var(--j-fuego)" },
        { emoji: "🏔️", valor: p.mejorRacha ?? 0, texto: "su mejor racha", color: "#F59E0B" },
        { emoji: "🧠", valor: p.conceptosDominados ?? 0, texto: "conceptos dominados", color: "#10B981" },
        { emoji: "📝", valor: p.practicas ?? 0, texto: "prácticas hechas", color: "var(--j-indigo)" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {volver}

            {/* Escenario: su Aria tal como la viste, con el ánimo que le da su racha */}
            <section className="pieza rounded-3xl overflow-hidden bg-[var(--j-indigo)] text-white">
                <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center">
                    <div className="relative flex justify-center pt-6 md:py-6">
                        {/* Los rayos giran (transform): van en su propia capa, centrada con márgenes y no con translate. */}
                        <div className="rayos absolute left-1/2 top-1/2 w-[520px] h-[520px] -ml-[260px] -mt-[260px] pointer-events-none" aria-hidden />
                        <div className="relative grid place-items-end justify-center w-56 h-64 rounded-[28px] border-[3px] border-[var(--j-tinta)]"
                             style={{ background: FONDO[aria.variante] ?? FONDO.clasica }}>
                            <AriaSvg estado={aria.animo} variante={aria.variante} accesorios={aria.equipado} className="w-52 h-60" />
                        </div>
                    </div>
                    <div className="p-6 md:pl-2 space-y-3">
                        <p className="text-sm font-semibold text-white/75">{p.esTu ? "Tu perfil" : "Perfil de tu compañero"}</p>
                        <h1 className="font-juego text-4xl font-extrabold leading-none">{p.apodo}</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="pieza rounded-xl bg-[var(--j-oro)] text-[var(--j-tinta)] px-3 py-1 font-juego font-extrabold">Nivel {p.nivel}</span>
                            <span className="pieza rounded-xl bg-white text-[var(--j-tinta)] px-3 py-1 font-semibold">{p.tituloEmoji} {p.titulo}</span>
                        </div>
                        <p className="text-white/90">{fraseDeAnimo(p)}</p>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {datos.map((d) => (
                    <div key={d.texto} className="pieza rounded-2xl bg-card p-4">
                        <span className="text-2xl" aria-hidden>{d.emoji}</span>
                        <p className="font-juego text-3xl font-extrabold tabular-nums leading-none mt-1" style={{ color: d.color }}>{d.valor}</p>
                        <p className="text-sm text-muted-foreground">{d.texto}</p>
                    </div>
                ))}
            </section>

            <div className="grid md:grid-cols-2 gap-4">
                <section className="pieza rounded-3xl bg-card p-5">
                    <h2 className="font-juego text-2xl font-extrabold">Medallas de la liga</h2>
                    {totalMedallas === 0 ? (
                        <p className="text-muted-foreground mt-2">{p.esTu ? "Aún no subes al podio. ¡Esta semana puede ser!" : "Todavía sin podios. Cada lunes la liga empieza de cero."}</p>
                    ) : (
                        <div className="flex gap-3 mt-3">
                            {([["🥇", medallas.oro, "1.º"], ["🥈", medallas.plata, "2.º"], ["🥉", medallas.bronce, "3.º"]] as const).map(([m, n, t]) => (
                                <div key={t} className={cn("flex-1 rounded-2xl border-2 border-[var(--j-tinta)] p-3 text-center", n === 0 && "opacity-40")}>
                                    <span className="text-3xl" aria-hidden>{m}</span>
                                    <p className="font-juego text-2xl font-extrabold tabular-nums">×{n}</p>
                                    <p className="text-xs text-muted-foreground">{t} puesto</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="pieza rounded-3xl bg-card p-5">
                    <div className="flex items-baseline justify-between">
                        <h2 className="font-juego text-2xl font-extrabold">Colección de Aria</h2>
                        <span className="font-juego font-extrabold tabular-nums text-muted-foreground">{aria.coleccion.length}/{aria.totalColeccion}</span>
                    </div>
                    <ul className="flex flex-wrap gap-2 mt-3">
                        {COLECCION.map((a) => {
                            const tiene = aria.coleccion.includes(a.id);
                            return (
                                <li key={a.id} className={cn("flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-sm font-semibold",
                                    tiene ? "border-[var(--j-tinta)] bg-[var(--j-oro)]/25" : "border-dashed border-muted-foreground/40 text-muted-foreground")}>
                                    <span aria-hidden className={cn(!tiene && "grayscale opacity-50")}>{a.emoji}</span>
                                    {a.nombre}
                                    {aria.equipado.includes(a.id) && <span className="text-[10px] font-bold uppercase text-[var(--j-indigo)]">puesto</span>}
                                </li>
                            );
                        })}
                    </ul>
                    {p.esTu && <Link to="/app/tienda" className="inline-block mt-3 text-sm font-semibold text-primary hover:underline">Ir a la tienda</Link>}
                </section>
            </div>

            {p.esTu && (
                <section className="pieza rounded-3xl bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="grid place-items-center w-12 h-12 rounded-2xl bg-muted shrink-0">
                        {p.visible ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                    </span>
                    <div className="flex-1">
                        <p className="font-juego text-xl font-extrabold">{p.visible ? "Tus compañeros de curso ven tu perfil" : "Tu perfil es privado"}</p>
                        <p className="text-sm text-muted-foreground">Solo ven tu apodo, tu Aria, tu nivel, tus rachas y tus medallas. Nunca tu nombre ni tus notas.</p>
                    </div>
                    <button
                        type="button"
                        disabled={visibilidad.isPending}
                        onClick={() => visibilidad.mutate(!p.visible)}
                        className="boton-juego h-11 px-4 bg-[var(--j-indigo)] text-white disabled:opacity-60"
                    >
                        {p.visible ? "Hacerlo privado" : "Mostrar a mi curso"}
                    </button>
                </section>
            )}
        </div>
    );
}
