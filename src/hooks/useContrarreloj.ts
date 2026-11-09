import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gamificacionApi, type Poder } from "@/services/gamificacion";
import { rondasApi } from "@/services/courses";
import type { Question } from "@/types/Evaluation";
import { ESCENA_MS, IMPACTO_MS } from "@/components/gamificacion/AriaComodin";

/**
 * Segundos para una pregunta, según lo que hay que LEER y PENSAR, no un número fijo.
 *  - Lectura: ~0,4 s por palabra (unas 150 palabras por minuto, lectura atenta de secundaria).
 *  - Bloom: aplicar/analizar suma 10 s; evaluar/crear, 20 s.
 *  - Tipo: abierta +45 s (hay que escribir), detección de errores +30 s.
 * Se redondea a 5 y se acota entre 15 y 150 s.
 */
export function segundosPara(p: Question, tipo: string, nivelBloom?: string | number | null): number {
    const opciones = Array.isArray(p.opciones_o_respuesta) ? p.opciones_o_respuesta.join(" ") : "";
    const palabras = `${p.enunciado ?? ""} ${tipo === "ABIERTA" ? "" : opciones}`.trim().split(/\s+/).length;
    const bloom = String(nivelBloom ?? "").toLowerCase();
    const extraBloom = /5|6|evalu|crea|sintes/.test(bloom) ? 20 : /3|4|aplic|anali/.test(bloom) ? 10 : 0;
    const extraTipo = tipo === "ABIERTA" ? 45 : tipo === "DETECCION_ERRORES" ? 30 : 0;
    const total = 8 + palabras * 0.4 + extraBloom + extraTipo;
    return Math.min(150, Math.max(15, Math.round(total / 5) * 5));
}

const SEGUNDOS_EXTRA = 15;
const SEGUNDOS_CONGELADO = 10;

interface Opciones {
    activo: boolean;
    /** Ronda en el servidor. Sin ella (vista previa del docente) no hay comodines. */
    rondaId?: string;
    preguntas: Question[];
    slide: number;
    resultados: any[];
    evaluando: boolean;
    tipo: string;
    nivelBloom?: string | number | null;
}

/**
 * Estado del modo contrarreloj: reloj por pregunta, combo de aciertos y poderes.
 * El reloj se detiene mientras la IA califica y cuando la pregunta ya tiene resultado.
 * Si llega a cero NO es error: solo se pierde el bono de rapidez, y se puede seguir respondiendo.
 */
