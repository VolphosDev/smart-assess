import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity, BookOpenCheck, Check, ChevronLeft, ChevronRight, FolderKanban, LayoutGrid, MousePointerClick,
  ShieldCheck, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clavePorUsuario } from "@/lib/almacenUsuario";
import { enCursoDocenteDemo, marcarGuiaDocenteActiva, RUTA_CURSO_DOCENTE_DEMO, RUTA_SEMANA_DOCENTE_DEMO } from "@/lib/guiaDocenteDemo";

/**
 * Guía de uso para el docente: recorrido por secciones sobre la aplicación real.
 *
 * POR QUE NO ES LA GUIA DEL ALUMNO. El docente no necesita motivación sino saber qué hace cada
 * pantalla y qué decisiones le corresponden. Por eso no hay personaje, voz ni puntos: un
 * cuadro sobrio que señala el elemento y explica para qué sirve.
 *
 * POR QUE NO TOCA DATOS. Las secciones de curso, semana y material usan el curso de ejemplo de
 * lib/guiaDocenteDemo, que existe solo en el navegador mientras la guía está activa. Fuera del
 * hueco resaltado, los clics se bloquean; dentro, solo se permite el clic en los pasos que
 * piden navegar (abrir el curso, gestionar una semana). Así el recorrido nunca sube, oculta ni
 * elimina nada.
 *
 * POR SECCIONES. Cinco recorridos cortos que se pueden repetir por separado desde el menú.
 */

const BASE_VISTA = "semantika.guia-docente.vista.v1";
const BASE_COMPLETADAS = "semantika.guia-docente.completadas.v1";
export const EVENTO_ABRIR_GUIA_DOCENTE = "semantika:abrir-guia-docente";

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EN_CURSO = new RegExp(`^${escapar(RUTA_CURSO_DOCENTE_DEMO)}$`);
const EN_SEMANA = new RegExp(`^${escapar(RUTA_SEMANA_DOCENTE_DEMO)}$`);
const EN_CURSO_O_SEMANA = new RegExp(`^${escapar(RUTA_CURSO_DOCENTE_DEMO)}(/semana/[^/]+)?$`);

type SeccionId = "cursos" | "curso" | "semana" | "seguimiento" | "validacion";

interface Seccion {
  id: SeccionId;
  titulo: string;
  resumen: string;
  icono: LucideIcon;
}

const SECCIONES: Seccion[] = [
  { id: "cursos", titulo: "Panel de cursos", resumen: "Navegación y creación de cursos", icono: LayoutGrid },
  { id: "curso", titulo: "Organización de un curso", resumen: "Semanas, visibilidad y matrícula", icono: FolderKanban },
  { id: "semana", titulo: "Material y banco de preguntas", resumen: "Carga, temas detectados, reactivos y notas", icono: BookOpenCheck },
  { id: "seguimiento", titulo: "Panel de seguimiento", resumen: "Evolución del grupo y alerta temprana", icono: Activity },
  { id: "validacion", titulo: "Validación del calificador", resumen: "Calificación a ciegas del juez de IA", icono: ShieldCheck },
];

interface Paso {
  id: string;
  seccion: SeccionId;
  titulo: string;
  texto: string;
  /** Elemento a resaltar; se usa el primero visible. Sin objetivo, el cuadro va centrado. */
  objetivo?: string;
  /** El paso avanza cuando el docente hace clic en un elemento que coincide. */
  clic?: string;
  /** Ruta del paso; al entrar se navega si hace falta. */
  ruta?: string;
  /** El paso se omite si la ruta actual ya cumple esta condición (p. ej., ya está en un curso). */
  omitirEn?: RegExp;
  /** Si el elemento no aparece, el paso se omite (contenido que depende de los datos). */
  opcional?: boolean;
  /** Si el elemento no aparece en un paso obligatorio, se muestra este texto. */
  sinObjetivo?: string;
}

