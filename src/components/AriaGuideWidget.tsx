import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, ChevronUp, FolderOpen, History,
  Home, Minimize2, MousePointerClick, PencilLine, Play, RotateCcw, Sparkles, SunMoon, Volume2, VolumeX, X,
  type LucideIcon,
} from "lucide-react";
import { AriaSvg, type ExpresionAria } from "@/components/Aria";
import { cn } from "@/lib/utils";
import { CURSO_DEMO_ID, RUTA_PRACTICA_DEMO, SEMANA_DEMO_ID } from "@/lib/tourDemo";
import { EVENTO_ABRIR_BIENVENIDA } from "@/lib/ariaEventos";

/**
 * Guía interactiva de Aria: bienvenida, centro de misiones y recorrido sobre la app real.
 *
 * COMO SE ORGANIZA. El recorrido son MISIONES cortas (inicio, brillo, curso, semana,
 * responder, mapa, historial). "Recorrido completo" las encadena todas; desde el menú se
 * puede repetir solo una. Un tutorial de 50 pasos seguidos no lo termina nadie; siete
 * misiones de uno o dos minutos, sí, y el alumno vuelve a la que necesita cuando la necesita.
 *
 * DONDE PRACTICA. Las misiones de curso, semana y responder usan el curso de ejemplo de
 * lib/tourDemo: existe solo en el navegador, así que abrir material o "responder" durante el
 * tutorial no genera preguntas con IA ni ensucia el historial ni los datos del estudio.
 *
 * DONDE NO APARECE ARIA. En las pantallas de evaluación real no se muestra ni el botón
 * flotante: ahí sería un "seductive detail" (Harp y Mayer, 1998; ver Aria.tsx).
 */

const CLAVE_BIENVENIDA = "aria_welcome_seen";
const CLAVE_VOZ = "aria_voz";
const CLAVE_COMPLETADAS = "aria_misiones_completadas";

const RUTA_CURSO = `/app/curso/${CURSO_DEMO_ID}`;
const RUTA_SEMANA = `${RUTA_CURSO}/semana/${SEMANA_DEMO_ID}`;

type MisionId = "inicio" | "vista" | "curso" | "semana" | "responder" | "mapa" | "historial";

interface Mision {
  id: MisionId;
  titulo: string;
  resumen: string;
  icono: LucideIcon;
  minutos: number;
  tono: string;
}

const MISIONES: Mision[] = [
  { id: "inicio", titulo: "Tu panel de inicio", resumen: "Tu próximo paso, tu racha y tus cursos", icono: Home, minutos: 1, tono: "from-violet-500 to-indigo-500" },
  { id: "vista", titulo: "Brillo y vista", resumen: "Claro, lectura u oscuro: elige cómo leer", icono: SunMoon, minutos: 1, tono: "from-amber-400 to-orange-500" },
  { id: "curso", titulo: "Entrar a un curso", resumen: "Abre un PDF de ejemplo y muévete por él", icono: FolderOpen, minutos: 1, tono: "from-emerald-500 to-teal-500" },
  { id: "semana", titulo: "Tu semana paso a paso", resumen: "Material, diagnóstico y formas de practicar", icono: CalendarDays, minutos: 2, tono: "from-sky-500 to-blue-600" },
  { id: "responder", titulo: "Cómo responder", resumen: "Práctica de ejemplo con 3 tipos de pregunta", icono: PencilLine, minutos: 2, tono: "from-pink-500 to-rose-500" },
  { id: "mapa", titulo: "Mapa de conocimiento", resumen: "Qué temas dominas y cuáles repasar", icono: Brain, minutos: 1, tono: "from-fuchsia-500 to-purple-600" },
  { id: "historial", titulo: "Historial de notas", resumen: "Tus intentos, notas y retroalimentación", icono: History, minutos: 1, tono: "from-slate-500 to-slate-700" },
];

interface PasoTour {
  id: string;
  mision: MisionId | "fin";
  titulo: string;
  texto: string;
  estado: ExpresionAria;
  /** Elemento a resaltar. Se busca el primero VISIBLE (la nav móvil y la de escritorio comparten anclas). */
  objetivo?: string;
  /** Si existe, el paso avanza cuando el alumno hace clic en un elemento que coincide. */
  clic?: string;
  /** Deja usar el hueco resaltado sin que eso avance el paso (probar el tema, leer el PDF). */
  interactivo?: boolean;
  /** Ruta donde vive el paso; al entrar en él se navega si hace falta. */
  ruta?: string;
  /** Elementos condicionales (p. ej. "temas para reforzar"): si no aparecen, se salta el paso. */
  saltarSiFalta?: boolean;
  boton?: string;
}

