import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Mic, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { AriaSvg, type ExpresionAria } from "@/components/Aria";
import { Escenario, SombraDeAria } from "@/components/charla/Escenario";
import { VistaSobria } from "@/components/charla/VistaSobria";
import { PreguntaDeteccionErrores } from "@/components/practice/PreguntaDeteccionErrores";
import { segundosPara } from "@/hooks/useContrarreloj";
import { refrescarProgreso } from "@/lib/refrescarProgreso";
import { reproducirAcierto, reproducirError, reproducirLogro, reproducirMiau, reproducirRonroneo } from "@/lib/sonidos";
import { VarianteAriaContext } from "@/lib/ariaAccesorios";
import { callarAria, guardarVozActivada, hablarComoAria, vozActivada } from "@/lib/vozAria";
import { rondasApi } from "@/services/courses";
import { charlaApi, estiloDe, type Charla, type EstiloCharla, type PreguntaCharla } from "@/services/charla";
import { gamificacionApi, type Poder } from "@/services/gamificacion";
import { esIaNoDisponible } from "@/services/http/config";
import type { Question } from "@/types/Evaluation";
import { cn } from "@/lib/utils";

type Fase = "cargando" | "error" | "leyendo" | "respondiendo" | "evaluando" | "resultado" | "fin";

const FRASES_ESPERA = ["Estoy leyendo el material de tu profe", "Afilando mis preguntas", "Buscando algo que te rete", "Ya casi, no te vayas"];

const AYUDAS: { id: Poder; icono: string; nombre: string; precio: number; primaria: boolean }[] = [
    { id: "PISTA", icono: "💡", nombre: "Dame una pista", precio: 10, primaria: true },
    { id: "CONGELAR", icono: "🗣️", nombre: "Dilo de otra forma", precio: 15, primaria: true },
    { id: "MITAD", icono: "✂️", nombre: "Déjame dos ideas", precio: 20, primaria: false },
    { id: "TIEMPO", icono: "⏳", nombre: "Déjame pensar", precio: 10, primaria: false },
];

const GESTO: Record<Poder, ExpresionAria> = { PISTA: "idea", CONGELAR: "sopla", MITAD: "zarpa", TIEMPO: "invoca" };
const FICHAS_PRIMARIA = ["★", "♥", "●", "▲"];
const COLORES = ["var(--j-indigo)", "var(--j-fuego)", "var(--j-oro)", "#14B8A6"];

function opcionesDe(p?: PreguntaCharla): string[] {
    if (!p) return [];
    if (p.tipo_pregunta === "VERDADERO_FALSO") return ["VERDADERO", "FALSO"];
    if (p.tipo_pregunta === "ABIERTA" || p.tipo_pregunta === "DETECCION_ERRORES") return [];
    return Array.isArray(p.opciones_o_respuesta) ? p.opciones_o_respuesta : (p.opciones_o_respuesta ?? "").split(" | ").filter(Boolean);
}

const sinLetra = (t: string) => t.replace(/^\s*[A-Da-d][).]\s*/, "");
const normal = (t: string) => sinLetra(t).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const bonito = (t: string) => (t === "VERDADERO" ? "Verdadero" : t === "FALSO" ? "Falso" : sinLetra(t));

function mensajeDe(e: unknown, porDefecto: string): string {
    const texto = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "";
    try { return JSON.parse(texto).error ?? porDefecto; } catch { return texto || porDefecto; }
}

