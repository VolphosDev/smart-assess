export interface EvaluarRespuestaRequest {
    pregunta: string;
    respuestaEsperada: string;
    respuestaEstudiante: string;
    totalPreguntas: number;
    tipoPregunta: string;
}

export interface EvaluarRespuestaResponse {
    pregunta_evaluada: string;
    evaluacion: {
        esCorrecta: boolean;
        puntaje: number;
        explicacion: string;
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
