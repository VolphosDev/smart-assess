import { CourseRepository } from "../../domain/repositories/CourseRepository";
import { Week } from "../../domain/entities/Course";

export class GetCourseWeeks {
    constructor(private courseRepository: CourseRepository) {}

    async execute(courseId: string | number): Promise<Week[]> {
        return this.courseRepository.getWeeks(courseId);
    }
}