const PASOS: PasoTour[] = [
  // ── Inicio ──────────────────────────────────────────────────────────────
  { id: "bienvenida", mision: "inicio", ruta: "/app", estado: "emocionado", boton: "¡Empecemos!",
    titulo: "¡Hola! Soy Aria, tu tutora", texto: "Te voy a señalar cada cosa en la aplicación real. Tú haces los clics; yo te digo dónde y para qué sirve." },
  { id: "hero-banner", mision: "inicio", ruta: "/app", objetivo: '[data-guide="hero-banner"]', estado: "guino",
    titulo: "Tu siguiente paso, siempre arriba", texto: "Este panel mira cómo vas y te deja un solo botón con lo que más te conviene hacer hoy." },
  { id: "stats-cards", mision: "inicio", ruta: "/app", objetivo: '[data-guide="stats-cards"]', estado: "idle",
    titulo: "Racha, promedio y prácticas", texto: "Cuántos días seguidos practicas, tu promedio sobre 20 y cuántas prácticas llevas." },
  { id: "temas-reforzar", mision: "inicio", ruta: "/app", objetivo: '[data-guide="temas-reforzar"]', estado: "pensando", saltarSiFalta: true,
    titulo: "Temas que te están costando", texto: "Con tus respuestas detecto los temas concretos donde más fallas. Empieza por el primero." },
  { id: "tarjeta-progreso", mision: "inicio", ruta: "/app", objetivo: '[data-guide="tarjeta-progreso"]', estado: "orgullosa", saltarSiFalta: true,
    titulo: "Tus puntos de progreso", texto: "Cada práctica suma puntos y te hace subir de rango. Las recomendadas dan puntos extra." },
  { id: "seccion-cursos", mision: "inicio", ruta: "/app", objetivo: '[data-guide="seccion-cursos"]', estado: "feliz",
    titulo: "Tus cursos", texto: "Aquí están tus asignaturas. Te agregué un curso de ejemplo para practicar sin miedo: no guarda notas y desaparece al terminar." },

  // ── Brillo y vista ─────────────────────────────────────────────────────
  { id: "tema-selector", mision: "vista", objetivo: '[data-guide="selector-tema"]', estado: "idle",
    titulo: "Cambia el brillo cuando quieras", texto: "Sol es el modo claro, el libro es el modo Lectura y la luna es el modo oscuro." },
  { id: "tema-lectura", mision: "vista", objetivo: '[data-guide="selector-tema"]', clic: '[data-guide="tema-suave"]', estado: "leyendo",
    titulo: "Prueba el modo Lectura", texto: "Toca el libro. Baja el brillo y usa un fondo crema: cansa menos la vista cuando lees un buen rato." },
  { id: "tema-elige", mision: "vista", objetivo: '[data-guide="selector-tema"]', interactivo: true, estado: "guino", boton: "Me quedo con este",
    titulo: "Elige el que más te guste", texto: "Prueba los tres. Tu elección se recuerda la próxima vez que entres." },
  { id: "boton-ayuda", mision: "vista", objetivo: '[data-guide="boton-ayuda"]', estado: "feliz", saltarSiFalta: true,
    titulo: "Si te pierdes, llámame", texto: "Este botón me vuelve a abrir. Puedes repetir solo la misión que necesites." },

  // ── Entrar a un curso ──────────────────────────────────────────────────
  { id: "clic-curso-demo", mision: "curso", ruta: "/app", objetivo: '[data-guide="tarjeta-curso-demo"]', clic: '[data-guide="tarjeta-curso-demo"]', estado: "emocionado",
    titulo: "Entra al curso de ejemplo", texto: "Toca la tarjeta con la etiqueta «Ejemplo de Aria»." },
  { id: "curso-hero", mision: "curso", ruta: RUTA_CURSO, objetivo: '[data-guide="curso-hero"]', estado: "feliz",
    titulo: "Cada curso tiene su color", texto: "Ese color te acompaña dentro de cada semana, así sabes siempre en qué asignatura estás." },
  { id: "semana-fila", mision: "curso", ruta: RUTA_CURSO, objetivo: '[data-guide="semana-fila"]', estado: "idle",
    titulo: "Las semanas se abren y se cierran", texto: "Toca una fila para desplegarla. La semana que te toca se abre sola al entrar." },
  { id: "abrir-pdf", mision: "curso", ruta: RUTA_CURSO, objetivo: '[data-guide="material-item"][data-ext="pdf"]', clic: '[data-guide="material-item"][data-ext="pdf"]', estado: "leyendo",
    titulo: "Abre el material en PDF", texto: "Toca el PDF para leerlo sin salir de Semantika." },
  { id: "visor-pdf", mision: "curso", objetivo: '[data-guide="visor-material"]', interactivo: true, estado: "leyendo", saltarSiFalta: true,
    titulo: "Así se lee el material", texto: "Desplázate por las páginas con la rueda o el dedo. Puedes acercar con los controles del propio visor." },
  { id: "visor-acciones", mision: "curso", objetivo: '[data-guide="visor-acciones"]', estado: "guino", saltarSiFalta: true,
    titulo: "Pantalla completa o descarga", texto: "Si en el celular se ve pequeño, ábrelo en pantalla completa. También puedes descargarlo." },
  { id: "cerrar-visor", mision: "curso", objetivo: '[data-guide="visor-cerrar"]', clic: '[data-guide="visor-cerrar"]', estado: "idle", saltarSiFalta: true,
    titulo: "Ciérralo con la X", texto: "Cuando termines de leer, cierra el visor para volver al curso." },
  { id: "ponte-a-prueba", mision: "curso", ruta: RUTA_CURSO, objetivo: '[data-guide="boton-ponte-a-prueba"]', clic: '[data-guide="boton-ponte-a-prueba"]', estado: "emocionado",
    titulo: "Ahora, ponte a prueba", texto: "Después de leer, este botón te lleva a la semana para practicar." },

  // ── Tu semana ──────────────────────────────────────────────────────────
  { id: "semana-hero", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="semana-hero"]', estado: "guino",
    titulo: "Bienvenido a tu semana", texto: "Lleva el color de su curso. Y ahí estoy yo, con una pista de lo que te toca hacer." },
  { id: "semana-pasos", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="semana-pasos"]', estado: "idle",
    titulo: "Tres pasos, siempre en orden", texto: "Lee el material, elige el tema y practica. Toca cualquiera para saltar a esa parte." },
  { id: "abrir-word", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="leer-material"][data-ext="docx"]', clic: '[data-guide="leer-material"][data-ext="docx"]', estado: "leyendo",
    titulo: "También hay material en Word", texto: "Toca el botón del documento Word para abrirlo." },
  { id: "visor-word", mision: "semana", objetivo: '[data-guide="visor-material"]', interactivo: true, estado: "leyendo", saltarSiFalta: true,
    titulo: "Los Word se leen como una página", texto: "Se muestran como una hoja blanca que puedes desplazar. Si prefieres tu programa de siempre, descárgalo." },
  { id: "cerrar-visor-word", mision: "semana", objetivo: '[data-guide="visor-cerrar"]', clic: '[data-guide="visor-cerrar"]', estado: "idle", saltarSiFalta: true,
    titulo: "Cierra el documento", texto: "Toca la X para seguir con la semana." },
  { id: "banner-diagnostico", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="banner-diagnostico"]', estado: "pensando",
    titulo: "Primero, el diagnóstico", texto: "En tus cursos reales verás «Realizar diagnóstico»: unas preguntas cortas, sin nota, para saber por dónde empezar contigo. Aquí ya está hecho para que veas el resultado." },
  { id: "elegir-tema", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="elegir-tema"]', interactivo: true, estado: "idle", saltarSiFalta: true,
    titulo: "Elige sobre qué te pregunto", texto: "Marca los temas que quieras practicar. Si no marcas ninguno, entran todos." },
  { id: "mapa-calor-semana", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="mapa-calor-semana"]', estado: "idle", saltarSiFalta: true,
    titulo: "Cómo llevas esta semana", texto: "Cuando practiques, aquí verás tus temas: lo azul ya lo dominas y lo rojo conviene repasarlo." },
  { id: "cantidad-preguntas", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="cantidad-preguntas"]', interactivo: true, estado: "guino",
    titulo: "¿Cuántas preguntas?", texto: "Cinco para un repaso rápido, diez si tienes más tiempo." },
  { id: "tarjetas-modos", mision: "semana", ruta: RUTA_SEMANA, objetivo: '[data-guide="tarjetas-modos"]', estado: "feliz",
    titulo: "Elige cómo practicar", texto: "Todas evalúan lo mismo, cambia la forma. Las marcadas «Recomendada» dan puntos extra, pero ninguna está bloqueada." },

  // ── Cómo responder ─────────────────────────────────────────────────────
  { id: "elegir-modo", mision: "responder", ruta: RUTA_SEMANA, objetivo: '[data-guide="modo-OPCION_MULTIPLE"]', clic: '[data-guide="modo-OPCION_MULTIPLE"]', estado: "emocionado",
    titulo: "Vamos a practicar", texto: "Toca «Opción múltiple». Es una práctica de ejemplo: nada de lo que respondas cuenta." },
  { id: "practica-cabecera", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-cabecera"]', estado: "idle",
    titulo: "Arriba ves en qué pregunta vas", texto: "Cada barrita es una pregunta: se pinta de verde si aciertas y de rojo si fallas." },
  { id: "marcar-opcion", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-pregunta"]:not([data-respondida]) label', estado: "pensando",
    titulo: "Lee y elige una alternativa", texto: "Lee la pregunta completa y toca la alternativa que creas correcta." },
  { id: "comprobar", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-comprobar"]', estado: "esperando",
    titulo: "Revisa y comprueba", texto: "Todavía puedes cambiar de alternativa. Cuando estés seguro, toca «Comprobar»." },
  { id: "retroalimentacion", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-siguiente"]', estado: "feliz",
    titulo: "Lee siempre la explicación", texto: "Verde es acierto y rojo es fallo. Si te equivocas no pasa nada: la explicación es lo que más enseña. Luego toca «Siguiente»." },
  { id: "vf-marcar", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-pregunta"]:not([data-respondida]) label', estado: "guino",
    titulo: "Verdadero o falso", texto: "Decide si el enunciado es correcto y toca VERDADERO o FALSO." },
  { id: "vf-comprobar", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-comprobar"]', estado: "esperando",
    titulo: "Comprueba tu respuesta", texto: "Toca «Comprobar» para ver si acertaste." },
  { id: "vf-siguiente", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-siguiente"]', estado: "feliz",
    titulo: "¡Muy bien! Una más", texto: "Lee la explicación y pasa a la última pregunta." },
  { id: "abierta", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-comprobar"]', estado: "leyendo",
    titulo: "Responde con tus palabras", texto: "En las preguntas abiertas no busco una frase perfecta, sino que expliques la idea. Escribe algo (o usa la respuesta de ejemplo) y toca «Comprobar»." },
  { id: "abierta-resultados", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-zona"]', clic: '[data-guide="demo-siguiente"]', estado: "feliz",
    titulo: "Último paso", texto: "Toca «Ver resultados» para terminar la práctica." },
  { id: "resultado", mision: "responder", ruta: RUTA_PRACTICA_DEMO, objetivo: '[data-guide="demo-resultado"]', estado: "celebrando",
    titulo: "¡Práctica terminada!", texto: "Al final ves tu nota sobre 20 y el resumen de cada respuesta. En tus cursos reales esto se guarda en tu Historial." },

  // ── Mapa de conocimiento ───────────────────────────────────────────────
  { id: "clic-mapa", mision: "mapa", objetivo: '[data-guide="nav-mapa"]', clic: '[data-guide="nav-mapa"]', estado: "guino",
    titulo: "Abre tu Mapa de conocimiento", texto: "Toca «Mapa de Conocimiento» en el menú." },
  { id: "resumen-mapa-stats", mision: "mapa", ruta: "/app/mapa-conocimiento", objetivo: '[data-guide="resumen-mapa-stats"]', estado: "idle",
    titulo: "Tu resumen en números", texto: "Cuántos temas llevas evaluados, cuántos dominas, cuántos van en progreso y cuáles necesitan refuerzo." },
  { id: "explicacion-mapa", mision: "mapa", ruta: "/app/mapa-conocimiento", objetivo: '[data-guide="mapa-nodos"]', estado: "pensando",
    titulo: "Tus temas por colores", texto: "Verde: dominado (75% o más). Amarillo: en progreso. Rojo: conviene reforzarlo." },
  { id: "matriz-cursos", mision: "mapa", ruta: "/app/mapa-conocimiento", objetivo: '[data-guide="matriz-cursos"]', estado: "idle", saltarSiFalta: true,
    titulo: "Cursos por semanas", texto: "Cada casilla cruza un curso con una semana y muestra tu porcentaje de aciertos." },
  { id: "curva-progreso", mision: "mapa", ruta: "/app/mapa-conocimiento", objetivo: '[data-guide="curva-progreso"]', estado: "orgullosa", saltarSiFalta: true,
    titulo: "Tu curva de avance", texto: "Tu nota promedio semana a semana. La idea es que vaya subiendo." },
  { id: "desglose-panel", mision: "mapa", ruta: "/app/mapa-conocimiento", objetivo: '[data-guide="desglose-panel"]', estado: "idle", saltarSiFalta: true,
    titulo: "El detalle de cada tema", texto: "Toca un tema y aquí verás tus aciertos, cuántas preguntas respondiste y su nivel de dificultad." },

  // ── Historial ──────────────────────────────────────────────────────────
  { id: "clic-historial", mision: "historial", objetivo: '[data-guide="nav-historial"]', clic: '[data-guide="nav-historial"]', estado: "guino",
    titulo: "Abre tu Historial", texto: "Toca «Historial» en el menú." },
  { id: "boton-descargar", mision: "historial", ruta: "/app/historial", objetivo: '[data-guide="boton-descargar"]', estado: "idle", saltarSiFalta: true,
    titulo: "Descarga tus respuestas", texto: "Guarda en tu computadora un informe con tus preguntas, respuestas y explicaciones." },
  { id: "grafico-evolucion", mision: "historial", ruta: "/app/historial", objetivo: '[data-guide="grafico-evolucion"]', estado: "orgullosa", saltarSiFalta: true,
    titulo: "Cómo evolucionan tus notas", texto: "La gráfica de tus últimas prácticas." },
  { id: "tarjeta-promedio", mision: "historial", ruta: "/app/historial", objetivo: '[data-guide="tarjeta-promedio"]', estado: "feliz", saltarSiFalta: true,
    titulo: "Tu promedio general", texto: "Tu nota promedio de todas las prácticas, sobre 20." },
  { id: "tarjetas-historial", mision: "historial", ruta: "/app/historial", objetivo: '[data-guide="tarjetas-historial"]', estado: "idle", saltarSiFalta: true,
    titulo: "Cada práctica, con su explicación", texto: "Abre cualquier intento para repasar tus respuestas y los consejos que te dejé." },
];

