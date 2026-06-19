import { AgentJudgeRepository, EvaluarRespuestaRequest, EvaluarRespuestaResponse } from "../../domain/repositories/AgentJudgeRepository";

export class EvaluateOpenAnswer {
    constructor(private agentJudgeRepository: AgentJudgeRepository) {}

    async execute(data: EvaluarRespuestaRequest): Promise<EvaluarRespuestaResponse> {
        return this.agentJudgeRepository.evaluateAnswer(data);
    }
}
