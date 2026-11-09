import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { gamificacionApi } from "@/services/gamificacion";
import CelebracionNivel from "./CelebracionNivel";

/** Escudo del nivel: la forma de insignia lo distingue de un simple número. */
export function EscudoNivel({ nivel, className = "w-9 h-10" }: { nivel: number; className?: string }) {
    return (
        <span className={`relative grid place-items-center shrink-0 ${className}`}>
            <svg viewBox="0 0 36 40" className="absolute inset-0 w-full h-full" aria-hidden>
                <path d="M18 2 L33 7 V19 C33 29 26 35 18 38 C10 35 3 29 3 19 V7 Z"
                      fill="var(--j-indigo)" stroke="var(--j-tinta)" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M18 6 L29 9.6 V18" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="relative font-juego font-extrabold text-white leading-none text-base -mt-0.5">{nivel}</span>
        </span>
    );
}

/**
 * Nivel, barra de XP, monedas y racha, siempre a la vista en la cabecera del alumno.
 * El nivel es de ACTIVIDAD: no cambia la dificultad de las preguntas (ver GamificacionService).
 */
export default function BarraJugador() {
    const { data: r } = useQuery({
        queryKey: ["gamificacion", "resumen"],
        queryFn: gamificacionApi.resumen,
        staleTime: 30_000,
    });
    if (!r) return null;

    const avance = r.xpDelNivel > 0 ? Math.min(100, (r.xpEnNivel / r.xpDelNivel) * 100) : 100;
    const faltan = r.xpDelNivel - r.xpEnNivel;

    return (
        <>
            <div data-guide="barra-jugador" className="flex items-center gap-1.5 sm:gap-2.5">
                <Link to="/app/perfil/yo" className="flex items-center gap-2" title={`Nivel ${r.nivel}: te faltan ${faltan} XP para el ${r.nivel + 1}. Abrir tu perfil`}>
                    <EscudoNivel nivel={r.nivel} />
                    <div className="hidden md:block w-24">
                        <div className="barra-xp h-3"><span style={{ width: `${avance}%` }} /></div>
                        <p className="font-juego text-[11px] font-bold text-muted-foreground leading-none mt-1 tabular-nums">
                            {r.xpEnNivel} / {r.xpDelNivel} XP
                        </p>
                    </div>
                </Link>
                <Link
                    to="/app/tienda"
                    className="boton-juego flex items-center gap-1 h-9 px-2.5 bg-[var(--j-oro)] text-[var(--j-tinta)] text-base tabular-nums"
                    title="Tus monedas: abrir la tienda"
                >
                    <span aria-hidden>🪙</span>{r.monedas}
                    <span className="sr-only"> monedas, abrir la tienda</span>
                </Link>
                <span
                    className="pieza hidden sm:flex items-center gap-1 h-9 px-2.5 rounded-[14px] bg-[var(--j-fuego)] text-white font-juego font-extrabold text-base tabular-nums"
                    title={`${r.racha} días seguidos practicando`}
                >
                    <span aria-hidden>🔥</span>{r.racha}
                    <span className="sr-only"> días seguidos</span>
                </span>
            </div>
            <CelebracionNivel nivel={r.nivel} titulo={r.titulo} />
        </>
    );
}
