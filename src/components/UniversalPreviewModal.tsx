import { X, Loader2, AlertCircle, Download, FileText, Image as ImageIcon, Video as VideoIcon, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { obtenerMaterial, htmlWordEnCache, guardarHtmlWord } from "@/lib/cacheMateriales";
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
    const [progreso, setProgreso] = useState<{ cargado: number; total: number | null } | null>(null);

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

    /*
       La descarga la gestiona `cacheMateriales`, no este componente.

       Antes el modal hacía su propio fetch y, al cerrarse, intentaba revocar la URL del blob
       — pero leía `fileBlobUrl` desde el cierre del efecto, que siempre valía null, así que
       nunca liberaba nada y cada apertura dejaba un archivo entero huérfano en memoria. Y
       aun así volvía a descargarlo todo en la siguiente apertura.

       Ahora la caché es dueña de las URLs (las revoca al expulsar) y el modal solo las usa.
       Tampoco se aborta la descarga al cerrar: si el alumno cierra y reabre enseguida, la
       descarga que ya iba por la mitad se aprovecha.
    */
    useEffect(() => {
        if (!isOpen || !mongoId) return;
        let vigente = true;

        const cargar = async () => {
            setLoading(true);
            setError(null);
            setDocxHtml(null);
            setProgreso(null);

            try {
                const { blob, url } = await obtenerMaterial(mongoId, (cargado, total) => {
                    if (vigente) setProgreso({ cargado, total });
                });
                if (!vigente) return;
                setFileBlobUrl(url);

                if (isWord) {
                    const enCache = htmlWordEnCache(mongoId);
                    if (enCache) {
                        setDocxHtml(enCache);
                    } else {
                        const arrayBuffer = await blob.arrayBuffer();
                        const mammoth = await import("mammoth");
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        guardarHtmlWord(mongoId, result.value);
                        if (vigente) setDocxHtml(result.value);
                    }
                }
            } catch (err) {
                console.error("Error fetching file:", err);
                if (vigente) setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                if (vigente) setLoading(false);
            }
        };

        cargar();
        return () => { vigente = false; };
    }, [isOpen, mongoId, isWord]);

    const formatoMB = (bytes: number) => `${(bytes / (1024 * 1024)).toLocaleString("es-PE", { maximumFractionDigits: 1 })} MB`;
    const porcentaje = progreso?.total ? Math.min(100, Math.round((progreso.cargado / progreso.total) * 100)) : null;

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

    /*
       Aquí hubo un bloqueo del scroll del fondo (`body.style.overflow = "hidden"` mientras el
       modal estaba abierto) y se quitó: al cerrar, la barra de desplazamiento de la página
       desaparecía y ya no volvía.

       Guardar y restaurar el valor anterior parece correcto, pero deja el estado del `body`
       —que es global— dependiendo de que cada apertura y cierre se emparejen perfectamente.
       En cuanto un ciclo se descuadra, la página se queda sin scroll y el alumno no puede
       moverse por ella.

       El overlay ya lleva `overscroll-contain`, que evita el efecto molesto de arrastrar el
       fondo, y eso se consigue sin tocar ningún estado global.
    */

    if (!isOpen) return null;

    /*
       Se dibuja con un portal, colgado directamente de <body>.

       `position: fixed` se mide respecto a la ventana SOLO si ningún ancestro tiene
       `transform`, `filter`, `backdrop-filter` o `contain`. Cualquiera de esas propiedades
       —y este proyecto usa animaciones y desenfoques por todas partes— convierte a ese
       ancestro en el marco de referencia, y entonces `inset-0` deja de significar "toda la
       pantalla" para significar "todo ESE elemento". De ahí la franja sin cubrir arriba.
       Colgando el modal de <body> no hay ancestro que pueda atraparlo.
    */
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 md:p-8 overscroll-contain">
            <div data-guide="visor-material" className="bg-card w-full h-[100dvh] sm:h-[90vh] max-w-6xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-border/50">

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

                    <div data-guide="visor-acciones" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                            data-guide="visor-cerrar"
                            className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-colors inline-flex items-center justify-center"
                            title="Cerrar visor"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 w-full bg-muted/50 relative flex items-center justify-center overflow-auto p-0 sm:p-2 md:p-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in duration-300 p-6 text-center w-full max-w-xs">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="font-semibold text-sm sm:text-base text-muted-foreground">
                                {fileBlobUrl && isWord ? "Preparando el documento..." : "Descargando el material..."}
                            </p>
                            {/* Progreso real: un spinner mudo con un PDF de 20 MB parece colgado. */}
                            {progreso && !fileBlobUrl && (
                                <div className="w-full space-y-1.5">
                                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-[width] duration-200"
                                            style={{ width: porcentaje !== null ? `${porcentaje}%` : "35%" }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        {formatoMB(progreso.cargado)}
                                        {progreso.total ? ` de ${formatoMB(progreso.total)}` : ""}
                                    </p>
                                </div>
                            )}
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
        </div>,
        document.body
    );
}
