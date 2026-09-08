/**
 * Etiquetas de control que Aria emite dentro de su respuesta.
 *
 * El modelo termina su texto con marcas como `[PUNTUACION: 3] [SENTIMIENTO: DUDA]
 * [ACCION: REPREGUNTA]`. Son instrucciones para la aplicación, no parte de lo que el alumno
 * debe leer.
 *
 * POR QUE ESTÁ AQUÍ Y NO SUELTO EN LA VISTA. Antes cada punto de `AvatarTutor` repetía sus
 * propios `.replace(...)`, y en el que pinta la burbuja faltaba justo el de `[ACCION:]`: el
 * alumno leía "...siempre sale ganando. [ACCION: AVANZAR]". Con seis copias de la misma
 * limpieza, que una se quede corta es cuestión de tiempo; con una sola, se arregla una vez.
 */

/** Las tres etiquetas conocidas. Global: si el modelo repite una, se quitan todas. */
const ETIQUETAS = /\[(?:PUNTUACION|SENTIMIENTO|ACCION)\s*:\s*[^\]]*\]/gi;

/**
 * Una etiqueta a medio llegar al final del texto, mientras el stream sigue abierto.
 *
 * Sin esto, el alumno ve aparecer "[ACCI" durante una fracción de segundo antes de que
 * complete el corchete. Solo se recorta al FINAL del texto: un corchete en mitad de la frase
 * es contenido del alumno, no una etiqueta.
 */
const ETIQUETA_PARCIAL = /\[(?:P(?:U(?:N(?:T(?:U(?:A(?:C(?:I(?:O(?:N)?)?)?)?)?)?)?)?)?|S(?:E(?:N(?:T(?:I(?:M(?:I(?:E(?:N(?:T(?:O)?)?)?)?)?)?)?)?)?)?|A(?:C(?:C(?:I(?:O(?:N)?)?)?)?)?)(?:\s*:[^\]]*)?$/i;

/** El texto que el alumno debe leer, sin ninguna marca de control. */
export function limpiarEtiquetas(texto: string | null | undefined): string {
    if (!texto) return "";
    return texto.replace(ETIQUETAS, "").replace(ETIQUETA_PARCIAL, "").trim();
}

export interface EtiquetasTutor {
    puntuacion?: number;
    sentimiento?: string;
    /** "AVANZAR" cierra el concepto; "REPREGUNTA" deja el turno abierto. */
    accion?: string;
    /**
     * true cuando el turno se dio por cerrado.
     *
     * Si el modelo omite `[ACCION:]` se asume cerrado, el mismo criterio que usa el servidor
     * en `registrarTurno`. Que las dos capas discrepen produciría turnos guardados como
     * cerrados que en pantalla siguen abiertos.
     */
    cerrado: boolean;
}

export function leerEtiquetas(texto: string | null | undefined): EtiquetasTutor {
    if (!texto) return { cerrado: false };

    const puntuacion = texto.match(/\[PUNTUACION:\s*(\d+)\]/i);
    const sentimiento = texto.match(/\[SENTIMIENTO:\s*(\w+)\]/i);
    const accion = texto.match(/\[ACCION:\s*(\w+)\]/i);

    return {
        puntuacion: puntuacion ? parseInt(puntuacion[1], 10) : undefined,
        sentimiento: sentimiento ? sentimiento[1] : undefined,
        accion: accion ? accion[1].toUpperCase() : undefined,
        cerrado: !accion || accion[1].toUpperCase() !== "REPREGUNTA",
    };
}

/**
 * La puntuación que se puede MOSTRAR, que no es siempre la que el modelo escribió.
 *
 * En una repregunta el turno sigue abierto: el alumno todavía no ha dado su respuesta final,
 * así que cualquier cifra ahí es un juicio a medio hacer. Enseñársela es peor que no enseñar
 * nada — vio "Fundamentación: 0 de 4" justo cuando Aria acababa de decirle que iba bien y le
 * pedía profundizar. La nota aparece cuando el concepto se cierra.
 */
export function puntuacionVisible(texto: string | null | undefined): number | undefined {
    const { puntuacion, cerrado } = leerEtiquetas(texto);
    return cerrado ? puntuacion : undefined;
}
