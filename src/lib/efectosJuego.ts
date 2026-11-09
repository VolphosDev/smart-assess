/**
 * Motor de partículas de los comodines de Aria, en un <canvas> fijo sobre toda la pantalla.
 *
 * Sin librerías: unas pocas partículas con física simple (velocidad, gravedad, roce, giro) y
 * figuras dibujadas a mano (copos de seis puntas con ramas, esquirlas de dos tonos, estelas
 * afiladas, chispas, estrellas). Todo con bordes nítidos: nada de desenfoques.
 *
 * El canvas existe solo mientras hay algo que dibujar; con "reducir movimiento" no se lanza nada.
 */

type Tipo = "copo" | "esquirla" | "estela" | "chispa" | "estrella";

interface Particula {
    tipo: Tipo;
    x: number; y: number;
    vx: number; vy: number;
    g: number;          // gravedad (px/s²)
    roce: number;       // fracción de velocidad que conserva por segundo
    rot: number; vr: number;
    tam: number;
    vida: number; max: number;
    color: string;
}

interface Tajo {
    // Media luna afilada que se dibuja en `dur` ms y se desvanece después.
    x0: number; y0: number; x1: number; y1: number; curva: number; grosor: number;
    inicio: number; dur: number; resto: number;
}

const TINTA = "#2B2140";
let lienzo: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particulas: Particula[] = [];
let tajos: Tajo[] = [];
let ultimo = 0;
let corriendo = false;

const reducido = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const azar = (a: number, b: number) => a + Math.random() * (b - a);

function asegurarLienzo() {
    if (lienzo) return;
    lienzo = document.createElement("canvas");
    lienzo.setAttribute("aria-hidden", "true");
    Object.assign(lienzo.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "75" });
    document.body.appendChild(lienzo);
    ctx = lienzo.getContext("2d");
    ajustar();
    window.addEventListener("resize", ajustar);
}

function ajustar() {
    if (!lienzo || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = window.innerWidth * dpr;
    lienzo.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function quitarLienzo() {
    window.removeEventListener("resize", ajustar);
    lienzo?.remove();
    lienzo = null;
    ctx = null;
}

function arrancar() {
    if (corriendo) return;
    corriendo = true;
    ultimo = performance.now();
    requestAnimationFrame(paso);
}

function paso(ahora: number) {
    if (!ctx || !lienzo) { corriendo = false; return; }
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const t of tajos) dibujarTajo(ctx, t, ahora);
    tajos = tajos.filter((t) => ahora < t.inicio + t.dur + t.resto);

    for (const p of particulas) {
        p.vida += dt;
        const k = Math.pow(p.roce, dt);
        p.vx *= k; p.vy = p.vy * k + p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        dibujarParticula(ctx, p);
    }
    particulas = particulas.filter((p) => p.vida < p.max);

    if (particulas.length || tajos.length) requestAnimationFrame(paso);
    else { corriendo = false; quitarLienzo(); }
}

// ── Figuras ─────────────────────────────────────────────────────────────

function dibujarParticula(c: CanvasRenderingContext2D, p: Particula) {
    const t = p.vida / p.max;
    const alfa = t < 0.15 ? t / 0.15 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    c.save();
    c.globalAlpha = Math.max(0, alfa);
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    switch (p.tipo) {
        case "copo": copo(c, p.tam); break;
        case "esquirla": esquirla(c, p.tam); break;
        case "estela": estela(c, p); break;
        case "chispa": chispa(c, p); break;
        case "estrella": estrella(c, p.tam, p.color); break;
    }
    c.restore();
}

/** Copo de seis brazos con ramas: primero el contorno azul, encima el trazo blanco. */
function copo(c: CanvasRenderingContext2D, r: number) {
    const brazo = () => {
        c.beginPath();
        c.moveTo(0, 0); c.lineTo(0, -r);
        for (const f of [0.45, 0.72]) {
            const largo = r * (f === 0.45 ? 0.38 : 0.26);
            c.moveTo(0, -r * f); c.lineTo(-largo * 0.7, -r * f - largo * 0.7);
            c.moveTo(0, -r * f); c.lineTo(largo * 0.7, -r * f - largo * 0.7);
        }
        c.stroke();
    };
    c.lineCap = "round";
    for (const [color, ancho] of [["#0369A1", Math.max(2.6, r * 0.22)], ["#FFFFFF", Math.max(1.2, r * 0.1)]] as const) {
        c.strokeStyle = color; c.lineWidth = ancho;
        for (let i = 0; i < 6; i++) { c.save(); c.rotate((i * Math.PI) / 3); brazo(); c.restore(); }
    }
    c.fillStyle = "#E0F2FE";
    c.beginPath(); c.arc(0, 0, r * 0.14, 0, Math.PI * 2); c.fill();
}

/** Esquirla de hielo: rombo con una cara clara y otra oscura, borde blanco brillante. */
function esquirla(c: CanvasRenderingContext2D, r: number) {
    c.lineJoin = "round";
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.45, 0); c.lineTo(0, r * 0.7); c.lineTo(-r * 0.45, 0); c.closePath();
    c.fillStyle = "#7DD3FC"; c.fill();
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.45, 0); c.lineTo(0, r * 0.7); c.closePath();
    c.fillStyle = "#38BDF8"; c.fill();
    c.beginPath(); c.moveTo(0, -r); c.lineTo(-r * 0.45, 0); c.lineTo(0, r * 0.7); c.lineTo(r * 0.45, 0); c.closePath();
    c.strokeStyle = "#0C4A6E"; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.moveTo(-r * 0.2, -r * 0.45); c.lineTo(0, -r * 0.8);
    c.strokeStyle = "#FFFFFF"; c.lineWidth = 1.6; c.stroke();
}

