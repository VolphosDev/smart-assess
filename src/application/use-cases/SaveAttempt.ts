import { AttemptRepository } from "../../domain/repositories/AttemptRepository";
import { SaveAttemptRequest } from "../../domain/entities/Attempt";

export class SaveAttempt {
    constructor(private attemptRepository: AttemptRepository) {}

    async execute(data: SaveAttemptRequest): Promise<any> {
        return this.attemptRepository.save(data);
    }
}
