/**
 * Voz de Aria con la síntesis del navegador (gratis, sin llamar a la IA).
 *
 * Se elige una voz en español, de preferencia latinoamericana y femenina. Sin elegirla, Chrome
 * en una PC configurada en inglés leía el texto en español con acento inglés, que no se entiende.
 */
export function elegirVozEspanol(): SpeechSynthesisVoice | undefined {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
    const voces = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("es"));
    if (voces.length === 0) return undefined;
    const puntuar = (v: SpeechSynthesisVoice) => {
        const lang = v.lang.toLowerCase().replace("_", "-");
        const nombre = v.name.toLowerCase();
        let p = 0;
        if (["es-pe", "es-419", "es-mx", "es-us", "es-co"].some((l) => lang.startsWith(l))) p += 4;
        if (/natural|neural|online|google/.test(nombre)) p += 3;
        if (/paulina|sabina|dalia|helena|elvira|camila|lupe|monica|mónica|female|mujer/.test(nombre)) p += 2;
        return p;
    };
    return [...voces].sort((a, b) => puntuar(b) - puntuar(a))[0];
}

// Chrome carga la lista de voces de forma asíncrona: se pide una vez al cargar el módulo.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
}

const CLAVE_VOZ = "semantika.vozAria";

/** ¿El alumno dejó la voz de Aria encendida? Por defecto sí. */
export function vozActivada(): boolean {
    try { return localStorage.getItem(CLAVE_VOZ) !== "0"; } catch { return true; }
}

export function guardarVozActivada(activa: boolean) {
    try { localStorage.setItem(CLAVE_VOZ, activa ? "1" : "0"); } catch { /* sin almacenamiento */ }
}

/** Lee el texto con la voz de Aria. Devuelve false si el navegador no puede hablar. */
export function hablarComoAria(texto: string, eventos: { alEmpezar?: () => void; alTerminar?: () => void; alPalabra?: (caracter: number) => void } = {}): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/[«»*#]/g, ""));
    const vozEs = elegirVozEspanol();
    if (vozEs) u.voice = vozEs;
    u.lang = vozEs?.lang ?? "es-ES";
    u.rate = 1.02;
    u.pitch = 1.15;
    u.onstart = () => eventos.alEmpezar?.();
    u.onboundary = (e) => {
        if (e.name !== "word") return;
        window.dispatchEvent(new CustomEvent("semantika:aria-palabra", { detail: e.charLength || 4 }));
        eventos.alPalabra?.(e.charIndex);
    };
    u.onend = () => eventos.alTerminar?.();
    u.onerror = () => eventos.alTerminar?.();
    window.speechSynthesis.speak(u);
    return true;
}

export function callarAria() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
