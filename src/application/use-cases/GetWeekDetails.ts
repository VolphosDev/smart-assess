import { CourseRepository } from "../../domain/repositories/CourseRepository";
import { Week } from "../../domain/entities/Course";

export class GetWeekDetails {
    constructor(private courseRepository: CourseRepository) {}

    async execute(semanaId: string | number): Promise<Week> {
        return this.courseRepository.getWeek(semanaId);
    }
}
