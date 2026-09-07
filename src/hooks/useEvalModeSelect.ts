import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { semanasApi } from "@/api/courses";

export function useEvalModeSelect() {
    const { courseId = "", semanaId: week = "" } = useParams();
    const [cantidad, setCantidad] = useState(5);
    const [selectedSubtemas, setSelectedSubtemas] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<{ id: string, name: string } | null>(null);

    const { data: semana, isLoading } = useQuery({
        queryKey: ["semana", week],
        queryFn: () => semanasApi.get(week),
        enabled: !!week,
    });

    return {
        courseId,
        semanaId: week,
        cantidad,
        setCantidad,
        selectedSubtemas,
        setSelectedSubtemas,
        selectedFile,
        setSelectedFile,
        semana,
        isLoading,
    };
}
