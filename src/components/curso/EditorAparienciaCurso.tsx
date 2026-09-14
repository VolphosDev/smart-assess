import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Pipette, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/icon-mapper";
import { PALETA_CURSO, esHexValido, fondoCabeceraCurso, hexDeColorCurso } from "@/lib/colorCurso";
import { prepararBanner } from "@/lib/bannerCurso";

/**
 * Selector de color simple: diez tonos listos + uno libre.
 *
 * Los diez cubren lo que un docente suele querer (y ya están probados con texto blanco); el
 * libre abre el selector nativo del sistema, que en Android y en PC ya es cómodo y accesible,
 * sin meter una librería de color entera en el paquete.
 */
export function SelectorColorCurso({ valor, onChange }: { valor: string; onChange: (hex: string) => void }) {
    const actual = hexDeColorCurso(valor);
    const [texto, setTexto] = useState(actual);
    const esPersonalizado = !PALETA_CURSO.some((c) => c.hex === actual);

    useEffect(() => setTexto(actual), [actual]);

    return (
        <div className="space-y-2.5">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color del curso">
                {PALETA_CURSO.map((c) => (
                    <button
                        key={c.hex}
                        type="button"
                        role="radio"
                        aria-checked={actual === c.hex}
                        title={c.nombre}
                        onClick={() => onChange(c.hex)}
                        className={cn(
                            "w-8 h-8 rounded-full grid place-items-center transition-transform hover:scale-110 ring-offset-2 ring-offset-card",
                            actual === c.hex && "ring-2 ring-foreground/70 scale-110",
                        )}
                        style={{ backgroundColor: c.hex }}
                    >
                        {actual === c.hex && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>
                ))}

                <label
                    title="Otro color"
                    className={cn(
                        "relative w-8 h-8 rounded-full grid place-items-center cursor-pointer transition-transform hover:scale-110 ring-offset-2 ring-offset-card overflow-hidden",
                        esPersonalizado && "ring-2 ring-foreground/70 scale-110",
                    )}
                    style={{
                        background: esPersonalizado
                            ? actual
                            : "conic-gradient(#ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)",
                    }}
                >
                    <Pipette className="w-3.5 h-3.5 text-white drop-shadow" />
                    <input
                        type="color"
                        value={actual}
                        onChange={(e) => onChange(e.target.value.toUpperCase())}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        aria-label="Elegir otro color"
                    />
                </label>
            </div>

            <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md border border-border shrink-0" style={{ backgroundColor: actual }} />
                <input
                    value={texto}
                    onChange={(e) => {
                        const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                        setTexto(v.toUpperCase());
                        if (esHexValido(v)) onChange(v.toUpperCase());
                    }}
                    maxLength={7}
                    spellCheck={false}
                    aria-label="Código hexadecimal del color"
                    className="h-8 w-28 rounded-lg border border-input bg-background px-2 font-mono text-xs uppercase"
                />
                <span className="text-[11px] text-muted-foreground">Si el color es muy claro, lo oscurecemos un poco para que el título se lea.</span>
            </div>
        </div>
    );
}

interface SelectorBannerProps {
    /** URL a mostrar: la portada actual del servidor o la recién elegida. */
    vistaPrevia: string | null;
    onElegir: (blob: Blob, urlLocal: string) => void;
    onQuitar: () => void;
}

/** Portada opcional. Recorta y comprime en el navegador antes de subir (ver lib/bannerCurso). */
export function SelectorBannerCurso({ vistaPrevia, onElegir, onQuitar }: SelectorBannerProps) {
    const entrada = useRef<HTMLInputElement>(null);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [enfoque, setEnfoque] = useState(0.5);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const procesar = async (f: File, y: number) => {
        setProcesando(true);
        setError(null);
        try {
            const blob = await prepararBanner(f, y);
            onElegir(blob, URL.createObjectURL(blob));
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo usar esa imagen");
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    "relative rounded-xl border-2 border-dashed overflow-hidden aspect-[10/3] grid place-items-center transition-colors",
                    vistaPrevia ? "border-transparent" : "border-border hover:border-primary/50 bg-muted/30",
                )}
            >
                {vistaPrevia ? (
                    <img src={vistaPrevia} alt="Portada del curso" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <button
                        type="button"
                        onClick={() => entrada.current?.click()}
                        className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground p-4"
                    >
                        <ImagePlus className="w-6 h-6" />
                        <span className="text-xs font-semibold">Subir una imagen de portada</span>
                        <span className="text-[11px]">JPG, PNG o WEBP · se recorta a 1600×480</span>
                    </button>
                )}
                {procesando && (
                    <div className="absolute inset-0 bg-black/40 grid place-items-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
                {vistaPrevia && !procesando && (
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <button type="button" onClick={() => entrada.current?.click()} className="h-8 px-2.5 rounded-lg bg-black/55 hover:bg-black/70 text-white text-xs font-semibold backdrop-blur">
                            Cambiar
                        </button>
                        <button
                            type="button"
                            onClick={() => { setArchivo(null); onQuitar(); }}
                            className="h-8 w-8 grid place-items-center rounded-lg bg-black/55 hover:bg-red-600 text-white backdrop-blur"
                            title="Quitar portada"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {archivo && vistaPrevia && (
                <label className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="shrink-0">Encuadre</span>
                    <input
                        type="range" min={0} max={1} step={0.05} value={enfoque}
                        onChange={(e) => setEnfoque(Number(e.target.value))}
                        onPointerUp={() => procesar(archivo, enfoque)}
                        onKeyUp={() => procesar(archivo, enfoque)}
                        className="flex-1 accent-primary"
                    />
                    <span className="shrink-0">{enfoque < 0.35 ? "Arriba" : enfoque > 0.65 ? "Abajo" : "Centro"}</span>
                </label>
            )}

            {error && <p className="text-xs text-destructive font-semibold">{error}</p>}

            <input
                ref={entrada}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    setArchivo(f);
                    setEnfoque(0.5);
                    procesar(f, 0.5);
                }}
            />
        </div>
    );
}

/** Así se verá la cabecera del curso para el alumno. */
export function VistaPreviaCurso({ nombre, color, emoji, banner }: { nombre: string; color: string; emoji: string; banner: string | null }) {
    return (
        <div className="relative rounded-xl p-4 sm:p-5 overflow-hidden min-h-[96px] flex flex-col justify-end" style={fondoCabeceraCurso(color, banner)}>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none">
                {getCourseIcon(emoji, "w-16 h-16")}
            </div>
            <span className="relative text-[10px] font-bold uppercase tracking-wider opacity-90">Vista previa · así lo verán tus alumnos</span>
            <p className="relative font-display font-bold text-xl leading-tight truncate pr-16">{nombre || "Nombre del curso"}</p>
        </div>
    );
}
