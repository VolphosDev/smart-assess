import { AgentJudgeRepository, EvaluarRespuestaRequest, EvaluarRespuestaResponse } from "../../domain/repositories/AgentJudgeRepository";
import { apiClient } from "../http/apiClient";

export class ApiAgentJudgeRepository implements AgentJudgeRepository {
    evaluateAnswer(data: EvaluarRespuestaRequest): Promise<EvaluarRespuestaResponse> {
        return apiClient.post<EvaluarRespuestaResponse>('/agent-judge/evaluar-respuesta', data);
    }
}
