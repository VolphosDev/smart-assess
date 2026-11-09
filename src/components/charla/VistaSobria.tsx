import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Mic, Send, Volume2, VolumeX } from "lucide-react";
import { AriaSvg, type ExpresionAria } from "@/components/Aria";
import { SombraDeAria } from "@/components/charla/Escenario";
import { PreguntaDeteccionErrores } from "@/components/practice/PreguntaDeteccionErrores";
import type { PreguntaCharla } from "@/services/charla";
import type { Poder } from "@/services/gamificacion";
import type { Question } from "@/types/Evaluation";
import { cn } from "@/lib/utils";

const bonito = (t: string) => (t === "VERDADERO" ? "Verdadero" : t === "FALSO" ? "Falso" : t.replace(/^\s*[A-Da-d][).]\s*/, ""));
const normal = (t: string) => t.replace(/^\s*[A-Da-d][).]\s*/, "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const COLORES = ["var(--j-indigo)", "var(--j-fuego)", "var(--j-oro)", "#14B8A6"];
const ICONOS: Record<Poder, string> = { PISTA: "💡", CONGELAR: "🗣️", MITAD: "✂️", TIEMPO: "⏳" };

export interface VistaSobriaProps {
    animo: ExpresionAria;
    volver: string;
    fase: string;
    total: number;
    indice: number;
    marcas: (boolean | null)[];
    reloj: number | null;
    voz: boolean;
    alternarVoz: () => void;
    frase: string;
    errorTexto: string;
    pregunta?: PreguntaCharla;
    opciones: string[];
    palabra: number;
    visibles: number;
    linea: string | null;
    fallidas: string[];
    ocultas: string[];
    elegida: string | null;
    texto: string;
    setTexto: (t: string) => void;
    resultado: any;
    bloqueado: boolean;
    correcta: string | null;
    ayudas: { id: Poder; nombre: string; precio: number }[];
    precioPista: number;
    restantes: number;
    usando: Poder | null;
    escuchando: boolean;
    resumen: { notaFinal: number; bono: number } | null;
    desafio: boolean;
    saltarLectura: () => void;
    enviar: (v: string) => void;
    enviarEscrito: () => void;
    usarAyuda: (p: Poder) => void;
    siguiente: () => void;
    dictar: () => void;
}

function combo(marcas: (boolean | null)[]): number {
    let n = 0;
    for (let i = marcas.length - 1; i >= 0; i--) {
        if (marcas[i] === true) n++;
        else if (marcas[i] === false) break;
    }
    return n;
}

