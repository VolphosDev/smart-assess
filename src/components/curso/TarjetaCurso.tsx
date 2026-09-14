import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/icon-mapper";
import { useBannerCurso } from "@/lib/bannerCurso";
import { estiloCurso, variablesCurso } from "@/lib/colorCurso";

interface Props {
    to: string;
    cursoId?: string | number | null;
    nombre: string;
    descripcion?: string | null;
    color?: string | null;
    emoji?: string | null;
    bannerVersion?: number | null;
    /** Cinta arriba a la izquierda, p. ej. "Ejemplo de Aria". */
    etiqueta?: string;
    /** Línea bajo el título cuando no hay descripción. */
    detalle?: string;
    dataGuide?: string;
    className?: string;
}

/**
 * Cartilla de curso: portada arriba, sello con el icono montado sobre el borde y el nombre
 * debajo.
 *
 * POR QUE CARTILLA Y NO FILA. Una fila con un icono de 48 px hace que todos los cursos se
 * parezcan. Con la portada que sube el docente cada curso tiene cara propia, y el alumno lo
 * reconoce igual que reconoce la tapa de su cuaderno. Sin portada no queda un hueco gris: se
 * dibuja una textura con el color del curso y su icono grande, así que tampoco se ve vacía.
 */
export function TarjetaCurso({
    to, cursoId, nombre, descripcion, color, emoji, bannerVersion, etiqueta, detalle, dataGuide, className,
}: Props) {
    const banner = useBannerCurso(cursoId, bannerVersion);
    const e = estiloCurso(color);

    return (
        <Link
            to={to}
            data-guide={dataGuide}
            style={variablesCurso(color)}
            className={cn(
                "group relative flex flex-col bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs",
                "hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--curso-suave)] hover:border-[var(--curso-borde)] transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--curso-base)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                className,
            )}
        >
            {/* Portada */}
            <div
                className="relative h-28 sm:h-32 overflow-hidden"
                style={banner ? undefined : {
                    backgroundColor: e.fuerte,
                    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,.22) 0 2px, transparent 3px), radial-gradient(circle at 75% 60%, rgba(255,255,255,.14) 0 2px, transparent 3px), linear-gradient(135deg, ${e.base} 0%, ${e.fuerte} 100%)`,
                    backgroundSize: "22px 22px, 30px 30px, 100% 100%",
                }}
            >
                {banner ? (
                    <img
                        src={banner}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute -right-4 -bottom-6 text-white/25 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                        {getCourseIcon(emoji ?? "📘", "w-28 h-28")}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                {etiqueta && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                        {etiqueta}
                    </span>
                )}
            </div>

            {/* Sello con el icono, montado sobre el borde de la portada */}
            <div
                className="absolute left-4 top-[5.25rem] sm:top-[6.25rem] w-12 h-12 rounded-2xl grid place-items-center text-white border-4 border-card shadow-md"
                style={{ backgroundColor: e.fuerte }}
            >
                {getCourseIcon(emoji ?? "📘", "w-5 h-5")}
            </div>

            <div className="flex-1 flex flex-col px-4 pt-8 pb-4">
                <h3 className="font-display font-bold text-base leading-tight line-clamp-2">{nombre}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                    {descripcion?.trim() || detalle}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--curso-tinta)] dark:text-[var(--curso-tinta-osc)]">
                    Entrar al curso
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
            </div>
        </Link>
    );
}
