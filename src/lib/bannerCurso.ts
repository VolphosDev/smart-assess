import { useQuery } from "@tanstack/react-query";

export const ANCHO_BANNER = 1600;
export const ALTO_BANNER = 480;

/**
 * URL local (blob) de la portada de un curso.
 *
 * Se descarga con fetch y no con un <img src> directo porque el endpoint pide el token en la
 * cabecera Authorization, y una etiqueta <img> no puede enviarla. La clave de caché incluye
 * `bannerVersion`: mientras la portada no cambie, se reutiliza la misma URL en todas las
 * pantallas sin volver a pedirla.
 */
export function useBannerCurso(cursoId?: string | number | null, bannerVersion?: number | null) {
    const { data } = useQuery({
        queryKey: ["banner-curso", String(cursoId ?? ""), bannerVersion ?? null],
        enabled: !!cursoId && !!bannerVersion,
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
        retry: false,
        queryFn: async () => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const token = localStorage.getItem("token");
            const res = await fetch(`${baseUrl}/cursos/${cursoId}/banner?v=${bannerVersion}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) return null;
            return URL.createObjectURL(await res.blob());
        },
    });
    return data ?? null;
}

/**
 * Recorta y comprime la imagen elegida ANTES de subirla: 1600×480 (proporción de las
 * cabeceras), JPG al 82 %. Una foto de celular de 6 MB queda en unos 150-250 KB, que es lo
 * que luego descargan todos los alumnos del curso.
 *
 * `enfoqueY` (0-1) decide qué franja vertical de la foto se conserva.
 */
export async function prepararBanner(archivo: File, enfoqueY = 0.5): Promise<Blob> {
    if (!archivo.type.startsWith("image/")) throw new Error("El archivo no es una imagen");
    if (archivo.size > 15 * 1024 * 1024) throw new Error("La imagen es demasiado grande (máx. 15 MB)");

    const url = URL.createObjectURL(archivo);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("No se pudo leer la imagen"));
            i.src = url;
        });

        const escala = Math.max(ANCHO_BANNER / img.naturalWidth, ALTO_BANNER / img.naturalHeight);
        const w = ANCHO_BANNER / escala;
        const h = ALTO_BANNER / escala;
        const sx = (img.naturalWidth - w) / 2;
        const sy = (img.naturalHeight - h) * Math.min(1, Math.max(0, enfoqueY));

        const canvas = document.createElement("canvas");
        canvas.width = ANCHO_BANNER;
        canvas.height = ALTO_BANNER;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Tu navegador no permite procesar imágenes");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, w, h, 0, 0, ANCHO_BANNER, ALTO_BANNER);

        return await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen"))), "image/jpeg", 0.82));
    } finally {
        URL.revokeObjectURL(url);
    }
}