/** Estela de viento: línea afilada en ambas puntas, orientada según su velocidad. */
function estela(c: CanvasRenderingContext2D, p: Particula) {
    const ang = Math.atan2(p.vy, p.vx) - p.rot;
    c.rotate(ang);
    const l = p.tam;
    c.beginPath();
    c.moveTo(-l, 0); c.quadraticCurveTo(0, -2.2, l * 0.4, 0); c.quadraticCurveTo(0, 2.2, -l, 0);
    c.fillStyle = "#E0F2FE"; c.fill();
    c.strokeStyle = "#38BDF8"; c.lineWidth = 1; c.stroke();
}

function chispa(c: CanvasRenderingContext2D, p: Particula) {
    const ang = Math.atan2(p.vy, p.vx) - p.rot;
    c.rotate(ang);
    c.lineCap = "round";
    c.strokeStyle = TINTA; c.lineWidth = 4.5;
    c.beginPath(); c.moveTo(-p.tam, 0); c.lineTo(p.tam * 0.4, 0); c.stroke();
    c.strokeStyle = p.color; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-p.tam, 0); c.lineTo(p.tam * 0.4, 0); c.stroke();
}

function estrella(c: CanvasRenderingContext2D, r: number, color: string) {
    c.beginPath();
    for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r : r * 0.38;
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    c.closePath();
    c.fillStyle = color; c.fill();
    c.strokeStyle = TINTA; c.lineWidth = 2; c.lineJoin = "round"; c.stroke();
    c.beginPath(); c.arc(-r * 0.12, -r * 0.2, r * 0.12, 0, Math.PI * 2); c.fillStyle = "#FFFFFF"; c.fill();
}

/** Tajo de garra: media luna afilada (gruesa al centro, punzante en las puntas) que se "corta" en el aire. */
function dibujarTajo(c: CanvasRenderingContext2D, t: Tajo, ahora: number) {
    const pasado = ahora - t.inicio;
    if (pasado < 0) return;
    const avance = Math.min(1, pasado / t.dur);
    const alfa = pasado <= t.dur ? 1 : Math.max(0, 1 - (pasado - t.dur) / t.resto);
    const dx = t.x1 - t.x0, dy = t.y1 - t.y0;
    const largo = Math.hypot(dx, dy);
    const nx = -dy / largo, ny = dx / largo;   // normal
    const N = 24;
    const puntos: [number, number, number][] = [];
    for (let i = 0; i <= N * avance; i++) {
        const u = i / N;
        const flecha = Math.sin(u * Math.PI) * t.curva;
        const ancho = Math.sin(u * Math.PI) ** 0.8 * t.grosor;
        puntos.push([t.x0 + dx * u + nx * flecha, t.y0 + dy * u + ny * flecha, ancho]);
    }
    if (puntos.length < 2) return;
    const contorno = (escala: number) => {
        c.beginPath();
        puntos.forEach(([x, y, a], i) => (i ? c.lineTo(x + nx * a * escala, y + ny * a * escala) : c.moveTo(x + nx * a * escala, y + ny * a * escala)));
        for (let i = puntos.length - 1; i >= 0; i--) { const [x, y, a] = puntos[i]; c.lineTo(x - nx * a * escala * 0.35, y - ny * a * escala * 0.35); }
        c.closePath();
    };
    c.save();
    c.globalAlpha = alfa;
    c.lineJoin = "round";
    contorno(1.25); c.fillStyle = TINTA; c.fill();
    contorno(1); c.fillStyle = "#FF7A2F"; c.fill();
    contorno(0.55); c.fillStyle = "#FFF7ED"; c.fill();
    c.restore();
}

