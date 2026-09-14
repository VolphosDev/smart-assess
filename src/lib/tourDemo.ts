import type { Question } from "@/types/Evaluation";

/**
 * Curso de ejemplo del recorrido de Aria. EXISTE SOLO EN EL FRONTEND.
 *
 * POR QUE NO SE USA UN CURSO REAL. El recorrido tiene que enseñar a abrir material, elegir
 * cómo practicar y responder preguntas. Con un curso real, cada clic del tutorial generaría
 * preguntas con IA, abriría intentos y dejaría notas en el historial del alumno: datos que
 * luego entran al estudio como si fueran práctica genuina. Aquí nada toca el servidor.
 *
 * POR QUE DESAPARECE. La tarjeta solo se muestra con el recorrido activo (ver Dashboard), y
 * al terminarlo la guía devuelve al alumno a /app si se quedó dentro del demo.
 */

export const CURSO_DEMO_ID = "tour-demo";
export const SEMANA_DEMO_ID = "tour-demo-s1";
export const RUTA_PRACTICA_DEMO = "/app/tour/practica";

export const esCursoDemo = (id?: string | number | null) => String(id ?? "") === CURSO_DEMO_ID;
export const esSemanaDemo = (id?: string | number | null) => String(id ?? "") === SEMANA_DEMO_ID;

/** Prefijo de los "mongoId" de ejemplo: el visor los sirve desde /public en vez del API. */
export const PREFIJO_MATERIAL_DEMO = "tour-demo:";
export const esMaterialDemo = (mongoId?: string | null) => !!mongoId?.startsWith(PREFIJO_MATERIAL_DEMO);
export const urlMaterialDemo = (mongoId: string) => `/tour/${mongoId.slice(PREFIJO_MATERIAL_DEMO.length)}`;

export const CURSO_DEMO = {
    id: CURSO_DEMO_ID,
    name: "Comunicación · Curso de ejemplo",
    color: "lime",
    emoji: "📘",
    weeks: 1,
};

const MATERIALES_DEMO = [
    {
        id: "tour-demo-m1",
        mongoId: `${PREFIJO_MATERIAL_DEMO}el-signo-linguistico-ejemplo.pdf`,
        nombreArchivo: "el-signo-linguistico-ejemplo.pdf",
        visible: true,
        subtemas: ["Significado y significante", "Arbitrariedad del signo"],
    },
    {
        id: "tour-demo-m2",
        mongoId: `${PREFIJO_MATERIAL_DEMO}clases-de-determinantes-ejemplo.docx`,
        nombreArchivo: "clases-de-determinantes-ejemplo.docx",
        visible: true,
        subtemas: ["Clases de determinantes"],
    },
];

export const SEMANA_DEMO = {
    id: SEMANA_DEMO_ID,
    numSem: "Semana 1",
    nombreTema: "El signo lingüístico",
    habilitada: true,
    totalPreguntas: 3,
    materiales: MATERIALES_DEMO,
};

/**
 * Estado de la semana de ejemplo: con el diagnóstico YA hecho. Así el alumno ve en el
 * recorrido cómo lucen las recomendaciones y los modos destacados, que es justo lo que
 * encontrará después de su primera evaluación real.
 */
export const ESTADO_SEMANA_DEMO = {
    recomendadoraCompletada: true,
    recomendaciones: [
        "Empieza con opción múltiple para fijar los conceptos básicos.",
        "Luego prueba verdadero o falso para repasar rápido.",
    ],
    modosRecomendados: ["OPCION_MULTIPLE", "VERDADERO_FALSO"],
    deliberacionReal: true,
    ubicacionCompletada: true,
};

export type TipoPreguntaDemo = "OPCION_MULTIPLE" | "VERDADERO_FALSO" | "ABIERTA";

export interface PreguntaDemo extends Question {
    tipo: TipoPreguntaDemo;
    explicacion: string;
    /** Palabras que debe mencionar una respuesta abierta para contarse como buena. */
    claves?: string[];
}

export const PREGUNTAS_DEMO: PreguntaDemo[] = [
    {
        tipo: "OPCION_MULTIPLE",
        enunciado: "¿Qué es el significante de un signo lingüístico?",
        opciones_o_respuesta: [
            "A) La idea o concepto que tenemos en la mente",
            "B) La secuencia de sonidos o letras con que lo nombramos",
            "C) El objeto real del mundo al que se refiere",
            "D) El idioma en el que se habla",
        ],
        respuesta_correcta: "B) La secuencia de sonidos o letras con que lo nombramos",
        justificacion_pregunta: "",
        explicacion: "El significante es la «forma» del signo: los sonidos g-a-t-o. La idea del animal es el significado.",
    },
    {
        tipo: "VERDADERO_FALSO",
        enunciado: "Que un árbol se diga «tree» en inglés demuestra que el signo lingüístico es arbitrario.",
        opciones_o_respuesta: ["VERDADERO", "FALSO"],
        respuesta_correcta: "VERDADERO",
        justificacion_pregunta: "",
        explicacion: "Exacto: no hay razón natural que una el concepto con sus sonidos, por eso cada idioma usa uno distinto.",
    },
    {
        tipo: "ABIERTA",
        enunciado: "Con tus propias palabras: ¿qué significa que el signo lingüístico sea lineal?",
        opciones_o_respuesta: "",
        respuesta_correcta: "",
        justificacion_pregunta: "",
        claves: ["orden", "uno", "detrás", "después", "seguido", "secuencia", "tiempo", "a la vez"],
        explicacion: "Una buena respuesta dice que los sonidos o letras van uno detrás de otro, en orden, y nunca al mismo tiempo.",
    },
];

export const RESPUESTA_ABIERTA_EJEMPLO =
    "Que los sonidos se dicen uno detrás de otro, en orden, y no todos a la vez.";
