export interface EvaluarRespuestaRequest {
    pregunta: string;
    respuestaEsperada: string;
    respuestaEstudiante: string;
    totalPreguntas: number;
    tipoPregunta: string;
}

export interface DetalleError {
    palabra_con_error: string;
    esCorrecto: boolean;
}

export interface EvaluarRespuestaResponse {
    pregunta_evaluada: string;
    evaluacion: {
        esCorrecta: boolean;
        puntaje: number;
        explicacion: string;
        detalles?: DetalleError[];
        texto_corregido?: string;
    };
    metricas_rendimiento: {
        latencia_segundos: number;
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    };
}

export interface AgentJudgeRepository {
    evaluateAnswer(data: EvaluarRespuestaRequest): Promise<EvaluarRespuestaResponse>;
}
