import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AriaSvg } from "@/components/Aria";
import { gamificacionApi, type ArticuloTienda } from "@/services/gamificacion";
import { cn } from "@/lib/utils";
import { VarianteAriaContext, guardarVariante, type VarianteAria } from "@/lib/ariaAccesorios";
import { FondoTienda } from "@/components/tienda/FondoTienda";
import { estiloDe, type EstiloCharla } from "@/services/charla";

/** Los precios y reglas se aplican en el servidor (PoderesService); aquí solo se explican. */
const COMODINES = [
    { icono: "💡", nombre: "Dame una pista", precio: "10, 20 o 40", detalle: "Aria te orienta sin darte la respuesta y cada pista cuesta más. La pregunta vale la mitad.", todos: true },
    { icono: "🗣️", nombre: "Dilo de otra forma", precio: "15", detalle: "Aria te repite la pregunta con otras palabras. No baja tu puntaje.", todos: true },
    { icono: "✂️", nombre: "Déjame dos ideas", precio: "20", detalle: "Quita alternativas incorrectas. Solo en opción múltiple. La pregunta vale la mitad.", todos: false },
    { icono: "⏳", nombre: "Déjame pensar", precio: "10", detalle: "Suma 15 segundos cuando juegas con tiempo. No baja tu puntaje.", todos: false },
];

/** La rareza es vocabulario de videojuego: dice de un vistazo cuánto cuesta conseguir algo. */
const RAREZA: Record<string, { nombre: string; color: string }> = {
    bufanda: { nombre: "Común", color: "var(--j-comun)" },
    gorro: { nombre: "Común", color: "var(--j-comun)" },
    audifonos: { nombre: "Raro", color: "var(--j-raro)" },
    corona: { nombre: "Épico", color: "var(--j-epico)" },
    dorada: { nombre: "Legendario", color: "var(--j-legendario)" },
};

const RECOMPENSAS = [
    { icono: "📝", texto: "Terminar una práctica", premio: "+5" },
    { icono: "⭐", texto: "Sacar 14 o más", premio: "+3" },
    { icono: "🐱", texto: "Resolver con Aria sin pistas", premio: "+3" },
    { icono: "🔥", texto: "Llegar a 7, 30 y 100 días seguidos", premio: "+20 a +150" },
    { icono: "🏆", texto: "Terminar la semana en el podio", premio: "+20 a +50" },
];

/** La misma tienda habla y se ve según la edad: patio, azotea o escaparate sobrio. */
const TEMA: Record<EstiloCharla, {
    titulo: string; texto: string; tinta: string; suave: string; pedestal: string;
    azulejo: string; barra: string; tu: string; accesorios: string; cabeceraSobria: boolean;
}> = {
    PRIMARIA: {
        titulo: "La tienda de Aria", texto: "Viste a Aria con las monedas que ganaste. Aquí no cambia tu nota.",
        tinta: "text-[#2B2140]", suave: "text-[#2B2140]/85", pedestal: "bg-[#62C24A]",
        azulejo: "bg-[#E3F6FF] dark:bg-muted/70", barra: "", tu: "🐱 Tu Aria", accesorios: "🎒 Accesorios", cabeceraSobria: false,
    },
    JUVENIL: {
        titulo: "Tienda de Aria", texto: "Personaliza a tu Aria con lo que ganaste. Nada de aquí cambia tu nota ni tu liga.",
        tinta: "text-[#2B2140]", suave: "text-[#2B2140]/85", pedestal: "bg-[#C9B8E8]",
        azulejo: "bg-[#FFF0E3] dark:bg-muted/70", barra: "border-l-[6px] border-[#FF7A2F] pl-3", tu: "Tu Aria", accesorios: "Accesorios", cabeceraSobria: false,
    },
    SOBRIO: {
        titulo: "Tienda", texto: "Personaliza tu perfil con lo que ganaste. No afecta tu nota ni tu liga.",
        tinta: "text-white", suave: "text-white/85", pedestal: "bg-[var(--j-indigo-hondo)]",
        azulejo: "bg-muted/70", barra: "", tu: "Tu Aria", accesorios: "Accesorios", cabeceraSobria: true,
    },
};

function mensajeDeError(err: unknown, porDefecto: string) {
    const texto = err instanceof Error ? err.message : "";
    try { return JSON.parse(texto).error ?? porDefecto; } catch { return texto || porDefecto; }
}

/**
 * Tienda del alumno: vestir a Aria y proteger la racha. Nada de lo que se vende da nota ni XP
 * (ver TiendaService en el backend).
 */
