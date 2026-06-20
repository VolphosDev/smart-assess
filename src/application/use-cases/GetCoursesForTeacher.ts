import { CourseRepository } from "../../domain/repositories/CourseRepository";
import { Course } from "../../domain/entities/Course";

export class GetCoursesForTeacher {
    constructor(private courseRepository: CourseRepository) {}

    async execute(teacherId: string): Promise<Course[]> {
        return this.courseRepository.getForTeacher(teacherId);
    }
}
