import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetWeekDetails } from "../../application/use-cases/GetWeekDetails";
import { ApiCourseRepository } from "../../infrastructure/repositories/ApiCourseRepository";

const courseRepo = new ApiCourseRepository();
const getWeekDetailsUseCase = new GetWeekDetails(courseRepo);

export function useEvalModeSelect() {
    const { courseId = "", semanaId: week = "" } = useParams();
    const [cantidad, setCantidad] = useState(5);
    const [selectedFile, setSelectedFile] = useState<{ id: string, name: string } | null>(null);

    const { data: semana, isLoading } = useQuery({
        queryKey: ["semana", week],
        queryFn: () => getWeekDetailsUseCase.execute(week),
        enabled: !!week,
    });

    return {
        courseId,
        semanaId: week,
        cantidad,
        setCantidad,
        selectedFile,
        setSelectedFile,
        semana,
        isLoading,
    };
}
