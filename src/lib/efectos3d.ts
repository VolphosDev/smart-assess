/**
 * Efectos 3D de los comodines de Aria (Three.js). Se importa de forma diferida: la librería solo
 * se descarga la primera vez que un alumno usa un comodín.
 *
 * ESTILO: sombreado de caricatura (MeshToonMaterial con 3 tonos) y contorno oscuro con la misma
 * tinta de Aria (#2B2140), dibujado con una copia invertida y algo más grande de cada figura.
 * Así el 3D se ve como los stickers del resto del juego, no como un render realista.
 *
 * Cámara ortográfica en píxeles de pantalla: (x, y) de la pantalla = (x, -y) en la escena.
 */
import * as THREE from "three";

const TINTA = 0x2b2140;

interface Animado {
    obj: THREE.Object3D;
    nace: number;
    dura: number;
    actualizar: (t: number, dt: number) => void; // t en [0, 1]
}

let renderer: THREE.WebGLRenderer | null = null;
let escena: THREE.Scene;
let camara: THREE.OrthographicCamera;
let lienzo: HTMLCanvasElement | null = null;
let animados: Animado[] = [];
let ultimo = 0;
let gradiente: THREE.DataTexture | null = null;

function rampaToon() {
    if (gradiente) return gradiente;
    const datos = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
    gradiente = new THREE.DataTexture(datos, 3, 1, THREE.RGBAFormat);
    gradiente.minFilter = THREE.NearestFilter;
    gradiente.magFilter = THREE.NearestFilter;
    gradiente.needsUpdate = true;
    return gradiente;
}

const toon = (color: number, extra: Partial<THREE.MeshToonMaterialParameters> = {}) =>
    new THREE.MeshToonMaterial({ color, gradientMap: rampaToon(), ...extra });

/** Figura con contorno de sticker: la misma geometría por detrás, en tinta y un poco más grande. */
function conContorno(geo: THREE.BufferGeometry, mat: THREE.Material, grosor = 1.12) {
    const grupo = new THREE.Group();
    const borde = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: TINTA, side: THREE.BackSide }));
    borde.scale.setScalar(grosor);
    grupo.add(borde, new THREE.Mesh(geo, mat));
    return grupo;
}

function asegurar() {
    if (renderer) return;
    lienzo = document.createElement("canvas");
    lienzo.setAttribute("aria-hidden", "true");
    Object.assign(lienzo.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "76" });
    document.body.appendChild(lienzo);
    renderer = new THREE.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    escena = new THREE.Scene();
    escena.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6);
    sol.position.set(-0.6, 1, 1.4);
    escena.add(sol);
    camara = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000);
    ajustar();
    window.addEventListener("resize", ajustar);
    ultimo = performance.now();
    requestAnimationFrame(bucle);
}

function ajustar() {
    if (!renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camara.left = 0; camara.right = w; camara.top = 0; camara.bottom = -h;
    camara.updateProjectionMatrix();
}

function liberar() {
    window.removeEventListener("resize", ajustar);
    escena?.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose?.();
    });
    renderer?.dispose();
    lienzo?.remove();
    renderer = null;
    lienzo = null;
}

function bucle(ahora: number) {
    if (!renderer) return;
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    for (const a of animados) {
        const t = (ahora - a.nace) / a.dura;
        if (t >= 0) a.actualizar(Math.min(1, t), dt);
    }
    const vivos = animados.filter((a) => ahora - a.nace < a.dura);
    for (const a of animados) if (!vivos.includes(a)) escena.remove(a.obj);
    animados = vivos;
    renderer.render(escena, camara);
    if (animados.length) requestAnimationFrame(bucle);
    else liberar();
}

function agregar(obj: THREE.Object3D, dura: number, actualizar: Animado["actualizar"], retraso = 0) {
    asegurar();
    escena.add(obj);
    obj.visible = retraso === 0;
    animados.push({ obj, nace: performance.now() + retraso, dura, actualizar: (t, dt) => { obj.visible = true; actualizar(t, dt); } });
}

const reducido = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const azar = (a: number, b: number) => a + Math.random() * (b - a);
/** Resorte simple 0→1 con un poco de exceso. */
const resorte = (t: number) => 1 - Math.exp(-7 * t) * Math.cos(10 * t);

// ── Reloj de arena ──────────────────────────────────────────────────────

