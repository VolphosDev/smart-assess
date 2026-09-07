import { X, Loader2, AlertCircle, Download, FileText, Image as ImageIcon, Video as VideoIcon, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
// mammoth (conversor de .docx a HTML) pesa ~500 KB sin comprimir. Se importa de forma
// DINÁMICA, dentro del if que lo necesita: solo se descarga si el usuario abre la vista
// previa de un archivo Word. Importado arriba de forma estática, entraba en el paquete de
// cualquier página que use este modal — Course, EvalModeSelect, AdaptivePractice — y todo
// alumno que abría un curso se lo bajaba aunque nunca tocara un .docx.

interface UniversalViewerProps {
    mongoId: string;
    fileName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function UniversalPreviewModal({ mongoId, fileName, isOpen, onClose }: UniversalViewerProps) {
    const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
    const [docxHtml, setDocxHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Evitar que el fondo se mueva/desplace mientras el modal está abierto
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Detectamos el tipo de archivo
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
    const isVideo = ["mp4", "webm", "ogg"].includes(extension);
    const isPdf = extension === "pdf";
    const isWord = ["doc", "docx"].includes(extension);

    useEffect(() => {
        if (!isOpen || !mongoId) return;

        const abortController = new AbortController();

        const fetchFile = async () => {
            setLoading(true);
            setError(null);
            setDocxHtml(null);

            try {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
                const token = localStorage.getItem("token");

                const response = await fetch(`${baseUrl}/cursos/ver-archivo/${mongoId}`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    signal: abortController.signal
                });

                if (!response.ok) {
                    throw new Error("No se pudo cargar el documento.");
                }

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setFileBlobUrl(objectUrl);

                // Conversión nativa de Word a HTML con Mammoth
                if (isWord) {
                    const arrayBuffer = await blob.arrayBuffer();
                    const mammoth = await import("mammoth");
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setDocxHtml(result.value);
                }

            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Error fetching file:", err);
                    setError(err.message || "Error desconocido");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFile();

        return () => {
            abortController.abort();
            if (fileBlobUrl) {
                URL.revokeObjectURL(fileBlobUrl);
            }
        };
    }, [isOpen, mongoId, isWord]);

    const handleClose = () => {
        setFileBlobUrl(null);
        setDocxHtml(null);
        setError(null);
        onClose();
    };

    const handleDownload = () => {
        if (!fileBlobUrl) return;
        const link = document.createElement("a");
        link.href = fileBlobUrl;
        link.download = fileName || `Documento_${mongoId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenInNewTab = () => {
        if (!fileBlobUrl) return;
        window.open(fileBlobUrl, "_blank", "noopener,noreferrer");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 md:p-8 overscroll-contain">
            <div className="bg-card w-full h-[100dvh] sm:h-[90vh] max-w-6xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-border/50">

                {/* Header optimizado para celular y escritorio */}
                <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-border bg-muted/40 shrink-0 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isImage && <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />}
                        {isVideo && <VideoIcon className="w-5 h-5 text-purple-500 shrink-0" />}
                        {isPdf && <FileText className="w-5 h-5 text-red-500 shrink-0" />}
                        {isWord && <FileText className="w-5 h-5 text-blue-600 shrink-0" />}
                        <h3
                            className="font-display font-bold text-sm sm:text-base md:text-lg truncate max-w-[150px] xs:max-w-[220px] sm:max-w-md"
                            title={fileName || "Vista Previa"}
                        >
                            {fileName || "Vista Previa"}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {fileBlobUrl && (
                            <>
                                <button
                                    onClick={handleOpenInNewTab}
                                    className="p-2 sm:px-3 sm:py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                                    title="Abrir en pantalla completa / nueva pestaña"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span className="hidden sm:inline">Pantalla completa</span>
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="p-2 sm:px-3 sm:py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                                    title="Descargar archivo"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Descargar</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-colors inline-flex items-center justify-center"
                            title="Cerrar visor"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 w-full bg-muted/50 relative flex items-center justify-center overflow-auto p-0 sm:p-2 md:p-4">
                    {loading && !fileBlobUrl && (
                        <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in duration-300 p-6 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="font-semibold text-sm sm:text-base text-muted-foreground">Descargando y procesando archivo...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center space-y-3 text-destructive p-6 text-center max-w-md">
                            <AlertCircle className="w-12 h-12" />
                            <p className="font-bold text-base sm:text-lg">{error}</p>
                            <button onClick={handleClose} className="btn-secondary text-xs px-4 py-2 mt-2">
                                Cerrar
                            </button>
                        </div>
                    )}

                    {!loading && !error && fileBlobUrl && (
                        <>
                            {isPdf && (
                                <div className="w-full h-full flex flex-col relative">
                                    {/* Sugerencia para móvil por si el navegador embebe pesado o en modo táctil */}
                                    <div className="sm:hidden flex items-center justify-between px-3.5 py-2 bg-amber-500/15 text-amber-950 dark:text-amber-100 text-xs border-b border-amber-500/25 shrink-0 gap-2">
                                        <span className="font-medium truncate">¿En celular o modo táctil?</span>
                                        <button
                                            onClick={handleOpenInNewTab}
                                            className="font-bold shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 rounded-lg transition-colors border border-amber-500/30 text-xs shadow-2xs"
                                        >
                                            Abrir completo <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <object data={fileBlobUrl} type="application/pdf" className="w-full flex-1">
                                        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                                            <FileText className="w-12 h-12 text-red-500" />
                                            <p className="font-semibold text-muted-foreground text-sm max-w-sm">
                                                Tu dispositivo no soporta previsualización incrustada de PDF.
                                            </p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                <button onClick={handleOpenInNewTab} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                                                    <ExternalLink className="w-4 h-4" /> Abrir PDF
                                                </button>
                                                <button onClick={handleDownload} className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                                                    <Download className="w-4 h-4" /> Descargar
                                                </button>
                                            </div>
                                        </div>
                                    </object>
                                </div>
                            )}

                            {isImage && (
                                <div className="p-4 flex items-center justify-center w-full h-full">
                                    <img src={fileBlobUrl} alt={fileName} className="max-w-full max-h-full object-contain rounded-xl shadow-sm" />
                                </div>
                            )}

                            {isVideo && (
                                <div className="p-4 flex items-center justify-center w-full h-full">
                                    <video src={fileBlobUrl} controls className="w-full max-h-full rounded-xl bg-black shadow-sm" />
                                </div>
                            )}

                            {/* Renderizado nativo de Word con Mammoth */}
                            {isWord && docxHtml && (
                                <div className="w-full h-full bg-white text-black p-4 sm:p-8 md:p-12 overflow-y-auto sm:rounded-xl shadow-sm">
                                    <div
                                        className="prose prose-sm md:prose-base max-w-none mx-auto [&_img]:!max-w-full [&_img]:!h-auto [&_img]:!max-h-[400px] [&_img]:!object-contain [&_img]:!mx-auto [&_img]:!rounded-lg [&_img]:!shadow-md"
                                        dangerouslySetInnerHTML={{ __html: docxHtml }}
                                    />
                                </div>
                            )}

                            {/* Fallback para otros formatos */}
                            {!isPdf && !isImage && !isVideo && !isWord && (
                                <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-card rounded-2xl shadow-sm border border-border m-4">
                                    <FileText className="w-16 h-16 text-muted-foreground" />
                                    <div className="text-center">
                                        <h4 className="font-display font-bold text-xl mb-2">Formato no renderizable</h4>
                                        <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
                                            El archivo <b>{fileName}</b> requiere una aplicación externa para visualizarse.
                                        </p>
                                        <button
                                            onClick={handleDownload}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-glow text-sm"
                                        >
                                            <Download className="w-5 h-5" />
                                            Descargar Archivo Seguro
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}