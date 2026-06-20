import { AttemptRepository } from "../../domain/repositories/AttemptRepository";
import { SaveAttemptRequest, AttemptRecord } from "../../domain/entities/Attempt";
import { apiClient } from "../http/apiClient";

export class ApiAttemptRepository implements AttemptRepository {
    save(data: SaveAttemptRequest): Promise<any> {
        return apiClient.post('/intentos/guardar', data);
    }

    getAttemptsByStudent(usuarioId: number | string): Promise<AttemptRecord[]> {
        return apiClient.get<AttemptRecord[]>(`/intentos/mis-intentos/${usuarioId}`);
    }

    getAttemptsByWeek(semanaId: number | string): Promise<any[]> {
        return apiClient.get<any[]>(`/intentos/semana/${semanaId}`);
    }
}
