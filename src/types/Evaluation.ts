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
}

export interface EvaluationResponse {
    preguntas: Question[];
    tipo_pregunta: string;
    nivel_bloom: string;
    metricas_objetivas: Record<string, unknown>;
}