// ── Efectos que usan los comodines ──────────────────────────────────────

/** Soplido helado desde (x, y) hacia el rectángulo de la pregunta: viento, copos y esquirlas que estallan al llegar. */
export function soplidoHelado(x: number, y: number, destino: DOMRect) {
    if (reducido()) return;
    asegurarLienzo();
    const tx = destino.left + destino.width * 0.35, ty = destino.top + destino.height * 0.45;
    const ang = Math.atan2(ty - y, tx - x);
    const vel = (min: number, max: number, abre: number) => {
        const a = ang + azar(-abre, abre), v = azar(min, max);
        return { vx: Math.cos(a) * v, vy: Math.sin(a) * v };
    };
    for (let i = 0; i < 26; i++) particulas.push({ tipo: "estela", x, y: y + azar(-18, 18), ...vel(900, 1500, 0.22), g: 0, roce: 0.4, rot: 0, vr: 0, tam: azar(22, 46), vida: -i * 0.012, max: 0.75, color: "" });
    for (let i = 0; i < 30; i++) particulas.push({ tipo: "copo", x, y, ...vel(380, 900, 0.4), g: 40, roce: 0.35, rot: azar(0, 6), vr: azar(-5, 5), tam: azar(6, 15), vida: -i * 0.018, max: 1.5, color: "" });
    // Al chocar con la pregunta, la escarcha estalla en esquirlas.
    setTimeout(() => {
        if (!lienzo) asegurarLienzo();
        for (let i = 0; i < 26; i++) {
            const a = azar(-Math.PI, Math.PI), v = azar(160, 520);
            particulas.push({ tipo: "esquirla", x: tx + azar(-40, 40), y: ty + azar(-30, 30), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 900, roce: 0.6, rot: azar(0, 6), vr: azar(-9, 9), tam: azar(6, 13), vida: 0, max: 1.1, color: "" });
        }
        arrancar();
    }, 380);
    arrancar();
}

/** Tres zarpazos sobre el rectángulo, con chispas en la dirección del golpe. */
export function zarpazo(destino: DOMRect, dir: number) {
    if (reducido()) return;
    asegurarLienzo();
    const ahora = performance.now();
    const cx = destino.left + destino.width * (dir > 0 ? 0.3 : 0.7), cy = destino.top + destino.height * 0.5;
    for (let i = 0; i < 3; i++) {
        const desfase = (i - 1) * 46;
        tajos.push({
            x0: cx - 120 * dir + desfase, y0: cy - 130,
            x1: cx + 70 * dir + desfase, y1: cy + 120,
            curva: 26 * dir, grosor: 11, inicio: ahora + i * 70, dur: 150, resto: 380,
        });
        setTimeout(() => {
            for (let k = 0; k < 9; k++) {
                const a = Math.atan2(250, 190 * dir) + azar(-0.9, 0.9) + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
                const v = azar(260, 620);
                particulas.push({ tipo: "chispa", x: cx + desfase + azar(-20, 20), y: cy + azar(-50, 50), vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 700, roce: 0.3, rot: 0, vr: 0, tam: azar(7, 13), vida: 0, max: 0.55, color: k % 3 ? "#FFC83D" : "#FF7A2F" });
            }
            arrancar();
        }, i * 70 + 80);
    }
    arrancar();
}

/** Estallido de estrellas doradas (reloj de arena). */
export function estallidoEstrellas(x: number, y: number) {
    if (reducido()) return;
    asegurarLienzo();
    for (let i = 0; i < 18; i++) {
        const a = azar(-Math.PI, 0) + azar(-0.3, 0.3), v = azar(220, 560);
        particulas.push({ tipo: "estrella", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 620, roce: 0.45, rot: azar(0, 6), vr: azar(-6, 6), tam: azar(5, 11), vida: -i * 0.01, max: 1.2, color: i % 3 ? "#FFC83D" : "#FFE48A" });
    }
    arrancar();
}
