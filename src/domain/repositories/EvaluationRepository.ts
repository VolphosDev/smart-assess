import { EvaluationResponse } from "../entities/Evaluation";

export interface EvaluationRepository {
    generateQuestions(mongoId: string, tipo: string, cantidad: number, tema?: string): Promise<EvaluationResponse>;
    generateQuestionsStream(
        mongoId: string,
        tipo: string,
        cantidad: number,
        tema: string,
        token: string,
        onChunk: (chunk: string) => void,
        onResult: (data: EvaluationResponse) => void,
        onError: (err: any) => void
    ): () => void;
}
