import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { gamificacionApi } from "@/services/gamificacion";
import { MonstruoJefe } from "./MonstruoJefe";

function diasRestantes(hastaIso: string) {
    const [a, m, d] = hastaIso.split("-").map(Number);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((new Date(a, m - 1, d).getTime() - hoy.getTime()) / 86_400_000);
}

/**
 * Jefe de la semana: batalla cooperativa del salón. Cada respuesta correcta de cualquier
 * compañero le quita vida. El único momento animado es la barra de vida bajando al cargar.
 */
export default function JefeSemanal() {
    const reducir = useReducedMotion();
    const { data: j, isError } = useQuery({
        queryKey: ["gamificacion", "jefe"],
        queryFn: () => gamificacionApi.jefe(),
        retry: false,
    });
    if (isError || !j) return null;

    const vida = Math.max(0, j.vidaMaxima - j.danio);
    const fraccion = j.vidaMaxima > 0 ? vida / j.vidaMaxima : 0;
    const quedan = diasRestantes(j.hasta);
    const cierre = quedan <= 0 ? "hoy a medianoche" : quedan === 1 ? "mañana" : `en ${quedan} días`;

    return (
        <section data-guide="jefe-semanal" className="pieza rounded-3xl overflow-hidden text-white"
                 style={{ background: "radial-gradient(circle at 70% 30%, #4C2FD0 0%, #24135F 60%, #170C40 100%)" }}>
            <div className="grid sm:grid-cols-[1fr_auto] items-center gap-4 p-5 sm:p-6">
                <div className="min-w-0 order-2 sm:order-1">
                    <p className="text-sm text-white/70">Jefe de la semana en {j.curso}</p>
                    <h2 className="font-juego text-3xl sm:text-4xl font-extrabold leading-none mt-1">{j.nombre}</h2>
                    <p className="text-white/80 mt-1">{j.lema}</p>

                    <div className="mt-4">
                        <div className="flex items-baseline justify-between text-sm mb-1">
                            <span className="font-juego font-extrabold text-lg">
                                {j.derrotado ? "¡Derrotado!" : `Vida ${vida} / ${j.vidaMaxima}`}
                            </span>
                            <span className="text-white/70">{j.derrotado ? "Ganaron esta semana" : `Huye ${cierre}`}</span>
                        </div>
                        <div className="h-5 rounded-full border-[2.5px] border-[var(--j-tinta)] bg-[#0E0828] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(180deg,#FB7185 0%,#E11D48 60%,#9F1239 100%)", boxShadow: "inset 0 2px 0 rgba(255,255,255,.35)" }}
                                initial={reducir ? false : { width: "100%" }}
                                animate={{ width: `${fraccion * 100}%` }}
                                transition={{ duration: 1.4, ease: [0.3, 0.9, 0.3, 1], delay: 0.3 }}
                            />
                        </div>
                    </div>

                    <p className="text-sm text-white/85 mt-3 max-w-xl">
                        {j.derrotado
                            ? <>Tu salón lo venció con {j.danio} respuestas correctas. {j.miAporte > 0
                                ? <>Diste <b className="text-[var(--j-oro)]">{j.miAporte} golpes</b> y ganaste el cofre de <b className="text-[var(--j-oro)]">{j.cofre} 🪙</b>.</>
                                : "Esta vez no aportaste golpes: el cofre es para quienes ayudaron."}</>
                            : <>Cada respuesta correcta en las prácticas es un golpe. {j.colaboradores} de {j.alumnos} compañeros ya lo atacaron
                                {j.miAporte > 0 ? <> y tú le diste <b className="text-[var(--j-oro)]">{j.miAporte} golpes</b></> : ""}.
                                Si lo derrotan, quienes ayudaron ganan <b className="text-[var(--j-oro)]">{j.cofre} 🪙</b>.</>}
                    </p>
                </div>

                <motion.div
                    className="order-1 sm:order-2 w-36 h-40 sm:w-44 sm:h-48 mx-auto"
                    initial={reducir || j.derrotado ? false : { rotate: 0 }}
                    animate={reducir || j.derrotado ? undefined : { rotate: [0, -6, 6, -4, 4, 0] }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <MonstruoJefe tipo={j.jefe} derrotado={j.derrotado} className="w-full h-full drop-shadow-[0_6px_0_rgba(0,0,0,.3)]" />
                </motion.div>
            </div>
        </section>
    );
}
