import { X, Loader2, AlertCircle, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"; // Asumiendo que tienes esta utilidad de shadcn/ui

interface PdfViewerProps {
    mongoId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function PdfPreviewModal({ mongoId, isOpen, onClose }: PdfViewerProps) {
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !mongoId) return;

        // 1. Creamos un controlador para poder abortar la petición HTTP
        const abortController = new AbortController();

        const fetchPdf = async () => {
            setLoading(true);
            setError(null);

            try {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
                const token = localStorage.getItem("token");

                const response = await fetch(`${baseUrl}/cursos/ver-pdf/${mongoId}`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    signal: abortController.signal // 2. Conectamos la señal al fetch
                });

                if (!response.ok) {
                    throw new Error(response.status === 403
                        ? "No tienes permisos para ver este archivo."
                        : "No se pudo cargar el documento.");
                }

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setPdfBlobUrl(objectUrl);

            } catch (err: any) {
                // Si el error es porque el usuario abortó, lo ignoramos
                if (err.name === 'AbortError') {
                    console.log("Descarga cancelada por el usuario.");
                } else {
                    console.error("Error fetching PDF:", err);
                    setError(err.message || "Error desconocido");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPdf();

        // 3. Cleanup function: se ejecuta cuando se cierra el modal o cambia el id
        return () => {
            abortController.abort(); // Cancela la descarga si sigue en proceso
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl); // Libera la memoria RAM
            }
        };
    }, [isOpen, mongoId]); // Nota: quitamos pdfBlobUrl de las dependencias para evitar ciclos

    // Limpieza total al cerrar
    const handleClose = () => {
        setPdfBlobUrl(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10">
            <div className="bg-card w-full max-w-6xl h-full md:h-[90vh] rounded-3xl shadow-lg flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 shrink-0">
                    <h3 className="font-display font-bold text-lg">Vista Previa del Documento</h3>
                    <button
                        onClick={handleClose}
                        className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 w-full bg-muted relative flex items-center justify-center">
                    {loading && !pdfBlobUrl && (
                        <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in duration-300">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="font-semibold text-muted-foreground">Descargando archivo seguro...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center space-y-3 text-destructive p-6 text-center">
                            <AlertCircle className="w-12 h-12" />
                            <p className="font-bold text-lg">{error}</p>
                            <button onClick={handleClose} className="text-sm underline mt-2">
                                Volver
                            </button>
                        </div>
                    )}

                    {!loading && !error && pdfBlobUrl && (
                        <object
                            data={pdfBlobUrl}
                            type="application/pdf"
                            className="w-full h-full"
                        >
                            {/* Fallback si el navegador no tiene visor de PDF (ej. móviles) */}
                            <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 bg-card rounded-xl shadow-sm m-4">
                                <p className="font-semibold text-muted-foreground text-center">
                                    Tu navegador no soporta la previsualización directa de PDFs.
                                </p>
                                <a
                                    href={pdfBlobUrl}
                                    download={`Documento_${mongoId}.pdf`}
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Descargar PDF
                                </a>
                            </div>
                        </object>
                    )}
                </div>
            </div>
        </div>
    );
}