import { EvaluationRepository } from "../../domain/repositories/EvaluationRepository";
import { EvaluationResponse } from "../../domain/entities/Evaluation";

export class GenerateQuestions {
    constructor(private evaluationRepository: EvaluationRepository) {}

    async execute(mongoId: string, tipo: string, cantidad: number, tema?: string): Promise<EvaluationResponse> {
        return this.evaluationRepository.generateQuestions(mongoId, tipo, cantidad, tema);
    }

    executeStream(
        mongoId: string,
        tipo: string,
        cantidad: number,
        tema: string,
        token: string,
        onChunk: (chunk: string) => void,
        onResult: (data: EvaluationResponse) => void,
        onError: (err: any) => void
    ): () => void {
        return this.evaluationRepository.generateQuestionsStream(
            mongoId,
            tipo,
            cantidad,
            tema,
            token,
            onChunk,
            onResult,
            onError
        );
    }
}
