import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, Lock, Swords } from "lucide-react";
import { AriaSvg } from "@/components/Aria";
import { Escenario, SombraDeAria } from "@/components/charla/Escenario";
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import { useEvalModeSelect } from "@/hooks/useEvalModeSelect";
import { VarianteAriaContext } from "@/lib/ariaAccesorios";
import { precargarMaterial } from "@/lib/cacheMateriales";
import { charlaApi, estiloDe, type ConceptoSemana } from "@/services/charla";
import { cn } from "@/lib/utils";
import EvalModeSelect from "./EvalModeSelect";

const ESTADOS: Record<ConceptoSemana["estado"], { texto: string; color: string }> = {
    SIN_EMPEZAR: { texto: "Sin empezar", color: "var(--j-plata)" },
    EN_CAMINO: { texto: "En camino", color: "var(--j-fuego)" },
    CASI: { texto: "Casi", color: "var(--j-oro)" },
    DOMINADO: { texto: "Dominado", color: "#22C55E" },
};

/** Entrada a la semana: la protagonista es la charla, sin menú de formatos ni prueba previa. */
export default function SemanaAria() {
    const { courseId, semanaId, semana, isLoading, esDemo, selectedFile, setSelectedFile } = useEvalModeSelect();
    const reducir = useReducedMotion();
    const [reto, setReto] = useState(false);
    const varianteAria = useContext(VarianteAriaContext);
    const usuario = JSON.parse(localStorage.getItem("user") || "{}");
    const esAlumno = usuario?.role?.toLowerCase() === "student";
    const materiales: any[] = (semana?.materiales ?? []).filter((m: any) => m.visible);
    const mongoId: string = materiales[0]?.mongoId || materiales[0]?.id || "";

    const { data: estado } = useQuery({
        queryKey: ["charla", "estado", semanaId],
        queryFn: () => charlaApi.estado(mongoId),
        enabled: esAlumno && !!mongoId && !esDemo,
    });

    // El recorrido guiado y la vista del docente siguen usando la pantalla anterior.
    if (esDemo || !esAlumno) return <EvalModeSelect />;
    if (isLoading) return <div className="py-24 text-center font-juego text-xl">Buscando a Aria</div>;

    const estilo = estiloDe(estado?.etapa, estado?.ciclo);
    const primaria = estilo === "PRIMARIA";
    const sobrio = estilo === "SOBRIO";
    const tarjeta = "pieza rounded-3xl bg-card p-5";
    const tituloTarjeta = "font-juego text-2xl font-extrabold";
    const titulo = semana?.nombreTema || semana?.numSem || "Esta semana";
    const destino = (extra = "") => `/app/curso/${courseId}/semana/${semanaId}/charla?mongoId=${encodeURIComponent(mongoId)}&e=${estilo}${extra}`;
    const primeraVez = (estado?.charlas ?? 0) === 0;
    const saludo = primaria
        ? primeraVez ? "¡Hola! ¿Jugamos a descubrir este tema?" : "¡Volviste! Sigamos un ratito."
        : sobrio
            ? primeraVez ? "A ver qué tan bien dominas esto." : "Vamos por más."
            : primeraVez ? "Veamos qué tanto sabes de esto." : "Volviste. Hoy subimos la dificultad.";

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <Link to={`/app/curso/${courseId}`} className="inline-flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Volver al curso
            </Link>

            {sobrio ? (
                <section className="relative overflow-hidden rounded-[2rem] border-[2.5px] border-[var(--j-tinta)] bg-[var(--j-indigo)] text-white grid md:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="p-8 md:p-11 relative z-10">
                        <p className="font-bold text-[#CFC5FF]">{titulo}</p>
                        <h1 className="font-juego text-4xl md:text-5xl font-extrabold leading-[1.1] mt-2 max-w-xl">{saludo}</h1>
                        {mongoId ? (
                            <div className="mt-7 flex flex-wrap items-center gap-5">
                                <Link to={destino(reto ? "&reto=1" : "")} className="boton-juego px-8 py-4 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego text-xl font-extrabold">Hablar con Aria</Link>
                                <label className="flex items-center gap-2.5 font-bold cursor-pointer">
                                    <input type="checkbox" checked={reto} onChange={(e) => setReto(e.target.checked)} className="w-5 h-5 accent-[#FFC83D]" /> Con tiempo
                                </label>
                            </div>
                        ) : <p className="mt-6 text-[#E4DEFF]">Tu profe todavía no subió el material de esta semana.</p>}
                    </div>
                    <div className="relative hidden md:flex items-end justify-center">
                        <span aria-hidden className="absolute -bottom-16 -right-8 w-[340px] h-[340px] rounded-full bg-[#7558F5]" />
                        <div className="relative w-[280px] h-[320px]"><SombraDeAria sobreRuedas /><AriaSvg estado="emocionado" className="w-full h-full" /></div>
                    </div>
                </section>
            ) : (
            <Escenario estilo={estilo as "PRIMARIA" | "JUVENIL"}>
                <div className="flex-1 grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 p-6 items-end">
                    <motion.div initial={reducir ? false : { y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("relative order-2 md:order-1 h-64", primaria ? "md:h-[480px]" : "md:h-[390px]")}>
                        <SombraDeAria sobreRuedas={varianteAria === "nocturna"} />
                        <AriaSvg estado="emocionado" className="w-full h-full" />
                    </motion.div>
                    <div className="order-1 md:order-2 space-y-5 pb-6 md:self-center">
                        <div className="pieza rounded-[28px] bg-white text-[#2B2140] px-6 py-5">
                            <p className="text-sm font-extrabold text-[var(--j-indigo)]">{titulo}</p>
                            <p className="font-juego text-3xl md:text-4xl font-extrabold leading-tight mt-1">{saludo}</p>
                        </div>
                        {mongoId ? (
                            <Link to={destino(reto ? "&reto=1" : "")} className="boton-juego flex items-center justify-center min-h-[76px] px-6 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego text-3xl font-extrabold">
                                Hablar con Aria
                            </Link>
                        ) : (
                            <p className="pieza rounded-3xl bg-card p-4 font-bold text-center">Tu profe todavía no subió el material de esta semana.</p>
                        )}
                        {!primaria && mongoId && (
                            <label className="pieza rounded-2xl bg-card px-4 py-3 flex items-center justify-between gap-3 font-bold cursor-pointer">
                                Activar reto con tiempo
                                <input type="checkbox" checked={reto} onChange={(e) => setReto(e.target.checked)} className="w-6 h-6 accent-[var(--j-indigo)]" />
                            </label>
                        )}
                    </div>
                </div>
            </Escenario>
            )}

            <div className="grid md:grid-cols-2 gap-5">
                <section className={tarjeta}>
                    <h2 className={tituloTarjeta}>{sobrio ? "Tu dominio" : "Lo que vas descubriendo"}</h2>
                    {(estado?.conceptos ?? []).length === 0 ? (
                        <p className="mt-2 text-muted-foreground">Después de tu primera charla, aquí verás tu avance.</p>
                    ) : (
                        <ul className="mt-3 space-y-3 p-0">
                            {estado!.conceptos.map((c) => (
                                <li key={c.concepto} className="list-none">
                                    <div className="flex items-center justify-between gap-2 font-bold">
                                        <span className="truncate">{c.concepto}</span>
                                        <span className="text-xs shrink-0 flex items-center gap-1">{c.estado === "DOMINADO" && <Check className="w-3.5 h-3.5" />}{ESTADOS[c.estado].texto}</span>
                                    </div>
                                    <div className={cn("rounded-full overflow-hidden mt-1", "h-3 bg-muted border-2 border-[var(--j-tinta)]")}>
                                        <div className="h-full" style={{ width: `${c.porcentaje}%`, background: ESTADOS[c.estado].color }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="space-y-5">
                    <section className="pieza rounded-3xl bg-[var(--j-indigo)] text-white p-5">
                        <h2 className={cn(tituloTarjeta, "flex items-center gap-2")}><Swords className="w-5 h-5" /> Desafío de la semana</h2>
                        <p className="mt-1 text-white/85">{primaria ? "Ayuda a Aria a resolver un problemita." : "Enséñale a Aria y defiende tu idea."}</p>
                        {estado?.desafioDisponible ? (
                            <Link to={destino("&desafio=1")} className={"boton-juego inline-flex mt-3 px-6 py-2.5 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego font-extrabold"}>Aceptar desafío</Link>
                        ) : (
                            <p className="mt-3 inline-flex items-center gap-2 font-bold text-white/85"><Lock className="w-4 h-4" /> Charla un poco más con Aria para abrirlo</p>
                        )}
                    </section>
                    {materiales.length > 0 && (
                        <section className={tarjeta}>
                            <h2 className={tituloTarjeta}>{sobrio ? "Material" : "El material de tu profe"}</h2>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {materiales.map((m, i) => {
                                    const id = m.mongoId || m.id;
                                    return (
                                        <button key={id || i} type="button" onMouseEnter={() => precargarMaterial(id, m.nombreArchivo)} onClick={() => setSelectedFile({ id, name: m.nombreArchivo })}
                                            className={cn("min-h-[44px] px-4 flex items-center gap-2 max-w-full", "boton-juego bg-card font-bold")}>
                                            <BookOpen className="w-4 h-4 shrink-0" /><span className="truncate">{(m.nombreArchivo || `Documento ${i + 1}`).replace(/\.(pdf|docx?|pptx?)$/i, "").replace(/[-_]/g, " ")}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <UniversalPreviewModal isOpen={!!selectedFile} onClose={() => setSelectedFile(null)} mongoId={selectedFile?.id || ""} fileName={selectedFile?.name || ""} />
        </div>
    );
}
