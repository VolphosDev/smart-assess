import { useEffect, useState } from "react";
import { PREFIJO_MATERIAL_DEMO } from "@/lib/tourDemo";
import type { BancoDeSemana } from "@/services/bancoPreguntas";
import type { TemaCurable } from "@/services/curacionTemas";

/**
 * Curso de ejemplo de la guía del docente. EXISTE SOLO EN EL FRONTEND.
 *
 * POR QUE NO SE USAN LOS CURSOS REALES. La guía debe mostrar un curso representativo —con
 * semanas, material, temas detectados, banco de preguntas y notas—, y un docente nuevo aún no
 * tiene nada de eso. Además, recorrer un curso real expone datos de sus alumnos en una
 * pantalla que se usa para aprender. Aquí nada toca el servidor: los nombres, los correos y
 * las notas son ficticios.
 *
 * POR QUE DESAPARECE. La tarjeta solo se muestra con la guía activa (ver TeacherDashboard), y
 * al cerrarla la guía devuelve al docente a /docente si se quedó dentro del curso de ejemplo.
 */

export const CURSO_DOCENTE_DEMO_ID = "guia-docente-demo";
export const SEMANA_DOCENTE_DEMO_ID = "guia-docente-demo-s1";
const SEMANA_DOCENTE_DEMO_2_ID = "guia-docente-demo-s2";
const PREFIJO_MATERIAL_ID = "guia-docente-demo-m";

export const RUTA_CURSO_DOCENTE_DEMO = `/docente/curso/${CURSO_DOCENTE_DEMO_ID}`;
export const RUTA_SEMANA_DOCENTE_DEMO = `${RUTA_CURSO_DOCENTE_DEMO}/semana/${SEMANA_DOCENTE_DEMO_ID}`;

export const esCursoDocenteDemo = (id?: string | number | null) => String(id ?? "") === CURSO_DOCENTE_DEMO_ID;
export const esSemanaDocenteDemo = (id?: string | number | null) => String(id ?? "").startsWith(`${CURSO_DOCENTE_DEMO_ID}-s`);
export const esMaterialDocenteDemo = (id?: string | number | null) => String(id ?? "").startsWith(PREFIJO_MATERIAL_ID);
export const enCursoDocenteDemo = (ruta: string) => ruta.startsWith(RUTA_CURSO_DOCENTE_DEMO);

// ---------------------------------------------------------------- estado de la guía
const CLAVE_ACTIVA = "guia_docente_activa";
const EVENTO = "guia_docente_change";

export function marcarGuiaDocenteActiva(activa: boolean) {
    try {
        if (activa) localStorage.setItem(CLAVE_ACTIVA, "true");
        else localStorage.removeItem(CLAVE_ACTIVA);
    } catch { /* sin persistencia: la tarjeta de ejemplo no se muestra */ }
    window.dispatchEvent(new Event(EVENTO));
}

export function useGuiaDocenteActiva(): boolean {
    const leer = () => { try { return localStorage.getItem(CLAVE_ACTIVA) === "true"; } catch { return false; } };
    const [activa, setActiva] = useState(leer);
    useEffect(() => {
        const cambio = () => setActiva(leer());
        window.addEventListener(EVENTO, cambio);
        window.addEventListener("storage", cambio);
        return () => {
            window.removeEventListener(EVENTO, cambio);
            window.removeEventListener("storage", cambio);
        };
    }, []);
    return activa;
}

// ---------------------------------------------------------------- datos de ejemplo
const MATERIALES = [
    {
        id: `${PREFIJO_MATERIAL_ID}1`,
        mongoId: `${PREFIJO_MATERIAL_DEMO}el-signo-linguistico-ejemplo.pdf`,
        nombreArchivo: "el-signo-linguistico-ejemplo.pdf",
        visible: true,
        fechaCarga: "2026-09-14T14:00:00",
    },
    {
        id: `${PREFIJO_MATERIAL_ID}2`,
        mongoId: `${PREFIJO_MATERIAL_DEMO}clases-de-determinantes-ejemplo.docx`,
        nombreArchivo: "clases-de-determinantes-ejemplo.docx",
        visible: false,
        fechaCarga: "2026-09-15T16:30:00",
    },
];

export const CURSO_DOCENTE_DEMO = {
    id: CURSO_DOCENTE_DEMO_ID,
    name: "Comunicación 3.° A · Curso de ejemplo",
    description: "Curso de ejemplo de la guía de uso",
    color: "#2563EB",
    emoji: "📘",
    weeks: 2,
    studentCount: 28,
    bannerVersion: null,
};

export const SEMANAS_DOCENTE_DEMO = [
    { id: SEMANA_DOCENTE_DEMO_ID, numSem: "Semana 1", nombreTema: "El signo lingüístico", habilitada: true, totalPreguntas: 3, materiales: MATERIALES },
    { id: SEMANA_DOCENTE_DEMO_2_ID, numSem: "Semana 2", nombreTema: "Clases de determinantes", habilitada: false, totalPreguntas: 0, materiales: [] },
];

