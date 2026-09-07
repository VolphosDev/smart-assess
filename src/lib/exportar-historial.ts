/**
 * Exportación del historial del alumno a CSV.
 *
 * Vive aquí y no dentro de HistoryPage porque lo usan dos botones distintos —"descargar
 * todo mi historial" y "descargar este intento"— y tienen que producir exactamente el
 * mismo formato de archivo. Una fila por pregunta, no por intento: lo que el alumno quiere
 * revisar es en qué preguntas falló, no una lista de notas.
 */

export const etiquetaTecnica = (tecnica?: string): string => {
    if (!tecnica) return "Práctica";
    switch (tecnica.toLowerCase()) {
        case "opcion_multiple": return "Opción múltiple";
        case "verdadero_falso": return "Verdadero / Falso";
        case "abierta": return "Pregunta abierta";
        case "deteccion_errores": return "Detección de errores";
        case "visual_quiz": return "Visual Quiz";
        case "avatar": return "Avatar Tutor";
        case "video": return "Video Tutor";
        case "adaptativa": return "Evaluación Recomendadora";
        default: return tecnica;
    }
};

const COLUMNAS = [
    "Curso", "Semana", "Tema de la semana", "Técnica", "N° de intento", "Fecha",
    "Nota del intento", "N° de pregunta", "Pregunta", "Tu respuesta",
    "Respuesta correcta", "Resultado", "Retroalimentación", "Nivel de Bloom", "Concepto",
];

/** Escapado CSV: comillas dobladas y todo el valor entrecomillado, para que una pregunta
 *  que contenga comas o saltos de línea no parta la fila en dos. */
const celda = (valor: unknown): string => {
    const texto = valor === null || valor === undefined ? "" : String(valor);
    return `"${texto.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
};

const filasDeIntento = (intento: any): string[][] =>
    (intento.respuestas || []).map((r: any, i: number) => [
        intento.cursoNombre ?? "",
        intento.semana ?? "",
        intento.nombreTema ?? "",
        etiquetaTecnica(intento.tecnica),
        intento.attemptNumber ?? "",
        intento.fecha ? new Date(intento.fecha).toLocaleString("es-PE") : "",
        intento.nota ?? "",
        i + 1,
        r.pregunta ?? "",
        r.respuesta ?? "",
        // Los intentos anteriores a que se persistiera este campo no lo tienen. Decirlo es
        // más honesto que dejar la celda vacía, que parecería un fallo de la descarga.
        r.respuestaCorrecta ?? "(no registrada en este intento)",
        r.esCorrecta ? "Correcto" : "Incorrecto",
        r.retroalimentacion ?? "",
        r.nivelBloom ?? "",
        r.conceptos ?? "",
    ]);

const descargar = (contenido: string, nombreArchivo: string) => {
    // El BOM ﻿ es lo que hace que Excel en Windows lea las tildes correctamente.
    const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.style.visibility = "hidden";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
};

const construirCsv = (intentos: any[]): string =>
    [COLUMNAS, ...intentos.flatMap(filasDeIntento)]
        .map((fila) => fila.map(celda).join(","))
        .join("\n");

/** Un archivo con todas las preguntas de todos los intentos del alumno. */
export const exportarHistorialCompleto = (intentos: any[], nombreAlumno?: string) => {
    const alumno = (nombreAlumno || "alumno").replace(/[^\p{L}\p{N}]+/gu, "_");
    const hoy = new Date().toISOString().slice(0, 10);
    descargar(construirCsv(intentos), `Mis_preguntas_y_respuestas_${alumno}_${hoy}.csv`);
};

/** Un archivo con las preguntas de un solo intento. */
export const exportarIntento = (intento: any) => {
    const curso = String(intento.cursoNombre || "curso").replace(/[^\p{L}\p{N}]+/gu, "_");
    const semana = String(intento.semana || "").replace(/[^\p{L}\p{N}]+/gu, "_");
    descargar(construirCsv([intento]), `${curso}_${semana}_intento_${intento.attemptNumber ?? intento.id}.csv`);
};

/** Cuántas preguntas hay realmente descargables, para no ofrecer un archivo vacío. */
export const totalPreguntas = (intentos: any[]): number =>
    intentos.reduce((suma, i) => suma + (i.respuestas?.length || 0), 0);
