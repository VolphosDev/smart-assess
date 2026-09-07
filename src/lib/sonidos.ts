/**
 * Efectos de sonido de la interfaz.
 *
 * Se SINTETIZAN con la Web Audio API en vez de cargar archivos. Tres motivos:
 *   1. Peso cero. No se descarga ni un byte, y el peso en móvil ya era una preocupación.
 *   2. Sin copyright. No hay nada que atribuir ni licencia que cumplir.
 *   3. Latencia cero. Un sonido de acierto que llega 300 ms tarde no es retroalimentación.
 *
 * Nota deliberada: no hay música de fondo, solo sonidos puntuales. Una melodía continua
 * compite con la comprensión lectora, que es justo lo que la aplicación evalúa; un tono de
 * 150 ms no.
 */

const CLAVE_PREFERENCIA = "semantika.sonido";

/** El contexto se crea perezosamente: los navegadores lo bloquean hasta que el usuario interactúa. */
let contexto: AudioContext | null = null;

function obtenerContexto(): AudioContext | null {
    try {
        if (!contexto) {
            const Ctor = window.AudioContext || (window as any).webkitAudioContext;
            if (!Ctor) return null;
            contexto = new Ctor();
        }
        // Safari e iOS suspenden el contexto hasta el primer gesto del usuario.
        if (contexto.state === "suspended") {
            void contexto.resume();
        }
        return contexto;
    } catch {
        // Sin audio disponible la aplicación debe seguir funcionando igual.
        return null;
    }
}

export function sonidoActivado(): boolean {
    try {
        // Activado por defecto; solo se apaga si el usuario lo pidió explícitamente.
        return localStorage.getItem(CLAVE_PREFERENCIA) !== "off";
    } catch {
        return false;
    }
}

export function alternarSonido(): boolean {
    const nuevo = !sonidoActivado();
    try {
        localStorage.setItem(CLAVE_PREFERENCIA, nuevo ? "on" : "off");
    } catch {
        /* modo privado: la preferencia no persiste, pero la sesión funciona */
    }
    if (nuevo) reproducirClic();
    return nuevo;
}

/** ¿El usuario pidió menos animación? Entonces tampoco quiere estímulos extra. */
function prefiereMenosEstimulo(): boolean {
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
}

interface Tono {
    frecuencia: number;
    duracion: number;
    /** Retraso desde el inicio, para encadenar dos notas. */
    retraso?: number;
    volumen?: number;
    tipo?: OscillatorType;
}

function tocar(tonos: Tono[]) {
    if (!sonidoActivado() || prefiereMenosEstimulo()) return;
    const ctx = obtenerContexto();
    if (!ctx) return;

    const ahora = ctx.currentTime;

    for (const t of tonos) {
        const inicio = ahora + (t.retraso ?? 0);
        const volumen = t.volumen ?? 0.06; // bajo a propósito: acompaña, no interrumpe
        const osc = ctx.createOscillator();
        const gan = ctx.createGain();

        osc.type = t.tipo ?? "sine";
        osc.frequency.setValueAtTime(t.frecuencia, inicio);

        // Envolvente suave. Sin ella, cortar la onda de golpe produce un chasquido audible.
        gan.gain.setValueAtTime(0.0001, inicio);
        gan.gain.exponentialRampToValueAtTime(volumen, inicio + 0.012);
        gan.gain.exponentialRampToValueAtTime(0.0001, inicio + t.duracion);

        osc.connect(gan);
        gan.connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + t.duracion + 0.02);
    }
}

/** Pulsación genérica. Muy corto y discreto. */
export const reproducirClic = () =>
    tocar([{ frecuencia: 620, duracion: 0.05, volumen: 0.035, tipo: "triangle" }]);

/** Acierto: dos notas ascendentes (do–sol). Ascender se lee como "bien" sin necesidad de texto. */
export const reproducirAcierto = () =>
    tocar([
        { frecuencia: 523.25, duracion: 0.11 },
        { frecuencia: 783.99, duracion: 0.16, retraso: 0.09 },
    ]);

/**
 * Error: dos notas descendentes y suaves.
 *
 * Deliberadamente NO es un zumbido de "buzzer". Este sonido lo va a oír un chico de 13 años
 * que acaba de equivocarse; el objetivo es informarle, no avergonzarlo.
 */
export const reproducirError = () =>
    tocar([
        { frecuencia: 392.0, duracion: 0.12, volumen: 0.05 },
        { frecuencia: 311.13, duracion: 0.18, retraso: 0.1, volumen: 0.05 },
    ]);

/** Fin de una evaluación: arpegio breve de tres notas. */
export const reproducirLogro = () =>
    tocar([
        { frecuencia: 523.25, duracion: 0.1 },
        { frecuencia: 659.25, duracion: 0.1, retraso: 0.09 },
        { frecuencia: 1046.5, duracion: 0.24, retraso: 0.18 },
    ]);