/** 3.° a 5.° de secundaria: mismo lenguaje que el resto de la app, con ritmo de juego. */
export function VistaSobria(v: VistaSobriaProps) {
    const reducir = useReducedMotion();
    const p = v.pregunta;
    const escrita = p && (p.tipo_pregunta === "ABIERTA" || p.tipo_pregunta === "DETECCION_ERRORES");
    const palabras = (p?.enunciado ?? "").split(/\s+/);
    const racha = combo(v.marcas);
    const aciertos = v.marcas.filter(Boolean).length;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-[2rem] border-[2.5px] border-[var(--j-tinta)] bg-[var(--j-indigo)] min-h-[620px] alto:min-h-[calc(100vh-9rem)] flex flex-col">
                <span aria-hidden className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#6E51F4]" />
                <span aria-hidden className="absolute -bottom-40 -right-20 w-[520px] h-[520px] rounded-full bg-[#7558F5]" />

                <header className="relative z-10 flex items-center gap-3 p-4">
                    <Link to={v.volver} aria-label="Volver a la semana" className="boton-juego w-11 h-11 grid place-items-center bg-card shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
                    <div className="flex-1 flex gap-2" aria-label={`Pregunta ${v.indice + 1} de ${v.total}`}>
                        {Array.from({ length: v.total }, (_, i) => (
                            <span key={i} className="h-4 flex-1 rounded-full border-2 border-[var(--j-tinta)]" style={{ background: v.marcas[i] === true ? "#22C55E" : v.marcas[i] === false ? "#FB923C" : i === v.indice ? "var(--j-oro)" : "#fff" }} />
                        ))}
                    </div>
                    {racha >= 2 && <span className="boton-juego h-11 px-3 grid place-items-center bg-[var(--j-fuego)] text-white font-juego font-extrabold">🔥 x{racha}</span>}
                    {v.reloj !== null && v.fase !== "fin" && <span className={cn("boton-juego h-11 px-3 grid place-items-center font-juego font-extrabold tabular-nums", v.reloj <= 5 ? "bg-[var(--j-fuego)] text-white" : "bg-card")}>{v.reloj}s</span>}
                    <button type="button" onClick={v.alternarVoz} aria-label={v.voz ? "Silenciar a Aria" : "Activar la voz de Aria"} className="boton-juego w-11 h-11 grid place-items-center bg-card shrink-0">
                        {v.voz ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                </header>

                {v.fase === "cargando" || v.fase === "error" ? (
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
                        <div className="w-52 h-60"><AriaSvg estado={v.fase === "error" ? "triste" : "pensando"} className="w-full h-full" /></div>
                        <p className="font-juego text-2xl font-extrabold">{v.fase === "error" ? v.errorTexto : v.frase}</p>
                        {v.fase === "error" && <Link to={v.volver} className="boton-juego px-6 py-3 bg-card text-foreground font-juego font-extrabold">Volver</Link>}
                    </div>
                ) : v.fase === "fin" && v.resumen ? (
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                        <div className="w-52 h-60"><AriaSvg estado="celebrando" className="w-full h-full" /></div>
                        <div className="pieza rounded-3xl bg-card px-10 py-5">
                            <p className="font-juego text-lg font-bold text-muted-foreground">{v.desafio ? "Desafío completado" : "Sesión completada"}</p>
                            <p className="font-juego text-6xl font-extrabold text-[var(--j-indigo)] tabular-nums leading-none mt-1">{v.resumen.notaFinal.toFixed(1)}<span className="text-2xl text-muted-foreground"> / 20</span></p>
                            <p className="font-bold mt-2">{aciertos} de {v.total} correctas{v.resumen.bono > 0 ? ` · +${v.resumen.bono} 🪙` : ""}</p>
                        </div>
                        <Link to={v.volver} className="boton-juego px-8 py-3.5 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego text-lg font-extrabold">Ver mi avance</Link>
                    </div>
                ) : p ? (
                    <div className="relative z-10 flex-1 grid md:grid-cols-[minmax(0,1fr)_230px] alto:grid-cols-[minmax(0,1fr)_340px] gap-4 p-4 pt-1 alto:px-6 alto:pb-6">
                        <div className="flex flex-col justify-center gap-3 alto:gap-4 min-w-0">
                            <div onClick={v.fase === "leyendo" ? v.saltarLectura : undefined} className={cn("pieza rounded-3xl bg-card px-6 py-5 alto:px-8 alto:py-7", v.fase === "leyendo" && "cursor-pointer")}>
                                {p.repaso && <p className="text-xs font-extrabold text-[var(--j-fuego)] mb-1">Repaso</p>}
                                <h1 className="font-juego text-2xl md:text-[28px] alto:text-[36px] font-extrabold leading-tight">
                                    {p.tipo_pregunta === "DETECCION_ERRORES" ? "Este texto tiene errores. Corrígelos." : palabras.map((w, i) => (
                                        <span key={i} className={cn("transition-opacity duration-100", i > v.palabra && "opacity-35")}>{w} </span>
                                    ))}
                                </h1>
                                {v.linea && (
                                    <motion.p initial={reducir ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl bg-[#EDE9FF] text-[#3A23B5] px-3 py-2 font-bold">{v.linea}</motion.p>
                                )}
                            </div>

                            {v.opciones.length > 0 && (
                                <ul className="grid sm:grid-cols-2 gap-3 alto:gap-4 p-0 m-0">
                                    {v.opciones.map((o, i) => {
                                        if (i >= v.visibles && v.fase === "leyendo") return null;
                                        const fuera = v.fallidas.includes(o) || v.ocultas.includes(o);
                                        const esCorrecta = v.correcta !== null && normal(o) === v.correcta;
                                        const estado = v.resultado ? (esCorrecta ? "correcta" : v.elegida === o ? "incorrecta" : "apagada") : fuera ? "descartada" : v.elegida === o ? "elegida" : "libre";
                                        return (
                                            <motion.li key={o} className="list-none" initial={reducir ? false : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                                                <button type="button" data-estado={estado} disabled={v.bloqueado || fuera} onClick={() => v.enviar(o)} className="opcion-juego w-full h-full min-h-[76px] alto:min-h-[116px] flex items-center gap-3 alto:gap-4 px-4 alto:px-5 py-3 text-left font-bold text-lg alto:text-2xl">
                                                    <span className="ficha-letra shrink-0 alto:w-14 alto:h-14 alto:text-2xl" style={{ background: COLORES[i % 4], color: i % 4 === 2 ? "var(--j-tinta)" : "#fff" }}>{esCorrecta && v.resultado ? "✓" : String.fromCharCode(65 + i)}</span>
                                                    <span className="flex-1 leading-snug">{bonito(o)}</span>
                                                </button>
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            )}

                            {p.tipo_pregunta === "DETECCION_ERRORES" && (
                                <div className="pieza rounded-3xl bg-card p-4">
                                    <PreguntaDeteccionErrores pregunta={p as Question} index={v.indice} valor={v.texto} onChange={v.setTexto} disabled={v.bloqueado} resultado={v.resultado ? { evaluacion: v.resultado } : undefined} />
                                </div>
                            )}

                            {p.tipo_pregunta === "ABIERTA" && (
                                <textarea value={v.texto} onChange={(e) => v.setTexto(e.target.value)} disabled={v.bloqueado} rows={4} placeholder="Defiende tu respuesta" aria-label="Tu respuesta" className="pieza w-full rounded-3xl bg-card p-4 text-lg outline-none focus-visible:ring-4 focus-visible:ring-[var(--j-oro)] resize-none" />
                            )}

                            {escrita && !v.resultado && (
                                <div className="flex justify-end gap-2">
                                    {p.tipo_pregunta === "ABIERTA" && (
                                        <button type="button" onClick={v.dictar} disabled={v.bloqueado} aria-label="Dictar mi respuesta" className={cn("boton-juego w-12 h-12 grid place-items-center", v.escuchando ? "bg-[var(--j-fuego)] text-white" : "bg-card")}><Mic className="w-5 h-5" /></button>
                                    )}
                                    <button type="button" onClick={v.enviarEscrito} disabled={v.bloqueado} className="boton-juego h-12 px-6 flex items-center gap-2 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego font-extrabold"><Send className="w-4 h-4" /> Responder</button>
                                </div>
                            )}

                            {v.fase === "resultado" && v.resultado && (
                                <motion.div initial={reducir ? false : { y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("pieza rounded-3xl p-4", v.resultado.esCorrecta ? "bg-[#DCFCE7] text-[#14532D]" : "bg-[#FFF1E6] text-[#7C2D12]")}>
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-juego text-2xl font-extrabold">{v.resultado.esCorrecta ? (v.resultado.primer_intento === false ? "Lo sacaste" : "¡Bien ahí!") : "No era esa"}</p>
                                        {v.resultado.esCorrecta && <span className="font-juego text-xl font-extrabold tabular-nums">+{Number(v.resultado.puntaje ?? 0).toFixed(1)}</span>}
                                    </div>
                                    <p className="mt-1 leading-snug alto:text-xl">{v.resultado.explicacion}</p>
                                    <div className="flex justify-end mt-3">
                                        <button type="button" onClick={v.siguiente} className="boton-juego h-12 px-7 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego text-lg font-extrabold">{v.indice + 1 < v.total ? "Siguiente" : "Terminar"}</button>
                                    </div>
                                </motion.div>
                            )}

                            {v.fase === "respondiendo" && !v.resultado && v.ayudas.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {v.ayudas.map((a) => (
                                        <button key={a.id} type="button" disabled={v.restantes <= 0 || !!v.usando} onClick={() => v.usarAyuda(a.id)} className="boton-juego h-10 px-3 bg-card text-sm font-bold flex items-center gap-1.5">
                                            <span aria-hidden>{ICONOS[a.id]}</span>{v.usando === a.id ? "Un momento" : a.nombre}
                                            <span className="tabular-nums text-muted-foreground">{a.id === "PISTA" ? v.precioPista : a.precio} 🪙</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <motion.div key={v.indice} initial={reducir ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative hidden md:block self-end h-[300px] alto:h-[440px]">
                            <SombraDeAria sobreRuedas />
                            <AriaSvg estado={v.animo} className="w-full h-full" />
                        </motion.div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
