import { cn } from "@/lib/utils";

/**
 * Muestra el resultado de una pregunta de DETECCIÓN DE ERRORES de forma legible.
 *
 * EL PROBLEMA. La respuesta del alumno en este tipo de pregunta es un mapa
 * `{fragmento con error: corrección propuesta}`, y en la pantalla de resultados se pintaba
 * tal cual, serializado:
 *
 *     {"complejas experimentaciones vanguardistas":"aparentes experiencias reales del
 *      autor","lenguaje hermético":"lenguaje simple"}
 *
 * Eso obliga al alumno a leer JSON para entender qué hizo mal. Y como en esa pregunta lo
 * único que importa es COMPARAR —lo que él escribió frente a lo que tocaba—, el formato
 * escondía justo la información que hace que la retroalimentación sirva de algo.
 *
 * Aquí se separa en tres columnas: el fragmento erróneo del enunciado, su corrección y la
 * esperada, con el acierto o el fallo marcado por fragmento. Un alumno puede así ver que
 * acertó dos de tres, en vez de un aspa global sobre una llave.
 */

interface Props {
    /** Lo que respondió el alumno: JSON del mapa, o texto suelto si algo falló. */
    respuesta: string;
    /** Fragmentos con error, en el orden en que los generó el sistema. */
    fragmentos?: string[];
    /** Correcciones esperadas, separadas por "|", en el MISMO orden que `fragmentos`. */
    esperadas?: string;
}

/** Normaliza para comparar: sin tildes, sin mayúsculas, sin signos ni espacios de más. */
function normalizar(texto: string): string {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function ResumenDeteccionErrores({ respuesta, fragmentos = [], esperadas = "" }: Props) {
    let mapa: Record<string, string> | null = null;
    try {
        const posible = JSON.parse(respuesta);
        // Solo un objeto plano cuenta: un array o un número no son un mapa de correcciones.
        if (posible && typeof posible === "object" && !Array.isArray(posible)) {
            mapa = posible as Record<string, string>;
        }
    } catch {
        // No era JSON. Se muestra el texto tal cual más abajo, que es mejor que nada.
    }

    if (!mapa) {
        return (
            <span className="font-bold text-destructive">{respuesta || "No respondió"}</span>
        );
    }

    const listaEsperadas = esperadas.split("|").map((t) => t.trim()).filter(Boolean);

    // Se recorre por FRAGMENTO y no por lo que respondió el alumno: así los que dejó en blanco
    // también aparecen, en vez de desaparecer de la lista sin explicación.
    const claves = fragmentos.length > 0 ? fragmentos : Object.keys(mapa);

    return (
        <div className="space-y-2 w-full">
            {claves.map((fragmento, i) => {
                const suya = mapa![fragmento] ?? "";
                const esperada = listaEsperadas[i] ?? "";
                const acerto = !!suya && !!esperada
                    && normalizar(suya) === normalizar(esperada);

                return (
                    <div
                        key={i}
                        className={cn(
                            "rounded-lg border px-3 py-2 text-xs",
                            acerto
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-destructive/25 bg-destructive/5"
                        )}
                    >
                        <p className="text-muted-foreground mb-1.5">
                            <span className="font-bold uppercase tracking-wider text-[10px]">
                                Fragmento con error
                            </span>
                            <br />
                            <span className="line-through decoration-destructive/60">{fragmento}</span>
                        </p>

                        <div className="grid sm:grid-cols-2 gap-2">
                            <div>
                                <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                                    Tu corrección
                                </span>
                                <p className={cn(
                                    "font-semibold",
                                    acerto ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                                )}>
                                    {suya || "— sin corregir"}
                                </p>
                            </div>

                            {/* La esperada se enseña SIEMPRE, también cuando acertó: ver la
                                formulación correcta al lado de la propia es lo que convierte
                                un acierto en aprendizaje y no en suerte confirmada. */}
                            {esperada && (
                                <div>
                                    <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                                        Lo correcto era
                                    </span>
                                    <p className="font-semibold text-foreground">{esperada}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
