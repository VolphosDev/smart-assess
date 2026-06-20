import { SaveAttemptRequest, AttemptRecord } from "../entities/Attempt";

export interface AttemptRepository {
    save(data: SaveAttemptRequest): Promise<any>;
    getAttemptsByStudent(usuarioId: number | string): Promise<AttemptRecord[]>;
    getAttemptsByWeek(semanaId: number | string): Promise<any[]>;
}
