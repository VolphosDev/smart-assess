import { X, Loader2, AlertCircle, Download, FileText, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { useState, useEffect } from "react";
import * as mammoth from "mammoth"; // <-- Importamos mammoth

interface UniversalViewerProps {
    mongoId: string;
    fileName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function UniversalPreviewModal({ mongoId, fileName, isOpen, onClose }: UniversalViewerProps) {
    const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
    const [docxHtml, setDocxHtml] = useState<string | null>(null); // <-- Nuevo estado para el texto del Word
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Detectamos el tipo de archivo
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
    const isVideo = ["mp4", "webm", "ogg"].includes(extension);
    const isPdf = extension === "pdf";
    const isWord = ["doc", "docx"].includes(extension); // <-- Detectamos si es Word

    useEffect(() => {
        if (!isOpen || !mongoId) return;

        const abortController = new AbortController();

        const fetchFile = async () => {
            setLoading(true);
            setError(null);
            setDocxHtml(null); // Limpiamos el texto anterior

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

                // MAGIA PARA EL WORD: Convertimos los bytes a HTML
                if (isWord) {
                    const arrayBuffer = await blob.arrayBuffer();
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
    }, [isOpen, mongoId, isWord]); // isWord en dependencias por si acaso

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10">
            <div className="bg-card w-full max-w-6xl h-full md:h-[90vh] rounded-3xl shadow-lg flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        {isImage && <ImageIcon className="w-5 h-5 text-blue-500" />}
                        {isVideo && <VideoIcon className="w-5 h-5 text-purple-500" />}
                        {isPdf && <FileText className="w-5 h-5 text-red-500" />}
                        {isWord && <FileText className="w-5 h-5 text-blue-600" />}
                        <h3 className="font-display font-bold text-lg truncate max-w-md">{fileName || "Vista Previa"}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {fileBlobUrl && (
                            <button
                                onClick={handleDownload}
                                className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl transition-colors"
                                title="Descargar"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-colors"
                            title="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 w-full bg-muted relative flex items-center justify-center overflow-auto p-4">
                    {loading && !fileBlobUrl && (
                        <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in duration-300">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="font-semibold text-muted-foreground">Descargando y procesando archivo...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center space-y-3 text-destructive p-6 text-center">
                            <AlertCircle className="w-12 h-12" />
                            <p className="font-bold text-lg">{error}</p>
                        </div>
                    )}

                    {!loading && !error && fileBlobUrl && (
                        <>
                            {isPdf && (
                                <object data={fileBlobUrl} type="application/pdf" className="w-full h-full rounded-xl">
                                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                                        <p className="font-semibold text-muted-foreground">Tu navegador no soporta PDFs incrustados.</p>
                                        <button onClick={handleDownload} className="btn-primary">Descargar PDF</button>
                                    </div>
                                </object>
                            )}

                            {isImage && (
                                <img src={fileBlobUrl} alt={fileName} className="max-w-full max-h-full object-contain rounded-xl shadow-sm" />
                            )}

                            {isVideo && (
                                <video src={fileBlobUrl} controls className="w-full max-h-full rounded-xl bg-black shadow-sm" />
                            )}

                            {/* RENDERIZADO NATIVO DE WORD CON MAMMOTH */}
                            {isWord && docxHtml && (
                                <div className="w-full h-full bg-white text-black p-8 md:p-12 overflow-y-auto rounded-xl shadow-sm">
                                    {/* La opción nuclear con !important y altura máxima */}
                                    <div
                                        className="prose prose-sm md:prose-base max-w-none mx-auto [&_img]:!max-w-full [&_img]:!h-auto [&_img]:!max-h-[400px] [&_img]:!object-contain [&_img]:!mx-auto [&_img]:!rounded-lg [&_img]:!shadow-md"
                                        dangerouslySetInnerHTML={{ __html: docxHtml }}
                                    />
                                </div>
                            )}

                            {/* Fallback para Excel, PowerPoint u otros no soportados */}
                            {!isPdf && !isImage && !isVideo && !isWord && (
                                <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-card rounded-2xl shadow-sm border border-border">
                                    <FileText className="w-16 h-16 text-muted-foreground" />
                                    <div className="text-center">
                                        <h4 className="font-display font-bold text-xl mb-2">Formato no renderizable</h4>
                                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                            El archivo <b>{fileName}</b> requiere una aplicación de escritorio (como Excel o PowerPoint) para visualizarse.
                                        </p>
                                        <button
                                            onClick={handleDownload}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-glow"
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