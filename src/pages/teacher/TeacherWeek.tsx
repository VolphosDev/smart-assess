import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Trash2, FileText, BookOpen, Loader2, Eye, EyeOff, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { semanasApi, intentosApi, coursesApi } from "@/api/courses.ts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import React, { useRef, useState } from "react";
// 1. IMPORTAMOS EL NUEVO MODAL UNIVERSAL
import { UniversalPreviewModal } from "@/components/UniversalPreviewModal";
import {cn} from "@/lib/utils.ts";

export default function TeacherWeek() {
    const { courseId = "", semanaId = "" } = useParams();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: semana, isLoading } = useQuery({
        queryKey: ["semana", semanaId],
        queryFn: () => semanasApi.get(semanaId),
        enabled: !!semanaId,
    });

    const { data: intentos = [], isLoading: loadingIntentos } = useQuery({
        queryKey: ["semana-intentos", semanaId],
        queryFn: () => intentosApi.porSemana(semanaId),
        enabled: !!semanaId,
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const teacherId = user.id;

    const { data: courses = [] } = useQuery({
        queryKey: ['teacher-courses', teacherId],
        queryFn: () => coursesApi.forTeacher(teacherId),
        enabled: !!teacherId,
    });
    const course = courses.find((c: any) => String(c.id) === String(courseId));
    const courseColor = course?.color || "primary";
    const bgSolid = courseColor === "lime" ? "bg-emerald-600" : courseColor === "coral" ? "bg-rose-600" : "bg-indigo-600";

    // 2. ACTUALIZAMOS EL ESTADO PARA GUARDAR ID Y NOMBRE
    const [selectedFile, setSelectedFile] = useState<{ id: string, name: string } | null>(null);
    const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

    const toggleStudentExpand = (email: string) => {
        setExpandedStudents(prev => ({ ...prev, [email]: !prev[email] }));
    };

    // Determinar si los intentos ya vienen agrupados desde el backend o si es el formato plano antiguo
    const isGroupedFormat = intentos.length > 0 && intentos[0].intentos !== undefined;

    let groupedStudents: any[] = [];
    if (isGroupedFormat) {
        groupedStudents = intentos;
    } else {
        // Fallback: agrupar manualmente si el backend aún devuelve la lista plana (ej. no se ha reiniciado Spring Boot)
        const studentMap = new Map<string, { nombre: string; correo: string; intentos: any[] }>();
        intentos.forEach((i: any) => {
            const key = i.correo || "";
            if (!studentMap.has(key)) {
                studentMap.set(key, { nombre: i.alumno || "Alumno", correo: i.correo || "", intentos: [] });
            }
            studentMap.get(key)!.intentos.push(i);
        });

        groupedStudents = Array.from(studentMap.values()).map(student => {
            const total = student.intentos.reduce((sum, a) => sum + (a.nota || 0), 0);
            const avg = student.intentos.length > 0 ? (total / student.intentos.length) : 0;
            return {
                alumno: student.nombre,
                correo: student.correo,
                promedio: parseFloat(avg.toFixed(1)),
                totalIntentos: student.intentos.length,
                intentos: student.intentos
            };
        });
    }

    // Grouping averages by technique (exam) across all students
    const techniqueMap = new Map<string, { total: number; count: number }>();
    groupedStudents.forEach((student: any) => {
        if (student.intentos) {
            student.intentos.forEach((i: any) => {
                const key = i.tecnica || "Práctica";
                if (!techniqueMap.has(key)) {
                    techniqueMap.set(key, { total: 0, count: 0 });
                }
                const t = techniqueMap.get(key)!;
                t.total += (i.nota || 0);
                t.count += 1;
            });
        }
    });

    const techniqueAverages = Array.from(techniqueMap.entries()).map(([tecnica, data]) => {
        let label = tecnica;
        switch (tecnica.toLowerCase()) {
            case "opcion_multiple": label = "Opción múltiple"; break;
            case "verdadero_falso": label = "Verdadero / Falso"; break;
            case "abierta": label = "Pregunta abierta"; break;
            case "deteccion_errores": label = "Detección de errores"; break;
            case "visual_quiz": label = "Visual Quiz"; break;
            case "avatar": label = "Avatar Tutor"; break;
            case "video": label = "Video Tutor"; break;
            case "adaptativa": label = "Evaluación Recomendadora"; break;
        }
        return {
            tecnicaRaw: tecnica,
            tecnicaLabel: label,
            promedio: parseFloat((data.total / data.count).toFixed(1)),
            count: data.count
        };
    });

    const uploadMutation = useMutation({
        mutationFn: (files: File[]) => semanasApi.uploadFiles(semanaId, files),
        onSuccess: () => {
            toast.success("Archivos subidos y vinculados correctamente");
            queryClient.invalidateQueries({ queryKey: ["semana", semanaId] });
            queryClient.invalidateQueries({ queryKey: ["semanas", courseId] });
        },
        onError: () => toast.error("Error al subir los archivos"),
    });

    const deleteMutation = useMutation({
        mutationFn: (materialId: string | number) => semanasApi.deleteMaterial(materialId),
        onSuccess: () => {
            toast.success("Archivo eliminado");
            queryClient.invalidateQueries({ queryKey: ["semana", semanaId] });
            queryClient.invalidateQueries({ queryKey: ["semanas", courseId] });
        },
        onError: () => toast.error("Error al eliminar el archivo"),
    });

    const toggleVisibilidadMutation = useMutation({
        mutationFn: (materialId: string | number) => semanasApi.toggleMaterialVisibility(materialId),
        onSuccess: () => {
            toast.success("Visibilidad actualizada");
            queryClient.invalidateQueries({ queryKey: ["semana", semanaId] });
        },
        onError: () => toast.error("Error al cambiar la visibilidad"),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const allowedTypes = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ];

            const allValid = files.every(f => allowedTypes.includes(f.type));
            if (!allValid) {
                toast.error("Solo se permiten archivos PDF o DOCX");
                return;
            }

            // Validar que ningún archivo exceda los 25 MB
            const MAX_SIZE = 25 * 1024 * 1024;
            const hasTooLargeFile = files.some(f => f.size > MAX_SIZE);
            if (hasTooLargeFile) {
                toast.error("El peso de este archivo es mayor a 25 MB, por favor comprímelo o sube otro");
                return;
            }

            uploadMutation.mutate(files);
        }
        e.target.value = "";
    };

    const handleDownloadCSV = () => {
        if (!intentos || intentos.length === 0) {
            toast.error("No hay notas registradas para descargar");
            return;
        }

        const rows: any[] = [];
        groupedStudents.forEach((student: any) => {
            if (student.intentos) {
                student.intentos.forEach((i: any) => {
                    let tecnicaLabel = i.tecnica || "Práctica";
                    switch (tecnicaLabel.toLowerCase()) {
                        case "opcion_multiple": tecnicaLabel = "Opción múltiple"; break;
                        case "verdadero_falso": tecnicaLabel = "Verdadero / Falso"; break;
                        case "abierta": tecnicaLabel = "Pregunta abierta"; break;
                        case "deteccion_errores": tecnicaLabel = "Detección de errores"; break;
                        case "visual_quiz": tecnicaLabel = "Visual Quiz"; break;
                        case "avatar": tecnicaLabel = "Avatar Tutor"; break;
                        case "video": tecnicaLabel = "Video Tutor"; break;
                        case "adaptativa": tecnicaLabel = "Evaluación Recomendadora"; break;
                    }
                    rows.push([
                        i.id,
                        student.alumno,
                        student.correo,
                        tecnicaLabel,
                        i.nota,
                        new Date(i.fecha).toLocaleString()
                    ]);
                });
            }
        });

        const csvRows = [
            headers.join(","),
            ...rows.map((row: any) => row.map((val: any) => {
                const stringVal = val === null || val === undefined ? "" : String(val);
                const escaped = stringVal.replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(","))
        ];
        const csvContent = csvRows.join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Notas_${semana?.numSem || "Semana"}_Curso_${courseId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Archivo descargado exitosamente");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const materiales = semana?.materiales || [];

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <Link
                to={`/docente/curso/${courseId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" /> Volver al curso
            </Link>

            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("rounded-[2rem] p-8 text-primary-foreground shadow-glow relative overflow-hidden", bgSolid)}
            >
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[8rem] opacity-35 select-none pointer-events-none">📄</div>
                <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-xs font-bold uppercase tracking-wider mb-3">
                    Gestión de material
                </span>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
                    {semana?.numSem ?? "Semana"}
                </h1>
                <p className="opacity-80 text-sm">
                    {semana?.totalPreguntas ?? 0} preguntas generadas · {materiales.length} archivo(s)
                </p>
            </motion.div>

            {/* Zona Archivos Múltiples */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6 shadow-soft space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-xl">Material de la semana</h2>
                    <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                        className={cn("rounded-lg text-white", bgSolid)}
                    >
                        <Upload className="w-4 h-4 mr-1" /> {uploadMutation.isPending ? "Subiendo..." : "Añadir archivos"}
                    </Button>
                </div>

                {materiales.length > 0 ? (
                    <div className="space-y-3">
                        {materiales.map((mat: any) => (
                            <div key={mat.id} className={cn(
                                "flex items-center gap-4 rounded-xl p-4 transition-all",
                                mat.visible ? "bg-muted/50" : "bg-muted/20 opacity-60" // Si está oculto, se ve más apagado
                            )}>
                                <div className={cn(
                                    "w-12 h-12 rounded-lg grid place-items-center text-primary-foreground shadow-soft shrink-0",
                                    mat.visible ? bgSolid : "bg-muted-foreground"
                                )}>
                                    <FileText className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{mat.nombreArchivo}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span className="font-mono">ID: {mat.mongoId ?? "—"}</span>
                                        {mat.fechaCarga && (
                                            <>
                                                <span>•</span>
                                                <span>{new Date(mat.fechaCarga).toLocaleDateString()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Botón para previsualizar */}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="rounded-xl"
                                    onClick={() => setSelectedFile({ id: mat.mongoId, name: mat.nombreArchivo })}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>

                                <Button
                                    size="sm"
                                    variant={mat.visible ? "outline" : "secondary"}
                                    className={cn("rounded-lg", !mat.visible && "text-amber-600 bg-amber-100 hover:bg-amber-200")}
                                    onClick={() => toggleVisibilidadMutation.mutate(mat.id)}
                                    disabled={toggleVisibilidadMutation.isPending}
                                    title={mat.visible ? "Ocultar a estudiantes" : "Mostrar a estudiantes"}
                                >
                                    {mat.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>

                                {/* Botón de eliminar (ya lo tenías) */}
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="rounded-xl"
                                    onClick={() => deleteMutation.mutate(mat.id)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                        className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-60"
                    >
                        {uploadMutation.isPending
                            ? <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            : <Upload className="w-8 h-8 text-muted-foreground" />}
                        <p className="font-semibold text-sm">
                            {uploadMutation.isPending ? "Subiendo y procesando..." : "Haz clic para subir material"}
                        </p>
                        <p className="text-xs text-muted-foreground">Puedes seleccionar varios archivos a la vez</p>
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </motion.section>

            {/* Estadísticas */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6 shadow-soft"
            >
                <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-lg grid place-items-center text-primary-foreground shadow-soft shrink-0", bgSolid)}>
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg">
                            {semana?.totalPreguntas ?? 0} preguntas generadas
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {materiales.length > 0
                                ? "Las preguntas se generarán a partir del material cargado al evaluar."
                                : "Sube material para habilitar las evaluaciones de esta semana."}
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* Notas de Estudiantes */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6 shadow-soft space-y-5"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-display font-bold text-xl">Notas de avance de alumnos</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Historial de intentos realizados esta semana</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleDownloadCSV}
                        className={cn("rounded-lg hover:opacity-90 active:scale-95 transition-all text-white font-semibold", bgSolid)}
                        disabled={intentos.length === 0}
                    >
                        <Download className="w-4 h-4 mr-1" /> Descargar Notas
                    </Button>
                </div>

                {loadingIntentos ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : intentos.length > 0 ? (
                    <div className="space-y-6">
                        {/* Averages by Technique/Exam */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-border pb-4">
                            {techniqueAverages.map((t, idx) => (
                                <div key={idx} className="bg-muted/40 border border-border rounded-xl p-3 text-left">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                                        {t.tecnicaLabel}
                                    </span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-lg font-bold text-foreground">
                                            {t.promedio} <span className="text-xs text-muted-foreground font-normal">/20</span>
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            ({t.count} {t.count === 1 ? 'intento' : 'intentos'})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grouped Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                                        <th className="py-3 px-2">Alumno</th>
                                        <th className="py-3 px-2">Correo</th>
                                        <th className="py-3 px-2">Intentos</th>
                                        <th className="py-3 px-2 text-center">Nota Promedio</th>
                                        <th className="py-3 px-2 text-right">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {groupedStudents.map((student) => {
                                        const isExpanded = !!expandedStudents[student.correo];
                                        return (
                                            <React.Fragment key={student.correo}>
                                                <tr
                                                    onClick={() => toggleStudentExpand(student.correo)}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                >
                                                    <td className="py-3.5 px-2 font-semibold text-foreground flex items-center gap-2">
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                                                        )}
                                                        {student.alumno}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-muted-foreground">{student.correo}</td>
                                                    <td className="py-3.5 px-2 text-xs font-semibold text-muted-foreground">
                                                        {student.totalIntentos} {student.totalIntentos === 1 ? 'intento' : 'intentos'}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full font-bold ${student.promedio >= 17 ? "bg-green-100 text-green-800" : student.promedio >= 14 ? "bg-primary/10 text-primary" : "bg-red-100 text-red-800"}`}>
                                                            {student.promedio}/20
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-2 text-right text-xs text-primary font-bold hover:underline">
                                                        {isExpanded ? "Ocultar" : "Ver detalles"}
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-muted/10">
                                                        <td colSpan={5} className="py-3 px-4 border-l-2 border-primary">
                                                            <div className="overflow-x-auto rounded-lg border border-border bg-card">
                                                                <table className="w-full text-xs text-left">
                                                                    <thead>
                                                                        <tr className="bg-muted/30 text-muted-foreground border-b border-border text-[10px] uppercase font-bold">
                                                                            <th className="py-2.5 px-3">Técnica de Evaluación</th>
                                                                            <th className="py-2.5 px-3 text-center">Nota</th>
                                                                            <th className="py-2.5 px-3 text-right">Fecha y Hora</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-border">
                                                                        {student.intentos.map((i: any) => {
                                                                            let tecnicaLabel = i.tecnica || "Práctica";
                                                                            switch (tecnicaLabel.toLowerCase()) {
                                                                                case "opcion_multiple": tecnicaLabel = "Opción múltiple"; break;
                                                                                case "verdadero_falso": tecnicaLabel = "Verdadero / Falso"; break;
                                                                                case "abierta": tecnicaLabel = "Pregunta abierta"; break;
                                                                                case "deteccion_errores": tecnicaLabel = "Detección de errores"; break;
                                                                                case "visual_quiz": tecnicaLabel = "Visual Quiz"; break;
                                                                                case "avatar": tecnicaLabel = "Avatar Tutor"; break;
                                                                                case "video": tecnicaLabel = "Video Tutor"; break;
                                                                                case "adaptativa": tecnicaLabel = "Evaluación Recomendadora"; break;
                                                                            }
                                                                            return (
                                                                                <tr key={i.id} className="hover:bg-muted/20">
                                                                                    <td className="py-2 px-3 font-medium text-foreground">{tecnicaLabel}</td>
                                                                                    <td className="py-2 px-3 text-center">
                                                                                        <span className={`px-2 py-0.5 rounded-full font-bold ${i.nota >= 17 ? "bg-green-100 text-green-800" : i.nota >= 14 ? "bg-primary/10 text-primary" : "bg-red-100 text-red-800"}`}>
                                                                                            {i.nota}/20
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-right text-muted-foreground">
                                                                                        {new Date(i.fecha).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        Aún ningún alumno ha completado evaluaciones esta semana.
                    </div>
                )}
            </motion.section>

            {/* 4. INYECTAMOS EL NUEVO MODAL AQUÍ */}
            <UniversalPreviewModal
                isOpen={!!selectedFile}
                onClose={() => setSelectedFile(null)}
                mongoId={selectedFile?.id || ""}
                fileName={selectedFile?.name || ""}
            />
        </div>
    );
}