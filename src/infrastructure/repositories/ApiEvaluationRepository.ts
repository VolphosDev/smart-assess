import { EvaluationRepository } from "../../domain/repositories/EvaluationRepository";
import { EvaluationResponse } from "../../domain/entities/Evaluation";
import { apiClient } from "../http/apiClient";

export class ApiEvaluationRepository implements EvaluationRepository {
    async generateQuestions(mongoId: string, tipo: string, cantidad: number, tema?: string): Promise<EvaluationResponse> {
        const url = `/archivos/una-tecnica-pdf-id?mongoId=${encodeURIComponent(mongoId)}&tipo=${tipo}&cantidad=${cantidad}${tema ? `&tema=${encodeURIComponent(tema)}` : ""}`;
        return apiClient.post<EvaluationResponse>(url, null);
    }

    generateQuestionsStream(
        mongoId: string,
        tipo: string,
        cantidad: number,
        tema: string,
        token: string,
        onChunk: (chunk: string) => void,
        onResult: (data: EvaluationResponse) => void,
        onError: (err: any) => void
    ): () => void {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const url = `${baseUrl}/archivos/stream-tecnica-pdf?mongoId=${encodeURIComponent(mongoId)}&tipo=${tipo}&cantidad=${cantidad}${tema ? `&tema=${encodeURIComponent(tema)}` : ""}&token=${token}`;
        
        const eventSource = new EventSource(url, { withCredentials: true });
        
        eventSource.addEventListener("chunk", (e) => {
            if (e.data) onChunk(e.data);
        });
        
        eventSource.addEventListener("result", (e) => {
            try {
                const data = JSON.parse(e.data);
                onResult(data);
            } catch (err) {
                onError(err);
            } finally {
                eventSource.close();
            }
        });
        
        eventSource.onerror = (err) => {
            onError(err);
            eventSource.close();
        };

        return () => eventSource.close();
    }
}