export default function Tienda() {
    const { data: jugador } = useQuery({ queryKey: ["gamificacion", "resumen"], queryFn: gamificacionApi.resumen });
    const qc = useQueryClient();
    const { data: tienda } = useQuery({ queryKey: ["gamificacion", "tienda"], queryFn: gamificacionApi.tienda });
    const { data: billetera } = useQuery({ queryKey: ["gamificacion", "billetera"], queryFn: gamificacionApi.billetera });
    const [probando, setProbando] = useState<string | null>(null);
    const variante = useContext(VarianteAriaContext);
    const estilo = estiloDe(jugador?.etapa ?? undefined, jugador?.ciclo);
    const tema = TEMA[estilo];

    const refrescar = () => qc.invalidateQueries({ queryKey: ["gamificacion"] });

    const comprar = useMutation({
        mutationFn: gamificacionApi.comprarAccesorio,
        onSuccess: (_, id) => {
            const a = tienda?.accesorios.find((x) => x.id === id);
            toast.success(`Compraste ${a?.nombre ?? "el accesorio"}. Ya puedes ponérselo a Aria.`);
            refrescar();
        },
        onError: (e) => toast.error(mensajeDeError(e, "No se pudo comprar.")),
    });

    const proteger = useMutation({
        mutationFn: gamificacionApi.comprarProtector,
        onSuccess: () => { toast.success("Racha protegida para mañana."); refrescar(); },
        onError: (e) => toast.error(mensajeDeError(e, "No se pudo comprar el protector.")),
    });

    const equipar = useMutation({
        mutationFn: gamificacionApi.equipar,
        onSuccess: refrescar,
        onError: (e) => toast.error(mensajeDeError(e, "No se pudo cambiar el accesorio.")),
    });

    if (!tienda || !billetera) return null;

    const puestos = tienda.accesorios.filter((a) => a.puesto).map((a) => a.id);
    // Vista previa: lo puesto, cambiando el accesorio que se está mirando en su misma ranura.
    const vistaPrevia = (() => {
        const a = tienda.accesorios.find((x) => x.id === probando);
        if (!a) return puestos;
        const mismaRanura = new Set(tienda.accesorios.filter((x) => x.ranura === a.ranura).map((x) => x.id));
        return [...puestos.filter((p) => !mismaRanura.has(p)), a.id];
    })();
    const enPrueba = tienda.accesorios.find((x) => x.id === probando);

    const alternar = (a: ArticuloTienda) => {
        const otros = puestos.filter((p) => tienda.accesorios.find((x) => x.id === p)?.ranura !== a.ranura);
        equipar.mutate(a.puesto ? puestos.filter((p) => p !== a.id) : [...otros, a.id]);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Escenario: Aria bajo el foco es lo primero que se ve, porque es lo que se viste. */}
            <section className={cn("pieza relative overflow-hidden rounded-3xl bg-[var(--j-indigo)]", tema.tinta)}>
                <FondoTienda estilo={estilo} />
                <div className="relative grid md:grid-cols-[1fr_1.1fr] items-center gap-2 px-6 pt-6 md:py-6">
                    <div className="flex flex-col items-center order-2 md:order-1">
                        <div className="w-36 h-48 md:w-48 md:h-64 drop-shadow-[0_6px_0_rgba(0,0,0,.25)]">
                            <AriaSvg estado={probando ? "emocionado" : "feliz"} className="w-full h-full" accesorios={vistaPrevia} />
                        </div>
                        {/* Pedestal */}
                        <div className={cn("-mt-3 w-44 md:w-56 h-5 rounded-[50%] border-[2.5px] border-[var(--j-tinta)]", tema.pedestal)} aria-hidden />
                        <p className={cn("text-sm mt-2 mb-4 md:mb-0 h-5", tema.suave)}>
                            {enPrueba ? `Probándose: ${enPrueba.nombre}` : ""}
                        </p>
                    </div>
                    <div className="order-1 md:order-2 text-center md:text-left">
                        <h1 className="font-juego text-4xl md:text-5xl font-extrabold leading-[0.95]">{tema.titulo}</h1>
                        <p className={cn("mt-2 max-w-sm mx-auto md:mx-0", tema.suave)}>{tema.texto}</p>
                        <div className="boton-juego inline-flex items-center gap-2 mt-4 px-4 h-12 bg-[var(--j-oro)] text-[var(--j-tinta)] text-2xl tabular-nums cursor-default">
                            <span aria-hidden>🪙</span>{tienda.saldo}
                            <span className="text-base font-bold">monedas</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Estilo de Aria: gratis, se cambia cuando el alumno quiera */}
            <section>
                <h2 className={cn("font-juego text-2xl font-extrabold mb-1", tema.barra)}>{tema.tu}</h2>
                <p className="text-sm text-muted-foreground mb-3">Elige cómo quieres que se vea tu compañera. No cuesta monedas.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {([
                        ["clasica", "Aria colorida", "Crema, alegre y con su birrete. Pensada para los primeros años de primaria."],
                        ["nocturna", "Aria juvenil", "Gata tuxedo con polerón, gorro, skate y mochila. Pensada desde 6.° de primaria."],
                        ["perro", "Aria perrito", "Cachorro con orejas caídas, gorro y pañoleta. Para quien prefiere perros."],
                    ] as [VarianteAria, string, string][]).map(([id, nombre, texto]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => {
                                guardarVariante(id);
                                gamificacionApi.ajustarPerfil({ variante: id })
                                    .then(() => qc.invalidateQueries({ queryKey: ["gamificacion", "resumen"] }))
                                    .catch(() => toast.error("No se pudo guardar tu Aria. Inténtalo de nuevo."));
                            }}
                            aria-pressed={variante === id}
                            className={cn("pieza rounded-2xl text-left flex items-center gap-4 p-3 transition-transform active:translate-y-[3px]",
                                variante === id ? "bg-[var(--j-indigo)] text-white ring-4 ring-[var(--j-oro)]" : "bg-card")}
                        >
                            <span className={cn("grid place-items-center w-20 h-24 shrink-0 rounded-xl border-[2.5px] border-[var(--j-tinta)]",
                                id === "nocturna" ? "bg-[#CCFBF1]" : id === "perro" ? "bg-[#FFEDD5]" : "bg-[#EDE9FE]")}>
                                <AriaSvg estado="feliz" variante={id} className="w-16 h-20" accesorios={[]} vida={false} />
                            </span>
                            <span className="min-w-0">
                                <span className="block font-juego text-xl font-extrabold leading-tight">{nombre}</span>
                                <span className={cn("block text-sm", variante === id ? "text-white/85" : "text-muted-foreground")}>{texto}</span>
                                {variante === id && <span className="inline-block mt-1 font-juego font-extrabold text-[var(--j-oro)]">La llevas puesta</span>}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Accesorios */}
            <section>
                <h2 className={cn("font-juego text-2xl font-extrabold mb-3", tema.barra)}>{tema.accesorios}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {tienda.accesorios.map((a) => {
                        const r = RAREZA[a.id] ?? RAREZA.bufanda;
                        const alcanza = tienda.saldo >= a.precio;
                        return (
                            <article
                                key={a.id}
                                onMouseEnter={() => setProbando(a.id)}
                                onMouseLeave={() => setProbando(null)}
                                onFocus={() => setProbando(a.id)}
                                onBlur={() => setProbando(null)}
                                className={cn("pieza rounded-2xl bg-card flex flex-col overflow-hidden", a.puesto && "ring-4 ring-[var(--j-oro)]")}
                            >
                                <div className="relative grid place-items-center pt-3 pb-1" style={tema.cabeceraSobria ? { background: "#EDE9FF", borderTop: `6px solid ${r.color}` } : { background: r.color }}>
                                    <span className="absolute top-2 left-2 rounded-full bg-[var(--j-tinta)]/80 text-white text-[11px] font-bold px-2 py-0.5">
                                        {r.nombre}
                                    </span>
                                    <AriaSvg estado="feliz" recorte="cara" className="w-20 h-20" accesorios={[a.id]} />
                                </div>
                                <div className="flex-1 flex flex-col gap-2 p-3 border-t-[2.5px] border-[var(--j-tinta)]">
                                    <div>
                                        <h3 className="font-juego text-lg font-extrabold leading-tight">{a.nombre}</h3>
                                        <p className="text-xs text-muted-foreground leading-snug">{a.descripcion}</p>
                                    </div>
                                    <div className="mt-auto">
                                        {a.comprado ? (
                                            <button
                                                type="button"
                                                disabled={equipar.isPending}
                                                onClick={() => alternar(a)}
                                                className={cn("boton-juego w-full h-10 flex items-center justify-center gap-1",
                                                    a.puesto ? "bg-[var(--j-oro)] text-[var(--j-tinta)]" : "bg-card text-foreground")}
                                            >
                                                {a.puesto ? <><Check className="w-4 h-4" strokeWidth={3} /> Lo lleva puesto</> : "Ponérselo"}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={!alcanza || comprar.isPending}
                                                onClick={() => comprar.mutate(a.id)}
                                                className="boton-juego w-full h-10 flex items-center justify-center gap-1 bg-[var(--j-indigo)] text-white tabular-nums"
                                                title={alcanza ? `Comprar por ${a.precio} monedas` : `Te faltan ${a.precio - tienda.saldo} monedas`}
                                            >
                                                {!alcanza && <Lock className="w-4 h-4" />}🪙 {a.precio}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2 items-start">
                {/* Protector de racha */}
                <section className="pieza rounded-3xl bg-[#DDF3FF] dark:bg-sky-950/50 p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <span className="pieza grid place-items-center w-14 h-14 shrink-0 rounded-2xl bg-[#7DD3FC] text-3xl" aria-hidden>🧊</span>
                        <div>
                            <h2 className="font-juego text-2xl font-extrabold leading-tight text-[var(--j-tinta)] dark:text-sky-100">Protector de racha</h2>
                            <p className="text-sm text-slate-700 dark:text-sky-200/80">
                                Si mañana no puedes practicar, tu racha de {"🔥"} no se corta.
                            </p>
                        </div>
                    </div>
                    {tienda.mananaProtegido ? (
                        <p className="flex items-center gap-1.5 font-juego font-extrabold text-lg text-sky-700 dark:text-sky-300">
                            <ShieldCheck className="w-5 h-5" /> Mañana ya está protegido
                        </p>
                    ) : (
                        <button
                            type="button"
                            disabled={tienda.saldo < tienda.precioProtector || proteger.isPending}
                            onClick={() => proteger.mutate()}
                            className="boton-juego h-11 bg-[#38BDF8] text-[var(--j-tinta)] text-lg"
                        >
                            Proteger mañana por 🪙 {tienda.precioProtector}
                        </button>
                    )}
                </section>

                {/* Cómo ganar */}
                <section className="pieza rounded-3xl bg-card p-5">
                    <h2 className="font-juego text-2xl font-extrabold leading-tight">Cómo ganar monedas</h2>
                    <ul className="mt-3 space-y-2">
                        {RECOMPENSAS.map((r) => (
                            <li key={r.texto} className="flex items-center gap-3">
                                <span className="w-8 text-center text-xl" aria-hidden>{r.icono}</span>
                                <span className="flex-1 text-sm">{r.texto}</span>
                                <span className="font-juego font-extrabold text-[var(--j-oro-hondo)] dark:text-[var(--j-oro)] tabular-nums">{r.premio}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4 rounded-2xl bg-muted/70 p-3">
                        Hoy te quedan <b className="text-foreground">{billetera.hoyCompletasRestantes}</b> prácticas con monedas completas
                        {billetera.hoyMediasRestantes > 0 && <> y <b className="text-foreground">{billetera.hoyMediasRestantes}</b> a mitad</>}.
                        Después sigues sumando XP, pero ya no monedas.
                    </p>
                </section>
            </div>

            <section className="pieza rounded-3xl bg-card p-5">
                <h2 className="font-juego text-2xl font-extrabold leading-tight mb-1">Comodines de Aria</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    No se compran por adelantado: los pagas mientras hablas con Aria.
                    Puedes usar hasta 3 por charla.
                </p>
                <ul className="grid sm:grid-cols-2 gap-3">
                    {COMODINES.filter((c) => c.todos || jugador?.etapa !== "PRIMARIA").map((c) => (
                        <li key={c.nombre} className={cn("rounded-2xl p-3", tema.azulejo)}>
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-juego font-extrabold text-base">{c.icono} {c.nombre}</span>
                                <span className="font-juego font-extrabold text-sm shrink-0">{c.precio} 🪙</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{c.detalle}</p>
                        </li>
                    ))}
                </ul>
            </section>

            {billetera.movimientos.length > 0 && (
                <section className="pieza rounded-3xl bg-card p-5">
                    <h2 className="font-juego text-2xl font-extrabold leading-tight mb-2">Tus últimos movimientos</h2>
                    <ul className="divide-y-2 divide-dashed divide-border">
                        {billetera.movimientos.map((m, i) => (
                            <li key={i} className="flex items-center justify-between py-2.5 gap-3 text-sm">
                                <span className="truncate">{m.motivo}</span>
                                <span className={cn("font-juego font-extrabold text-base tabular-nums shrink-0",
                                    m.cantidad > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                    {m.cantidad > 0 ? "+" : ""}{m.cantidad} 🪙
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