export function useContrarreloj({ activo, rondaId, preguntas, slide, resultados, evaluando, tipo, nivelBloom }: Opciones) {
    const qc = useQueryClient();
    const [restante, setRestante] = useState<Record<number, number>>({});
    const [total, setTotal] = useState<Record<number, number>>({});
    const [congeladoHasta, setCongeladoHasta] = useState(0);
    const [combo, setCombo] = useState(0);
    const [comboMaximo, setComboMaximo] = useState(0);
    const [rapidas, setRapidas] = useState(0);
    const [ayudas, setAyudas] = useState<Set<number>>(new Set());
    const [ocultas, setOcultas] = useState<Record<number, string[]>>({});
    const [pista, setPista] = useState<string | null>(null);
    const [usando, setUsando] = useState<Poder | null>(null);
    const [poderesRestantes, setPoderesRestantes] = useState(3);
    const [precioPista, setPrecioPista] = useState(10);
    const procesados = useRef<Set<number>>(new Set());
    const [ultimo, setUltimo] = useState<"acierto" | "error" | null>(null);
    const [bono, setBono] = useState<number | null>(null);
    /** Comodín que Aria está usando en pantalla: mientras dura la escena el reloj se detiene. */
    /** Hasta cuándo se ve la escarcha sobre la pregunta (empieza cuando el soplido de Aria la alcanza). */
    const [escarchaHasta, setEscarchaHasta] = useState(0);
    const [comodinEnEscena, setComodinEnEscena] = useState<Exclude<Poder, "PISTA"> | null>(null);

    const pregunta = preguntas[slide];

    // Tiempo inicial de cada pregunta, la primera vez que aparece.
    useEffect(() => {
        if (!activo || !pregunta || restante[slide] !== undefined) return;
        const s = segundosPara(pregunta, tipo, nivelBloom);
        setRestante((r) => ({ ...r, [slide]: s }));
        setTotal((t) => ({ ...t, [slide]: s }));
    }, [activo, pregunta, slide, tipo, nivelBloom, restante]);

    // El reloj.
    const enPausa = !activo || evaluando || !!resultados[slide] || !!pista || !!comodinEnEscena;
    useEffect(() => {
        if (enPausa) return;
        const id = setInterval(() => {
            if (Date.now() < congeladoHasta) return;
            setRestante((r) => ({ ...r, [slide]: Math.max(0, (r[slide] ?? 0) - 1) }));
        }, 1000);
        return () => clearInterval(id);
    }, [enPausa, slide, congeladoHasta]);

    // Combo y rapidez: se cuentan una sola vez por pregunta, al llegar su resultado.
    useEffect(() => {
        if (!activo) return;
        resultados.forEach((r, i) => {
            if (!r || procesados.current.has(i)) return;
            procesados.current.add(i);
            const correcta = !!r?.evaluacion?.esCorrecta;
            setUltimo(correcta ? "acierto" : "error");
            if (correcta) {
                setCombo((c) => {
                    const nuevo = c + 1;
                    setComboMaximo((m) => Math.max(m, nuevo));
                    return nuevo;
                });
                if ((restante[i] ?? 0) > 0) setRapidas((n) => n + 1);
            } else {
                setCombo(0);
            }
        });
    }, [activo, resultados, restante]);

    useEffect(() => {
        if (!activo || !rondaId) return;
        gamificacionApi.precioPoder(rondaId, "PISTA").then((r) => setPrecioPista(r.precio)).catch(() => {});
    }, [activo, rondaId]);

    const usarPoder = useCallback(async (poder: Poder) => {
        if (!pregunta || usando) return;
        if (!rondaId) {
            toast.info("Los comodines se usan en la práctica de un alumno.");
            return;
        }
        setUsando(poder);
        try {
            const r = await rondasApi.comodin(rondaId, slide, poder);
            setPoderesRestantes(r.restantes);
            qc.invalidateQueries({ queryKey: ["gamificacion", "resumen"] });
            // Los tres comodines tienen escena de Aria: el efecto se aplica cuando ella "pega".
            if (poder !== "PISTA") setComodinEnEscena(poder);
            if (poder === "TIEMPO") {
                setTimeout(() => setRestante((t) => ({ ...t, [slide]: (t[slide] ?? 0) + SEGUNDOS_EXTRA })), IMPACTO_MS);
            }
            // El congelamiento empieza cuando termina la escena (durante ella el reloj ya está detenido).
            if (poder === "CONGELAR") {
                const hasta = Date.now() + ESCENA_MS + SEGUNDOS_CONGELADO * 1000;
                setCongeladoHasta(hasta);
                setTimeout(() => setEscarchaHasta(hasta), IMPACTO_MS + 70);
            }
            if (poder === "MITAD") {
                const quitar = r.ocultas ?? [];
                setTimeout(() => setOcultas((o) => ({ ...o, [slide]: quitar })), IMPACTO_MS);
                setAyudas((a) => new Set(a).add(slide));
            }
            if (poder === "PISTA") {
                setPista(r.pista ?? "Relee la pregunta despacio y descarta lo que no encaja.");
                setAyudas((a) => new Set(a).add(slide));
                gamificacionApi.precioPoder(rondaId, "PISTA").then((p) => setPrecioPista(p.precio)).catch(() => {});
            }
        } catch (e) {
            const texto = e instanceof Error ? e.message : "";
            let msg = "No se pudo usar el comodín.";
            try { msg = JSON.parse(texto).error ?? msg; } catch { if (texto) msg = texto; }
            toast.error(msg);
        } finally {
            setUsando(null);
        }
    }, [pregunta, usando, rondaId, slide, qc]);

    /** El bono lo calcula el servidor con los tiempos que él mismo midió. */
    const fijarBono = useCallback((valor: number | null) => {
        setBono(valor ?? 0);
        if (valor) toast.success(`Bono de contrarreloj: +${valor} monedas 🪙`);
        qc.invalidateQueries({ queryKey: ["gamificacion"] });
    }, [qc]);

    return {
        restante: restante[slide] ?? 0,
        total: total[slide] ?? 0,
        congelado: Date.now() < congeladoHasta,
        combo, comboMaximo, rapidas, ultimo,
        ocultas: ocultas[slide] ?? [],
        usoAyuda: ayudas.has(slide),
        pista, cerrarPista: () => setPista(null),
        usando, usarPoder, poderesRestantes, precioPista,
        fijarBono, bono,
        comodinEnEscena, terminarComodin: () => setComodinEnEscena(null),
        escarchaHasta,
    };
}
