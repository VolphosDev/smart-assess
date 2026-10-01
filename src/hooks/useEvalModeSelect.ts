import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { semanasApi } from "@/services/courses";
import { SEMANA_DEMO, esSemanaDemo } from "@/lib/tourDemo";

export function useEvalModeSelect() {
    const { courseId = "", semanaId: week = "" } = useParams();
    const [cantidad, setCantidad] = useState(5);
    const [selectedSubtemas, setSelectedSubtemas] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<{ id: string, name: string } | null>(null);

    const esDemo = esSemanaDemo(week);
    const { data: semanaServidor, isLoading } = useQuery({
        queryKey: ["semana", week],
        queryFn: () => semanasApi.get(week),
        enabled: !!week && !esDemo,
    });
    // La semana del curso de ejemplo de Aria no existe en el servidor (ver lib/tourDemo).
    const semana: any = esDemo ? SEMANA_DEMO : semanaServidor;

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
        isLoading: isLoading && !esDemo,
        esDemo,
    };
}
