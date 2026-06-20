import { CourseRepository } from "../../domain/repositories/CourseRepository";
import { Course } from "../../domain/entities/Course";

export class GetCoursesForStudent {
    constructor(private courseRepository: CourseRepository) {}

    async execute(studentId: string): Promise<Course[]> {
        return this.courseRepository.getForStudent(studentId);
    }
}
