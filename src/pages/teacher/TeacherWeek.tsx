import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Trash2, FileText, BookOpen, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { semanasApi } from "@/api/courses.ts"; // Asegúrate de que apunte a tu archivo correcto
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef } from "react";
import { useState } from "react";
import { Eye } from "lucide-react"; // <-- Agrega Eye a tus importaciones de lucide-react
import { PdfPreviewModal } from "@/components/PdfPreviewModal";

export default function TeacherWeek() {
    const { courseId = "", semanaId = "" } = useParams();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: semana, isLoading } = useQuery({
        queryKey: ["semana", semanaId],
        queryFn: () => semanasApi.get(semanaId),
        enabled: !!semanaId,
    });

    const [previewMongoId, setPreviewMongoId] = useState<string | null>(null);

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
        // Asegúrate de tener este método en tu backend si quieres borrar archivos individuales
        mutationFn: (materialId: string | number) => semanasApi.deleteMaterial(materialId),
        onSuccess: () => {
            toast.success("Archivo eliminado");
            queryClient.invalidateQueries({ queryKey: ["semana", semanaId] });
            queryClient.invalidateQueries({ queryKey: ["semanas", courseId] });
        },
        onError: () => toast.error("Error al eliminar el archivo"),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const allowedTypes = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/jpeg",
                "image/png"
            ];

            const allValid = files.every(f => allowedTypes.includes(f.type));
            if (!allValid) {
                toast.error("Solo se permiten archivos PDF, DOCX, JPG o PNG");
                return;
            }

            uploadMutation.mutate(files);
        }
        e.target.value = ""; // Limpiamos el input
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Adaptamos para leer la nueva lista 'materiales' (o un array vacío si no existe)
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
                className="rounded-[2rem] p-8 bg-primary-gradient text-primary-foreground shadow-glow relative overflow-hidden"
            >
                <div className="absolute -right-6 -top-6 text-[10rem] opacity-20 select-none">📄</div>
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
                className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-xl">Material de la semana</h2>
                    <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                        className="rounded-xl bg-primary-gradient"
                    >
                        <Upload className="w-4 h-4 mr-1" /> {uploadMutation.isPending ? "Subiendo..." : "Añadir archivos"}
                    </Button>
                </div>

                {materiales.length > 0 ? (
                    <div className="space-y-3">
                        {materiales.map((mat: any) => (
                            <div key={mat.id} className="flex items-center gap-4 bg-muted/50 rounded-2xl p-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-soft shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{mat.nombreArchivo}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ID MongoDB: <span className="font-mono">{mat.mongoId ?? "—"}</span>
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="rounded-xl"
                                    onClick={() => setPreviewMongoId(mat.mongoId)}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
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
                        className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-60"
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
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </motion.section>

            {/* Estadísticas */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-3xl p-6 shadow-soft"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-lime-gradient grid place-items-center text-primary-foreground shadow-soft shrink-0">
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
            <PdfPreviewModal
                mongoId={previewMongoId || ""}
                isOpen={!!previewMongoId}
                onClose={() => setPreviewMongoId(null)}
            />
        </div>
    );
}