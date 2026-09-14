export interface Question {
    enunciado: string;
    opciones_o_respuesta: string[] | string;
    justificacion_pregunta: string;
    respuesta_correcta?: string;
    base64_imagen?: string;
    prompt_imagen?: string;
    /** Tema puntual que evalúa esta pregunta (ver PromptTemplateService.UNIVERSAL_SCHEMA
     *  en el backend). Alimenta el mapa de conocimiento por concepto. */
    concepto?: string;
    /**
     * Tipo del reactivo tal como lo declara el generador (OPCION_MULTIPLE, ABIERTA,
     * DETECCION_ERRORES, VISUAL_QUIZ...). Faltaba en el tipo aunque el backend siempre lo
     * envia, asi que la pantalla de resultados no podia distinguir un formato de otro y
     * pintaba todas las respuestas igual.
     */
    tipo_pregunta?: string;
}

export interface EvaluationResponse {
    preguntas: Question[];
    tipo_pregunta: string;
    nivel_bloom: string;
    metricas_objetivas: Record<string, unknown>;
}