export const semanaDocenteDemo = (id: string) => SEMANAS_DOCENTE_DEMO.find((s) => s.id === id) ?? SEMANAS_DOCENTE_DEMO[0];

const TEMAS: Record<string, TemaCurable[]> = {
    [`${PREFIJO_MATERIAL_ID}1`]: [
        { tema: "Significado y significante", aceptado: true, motivo: null, evidencia: [] },
        { tema: "Arbitrariedad del signo", aceptado: null, motivo: null, evidencia: [] },
        { tema: "Índice del documento", aceptado: false, motivo: "No es un tema del curso", evidencia: [] },
    ],
    [`${PREFIJO_MATERIAL_ID}2`]: [
        { tema: "Determinantes demostrativos", aceptado: null, motivo: null, evidencia: [] },
        { tema: "Determinantes posesivos", aceptado: null, motivo: null, evidencia: [] },
    ],
};
export const temasDocenteDemo = (materialId: string) => TEMAS[materialId] ?? [];
export const EVIDENCIA_DOCENTE_DEMO = [
    "«El signo lingüístico une un concepto (significado) con una imagen acústica (significante)…» — fragmento de ejemplo.",
];

export const BANCO_DOCENTE_DEMO: BancoDeSemana = {
    numSem: "Semana 1",
    nombreTema: "El signo lingüístico",
    total: 3,
    porNivelBloom: { Comprender: 1, Analizar: 1, Evaluar: 1 },
    sinRespuestaCorrecta: 0,
    preguntas: [
        {
            id: 1, enunciado: "¿Qué une el signo lingüístico según Saussure?", tipo: "OPCION_MULTIPLE", nivelBloom: "Comprender",
            nivelDificultad: "Básico", conceptos: "signo lingüístico", respuestaCorrecta: "Un significado y un significante",
            opciones: ["Una palabra y un objeto", "Un significado y un significante", "Un sonido y una letra", "Un hablante y un oyente"],
            vecesRespondida: 4, aciertos: 3, tasaAcierto: 0.75, lecturaDificultad: "Muestra pequeña: 4 respuestas.",
            respuestas: [
                { alumno: "Lucía Paredes (ejemplo)", respuesta: "Un significado y un significante", correcta: true, retroalimentacion: null, fecha: "2026-09-16T10:12:00" },
                { alumno: "Mateo Quispe (ejemplo)", respuesta: "Una palabra y un objeto", correcta: false, retroalimentacion: null, fecha: "2026-09-16T10:14:00" },
            ],
        },
        {
            id: 2, enunciado: "Analice por qué «árbol» y «tree» designan lo mismo con significantes distintos.", tipo: "ABIERTA",
            nivelBloom: "Analizar", nivelDificultad: "Intermedio", conceptos: "arbitrariedad", respuestaCorrecta: "La relación entre significado y significante es convencional, no natural.",
            opciones: [], vecesRespondida: 3, aciertos: 2, tasaAcierto: 0.67, lecturaDificultad: "Muestra pequeña: 3 respuestas.",
            respuestas: [
                { alumno: "Lucía Paredes (ejemplo)", respuesta: "Porque cada lengua asocia sonidos distintos al mismo concepto por convención.", correcta: true,
                  retroalimentacion: "Identifica bien la convención; podría mencionar el término «arbitrariedad».", fecha: "2026-09-16T10:20:00" },
            ],
        },
        {
            id: 3, enunciado: "Evalúe si las onomatopeyas contradicen la arbitrariedad del signo.", tipo: "ABIERTA",
            nivelBloom: "Evaluar", nivelDificultad: "Avanzado", conceptos: "arbitrariedad, motivación", respuestaCorrecta: "Solo en parte: incluso las onomatopeyas varían entre lenguas.",
            opciones: [], vecesRespondida: 0, aciertos: 0, tasaAcierto: null, lecturaDificultad: "Aún nadie la ha respondido.", respuestas: [],
        },
    ],
};

export const INTENTOS_DOCENTE_DEMO = [
    { id: "d1", alumno: "Lucía Paredes (ejemplo)", correo: "lucia@ejemplo.pe", tecnica: "OPCION_MULTIPLE", nota: 18, fecha: "2026-09-16T10:15:00" },
    { id: "d2", alumno: "Lucía Paredes (ejemplo)", correo: "lucia@ejemplo.pe", tecnica: "ABIERTA", nota: 16, fecha: "2026-09-17T09:40:00" },
    { id: "d3", alumno: "Mateo Quispe (ejemplo)", correo: "mateo@ejemplo.pe", tecnica: "OPCION_MULTIPLE", nota: 12, fecha: "2026-09-16T10:18:00" },
    { id: "d4", alumno: "Valeria Ríos (ejemplo)", correo: "valeria@ejemplo.pe", tecnica: "VERDADERO_FALSO", nota: 15, fecha: "2026-09-18T11:05:00" },
];