/** Reloj de arena 3D: aparece con rebote, se voltea en el aire y se va encogiéndose. */
export function relojDeArena3D(x: number, y: number) {
    if (reducido()) return;
    const reloj = new THREE.Group();
    // Vidrio: dos conos unidos por la cintura (perfil girado).
    const perfil = [new THREE.Vector2(0.02, -1), new THREE.Vector2(0.62, -0.95), new THREE.Vector2(0.62, -0.7), new THREE.Vector2(0.12, -0.05),
        new THREE.Vector2(0.12, 0.05), new THREE.Vector2(0.62, 0.7), new THREE.Vector2(0.62, 0.95), new THREE.Vector2(0.02, 1)];
    reloj.add(conContorno(new THREE.LatheGeometry(perfil, 28), toon(0xe0f2fe, { transparent: true, opacity: 0.78 }), 1.08));
    // Arena: arriba se vacía, abajo se llena (se anima con la escala).
    const arenaArriba = conContorno(new THREE.ConeGeometry(0.48, 0.55, 24), toon(0xffc83d), 1.06);
    arenaArriba.rotation.x = Math.PI; arenaArriba.position.y = 0.42;
    const arenaAbajo = conContorno(new THREE.ConeGeometry(0.5, 0.45, 24), toon(0xffc83d), 1.06);
    arenaAbajo.position.y = -0.68;
    reloj.add(arenaArriba, arenaAbajo);
    // Tapas y columnas de madera dorada.
    for (const s of [-1, 1]) {
        const tapa = conContorno(new THREE.CylinderGeometry(0.85, 0.85, 0.16, 28), toon(0xb7790a), 1.1);
        tapa.position.y = s * 1.06;
        reloj.add(tapa);
    }
    for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
        const col = conContorno(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 10), toon(0x8a5a07), 1.25);
        col.position.set(Math.cos(a) * 0.74, 0, Math.sin(a) * 0.74);
        reloj.add(col);
    }
    const escala = 46;
    reloj.position.set(x, -y, 0);
    agregar(reloj, 1300, (t) => {
        const entra = Math.min(1, t / 0.3), sale = t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1;
        reloj.scale.setScalar(escala * resorte(entra) * sale);
        // Se voltea entre el 25 % y el 70 % con un giro de lado para que se lea el volumen.
        const g = Math.min(1, Math.max(0, (t - 0.25) / 0.45));
        const suave = g * g * (3 - 2 * g);
        reloj.rotation.z = suave * Math.PI;
        reloj.rotation.y = 0.5 + Math.sin(t * Math.PI) * 0.6;
        reloj.rotation.x = 0.25;
        reloj.position.y = -y + Math.sin(t * Math.PI) * 26;
        arenaArriba.scale.setScalar(Math.max(0.05, 1 - suave));
        arenaAbajo.scale.setScalar(0.2 + suave * 0.8);
    });
}

// ── Hielo ───────────────────────────────────────────────────────────────

/** Esquirlas de hielo 3D que estallan desde (x, y), girando en los tres ejes y cayendo. */
export function esquirlasHielo3D(x: number, y: number, cantidad = 18) {
    if (reducido()) return;
    const colores = [0xbae6fd, 0x7dd3fc, 0xe0f2fe, 0x38bdf8];
    for (let i = 0; i < cantidad; i++) {
        const geo = i % 3 === 0 ? new THREE.OctahedronGeometry(1, 0) : new THREE.TetrahedronGeometry(1, 0);
        const pieza = conContorno(geo, toon(colores[i % colores.length], { emissive: 0x0c4a6e, emissiveIntensity: 0.08 }), 1.14);
        const tam = azar(7, 16);
        pieza.scale.set(tam * azar(0.6, 1), tam * azar(1, 1.8), tam * azar(0.6, 1));
        const a = azar(-Math.PI, Math.PI), v = azar(180, 560);
        const vel = new THREE.Vector3(Math.cos(a) * v, Math.sin(a) * v + 220, azar(-200, 200));
        const giro = new THREE.Vector3(azar(-9, 9), azar(-9, 9), azar(-9, 9));
        pieza.position.set(x + azar(-24, 24), -y + azar(-18, 18), 0);
        const base = pieza.scale.clone();
        agregar(pieza, azar(900, 1300), (t, dt) => {
            vel.y -= 1300 * dt;           // gravedad (y de la escena crece hacia arriba)
            vel.multiplyScalar(Math.pow(0.55, dt));
            pieza.position.addScaledVector(vel, dt);
            pieza.rotation.x += giro.x * dt; pieza.rotation.y += giro.y * dt; pieza.rotation.z += giro.z * dt;
            const s = t > 0.7 ? 1 - (t - 0.7) / 0.3 : Math.min(1, t / 0.08);
            pieza.scale.set(base.x * s, base.y * s, base.z * s);
        });
    }
    // Un cristal grande en el centro del impacto que brota y se rompe.
    const cristal = conContorno(new THREE.OctahedronGeometry(1, 0), toon(0xe0f2fe), 1.1);
    cristal.position.set(x, -y, 0);
    agregar(cristal, 520, (t) => {
        cristal.scale.set(26 * resorte(t) * (1 - t * 0.6), 42 * resorte(t) * (1 - t * 0.6), 26);
        cristal.rotation.y = t * 3;
        cristal.rotation.z = 0.3;
    });
}

// ── Zarpazo ─────────────────────────────────────────────────────────────

/** Escombros 3D del zarpazo: astillas naranjas y trozos de papel que salen hacia el lado del golpe. */
export function escombros3D(x: number, y: number, dir: number) {
    if (reducido()) return;
    for (let i = 0; i < 16; i++) {
        const papel = i % 2 === 0;
        const geo = papel ? new THREE.BoxGeometry(1, 0.7, 0.08) : new THREE.TetrahedronGeometry(1, 0);
        const pieza = conContorno(geo, toon(papel ? 0xfff7ed : i % 3 ? 0xff7a2f : 0xffc83d), papel ? 1.18 : 1.14);
        const tam = papel ? azar(9, 15) : azar(6, 11);
        pieza.scale.setScalar(tam);
        const a = (dir > 0 ? 0 : Math.PI) + azar(-0.9, 0.9);
        const v = azar(260, 640);
        const vel = new THREE.Vector3(Math.cos(a) * v, Math.abs(Math.sin(a)) * v * 0.6 + azar(120, 320), azar(-260, 260));
        const giro = new THREE.Vector3(azar(-12, 12), azar(-12, 12), azar(-12, 12));
        pieza.position.set(x + azar(-30, 30), -y + azar(-50, 50), 0);
        agregar(pieza, azar(800, 1150), (t, dt) => {
            vel.y -= 1400 * dt;
            vel.x *= Math.pow(0.5, dt);
            pieza.position.addScaledVector(vel, dt);
            pieza.rotation.x += giro.x * dt; pieza.rotation.y += giro.y * dt; pieza.rotation.z += giro.z * dt;
            pieza.scale.setScalar(tam * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1));
        }, i * 12);
    }
}