const PASOS: Paso[] = [
  // ── Panel de cursos ─────────────────────────────────────────────────────
  { id: "inicio", seccion: "cursos", ruta: "/docente",
    titulo: "Guía de uso para docentes",
    texto: "Este recorrido señala cada parte de su espacio de trabajo y explica para qué sirve. Usa un curso de ejemplo que solo existe durante la guía, así que no modifica ningún dato: solo podrá hacer clic donde se le indique para avanzar." },
  { id: "nav", seccion: "cursos", ruta: "/docente", objetivo: '[data-guide="docente-nav"]', opcional: true,
    titulo: "Tres espacios de trabajo",
    texto: "Mis cursos reúne sus asignaturas y su material. El panel de seguimiento muestra el desempeño de sus grupos. Validar calificador sirve para contrastar la nota de la IA con su criterio." },
  { id: "cursos", seccion: "cursos", ruta: "/docente", objetivo: '[data-guide="docente-cursos"]', opcional: true,
    titulo: "Sus cursos",
    texto: "Durante la guía aparece además un curso de ejemplo. Cada tarjeta muestra el número de semanas y de alumnos matriculados. El menú de la esquina permite editar el nombre, el color y la portada, o eliminar el curso." },
  { id: "crear", seccion: "cursos", ruta: "/docente", objetivo: '[data-guide="docente-crear-curso"]',
    titulo: "Crear un curso",
    texto: "Defina el nombre, el número de semanas y un color que lo identifique. El curso se crea vacío: las semanas y el material se agregan después, desde el propio curso." },
  { id: "ayuda", seccion: "cursos", objetivo: '[data-guide="docente-ayuda"]', opcional: true,
    titulo: "Volver a esta guía",
    texto: "Este botón abre el menú de la guía. Puede repetir solo la sección que necesite." },

  // ── Organización de un curso ────────────────────────────────────────────
  { id: "abrir-curso", seccion: "curso", ruta: "/docente", omitirEn: EN_CURSO,
    objetivo: '[data-guide="docente-tarjeta-curso"]', clic: '[data-guide="docente-tarjeta-curso"]',
    titulo: "Abra el curso de ejemplo",
    texto: "Haga clic en la tarjeta «Comunicación 3.° A · Curso de ejemplo». Sus datos son ficticios y desaparecen al cerrar la guía." },
  { id: "curso-hero", seccion: "curso", objetivo: '[data-guide="docente-curso-hero"]',
    titulo: "Cabecera del curso",
    texto: "Muestra el número de semanas y de alumnos. Desde aquí se cambia la portada sin abrir el formulario de edición." },
  { id: "gestionar-clase", seccion: "curso", objetivo: '[data-guide="docente-gestionar-clase"]',
    titulo: "Matrícula de alumnos",
    texto: "En «Gestionar clase» se matricula o retira a los alumnos del curso. Solo los alumnos matriculados ven sus semanas y su material." },
  { id: "semanas", seccion: "curso", objetivo: '[data-guide="docente-semanas"]', opcional: true,
    titulo: "Semanas del curso",
    texto: "Cada semana corresponde a un tema. Arrastre el ícono de la izquierda para cambiar el orden. El contador indica cuántas preguntas se generaron y cuántos archivos tiene." },
  { id: "semana-acciones", seccion: "curso", objetivo: '[data-guide="docente-semana-acciones"]', opcional: true,
    titulo: "Visibilidad de cada semana",
    texto: "Con «Habilitar» o «Inhabilitar» decide si los alumnos ven la semana. Conviene habilitarla solo cuando el material esté revisado. El lápiz cambia el título y la papelera elimina una semana vacía." },
  { id: "agregar-semana", seccion: "curso", objetivo: '[data-guide="docente-agregar-semana"]',
    titulo: "Agregar una semana",
    texto: "Añade una semana al final del curso. Luego puede ponerle el nombre del tema." },

  // ── Material y banco de preguntas ───────────────────────────────────────
  { id: "abrir-curso-2", seccion: "semana", ruta: "/docente", omitirEn: EN_CURSO_O_SEMANA,
    objetivo: '[data-guide="docente-tarjeta-curso"]', clic: '[data-guide="docente-tarjeta-curso"]',
    titulo: "Abra el curso de ejemplo",
    texto: "Haga clic en la tarjeta «Comunicación 3.° A · Curso de ejemplo» para llegar a sus semanas." },
  { id: "abrir-semana", seccion: "semana", omitirEn: EN_SEMANA,
    objetivo: '[data-guide="docente-semana-gestionar"]', clic: '[data-guide="docente-semana-gestionar"]',
    titulo: "Entre a la semana 1",
    texto: "Haga clic en «Gestionar» en la semana «El signo lingüístico»." },
  { id: "material", seccion: "semana", objetivo: '[data-guide="docente-material"]',
    titulo: "Material de la semana",
    texto: "Las preguntas de la semana se generan solo a partir de estos archivos, en PDF o Word. Con el botón del libro abre un archivo para leerlo; con el ojo decide si los alumnos lo ven." },
  { id: "subir", seccion: "semana", objetivo: '[data-guide="docente-subir"]', opcional: true,
    titulo: "Añadir archivos",
    texto: "Puede seleccionar varios archivos a la vez. El sistema los procesa en segundo plano y muestra una barra de avance; mientras tanto puede seguir trabajando." },
  { id: "temas", seccion: "semana", objetivo: '[data-guide="docente-temas"]', opcional: true,
    titulo: "Temas detectados",
    texto: "La IA extrae los temas de cada archivo. Revíselos: oculte los que no sean temas reales, como un índice o una bibliografía, para que no se pregunte sobre ellos." },
  { id: "banco", seccion: "semana", objetivo: '[data-guide="docente-banco"]',
    titulo: "Banco de preguntas",
    texto: "Cada reactivo que generó la IA, con su nivel de la taxonomía de Bloom, la respuesta usada para calificar y lo que respondió cada alumno. Sirve para auditar la calidad de lo que se pregunta." },
  { id: "notas", seccion: "semana", objetivo: '[data-guide="docente-notas"]',
    titulo: "Notas de avance",
    texto: "El historial de intentos de la semana por alumno. El botón de la derecha exporta las notas a un archivo CSV para su registro." },

  // ── Panel de seguimiento ────────────────────────────────────────────────
  { id: "seg-analiticas", seccion: "seguimiento", ruta: "/docente/seguimiento", objetivo: '[data-guide="docente-analiticas"]',
    titulo: "Evolución del grupo",
    texto: "Muestra la evolución de las notas o la frecuencia de uso a lo largo del tiempo. Cambie entre ambas vistas con los botones de la parte superior." },
  { id: "seg-filtros", seccion: "seguimiento", ruta: "/docente/seguimiento", objetivo: '[data-guide="docente-filtros"]', opcional: true,
    titulo: "Filtros",
    texto: "Acote el gráfico por alumno, por curso o por periodo." },
  { id: "seg-alertas", seccion: "seguimiento", ruta: "/docente/seguimiento", objetivo: '[data-guide="docente-alertas"]', opcional: true,
    titulo: "Alerta temprana",
    texto: "Señala a los alumnos con promedio bajo, una racha de notas descendentes o inactividad. El riesgo se mide dentro de cada curso. Es una alerta para acompañar al alumno, no una calificación." },

  // ── Validación del calificador ──────────────────────────────────────────
  { id: "val-intro", seccion: "validacion", ruta: "/docente/validacion-juez", objetivo: '[data-guide="docente-validacion-intro"]',
    titulo: "Por qué validar al calificador",
    texto: "La IA califica las respuestas abiertas. Para saber si su criterio coincide con el de los docentes, usted califica una muestra sin ver la nota de la IA; al final se compara el acuerdo entre ambas." },
  { id: "val-origen", seccion: "validacion", ruta: "/docente/validacion-juez", objetivo: '[data-guide="docente-validacion-origen"]',
    titulo: "Muestra a calificar",
    texto: "Elija el tipo de respuesta: de examen, de la conversación con la tutora o por voz. «Armar muestra» selecciona casos al azar; califique cada uno como lo haría normalmente." },
];

