import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/icon-mapper";
import { useBannerCurso } from "@/lib/bannerCurso";
import { estiloCurso } from "@/lib/colorCurso";

/**
 * Miniatura de un curso para listas: su portada recortada si la tiene, o el icono sobre un
 * fondo suave de su color. Así el alumno reconoce el curso por la misma imagen que ve dentro.
 */
export function IconoCurso({
    cursoId, color, emoji, bannerVersion, className,
}: {
    cursoId?: string | number | null;
    color?: string | null;
    emoji?: string | null;
    bannerVersion?: number | null;
    className?: string;
}) {
    const banner = useBannerCurso(cursoId, bannerVersion);
    const e = estiloCurso(color);

    return (
        <div
            className={cn("relative w-12 h-12 rounded-xl grid place-items-center border shrink-0 overflow-hidden bg-cover bg-center", className)}
            style={banner
                ? { backgroundImage: `url("${banner}")`, borderColor: e.borde }
                : { backgroundColor: e.suave, borderColor: e.borde, color: e.fuerte }}
        >
            {banner ? (
                <span className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-md grid place-items-center text-white shadow" style={{ backgroundColor: e.fuerte }}>
                    {getCourseIcon(emoji ?? "📘", "w-3 h-3")}
                </span>
            ) : (
                <span className="dark:brightness-150">{getCourseIcon(emoji ?? "📘", "w-6 h-6")}</span>
            )}
        </div>
    );
}