export default function CharlaAria() {
    const { courseId = "", semanaId = "" } = useParams();
    const [params] = useSearchParams();
    const mongoId = params.get("mongoId") ?? "";
    const desafio = params.get("desafio") === "1";
    const reto = params.get("reto") === "1";
    const qc = useQueryClient();
    const reducir = useReducedMotion();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const clave = `semantika.charla.${user.id}.${semanaId}.${desafio ? "desafio" : "normal"}`;

    const [charla, setCharla] = useState<Charla | null>(null);
    const [indice, setIndice] = useState(0);
    const [fase, setFase] = useState<Fase>("cargando");
    const [animo, setAnimo] = useState<ExpresionAria>("pensando");
    const [linea, setLinea] = useState<string | null>(null);
    const [palabra, setPalabra] = useState(-1);
    const [visibles, setVisibles] = useState(0);
    const [fallidas, setFallidas] = useState<string[]>([]);
    const [ocultas, setOcultas] = useState<string[]>([]);
    const [elegida, setElegida] = useState<string | null>(null);
    const [texto, setTexto] = useState("");
    const [resultado, setResultado] = useState<any>(null);
    const [marcas, setMarcas] = useState<(boolean | null)[]>([]);
    const [restantes, setRestantes] = useState(3);
    const [precioPista, setPrecioPista] = useState(10);
    const [usando, setUsando] = useState<Poder | null>(null);
    const [voz, setVoz] = useState(vozActivada());
    const [reloj, setReloj] = useState<number | null>(null);
    const [resumen, setResumen] = useState<{ notaFinal: number; bono: number } | null>(null);
    const [espera, setEspera] = useState(0);
    const [errorTexto, setErrorTexto] = useState("");
    const [escuchando, setEscuchando] = useState(false);
    const [fiesta, setFiesta] = useState(0);
    const varianteAria = useContext(VarianteAriaContext);
    const iniciado = useRef(false);
    const turnoVoz = useRef(0);

    const estilo: EstiloCharla = charla ? estiloDe(charla.etapa, charla.ciclo) : ((params.get("e") as EstiloCharla | null) ?? "SOBRIO");
    const primaria = estilo === "PRIMARIA";
    const pregunta = charla?.preguntas[indice];
    const opciones = useMemo(() => opcionesDe(pregunta), [pregunta]);
    const conReloj = reto && !primaria && !desafio;

    useEffect(() => {
        if (fase !== "cargando") return;
        const id = setInterval(() => setEspera((n) => (n + 1) % FRASES_ESPERA.length), 2600);
        return () => clearInterval(id);
    }, [fase]);

    useEffect(() => {
        if (iniciado.current) return;
        iniciado.current = true;
        const guardada = (() => { try { return JSON.parse(localStorage.getItem(clave) || "null"); } catch { return null; } })();
        if (guardada?.charla) {
            setCharla(guardada.charla);
            setIndice(guardada.indice ?? 0);
            setMarcas(guardada.marcas ?? []);
            setFase("leyendo");
            return;
        }
        if (!mongoId) {
            setErrorTexto("Esta semana todavía no tiene material.");
            setFase("error");
            return;
        }
        charlaApi.iniciar(mongoId, desafio)
            .then((c) => { setCharla(c); setFase("leyendo"); })
            .catch((e) => {
                setErrorTexto(esIaNoDisponible(e) ? "Me quedé dormida un momento. Inténtalo en unos minutos." : mensajeDe(e, "No pude preparar la charla."));
                setAnimo("triste");
                setFase("error");
            });
    }, [clave, mongoId, desafio]);

    useEffect(() => {
        if (charla && fase !== "fin") localStorage.setItem(clave, JSON.stringify({ charla, indice, marcas }));
    }, [charla, indice, marcas, fase, clave]);

    useEffect(() => {
        if (!charla) return;
        gamificacionApi.precioPoder(charla.ronda_id, "PISTA").then((r) => setPrecioPista(r.precio)).catch(() => {});
    }, [charla]);

    useEffect(() => () => callarAria(), []);

    const decir = useCallback((guion: string, eventos: { alPalabra?: (i: number) => void; alTerminar?: () => void } = {}) => {
        const turno = ++turnoVoz.current;
        // Hay voces que no avisan por dónde van, y navegadores que nunca avisan que terminaron:
        // sin este avance estimado, las opciones no aparecerían y la charla se quedaría trabada.
        const duracion = Math.max(1200, guion.split(/\s+/).length * 400);
        const inicio = performance.now();
        let avisaPalabras = false;
        let terminada = false;
        let reserva = 0;
        const estimador = window.setInterval(() => {
            if (turno !== turnoVoz.current) { window.clearInterval(estimador); return; }
            if (avisaPalabras) return;
            const avance = (performance.now() - inicio) / duracion;
            if (avance < 1) eventos.alPalabra?.(Math.floor(avance * guion.length));
        }, 120);
        const fin = () => {
            if (terminada) return;
            terminada = true;
            window.clearInterval(estimador);
            window.clearTimeout(reserva);
            if (turno === turnoVoz.current) eventos.alTerminar?.();
        };
        reserva = window.setTimeout(fin, duracion * 1.8 + 3000);
        if (!vozActivada() || !hablarComoAria(guion, {
            alTerminar: fin,
            alPalabra: (i) => {
                avisaPalabras = true;
                if (turno === turnoVoz.current) eventos.alPalabra?.(i);
            },
        })) fin();
    }, []);

    // Aria lee la pregunta y va nombrando cada opción. El reloj arranca cuando termina.
    useEffect(() => {
        if (fase !== "leyendo" || !pregunta) return;
        setAnimo("hablando");
        setLinea(null);
        setPalabra(-1);
        setVisibles(0);
        setFallidas([]);
        setOcultas([]);
        setElegida(null);
        setTexto("");
        setResultado(null);
        const previa = pregunta.repaso ? "Esto lo vimos antes. " : "";
        let guion = previa + pregunta.enunciado;
        const inicios: number[] = [];
        opciones.forEach((o) => {
            guion += ". ";
            inicios.push(guion.length);
            guion += bonito(o);
        });
        const terminar = () => {
            setVisibles(opciones.length);
            setPalabra(Number.MAX_SAFE_INTEGER);
            setAnimo("esperando");
            setFase("respondiendo");
            if (conReloj) setReloj(segundosPara(pregunta as Question, pregunta.tipo_pregunta, pregunta.nivel_bloom));
        };
        decir(guion, {
            alPalabra: (i) => {
                const enEnunciado = Math.max(0, i - previa.length);
                setPalabra(pregunta.enunciado.slice(0, enEnunciado).split(/\s+/).length - 1);
                setVisibles(inicios.filter((c) => c <= i).length);
            },
            alTerminar: terminar,
        });
    }, [fase, indice, pregunta, opciones, decir, conReloj]);

    useEffect(() => {
        if (fase !== "respondiendo" || reloj === null || reloj <= 0) return;
        const id = setTimeout(() => setReloj((r) => (r === null ? r : r - 1)), 1000);
        return () => clearTimeout(id);
    }, [fase, reloj]);

    const saltarLectura = () => {
        callarAria();
        turnoVoz.current++;
        setVisibles(opciones.length);
        setPalabra(Number.MAX_SAFE_INTEGER);
        setAnimo("esperando");
        setFase("respondiendo");
        if (conReloj && pregunta) setReloj(segundosPara(pregunta as Question, pregunta.tipo_pregunta, pregunta.nivel_bloom));
    };

    const enviar = async (valor: string) => {
        if (!charla || !pregunta || fase === "evaluando") return;
        callarAria();
        turnoVoz.current++;
        setElegida(valor);
        setAnimo("pensando");
        setFase("evaluando");
        try {
            const r = await rondasApi.responder(charla.ronda_id, indice, valor);
            if (r?.evaluacion?.fallo) {
                toast.error("No pude revisar tu respuesta. Inténtalo otra vez.");
                setAnimo("esperando");
                setFase("respondiendo");
                return;
            }
            if (r?.continua) {
                setFallidas((f) => [...f, valor]);
                setElegida(null);
                setLinea(r.repregunta);
                setAnimo("confundido");
                if (primaria) reproducirMiau();
                setFase("respondiendo");
                decir(r.repregunta, { alTerminar: () => setAnimo("esperando") });
                return;
            }
            const preguntas = charla.preguntas.map((q, i) => (i === indice ? { ...q, ...r.revelado } : q));
            setCharla({ ...charla, preguntas });
            setResultado(r.evaluacion);
            const bien = !!r.evaluacion?.esCorrecta;
            setMarcas((m) => { const c = [...m]; c[indice] = bien; return c; });
            setAnimo(bien ? "celebrando" : "confundido");
            if (bien) {
                reproducirAcierto();
                if (primaria) { reproducirRonroneo(); setFiesta((n) => n + 1); }
            } else reproducirError();
            setFase("resultado");
            decir(r.evaluacion?.explicacion ?? "");
        } catch (e) {
            toast.error(mensajeDe(e, "No pude revisar tu respuesta."));
            setAnimo("esperando");
            setFase("respondiendo");
        }
    };

    const enviarEscrito = () => {
        if (!pregunta) return;
        if (pregunta.tipo_pregunta === "DETECCION_ERRORES") {
            const escritas: Record<string, string> = (() => { try { return texto ? JSON.parse(texto) : {}; } catch { return {}; } })();
            const errores = Array.isArray(pregunta.opciones_o_respuesta) ? pregunta.opciones_o_respuesta : [];
            const completa: Record<string, string> = {};
            errores.forEach((e) => { completa[e] = (escritas[e] || "").trim() || e; });
            enviar(JSON.stringify(completa));
            return;
        }
        if (!texto.trim()) { toast.warning("Cuéntame tu respuesta primero."); return; }
        enviar(texto.trim());
    };

    const usarAyuda = async (poder: Poder) => {
        if (!charla || usando || fase !== "respondiendo") return;
        setUsando(poder);
        setAnimo(GESTO[poder]);
        try {
            const r = await rondasApi.comodin(charla.ronda_id, indice, poder);
            setRestantes(r.restantes);
            qc.invalidateQueries({ queryKey: ["gamificacion", "resumen"] });
            if (poder === "MITAD") setOcultas(r.ocultas ?? []);
            if (poder === "TIEMPO") setReloj((s) => (s === null ? s : s + 15));
            const frase = poder === "PISTA" ? r.pista : poder === "CONGELAR" ? r.reformulacion : poder === "TIEMPO" ? "Tranqui, tómate tu tiempo." : "Te quité las que no van.";
            if (frase) { setLinea(frase); decir(frase); }
            if (poder === "PISTA") gamificacionApi.precioPoder(charla.ronda_id, "PISTA").then((p) => setPrecioPista(p.precio)).catch(() => {});
        } catch (e) {
            toast.error(mensajeDe(e, "No se pudo usar esa ayuda."));
        } finally {
            setUsando(null);
            setTimeout(() => setAnimo("esperando"), 1700);
        }
    };

    const siguiente = async () => {
        if (!charla) return;
        callarAria();
        turnoVoz.current++;
        if (indice + 1 < charla.preguntas.length) {
            setIndice(indice + 1);
            setFase("leyendo");
            return;
        }
        setFase("evaluando");
        setAnimo("pensando");
        try {
            const r = await rondasApi.finalizar(charla.ronda_id, conReloj);
            setResumen(r);
            localStorage.removeItem(clave);
            refrescarProgreso(qc);
            qc.invalidateQueries({ queryKey: ["charla"] });
            reproducirLogro();
            if (estilo !== "SOBRIO") setFiesta((n) => n + 1);
            if (primaria) reproducirRonroneo();
            setAnimo("celebrando");
            setFase("fin");
        } catch (e) {
            toast.error(mensajeDe(e, "No pude guardar la charla. Inténtalo otra vez."));
            setAnimo("confundido");
            setFase("resultado");
        }
    };

    const dictar = () => {
        const Reconocedor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
        if (!Reconocedor) { toast.info("Tu navegador no permite dictar. Escríbelo."); return; }
        const r = new Reconocedor();
        r.lang = "es-PE";
        r.onresult = (e: any) => setTexto((t) => `${t} ${e.results[0][0].transcript}`.trim());
        r.onend = () => setEscuchando(false);
        setEscuchando(true);
        r.start();
    };

    const alternarVoz = () => {
        const nueva = !voz;
        setVoz(nueva);
        guardarVozActivada(nueva);
        if (!nueva) callarAria();
    };

    const volver = `/app/curso/${courseId}/semana/${semanaId}`;
    const palabras = (pregunta?.enunciado ?? "").split(/\s+/);
    const hayRespuestaEscrita = pregunta && (pregunta.tipo_pregunta === "ABIERTA" || pregunta.tipo_pregunta === "DETECCION_ERRORES");
    const bloqueado = fase === "evaluando" || fase === "resultado";
    const correcta = pregunta?.respuesta_correcta ? normal(pregunta.respuesta_correcta) : null;
    const ayudas = AYUDAS.filter((a) => (!primaria || a.primaria) && (a.id !== "MITAD" || (pregunta?.tipo_pregunta === "OPCION_MULTIPLE" && opciones.length >= 3)) && (a.id !== "TIEMPO" || conReloj));
    const estrellas = resumen ? Math.max(1, Math.round((resumen.notaFinal / 20) * 3)) : 0;

    if (estilo === "SOBRIO") {
        return (
            <VistaSobria animo={animo} volver={volver} fase={fase} total={charla?.preguntas.length ?? 0} indice={indice} marcas={marcas} reloj={reloj} voz={voz} alternarVoz={alternarVoz}
                frase="Preparando tus preguntas" errorTexto={errorTexto} pregunta={pregunta} opciones={opciones} palabra={palabra} visibles={visibles} linea={linea} fallidas={fallidas}
                ocultas={ocultas} elegida={elegida} texto={texto} setTexto={setTexto} resultado={resultado} bloqueado={bloqueado} correcta={correcta} ayudas={ayudas} precioPista={precioPista}
                restantes={restantes} usando={usando} escuchando={escuchando} resumen={resumen} desafio={desafio} saltarLectura={saltarLectura} enviar={enviar} enviarEscrito={enviarEscrito}
                usarAyuda={usarAyuda} siguiente={siguiente} dictar={dictar} />
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <Escenario estilo={estilo}>
                <header className="flex items-center gap-3 p-4">
                    <Link to={volver} aria-label="Volver a la semana" className="boton-juego w-11 h-11 grid place-items-center bg-card shrink-0" onClick={() => callarAria()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 flex justify-center gap-1.5 sm:gap-3" aria-label={`Pregunta ${indice + 1} de ${charla?.preguntas.length ?? 0}`}>
                        {primaria
                            ? (charla?.preguntas ?? []).map((_, i) => <Huella key={i} estado={marcas[i] === true ? "bien" : marcas[i] === false ? "mal" : i === indice ? "actual" : "libre"} />)
                            : (charla?.preguntas ?? []).map((_, i) => (
                                <span key={i} className="h-4 flex-1 max-w-[88px] rounded-full border-[2.5px] border-[var(--j-tinta)]" style={{ background: marcas[i] === true ? "#22C55E" : marcas[i] === false ? "#FB923C" : i === indice ? "var(--j-oro)" : "#fff" }} />
                            ))}
                    </div>
                    {conReloj && reloj !== null && fase !== "fin" && (
                        <span className={cn("boton-juego h-11 px-3 grid place-items-center font-juego font-extrabold tabular-nums", reloj === 0 ? "bg-muted" : reloj <= 5 ? "bg-[var(--j-fuego)] text-white" : "bg-card")}>{reloj}s</span>
                    )}
                    <button type="button" onClick={alternarVoz} aria-label={voz ? "Silenciar a Aria" : "Activar la voz de Aria"} className="boton-juego w-11 h-11 grid place-items-center bg-card shrink-0">
                        {voz ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                </header>

                {fase === "cargando" || fase === "error" ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
                        <Burbuja><span className="font-juego text-xl font-bold">{fase === "error" ? errorTexto : FRASES_ESPERA[espera]}</span></Burbuja>
                        <div className="w-56 h-64"><AriaSvg estado={fase === "error" ? "triste" : "pensando"} className="w-full h-full" /></div>
                        {fase === "error" && <Link to={volver} className="boton-juego px-6 py-3 bg-card font-juego font-extrabold">Volver</Link>}
                    </div>
                ) : fase === "fin" && resumen ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <Burbuja>
                            <p className="font-juego text-3xl font-extrabold">{desafio ? "Desafío superado" : primaria ? "¡Lo hicimos juntas!" : "Buena, sigamos así"}</p>
                            {primaria
                                ? <p className="text-4xl mt-1" aria-label={`${estrellas} de 3 estrellas`}>{"⭐".repeat(estrellas)}</p>
                                : <p className="font-juego text-5xl font-extrabold text-[var(--j-indigo)] mt-1">{resumen.notaFinal.toFixed(1)}<span className="text-2xl"> / 20</span></p>}
                            {resumen.bono > 0 && <p className="font-bold mt-1">+{resumen.bono} monedas de bono 🪙</p>}
                        </Burbuja>
                        <div className="w-56 h-64"><AriaSvg estado="celebrando" className="w-full h-full" /></div>
                        <Link to={volver} className="boton-juego px-8 py-3.5 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego text-lg font-extrabold">Ver mi avance</Link>
                    </div>
                ) : pregunta ? (
                    <div className="flex-1 grid md:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] gap-2 md:gap-6 p-4 pt-0 items-end">
                        <motion.div key={indice} initial={reducir ? false : { x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={cn("relative order-2 md:order-1 h-52 self-end", primaria ? "md:h-[430px] alto:h-[520px]" : "md:h-[350px] alto:h-[460px]")}>
                            <SombraDeAria sobreRuedas={varianteAria === "nocturna"} />
                            <AriaSvg estado={animo} className="w-full h-full" />
                        </motion.div>

                        <div className="order-1 md:order-2 space-y-3 pb-3">
                            <Burbuja onClick={fase === "leyendo" ? saltarLectura : undefined}>
                                {pregunta.repaso && <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--j-fuego)] mb-1">Repaso</p>}
                                <p className={cn("font-juego font-bold leading-snug", primaria ? "text-2xl alto:text-[32px]" : "text-xl md:text-2xl alto:text-[30px]")}>
                                    {hayRespuestaEscrita && pregunta.tipo_pregunta === "DETECCION_ERRORES" ? "Ayúdame: este texto tiene errores. Corrígelos." : palabras.map((w, i) => (
                                        <span key={i} className={cn("transition-colors duration-100", i <= palabra ? "text-[var(--j-tinta)]" : "text-[#2B2140]/45")}>{w} </span>
                                    ))}
                                </p>
                                <AnimatePresence>
                                    {linea && (
                                        <motion.p initial={reducir ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-2xl bg-[#EDE9FF] text-[#3A23B5] px-3 py-2 font-bold">{linea}</motion.p>
                                    )}
                                </AnimatePresence>
                            </Burbuja>

                            {opciones.length > 0 && (
                                <ul className="grid gap-2.5 p-0 m-0">
                                    {opciones.map((o, i) => {
                                        const yaFallo = fallidas.includes(o);
                                        const descartada = ocultas.includes(o);
                                        const esCorrecta = correcta !== null && normal(o) === correcta;
                                        const estado = resultado ? (esCorrecta ? "correcta" : elegida === o ? "incorrecta" : "apagada") : yaFallo || descartada ? "descartada" : elegida === o ? "elegida" : "libre";
                                        return (
                                            <AnimatePresence key={o}>
                                                {(i < visibles || fase !== "leyendo") && (
                                                    <motion.li className="list-none" initial={reducir ? false : { x: 70, opacity: 0, scale: 0.9 }} animate={{ x: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 340, damping: 22 }}>
                                                        <button type="button" data-estado={estado} disabled={bloqueado || yaFallo || descartada} onClick={() => enviar(o)}
                                                            className={cn("opcion-juego w-full flex items-center gap-3 px-4 text-left font-semibold", primaria ? "py-5 text-xl alto:py-6 alto:text-2xl" : "py-3 text-base md:text-lg alto:py-5 alto:text-[22px]")}>
                                                            <span className="ficha-letra shrink-0 alto:w-14 alto:h-14 alto:text-2xl" style={{ background: COLORES[i % 4], color: i % 4 === 2 ? "var(--j-tinta)" : "#fff" }}>
                                                                {esCorrecta && resultado ? "✓" : primaria ? FICHAS_PRIMARIA[i % 4] : String.fromCharCode(65 + i)}
                                                            </span>
                                                            <span className="flex-1">{bonito(o)}</span>
                                                        </button>
                                                    </motion.li>
                                                )}
                                            </AnimatePresence>
                                        );
                                    })}
                                </ul>
                            )}

                            {pregunta.tipo_pregunta === "DETECCION_ERRORES" && (
                                <div className="pieza rounded-3xl bg-card p-4">
                                    <PreguntaDeteccionErrores pregunta={pregunta as Question} index={indice} valor={texto} onChange={setTexto} disabled={bloqueado} resultado={resultado ? { evaluacion: resultado } : undefined} />
                                </div>
                            )}

                            {pregunta.tipo_pregunta === "ABIERTA" && (
                                <textarea value={texto} onChange={(e) => setTexto(e.target.value)} disabled={bloqueado} rows={3} placeholder="Cuéntame con tus palabras"
                                    aria-label="Tu respuesta" className="pieza w-full rounded-3xl bg-card p-4 text-lg outline-none focus-visible:ring-4 focus-visible:ring-[var(--j-oro)] resize-none" />
                            )}

                            {hayRespuestaEscrita && !resultado && (
                                <div className="flex gap-2 justify-end">
                                    {pregunta.tipo_pregunta === "ABIERTA" && (
                                        <button type="button" onClick={dictar} disabled={bloqueado} aria-label="Dictar mi respuesta" className={cn("boton-juego w-12 h-12 grid place-items-center", escuchando ? "bg-[var(--j-fuego)] text-white" : "bg-card")}><Mic className="w-5 h-5" /></button>
                                    )}
                                    <button type="button" onClick={enviarEscrito} disabled={bloqueado} className="boton-juego h-12 px-6 flex items-center gap-2 bg-[var(--j-indigo)] text-white font-juego font-extrabold"><Send className="w-4 h-4" /> Responder</button>
                                </div>
                            )}

                            {fase === "resultado" && resultado && (
                                <motion.div initial={reducir ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("pieza rounded-3xl p-4", resultado.esCorrecta ? "bg-[#DCFCE7] text-[#14532D]" : "bg-[#FFF1E6] text-[#7C2D12]")}>
                                    <p className="font-juego text-xl font-extrabold">{resultado.esCorrecta ? (resultado.primer_intento === false ? "¡Lo lograste!" : "¡Eso!") : "Mira, era así"}</p>
                                    <p className="mt-1 leading-snug">{resultado.explicacion}</p>
                                    <div className="flex justify-end mt-3">
                                        <button type="button" onClick={siguiente} className="boton-juego h-12 px-7 bg-[var(--j-oro)] text-[var(--j-tinta)] font-juego text-lg font-extrabold">
                                            {indice + 1 < (charla?.preguntas.length ?? 0) ? "Seguir" : "Terminar"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {fase === "respondiendo" && !resultado && ayudas.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {ayudas.map((a) => (
                                        <button key={a.id} type="button" disabled={restantes <= 0 || !!usando} onClick={() => usarAyuda(a.id)} className="boton-juego h-10 px-3 bg-card text-sm font-bold flex items-center gap-1.5">
                                            <span aria-hidden>{a.icono}</span>{usando === a.id ? "Un momento" : a.nombre}
                                            <span className="tabular-nums text-muted-foreground">{a.id === "PISTA" ? precioPista : a.precio} 🪙</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
                {!reducir && <Confeti llave={fiesta} />}
            </Escenario>
        </div>
    );
}

function Burbuja({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return (
        <div onClick={onClick} className={cn("relative pieza rounded-[28px] bg-white text-[#2B2140] px-5 py-4 w-full", onClick && "cursor-pointer")}>
            {children}
            <span aria-hidden className="hidden md:block absolute -left-[11px] bottom-8 w-5 h-5 bg-white border-l-[2.5px] border-b-[2.5px] border-[var(--j-tinta)] rotate-45" />
        </div>
    );
}

function Huella({ estado }: { estado: "libre" | "actual" | "bien" | "mal" }) {
    const color = estado === "bien" ? "#22C55E" : estado === "mal" ? "#FB923C" : estado === "actual" ? "#FFC83D" : "#FFFFFF";
    return (
        <svg viewBox="0 0 40 40" className={cn("w-9 h-9 sm:w-11 sm:h-11", estado === "actual" && "charla-huella-actual")} aria-hidden>
            <g fill={color} stroke="#2B2140" strokeWidth="2.5">
                <ellipse cx="20" cy="27" rx="10" ry="8.5" />
                <ellipse cx="8.5" cy="17" rx="3.8" ry="5" transform="rotate(-20 8.5 17)" />
                <ellipse cx="16" cy="10" rx="3.8" ry="5.2" />
                <ellipse cx="25" cy="10" rx="3.8" ry="5.2" />
                <ellipse cx="32" cy="17" rx="3.8" ry="5" transform="rotate(20 32 17)" />
            </g>
        </svg>
    );
}

function Confeti({ llave }: { llave: number }) {
    if (llave === 0) return null;
    return (
        <div key={llave} aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {Array.from({ length: 26 }, (_, i) => (
                <motion.span key={i} className="absolute w-3 h-3 rounded-sm" style={{ left: `${(i * 37) % 100}%`, top: -16, background: COLORES[i % 4] }}
                    initial={{ y: 0, rotate: 0, opacity: 1 }} animate={{ y: 720, rotate: 360 + i * 40, opacity: 0 }} transition={{ duration: 1.4 + (i % 5) * 0.2, ease: "easeIn" }} />
            ))}
        </div>
    );
}