const PASO_FINAL: Paso = {
  id: "fin", seccion: "validacion",
  titulo: "Recorrido terminado",
  texto: "Puede volver a cualquier sección desde el botón «Guía» de la cabecera.",
};

function buscarVisible(selector: string): Element | null {
  for (const el of Array.from(document.querySelectorAll(selector))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function leerCompletadas(): SeccionId[] {
  try { return JSON.parse(localStorage.getItem(clavePorUsuario(BASE_COMPLETADAS)) || "[]"); } catch { return []; }
}

interface Caja { top: number; left: number; width: number; height: number }

const RELLENO = 8;
const ANCHO_CUADRO = 360;

export default function GuiaDocente() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [pasos, setPasos] = useState<Paso[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [caja, setCaja] = useState<Caja | null>(null);
  const [faltante, setFaltante] = useState(false);
  const [completadas, setCompletadas] = useState<SeccionId[]>(leerCompletadas);
  const direccion = useRef<1 | -1>(1);

  const paso = pasos?.[indice];

  // Una guía no sobrevive a una recarga (su estado vive en memoria): si quedó la marca de
  // activa, se limpia, y si la recarga pilló al docente dentro del curso de ejemplo, se le saca.
  useEffect(() => {
    marcarGuiaDocenteActiva(false);
    if (enCursoDocenteDemo(location.pathname)) navigate("/docente", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primer ingreso: se ofrece el menú una sola vez, sin iniciar nada por sí solo.
  useEffect(() => {
    try {
      if (!localStorage.getItem(clavePorUsuario(BASE_VISTA)) && location.pathname === "/docente") setMenu(true);
    } catch { /* sin persistencia: queda el botón de la cabecera */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const abrir = () => setMenu(true);
    window.addEventListener(EVENTO_ABRIR_GUIA_DOCENTE, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_GUIA_DOCENTE, abrir);
  }, []);

  const marcarVista = () => {
    try { localStorage.setItem(clavePorUsuario(BASE_VISTA), "1"); } catch { /* sin persistencia */ }
  };

  const marcarCompletada = useCallback((id: SeccionId) => {
    setCompletadas((prev) => {
      if (prev.includes(id)) return prev;
      const nuevas = [...prev, id];
      try { localStorage.setItem(clavePorUsuario(BASE_COMPLETADAS), JSON.stringify(nuevas)); } catch { /* sin persistencia */ }
      return nuevas;
    });
  }, []);

  const iniciar = (secciones?: SeccionId[]) => {
    const lista = secciones ? PASOS.filter((p) => secciones.includes(p.seccion)) : PASOS;
    marcarVista();
    marcarGuiaDocenteActiva(true);
    setMenu(false);
    direccion.current = 1;
    setIndice(0);
    setPasos([...lista, PASO_FINAL]);
  };

  const cerrar = useCallback(() => {
    setPasos(null);
    setCaja(null);
    setFaltante(false);
    marcarGuiaDocenteActiva(false);
    // El curso de ejemplo desaparece: si el docente terminó dentro de él, vuelve a su inicio.
    if (enCursoDocenteDemo(location.pathname)) navigate("/docente");
  }, [location.pathname, navigate]);

  const avanzar = useCallback(() => {
    direccion.current = 1;
    setIndice((i) => i + 1);
  }, []);

  const retroceder = () => {
    direccion.current = -1;
    setIndice((i) => Math.max(0, i - 1));
  };

  const saltarSeccion = () => {
    if (!pasos || !paso) return;
    const siguiente = pasos.findIndex((p, i) => i > indice && p.seccion !== paso.seccion);
    direccion.current = 1;
    setIndice(siguiente === -1 ? pasos.length - 1 : siguiente);
  };

  // Fin del recorrido.
  useEffect(() => {
    if (pasos && indice >= pasos.length) cerrar();
  }, [indice, pasos, cerrar]);

  // Al entrar en un paso: omitirlo si no corresponde, navegar a su ruta y, si se cambió de
  // sección avanzando, dar por completada la anterior.
  useEffect(() => {
    if (!pasos || !paso) return;
    setFaltante(false);
    if (paso.omitirEn && paso.omitirEn.test(location.pathname)) {
      setIndice((i) => Math.max(0, i + direccion.current));
      return;
    }
    const anterior = pasos[indice - 1];
    if (direccion.current === 1 && anterior && anterior.seccion !== paso.seccion) marcarCompletada(anterior.seccion);
    if (paso === PASO_FINAL && anterior) marcarCompletada(anterior.seccion);
    if (paso.ruta && location.pathname !== paso.ruta) navigate(paso.ruta);
    // Solo al cambiar de paso: el docente puede navegar por su cuenta sin que la guía lo devuelva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasos, indice]);

  // Seguimiento del elemento resaltado: aparece tarde (datos que cargan) y se mueve con el scroll.
  useEffect(() => {
    setCaja(null);
    if (!paso?.objetivo) return;
    const desde = indice;
    const inicio = Date.now();
    let desplazado = false;

    const medir = () => {
      const el = buscarVisible(paso.objetivo!);
      if (!el) {
        setCaja((prev) => (prev ? null : prev));
        if (Date.now() - inicio > 2000) {
          if (paso.opcional) setIndice((i) => (i === desde ? Math.max(0, i + direccion.current) : i));
          else setFaltante(true);
        }
        return;
      }
      setFaltante(false);
      const r = el.getBoundingClientRect();
      if (!desplazado) {
        desplazado = true;
        const vh = window.innerHeight;
        if (r.top < 72 || r.bottom > vh - 16) {
          const destino = r.height > vh * 0.5 ? r.top - 84 : r.top - (vh - r.height) / 2;
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
    const id = window.setInterval(medir, 150);
    window.addEventListener("scroll", medir, { capture: true, passive: true });
    window.addEventListener("resize", medir, { passive: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", medir, { capture: true });
      window.removeEventListener("resize", medir);
    };
  }, [paso, indice]);

  // Pasos que avanzan con un clic real en el elemento señalado (solo navegación).
  useEffect(() => {
    if (!paso?.clic) return;
    const desde = indice;
    const selector = paso.clic;
    const alClic = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.(selector)) return;
      window.setTimeout(() => {
        direccion.current = 1;
        setIndice((i) => (i === desde ? i + 1 : i));
      }, 250);
    };
    document.addEventListener("click", alClic, true);
    return () => document.removeEventListener("click", alClic, true);
  }, [paso, indice]);

  // Escape cierra la guía.
  useEffect(() => {
    if (!pasos && !menu) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pasos) cerrar(); else { marcarVista(); setMenu(false); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [pasos, menu, cerrar]);

  if (menu) {
    return createPortal(
      <MenuGuia
        completadas={completadas}
        onIniciar={iniciar}
        onCerrar={() => { marcarVista(); setMenu(false); }}
      />,
      document.body,
    );
  }

  if (!pasos || !paso) return null;

  const seccion = SECCIONES.find((s) => s.id === paso.seccion)!;
  // Se numeran las secciones y no los pasos: algunos pasos se omiten según los datos (un
  // material sin temas, un curso ya abierto) y un "paso 2 de 7" que salta al 4 desconcierta.
  const seccionesRecorrido = [...new Set(pasos.filter((p) => p !== PASO_FINAL).map((p) => p.seccion))];
  const posicion = seccionesRecorrido.indexOf(paso.seccion) + 1;
  const esFinal = paso === PASO_FINAL;
  const hueco = caja && {
    top: caja.top - RELLENO, left: caja.left - RELLENO,
    width: caja.width + RELLENO * 2, height: caja.height + RELLENO * 2,
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] pointer-events-none" role="dialog" aria-modal="true" aria-label="Guía de uso para docentes">
      {/* Oscurecido con hueco. Solo es visual; los clics los gestionan los bloqueadores. */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        <defs>
          <mask id="guia-docente-mascara">
            <rect width="100%" height="100%" fill="white" />
            {hueco && <rect x={hueco.left} y={hueco.top} width={hueco.width} height={hueco.height} rx={10} fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15,23,42,0.55)" mask="url(#guia-docente-mascara)" />
        {hueco && (
          <rect x={hueco.left} y={hueco.top} width={hueco.width} height={hueco.height} rx={10}
            fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
        )}
      </svg>

      <Bloqueadores hueco={hueco} permitirClic={!!paso.clic} />

      <CuadroPaso
        hueco={hueco}
        seccion={seccion}
        paso={paso}
        posicion={posicion}
        total={seccionesRecorrido.length}
        faltante={faltante}
        esFinal={esFinal}
        puedeRetroceder={indice > 0 && !esFinal}
        onAnterior={retroceder}
        onSiguiente={avanzar}
        onSaltarSeccion={saltarSeccion}
        onCerrar={cerrar}
      />
    </div>,
    document.body,
  );
}

/**
 * Cuatro paneles transparentes alrededor del hueco que absorben los clics. El hueco solo deja
 * pasar el clic en los pasos de navegación; en el resto lo cubre un panel más.
 */
function Bloqueadores({ hueco, permitirClic }: { hueco: Caja | null; permitirClic: boolean }) {
  if (!hueco) return <div className="absolute inset-0 pointer-events-auto" />;
  const { top, left, width, height } = hueco;
  return (
    <>
      <div className="absolute pointer-events-auto left-0 right-0 top-0" style={{ height: Math.max(0, top) }} />
      <div className="absolute pointer-events-auto left-0 right-0 bottom-0" style={{ top: top + height }} />
      <div className="absolute pointer-events-auto left-0" style={{ top, height, width: Math.max(0, left) }} />
      <div className="absolute pointer-events-auto right-0" style={{ top, height, left: left + width }} />
      {!permitirClic && <div className="absolute pointer-events-auto" style={{ top, left, width, height }} />}
    </>
  );
}

interface CuadroProps {
  hueco: Caja | null;
  seccion: Seccion;
  paso: Paso;
  posicion: number;
  total: number;
  faltante: boolean;
  esFinal: boolean;
  puedeRetroceder: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
  onSaltarSeccion: () => void;
  onCerrar: () => void;
}

function CuadroPaso({
  hueco, seccion, paso, posicion, total, faltante, esFinal, puedeRetroceder,
  onAnterior, onSiguiente, onSaltarSeccion, onCerrar,
}: CuadroProps) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const movil = vw < 640;
  const ancho = Math.min(ANCHO_CUADRO, vw - 32);
  const ALTO_ESTIMADO = 230;

  // Debajo del elemento si cabe; si no, encima; si tampoco, centrado. En el celular, abajo.
  let estilo: CSSProperties;
  if (movil) {
    estilo = { left: 16, right: 16, bottom: 16 };
  } else if (!hueco) {
    estilo = { left: (vw - ancho) / 2, top: Math.max(80, (vh - ALTO_ESTIMADO) / 2), width: ancho };
  } else {
    const left = Math.min(Math.max(16, hueco.left), vw - ancho - 16);
    const abajo = hueco.top + hueco.height + 12;
    const arriba = hueco.top - 12 - ALTO_ESTIMADO;
    const top = abajo + ALTO_ESTIMADO < vh ? abajo : arriba > 72 ? arriba : Math.max(80, vh - ALTO_ESTIMADO - 16);
    estilo = { left, top, width: ancho };
  }

  const esperandoClic = !!paso.clic && !faltante;
  const Icono = seccion.icono;

  return (
    <div className="absolute pointer-events-auto bg-card text-card-foreground border border-border rounded-xl shadow-xl" style={estilo}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Icono className="w-3.5 h-3.5" />
          {esFinal ? "Guía de uso" : total > 1 ? `${seccion.titulo} · sección ${posicion} de ${total}` : seccion.titulo}
        </span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar la guía" title="Cerrar la guía (Esc)"
          className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pt-1.5 pb-3 space-y-1.5">
        <h2 className="font-display font-bold text-base leading-snug">{paso.titulo}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {faltante && paso.sinObjetivo ? paso.sinObjetivo : paso.texto}
        </p>
        {esperandoClic && (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary pt-0.5">
            <MousePointerClick className="w-3.5 h-3.5" /> Haga clic en el elemento resaltado
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-2 border-t border-border">
        {!esFinal ? (
          <button type="button" onClick={onSaltarSeccion}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            Omitir sección
          </button>
        ) : <span />}
        <div className="flex items-center gap-1.5">
          {puedeRetroceder && (
            <button type="button" onClick={onAnterior}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          )}
          {!esperandoClic && (
            <button type="button" onClick={esFinal ? onCerrar : faltante && paso.clic ? onSaltarSeccion : onSiguiente}
              className="inline-flex items-center gap-1 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
              {esFinal ? "Cerrar" : faltante && paso.clic ? "Continuar" : "Siguiente"} {!esFinal && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuGuia({ completadas, onIniciar, onCerrar }: {
  completadas: SeccionId[];
  onIniciar: (secciones?: SeccionId[]) => void;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-4" role="dialog" aria-modal="true"
      aria-label="Guía de uso para docentes" onClick={onCerrar}>
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="font-display font-bold text-xl">Guía de uso para docentes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Recorrido por su espacio de trabajo con un curso de ejemplo, sin modificar sus datos.
              Elija una sección o el recorrido completo (unos cinco minutos).
            </p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar"
            className="h-8 w-8 shrink-0 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="px-3 space-y-1">
          {SECCIONES.map((s) => {
            const hecha = completadas.includes(s.id);
            const Icono = s.icono;
            return (
              <li key={s.id}>
                <button type="button" onClick={() => onIniciar([s.id])}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-muted">
                  <span className="w-9 h-9 shrink-0 grid place-items-center rounded-lg bg-muted text-foreground">
                    <Icono className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold">{s.titulo}</span>
                    <span className="block text-xs text-muted-foreground truncate">{s.resumen}</span>
                  </span>
                  {hecha && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                      <Check className="w-3.5 h-3.5" /> Vista
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className={cn("flex items-center justify-end gap-2 p-5 pt-4")}>
          <button type="button" onClick={onCerrar}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
            Ahora no
          </button>
          <button type="button" onClick={() => onIniciar()}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
            Recorrido completo
          </button>
        </div>
      </div>
    </div>
  );
}