const PASO_FINAL: PasoTour = {
  id: "finalizar-tour", mision: "fin", estado: "celebrando", boton: "¡A practicar!",
  titulo: "¡Misión cumplida!", texto: "Ya sabes moverte por Semantika. El curso de ejemplo desaparece ahora; tus cursos reales te esperan en el inicio.",
};

function leerCompletadas(): MisionId[] {
  try { return JSON.parse(localStorage.getItem(CLAVE_COMPLETADAS) || "[]"); } catch { return []; }
}

function buscarVisible(selector: string): Element | null {
  for (const el of Array.from(document.querySelectorAll(selector))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

interface Caja { top: number; left: number; width: number; height: number }

const RELLENO = 10;

export default function AriaGuideWidget({ pausado = false }: { pausado?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [bienvenida, setBienvenida] = useState(false);
  const [pasos, setPasos] = useState<PasoTour[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [caja, setCaja] = useState<Caja | null>(null);
  const [minimizado, setMinimizado] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [completadas, setCompletadas] = useState<MisionId[]>(leerCompletadas);
  const [voz, setVoz] = useState(() => {
    try { return localStorage.getItem(CLAVE_VOZ) === "1"; } catch { return false; }
  });
  const direccion = useRef<1 | -1>(1);
  /** Saltar una misión no es completarla: sin esta marca, el menú la pintaba con check. */
  const saltando = useRef(false);

  const tourActivo = pasos !== null;
  const paso = pasos?.[indice];

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const primerNombre = (user.name || user.nombre || "").split(" ")[0] || "";

  const enEvaluacionReal = location.pathname.includes("/evaluacion/");

  // Un recorrido no sobrevive a una recarga (su estado vive en memoria). Si quedó la marca
  // de "activo" en localStorage, se limpia para que la tarjeta demo no se quede colgada.
  useEffect(() => {
    if (localStorage.getItem("aria_tour_active") === "true") {
      localStorage.removeItem("aria_tour_active");
      localStorage.removeItem("aria_tour_step");
      window.dispatchEvent(new Event("aria_tour_change"));
    }
    // Y si la recarga pilló al alumno dentro del curso de ejemplo, se le saca: sin recorrido
    // ese curso no debe seguir existiendo para él.
    if (location.pathname.startsWith(RUTA_CURSO) || location.pathname === RUTA_PRACTICA_DEMO) {
      navigate("/app", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bienvenida automática en el primer ingreso (y nunca encima del consentimiento de datos).
  useEffect(() => {
    if (pausado || tourActivo) return;
    if (!localStorage.getItem(CLAVE_BIENVENIDA) && location.pathname === "/app") setBienvenida(true);
  }, [location.pathname, pausado, tourActivo]);

  useEffect(() => {
    const abrir = () => { setMenuAbierto(false); setBienvenida(true); };
    window.addEventListener(EVENTO_ABRIR_BIENVENIDA, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_BIENVENIDA, abrir);
  }, []);

  const hablar = useCallback((texto: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/[«»*#]/g, ""));
    u.lang = "es-ES";
    u.rate = 1.02;
    u.pitch = 1.15;
    u.onstart = () => setHablando(true);
    u.onend = () => setHablando(false);
    u.onerror = () => setHablando(false);
    window.speechSynthesis.speak(u);
  }, []);

  const callar = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setHablando(false);
  };

  const marcarCompletada = useCallback((id: MisionId | "fin") => {
    if (id === "fin") return;
    setCompletadas((prev) => {
      if (prev.includes(id)) return prev;
      const nuevas = [...prev, id];
      try { localStorage.setItem(CLAVE_COMPLETADAS, JSON.stringify(nuevas)); } catch { /* sin persistencia */ }
      return nuevas;
    });
  }, []);

  const iniciar = (misiones?: MisionId[]) => {
    const lista = misiones ? PASOS.filter((p) => misiones.includes(p.mision as MisionId)) : PASOS;
    try { localStorage.setItem(CLAVE_BIENVENIDA, "true"); } catch { /* sin persistencia */ }
    localStorage.setItem("aria_tour_active", "true");
    window.dispatchEvent(new Event("aria_tour_change"));
    direccion.current = 1;
    setBienvenida(false);
    setMenuAbierto(false);
    setMinimizado(false);
    setIndice(0);
    setPasos([...lista, PASO_FINAL]);
  };

  const finalizar = useCallback(() => {
    callar();
    localStorage.removeItem("aria_tour_active");
    localStorage.removeItem("aria_tour_step");
    window.dispatchEvent(new Event("aria_tour_change"));
    setPasos(null);
    setCaja(null);
    // El curso de ejemplo "desaparece": si el alumno terminó dentro de él, vuelve al inicio.
    if (location.pathname.startsWith(RUTA_CURSO) || location.pathname === RUTA_PRACTICA_DEMO) navigate("/app");
  }, [location.pathname, navigate]);

  /** Avanza solo si seguimos en el paso `desde`: evita saltos dobles (un clic en <label> dispara dos eventos). */
  const avanzarDesde = useCallback((desde: number) => {
    direccion.current = 1;
    setIndice((i) => (i === desde ? i + 1 : i));
  }, []);

  const retroceder = () => {
    direccion.current = -1;
    setIndice((i) => Math.max(0, i - 1));
  };

  const saltarMision = () => {
    if (!pasos || !paso) return;
    const siguiente = pasos.findIndex((p, i) => i > indice && p.mision !== paso.mision);
    direccion.current = 1;
    saltando.current = true;
    setIndice(siguiente === -1 ? pasos.length - 1 : siguiente);
  };

  // Fin del recorrido al pasar del último paso.
  useEffect(() => {
    if (pasos && indice >= pasos.length) {
      marcarCompletada(pasos[pasos.length - 1].mision);
      finalizar();
    }
  }, [indice, pasos, finalizar, marcarCompletada]);

  // Al entrar en un paso: publicarlo (las páginas muestran datos de ejemplo), navegar a su
  // ruta, hablar, y dar por completada la misión anterior si acabamos de cambiar de misión.
  useEffect(() => {
    if (!pasos || !paso) return;
    localStorage.setItem("aria_tour_step", paso.id);
    window.dispatchEvent(new Event("aria_tour_change"));

    const anterior = pasos[indice - 1];
    if (direccion.current === 1 && !saltando.current && anterior && anterior.mision !== paso.mision) {
      marcarCompletada(anterior.mision);
    }
    saltando.current = false;

    if (paso.ruta && location.pathname !== paso.ruta) navigate(paso.ruta);
    if (voz) hablar(`${paso.titulo}. ${paso.texto}`);
    // Solo al cambiar de paso: si dependiera de la ruta, el alumno no podría navegar por su cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasos, indice]);

  // Seguimiento del elemento resaltado. Se mide en bucle corto en vez de una sola vez
  // porque los objetivos aparecen tarde (datos que cargan, acordeones que se abren,
  // modales), se mueven con animaciones y cambian de tamaño con el scroll.
  useEffect(() => {
    if (!paso) { setCaja(null); return; }
    setCaja(null);
    if (!paso.objetivo) return;

    const desde = indice;
    const inicio = Date.now();
    let desplazado = false;

    const medir = () => {
      const el = buscarVisible(paso.objetivo!);
      if (!el) {
        setCaja((prev) => (prev ? null : prev));
        if (paso.saltarSiFalta && Date.now() - inicio > 1800) {
          setIndice((i) => (i === desde ? Math.max(0, i + direccion.current) : i));
        }
        return;
      }
      const r = el.getBoundingClientRect();
      if (!desplazado) {
        desplazado = true;
        const vh = window.innerHeight;
        const fuera = r.top < 72 || r.bottom > vh - 16;
        // scrollTo y no scrollIntoView: con block "start" el elemento quedaba debajo de la
        // cabecera sticky (64 px). Los objetivos fijos (cabecera, modales) nunca están "fuera".
        if (fuera) {
          const destino = r.height > vh * 0.55 ? r.top - 84 : r.top - (vh - r.height) / 2;
          window.scrollTo({ top: window.scrollY + destino, behavior: "smooth" });
        }
      }
      setCaja((prev) =>
        prev && Math.abs(prev.top - r.top) < 1 && Math.abs(prev.left - r.left) < 1
          && Math.abs(prev.width - r.width) < 1 && Math.abs(prev.height - r.height) < 1
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height });
    };

    medir();
    const id = window.setInterval(medir, 120);
    window.addEventListener("scroll", medir, { capture: true, passive: true });
    window.addEventListener("resize", medir, { passive: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", medir, { capture: true });
      window.removeEventListener("resize", medir);
    };
  }, [paso, indice]);

  // Pasos que avanzan con un clic real del alumno. Se escucha en `document` (fase de
  // captura) y se compara con `closest`: así funciona aunque el botón aparezca después de
  // entrar al paso o se vuelva a montar, que era lo que dejaba colgado el tour anterior.
  useEffect(() => {
    if (!paso?.clic) return;
    const desde = indice;
    const selector = paso.clic;
    const alClic = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.(selector)) return;
      window.setTimeout(() => avanzarDesde(desde), 260);
    };
    document.addEventListener("click", alClic, true);
    return () => document.removeEventListener("click", alClic, true);
  }, [paso, indice, avanzarDesde]);

  // Teclado: Esc sale, flechas navegan (salvo si el alumno está escribiendo).
  useEffect(() => {
    if (!tourActivo) return;
    const alTecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") finalizar();
      else if (e.key === "ArrowRight" && paso && !paso.clic) avanzarDesde(indice);
      else if (e.key === "ArrowLeft") retroceder();
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [tourActivo, paso, indice, finalizar, avanzarDesde]);

  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const alternarVoz = () => {
    setVoz((v) => {
      const nueva = !v;
      try { localStorage.setItem(CLAVE_VOZ, nueva ? "1" : "0"); } catch { /* sin persistencia */ }
      if (!nueva) callar();
      else if (paso) hablar(`${paso.titulo}. ${paso.texto}`);
      return nueva;
    });
  };

  const misionesDelRecorrido = useMemo(
    () => (pasos ? Array.from(new Set(pasos.map((p) => p.mision))).filter((m): m is MisionId => m !== "fin") : []),
    [pasos],
  );

  return (
    <>
      {/* ── Botón flotante ─────────────────────────────────────────────── */}
      {!tourActivo && !bienvenida && !enEvaluacionReal && (
        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label="Abrir la guía de Aria"
          aria-expanded={menuAbierto}
          className="group fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2.5 rounded-full bg-card/95 backdrop-blur border border-violet-500/30 shadow-lg shadow-violet-500/10 pl-1.5 pr-4 py-1.5 hover:shadow-xl hover:shadow-violet-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <span className="relative w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 p-[2px] shrink-0">
            <span className="grid place-items-center w-full h-full rounded-full bg-violet-50 dark:bg-violet-950 overflow-hidden">
              <AriaSvg estado={menuAbierto ? "feliz" : "idle"} recorte="cara" className="w-10 h-10 translate-y-0.5" />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-card" />
          </span>
          <span className="flex flex-col items-start leading-tight text-left">
            <span className="text-[13px] font-display font-bold text-foreground">¿Te ayudo?</span>
            <span className="text-[11px] text-muted-foreground">Guía de Aria</span>
          </span>
        </button>
      )}

      {/* ── Centro de misiones ─────────────────────────────────────────── */}
      <AnimatePresence>
        {menuAbierto && !tourActivo && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-40 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 text-white overflow-hidden">
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 relative">
                <AriaSvg estado="guino" recorte="cara" className="w-14 h-14 drop-shadow" />
                <div>
                  <p className="font-display font-bold text-base leading-tight">Centro de misiones</p>
                  <p className="text-xs text-white/85">{completadas.length} de {MISIONES.length} completadas</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${(completadas.length / MISIONES.length) * 100}%` }} />
              </div>
            </div>

            <div className="p-3 max-h-[min(420px,55vh)] overflow-y-auto">
              <button
                type="button"
                onClick={() => iniciar()}
                className="w-full flex items-center gap-3 p-3 mb-2 rounded-2xl bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/25 text-left transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-violet-600 text-white grid place-items-center shrink-0">
                  <Play className="w-4 h-4 fill-white" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-display font-bold text-sm">Recorrido completo</span>
                  <span className="block text-[11px] text-muted-foreground">Las 7 misiones seguidas · unos 8 min</span>
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <ul className="space-y-1">
                {MISIONES.map((m) => {
                  const hecha = completadas.includes(m.id);
                  const Icono = m.icono;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => iniciar([m.id])}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted text-left transition-colors group"
                      >
                        <span className={cn("w-9 h-9 rounded-xl grid place-items-center text-white bg-gradient-to-br shrink-0", m.tono)}>
                          <Icono className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold leading-tight">{m.titulo}</span>
                          <span className="block text-[11px] text-muted-foreground truncate">{m.resumen}</span>
                        </span>
                        {hecha ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white grid place-items-center shrink-0" title="Completada">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">{m.minutos} min</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
              <button type="button" onClick={alternarVoz} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                {voz ? <Volume2 className="w-3.5 h-3.5 text-violet-500" /> : <VolumeX className="w-3.5 h-3.5" />}
                Voz {voz ? "activada" : "apagada"}
              </button>
              <button type="button" onClick={() => { setMenuAbierto(false); setBienvenida(true); }} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                <RotateCcw className="w-3 h-3" /> Ver bienvenida
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bienvenida ─────────────────────────────────────────────────── */}
      {bienvenida && !tourActivo && createPortal(
        <Bienvenida
          nombre={primerNombre}
          voz={voz}
          onVoz={alternarVoz}
          onIniciar={() => iniciar()}
          onElegir={() => {
            try { localStorage.setItem(CLAVE_BIENVENIDA, "true"); } catch { /* sin persistencia */ }
            setBienvenida(false);
            setMenuAbierto(true);
          }}
          onCerrar={() => {
            try { localStorage.setItem(CLAVE_BIENVENIDA, "true"); } catch { /* sin persistencia */ }
            setBienvenida(false);
          }}
        />,
        document.body,
      )}

      {/* ── Recorrido ──────────────────────────────────────────────────── */}
      {tourActivo && paso && createPortal(
        <Recorrido
          paso={paso}
          caja={caja}
          indice={indice}
          total={pasos!.length}
          misiones={misionesDelRecorrido}
          pasosMision={pasos!.filter((p) => p.mision === paso.mision)}
          indiceEnMision={pasos!.filter((p, i) => p.mision === paso.mision && i < indice).length}
          estadoAria={hablando ? "hablando" : paso.estado}
          voz={voz}
          minimizado={minimizado}
          onMinimizar={setMinimizado}
          onVoz={alternarVoz}
          onSiguiente={() => avanzarDesde(indice)}
          onAnterior={retroceder}
          onSaltarMision={saltarMision}
          onSalir={finalizar}
        />,
        document.body,
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bienvenida
// ─────────────────────────────────────────────────────────────────────────────

function Bienvenida({
  nombre, voz, onVoz, onIniciar, onElegir, onCerrar,
}: {
  nombre: string; voz: boolean; onVoz: () => void; onIniciar: () => void; onElegir: () => void; onCerrar: () => void;
}) {
  const [cara, setCara] = useState<ExpresionAria>("feliz");

  // Pequeña secuencia de gestos al abrir: saluda, guiña y se queda contenta.
  useEffect(() => {
    const t1 = window.setTimeout(() => setCara("guino"), 1400);
    const t2 = window.setTimeout(() => setCara("emocionado"), 2600);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  const puntos = [
    { icono: MousePointerClick, texto: "Te señalo dónde tocar en la aplicación real." },
    { icono: BookOpen, texto: "Abres un PDF y un Word en un curso de ejemplo." },
    { icono: PencilLine, texto: "Respondes una práctica de prueba que no cuenta para tu nota." },
  ];

  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aria-bienvenida-titulo"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-3xl rounded-[28px] bg-card border border-border shadow-2xl overflow-hidden grid md:grid-cols-[0.95fr_1.05fr]"
      >
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-3 right-3 z-20 p-2 rounded-full text-white md:text-muted-foreground hover:bg-black/10 md:hover:bg-muted transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Escenario de Aria */}
        <div className="relative min-h-[260px] md:min-h-[480px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 overflow-hidden flex items-end justify-center">
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
          {[["12%", "18%", 0], ["80%", "14%", 0.6], ["18%", "62%", 1.2], ["86%", "55%", 0.3]].map(([x, y, d], i) => (
            <motion.span
              key={i}
              className="absolute text-white/80"
              style={{ left: x as string, top: y as string }}
              animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.6, repeat: Infinity, delay: d as number }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.span>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 rounded-2xl rounded-bl-sm bg-white text-slate-800 px-4 py-2.5 shadow-xl text-sm font-bold whitespace-nowrap"
          >
            ¡Hola{nombre ? `, ${nombre}` : ""}! 👋
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-44 md:w-72 -mb-4 md:-mb-6"
          >
            <AriaSvg estado={cara} className="w-full h-auto drop-shadow-2xl" />
          </motion.div>
        </div>

        {/* Contenido */}
        <div className="p-6 sm:p-8 flex flex-col">
          <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Misión inicial
          </span>
          <h2 id="aria-bienvenida-titulo" className="font-display font-extrabold text-2xl sm:text-3xl leading-tight mt-3">
            Soy Aria y te enseño Semantika en unos minutos
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Soy tu tutora. Vamos juntos por la aplicación de verdad, paso a paso, y practicas sin miedo a equivocarte.
          </p>

          <ul className="mt-5 space-y-2.5">
            {puntos.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300 grid place-items-center shrink-0">
                  <Icono className="w-4 h-4" />
                </span>
                <span className="text-sm leading-snug pt-1.5">{texto}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {MISIONES.map((m) => {
              const Icono = m.icono;
              return (
                <span key={m.id} title={m.resumen} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
                  <Icono className="w-3 h-3" /> {m.titulo}
                </span>
              );
            })}
          </div>

          <div className="mt-auto pt-6 space-y-3">
            <button
              type="button"
              onClick={onIniciar}
              autoFocus
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-violet-600/25 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Empezar el recorrido
            </button>
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={onElegir} className="h-10 px-4 rounded-xl bg-muted hover:bg-muted/70 text-sm font-semibold transition-colors">
                Elegir una misión
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onVoz}
                  title={voz ? "Silenciar a Aria" : "Escuchar a Aria"}
                  className="h-10 w-10 grid place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {voz ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button type="button" onClick={onCerrar} className="h-10 px-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recorrido: máscara con hueco + diálogo de Aria
// ─────────────────────────────────────────────────────────────────────────────

interface RecorridoProps {
  paso: PasoTour;
  caja: Caja | null;
  indice: number;
  total: number;
  misiones: MisionId[];
  pasosMision: PasoTour[];
  indiceEnMision: number;
  estadoAria: ExpresionAria;
  voz: boolean;
  minimizado: boolean;
  onMinimizar: (v: boolean) => void;
  onVoz: () => void;
  onSiguiente: () => void;
  onAnterior: () => void;
  onSaltarMision: () => void;
  onSalir: () => void;
}

function Recorrido({
  paso, caja, indice, total, misiones, pasosMision, indiceEnMision, estadoAria, voz,
  minimizado, onMinimizar, onVoz, onSiguiente, onAnterior, onSaltarMision, onSalir,
}: RecorridoProps) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mision = MISIONES.find((m) => m.id === paso.mision);
  const numMision = mision ? misiones.indexOf(mision.id) + 1 : misiones.length;
  const centrado = !paso.objetivo;
  const ultimo = indice === total - 1;
  const esperaClic = !!paso.clic;

  const hueco = caja && {
    x: Math.max(4, caja.left - RELLENO),
    y: Math.max(4, caja.top - RELLENO),
    w: caja.width + RELLENO * 2,
    h: caja.height + RELLENO * 2,
  };

  // Dónde va el diálogo para no tapar lo que se explica: abajo, arriba o a un lado. Si no
  // cabe en ningún hueco libre, se vuelve compacto y se pone en el lado CONTRARIO al botón
  // que hay que tocar: tapar un poco del enunciado se arregla con scroll; tapar "Comprobar"
  // deja al alumno atascado.
  const ALTO_HUD = 240;
  let lugar: "abajo" | "arriba" | "derecha" | "izquierda" = "abajo";
  let compacto = false;
  if (hueco) {
    const libreAbajo = vh - (hueco.y + hueco.h);
    const libreArriba = hueco.y - 64;
    if (libreAbajo >= ALTO_HUD + 16) lugar = "abajo";
    else if (libreArriba >= ALTO_HUD + 16) lugar = "arriba";
    else if (vw - (hueco.x + hueco.w) >= 440) lugar = "derecha";
    else if (hueco.x >= 440) lugar = "izquierda";
    else {
      compacto = true;
      const botonClic = paso.clic ? buscarVisible(paso.clic)?.getBoundingClientRect() : null;
      lugar = botonClic && botonClic.top > vh / 2 ? "arriba" : "abajo";
    }
  }

  const oscuro = { pointerEvents: "auto" as const, background: "rgba(8, 6, 23, 0.68)" };

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Máscara */}
      {hueco ? (
        <>
          <div className="fixed" style={{ ...oscuro, top: 0, left: 0, width: vw, height: hueco.y }} />
          <div className="fixed" style={{ ...oscuro, top: hueco.y + hueco.h, left: 0, width: vw, height: Math.max(0, vh - hueco.y - hueco.h) }} />
          <div className="fixed" style={{ ...oscuro, top: hueco.y, left: 0, width: hueco.x, height: hueco.h }} />
          <div className="fixed" style={{ ...oscuro, top: hueco.y, left: hueco.x + hueco.w, width: Math.max(0, vw - hueco.x - hueco.w), height: hueco.h }} />
          {!esperaClic && !paso.interactivo && (
            <div className="fixed" style={{ top: hueco.y, left: hueco.x, width: hueco.w, height: hueco.h, pointerEvents: "auto", cursor: "not-allowed" }} />
          )}
          <div
            className="fixed rounded-2xl transition-all duration-200 ease-out"
            style={{
              top: hueco.y, left: hueco.x, width: hueco.w, height: hueco.h,
              boxShadow: "0 0 0 3px rgba(167,139,250,.95), 0 0 0 8px rgba(139,92,246,.25), 0 0 40px rgba(139,92,246,.55)",
            }}
          >
            {esperaClic && (
              <span
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-violet-600 text-white text-[11px] font-bold px-3 py-1 shadow-lg whitespace-nowrap animate-bounce",
                  hueco.y < 60 ? "-bottom-9" : "-top-9",
                )}
              >
                <MousePointerClick className="w-3.5 h-3.5" /> Toca aquí
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="fixed inset-0" style={{ ...oscuro, backdropFilter: centrado ? "blur(3px)" : undefined }} />
      )}

      {/* Diálogo.
          La posición (con sus translate de Tailwind) va en un div normal y la animación en un
          motion.div interior: framer-motion escribe `transform` en línea al animar `y`/`scale`
          y eso pisaba el `-translate-x-1/2`, dejando el diálogo corrido a la derecha. */}
      {minimizado ? (
        <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onMinimizar(false)}
            className="flex items-center gap-2 rounded-full bg-card border border-violet-500/40 shadow-2xl pl-1.5 pr-4 py-1.5"
          >
            <span className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 grid place-items-center overflow-hidden">
              <AriaSvg estado={estadoAria} recorte="cara" className="w-8 h-8" />
            </span>
            <span className="text-sm font-bold">Mostrar a Aria</span>
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      ) : (
        <div
          className={cn(
            "pointer-events-auto fixed",
            centrado && "inset-0 grid place-items-center p-4",
            !centrado && lugar === "abajo" && "bottom-4 left-1/2 -translate-x-1/2 w-[min(620px,calc(100vw-1.5rem))]",
            !centrado && lugar === "arriba" && "top-[76px] left-1/2 -translate-x-1/2 w-[min(620px,calc(100vw-1.5rem))]",
            !centrado && lugar === "derecha" && "top-1/2 -translate-y-1/2 right-4 w-[400px]",
            !centrado && lugar === "izquierda" && "top-1/2 -translate-y-1/2 left-4 w-[400px]",
          )}
        >
          <motion.div
            key={centrado ? "centro" : "hud"}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {centrado ? (
              <DialogoCentrado
                paso={paso} estadoAria={estadoAria} mision={mision} ultimo={ultimo} indice={indice}
                voz={voz} onVoz={onVoz} onSiguiente={onSiguiente} onAnterior={onAnterior} onSalir={onSalir}
              />
            ) : (
              <div className={cn("relative", !compacto && "pt-10 sm:pt-0")}>
                {/* La Aria grande, de cuerpo entero, asomada al diálogo */}
                {!compacto && (
                  <motion.div
                    key={estadoAria}
                    initial={{ scale: 0.92 }}
                    animate={{ scale: 1 }}
                    className="absolute z-10 left-2 top-0 w-20 sm:-left-3 sm:top-auto sm:bottom-2 sm:w-32"
                  >
                    <AriaSvg estado={estadoAria} className="w-full h-auto drop-shadow-xl" />
                  </motion.div>
                )}

                <div className={cn("rounded-3xl border border-violet-500/30 bg-card/95 backdrop-blur-xl shadow-2xl shadow-violet-900/30 overflow-hidden", !compacto && "sm:ml-16")}>
                  <div className="h-1 bg-muted">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300" style={{ width: `${((indice + 1) / total) * 100}%` }} />
                  </div>

                  <div className={cn("pr-3 pt-3 flex items-center gap-2", compacto ? "pl-3" : "pl-24")}>
                    {compacto && (
                      <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 grid place-items-center overflow-hidden shrink-0">
                        <AriaSvg estado={estadoAria} recorte="cara" className="w-7 h-7" />
                      </span>
                    )}
                    {mision && (
                      <span className="inline-flex items-center gap-1.5 min-w-0 px-2 py-1 rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[11px] font-bold">
                        <mision.icono className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Misión {numMision}/{misiones.length} · {mision.titulo}</span>
                      </span>
                    )}
                    <span className="ml-auto flex items-center shrink-0">
                      <button type="button" onClick={onVoz} title={voz ? "Silenciar a Aria" : "Escuchar a Aria"} className="h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                        {voz ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => onMinimizar(true)} title="Minimizar para ver lo de atrás" className="h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Minimize2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={onSalir} title="Salir del recorrido (Esc)" className="h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  </div>

                  <div className={cn("pr-5 pt-1.5 pb-1", compacto ? "pl-4" : "pl-24 min-h-[88px]")}>
                    {/* Sin AnimatePresence "wait": esperar a que salga el texto anterior dejaba
                        el diálogo vacío un instante en cada paso. Solo entra el nuevo. */}
                    <motion.div
                        key={paso.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.16 }}
                      >
                        <h3 className="font-display font-bold text-base sm:text-lg leading-snug">{paso.titulo}</h3>
                        <p className={cn("text-muted-foreground leading-relaxed mt-1", compacto ? "text-xs line-clamp-2" : "text-sm")}>{paso.texto}</p>
                      </motion.div>
                  </div>

                  <div className={cn("flex items-center gap-2 px-4 mt-1 border-t border-border/70 bg-muted/30", compacto ? "py-2" : "py-3")}>
                    <div className={cn("flex items-center gap-1", !compacto && "pl-20")} aria-label={`Paso ${indiceEnMision + 1} de ${pasosMision.length} en esta misión`}>
                      {pasosMision.map((p, i) => (
                        <span key={p.id} className={cn("h-1.5 rounded-full transition-all", i === indiceEnMision ? "w-5 bg-violet-500" : i < indiceEnMision ? "w-1.5 bg-violet-400/60" : "w-1.5 bg-border")} />
                      ))}
                    </div>
                    <button type="button" onClick={onSaltarMision} className="hidden sm:inline text-[11px] font-semibold text-muted-foreground hover:text-foreground ml-2">
                      Saltar misión
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onAnterior}
                        disabled={indice === 0}
                        className="h-9 w-9 grid place-items-center rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-30 transition-colors"
                        title="Paso anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {esperaClic ? (
                        <span className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-bold">
                          <span className="relative flex w-2 h-2">
                            <span className="absolute inset-0 rounded-full bg-violet-500 animate-ping" />
                            <span className="relative w-2 h-2 rounded-full bg-violet-500" />
                          </span>
                          Esperando tu clic
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={onSiguiente}
                          className="h-9 inline-flex items-center gap-1 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white text-sm font-bold shadow-md shadow-violet-600/25 active:scale-95 transition-all"
                        >
                          {paso.boton || "Siguiente"} <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DialogoCentrado({
  paso, estadoAria, mision, ultimo, indice, voz, onVoz, onSiguiente, onAnterior, onSalir,
}: {
  paso: PasoTour; estadoAria: ExpresionAria; mision?: Mision; ultimo: boolean; indice: number; voz: boolean;
  onVoz: () => void; onSiguiente: () => void; onAnterior: () => void; onSalir: () => void;
}) {
  return (
    <div className="relative w-full max-w-md">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-40 sm:w-48 -mb-14"
      >
        <AriaSvg estado={estadoAria} className="w-full h-auto drop-shadow-2xl" />
      </motion.div>
      <div className="relative rounded-[28px] bg-card border border-violet-500/30 shadow-2xl shadow-violet-900/40 overflow-hidden text-center">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-violet-500/20 to-transparent pointer-events-none" />
        <div className="absolute top-3 right-3 flex items-center">
          <button type="button" onClick={onVoz} title={voz ? "Silenciar a Aria" : "Escuchar a Aria"} className="h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            {voz ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {!ultimo && (
            <button type="button" onClick={onSalir} title="Salir del recorrido (Esc)" className="h-8 w-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative px-6 sm:px-8 pt-16 pb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[11px] font-bold uppercase tracking-wider">
            {ultimo ? <><Sparkles className="w-3.5 h-3.5" /> Recorrido completado</> : mision ? <><mision.icono className="w-3.5 h-3.5" /> {mision.titulo}</> : null}
          </span>
          <h3 className="font-display font-extrabold text-2xl leading-tight mt-3">{paso.titulo}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{paso.texto}</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            {indice > 0 && !ultimo && (
              <button type="button" onClick={onAnterior} className="h-11 px-4 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors">
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={onSiguiente}
              autoFocus
              className="h-11 inline-flex items-center gap-2 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-violet-600/25 active:scale-95 transition-all"
            >
              {paso.boton || "Siguiente"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!ultimo && (
            <p className="mt-4 text-[11px] text-muted-foreground">Usa ← → para moverte y Esc para salir.</p>
          )}
        </div>
      </div>
    </div>
  );
}
