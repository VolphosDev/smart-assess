import { useEffect, useMemo, useRef, useState } from "react";
import type { GrupoCursoConocimiento, TemaConocimiento } from "./ConceptHeatMap";

/**
 * Mapa de calor de temas: un campo de densidad continuo, no un conjunto de burbujas.
 *
 * La diferencia con el componente anterior es de lectura. Unas burbujas separadas obligan a
 * mirar cada tema por su cuenta; un campo continuo hace que las zonas problemáticas se vean
 * de un vistazo, que es justo lo que un alumno de 2do de secundaria necesita para saber por
 * dónde empezar.
 *
 * EJES: horizontal = semana del curso (izquierda = primeras, derecha = últimas). Vertical =
 * los temas repartidos dentro de su semana. Así "estoy flojo en la semana 3" se ve como una
 * franja caliente, y no hay que leer una tabla para descubrirlo.
 *
 * CÓMO SE DIBUJA: se acumula una gaussiana por tema sobre una rejilla gruesa (unas 8000
 * celdas) y se colorea esa rejilla; el navegador la escala con suavizado. Es la razón de que
 * funcione en un móvil: el coste no depende del tamaño en pantalla, solo del número de temas
 * y de la rejilla, que son fijos.
 */

interface Props {
    cursos: GrupoCursoConocimiento[];
    /**
     * Si se indica, el mapa muestra SOLO los temas de esa semana. Sirve para incrustarlo
     * dentro de la vista de una semana concreta, donde el alumno ya sabe en qué semana está
     * y lo que necesita ver es cómo lleva sus temas, no el curso entero.
     */
    soloSemanaId?: number | string | null;
    /** Sin selector de curso, sin eje de semanas y sin panel de detalle. */
    compacto?: boolean;
}

/** Tema con la semana ya resuelta, como lo devuelve el backend tras la Sesión 15. */
interface TemaConSemana extends TemaConocimiento {
    semanaId?: number | string | null;
    semanaNumero?: string | null;
    semanaTema?: string | null;
}

const REJILLA_ANCHO = 120;
const REJILLA_ALTO = 68;

/**
 * Rampa de color tipo mapa de densidad: azul (frío, dominado) → cian → verde → amarillo →
 * naranja → rojo (caliente, a reforzar). Se eligió esta y no un degradado de un solo tono
 * porque el salto verde→amarillo es perceptualmente muy marcado, y ahí es justo donde está
 * el umbral entre "lo llevas" y "hay que repasar".
 */
const PARADAS: Array<[number, [number, number, number]]> = [
    [0.00, [40, 60, 160]],
    [0.30, [40, 150, 190]],
    [0.48, [70, 190, 120]],
    [0.62, [220, 230, 60]],
    [0.78, [245, 160, 40]],
    [0.90, [225, 60, 60]],
    [1.00, [200, 40, 130]],
];

function color(t: number): [number, number, number] {
    const v = Math.max(0, Math.min(1, t));
    for (let i = 0; i < PARADAS.length - 1; i++) {
        const [p0, c0] = PARADAS[i];
        const [p1, c1] = PARADAS[i + 1];
        if (v >= p0 && v <= p1) {
            const f = p1 === p0 ? 0 : (v - p0) / (p1 - p0);
            return [
                Math.round(c0[0] + (c1[0] - c0[0]) * f),
                Math.round(c0[1] + (c1[1] - c0[1]) * f),
                Math.round(c0[2] + (c1[2] - c0[2]) * f),
            ];
        }
    }
    return PARADAS[PARADAS.length - 1][1];
}

/** Ordena "Semana 2" antes que "Semana 10": comparar como texto los pondría al revés. */
function numeroDeSemana(etiqueta?: string | null): number {
    if (!etiqueta) return Number.MAX_SAFE_INTEGER;
    const digitos = etiqueta.replace(/\D+/g, "");
    return digitos ? parseInt(digitos, 10) : Number.MAX_SAFE_INTEGER;
}

/**
 * Ruido de valor con interpolacion suave. Sirve para DEFORMAR el campo antes de medir la
 * distancia a cada tema: sin esto, cada halo es un circulo perfecto y el mapa parece un
 * diagrama tecnico. Deformado, las manchas toman contorno irregular y se leen como un mapa
 * de densidad real.
 *
 * Es determinista (no usa Math.random): el mismo alumno ve siempre el mismo mapa, y un mapa
 * que cambia de forma en cada recarga no es interpretable.
 */
function ruido(x: number, y: number): number {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;

    const azar = (a: number, b: number) => {
        const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
        return n - Math.floor(n);
    };
    // Suavizado de Hermite: evita bordes rectos entre celdas del ruido.
    const suave = (t: number) => t * t * (3 - 2 * t);

    const sx = suave(xf), sy = suave(yf);
    const arriba = azar(xi, yi) * (1 - sx) + azar(xi + 1, yi) * sx;
    const abajo = azar(xi, yi + 1) * (1 - sx) + azar(xi + 1, yi + 1) * sx;
    return arriba * (1 - sy) + abajo * sy;
}

export type EstiloMapa = "difuminado" | "contornos" | "nitido";

export const ESTILOS: Array<{ id: EstiloMapa; nombre: string; descripcion: string }> = [
    { id: "difuminado", nombre: "Difuminado", descripcion: "Manchas suaves que se funden entre si" },
    { id: "contornos", nombre: "Contornos", descripcion: "Franjas de nivel, como un mapa topografico" },
    { id: "nitido", nombre: "Nitido", descripcion: "Cada tema con su halo bien separado" },
];

interface Punto {
    x: number;
    y: number;
    /**
     * Ancho máximo de la etiqueta, en fracción del contenedor.
     *
     * Sin esto las píldoras se pisaban: son de ancho variable y van centradas en su punto,
     * así que dos temas de nombre largo en la misma fila se montaban uno sobre otro. Limitar
     * cada una al hueco que de verdad le toca lo hace imposible por construcción, sin tener
     * que medir nada en el DOM ni recolocar etiquetas a posteriori.
     */
    anchoMax: number;
    intensidad: number;
    tema: TemaConSemana;
    etiquetaSemana: string;
}

export default function MapaCalorTemas({ cursos, soloSemanaId, compacto = false }: Props) {
    const cursosFiltrados = soloSemanaId == null
        ? cursos
        : cursos.map((c) => ({
            ...c,
            temas: c.temas.filter(
                (t) => String((t as TemaConSemana).semanaId ?? "") === String(soloSemanaId)),
        }));

    const conDatos = cursosFiltrados.filter((c) => c.temas.length > 0);
    const [cursoActivo, setCursoActivo] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [seleccionado, setSeleccionado] = useState<Punto | null>(null);
    const [estilo, setEstilo] = useState<EstiloMapa>(() => {
        try {
            return (localStorage.getItem("semantika.estiloMapa") as EstiloMapa) || "difuminado";
        } catch {
            return "difuminado";
        }
    });

    const cambiarEstilo = (nuevo: EstiloMapa) => {
        setEstilo(nuevo);
        try {
            localStorage.setItem("semantika.estiloMapa", nuevo);
        } catch {
            // Modo privado: la preferencia no persiste, pero la sesion funciona.
        }
    };

    const curso = conDatos[Math.min(cursoActivo, Math.max(0, conDatos.length - 1))];

    /** Coloca cada tema en su columna de semana y lo reparte verticalmente dentro de ella. */
    const { puntos, columnas } = useMemo(() => {
        if (!curso) return { puntos: [] as Punto[], columnas: [] as string[] };

        const temas = curso.temas as TemaConSemana[];

        // Agrupar por semana. Los temas sin semana (registros anteriores a que se guardara)
        // van a una columna propia al final en vez de desaparecer del mapa.
        const porSemana = new Map<string, TemaConSemana[]>();
        for (const t of temas) {
            const clave = t.semanaTema || t.semanaNumero || "Sin semana";
            if (!porSemana.has(clave)) porSemana.set(clave, []);
            porSemana.get(clave)!.push(t);
        }

        const claves = [...porSemana.keys()].sort((a, b) => {
            const na = a === "Sin semana" ? Number.MAX_SAFE_INTEGER : numeroDeSemana(
                temas.find((t) => (t.semanaTema || t.semanaNumero) === a)?.semanaNumero);
            const nb = b === "Sin semana" ? Number.MAX_SAFE_INTEGER : numeroDeSemana(
                temas.find((t) => (t.semanaTema || t.semanaNumero) === b)?.semanaNumero);
            if (na !== nb) return na - nb;
            return a.localeCompare(b);
        });

        const pts: Punto[] = [];
        const anchoBanda = 1 / claves.length;

        claves.forEach((clave, i) => {
            const grupo = porSemana.get(clave)!;
            const inicioBanda = i * anchoBanda;

            // Los temas se reparten en DOS dimensiones dentro de la banda de su semana, no
            // apilados en una sola columna. Apilados, sus halos se solapaban y el centro
            // salía caliente por acumulación aunque esos temas estuvieran dominados: el mapa
            // mentía. Repartidos, cada tema conserva su propia zona legible.
            const columnasEnBanda = Math.max(
                1,
                Math.min(grupo.length, Math.round(Math.sqrt(grupo.length * anchoBanda * 1.9)))
            );
            const filasEnBanda = Math.ceil(grupo.length / columnasEnBanda);

            grupo.forEach((tema, j) => {
                const col = j % columnasEnBanda;
                const fila = Math.floor(j / columnasEnBanda);

                // Cuántos hay realmente en esta fila: si la última va incompleta, se centran
                // en vez de quedar pegados al borde izquierdo.
                const enEstaFila = Math.min(columnasEnBanda, grupo.length - fila * columnasEnBanda);

                const x = inicioBanda + anchoBanda * ((col + 1) / (enEstaFila + 1));
                const y = (fila + 1) / (filasEnBanda + 1);

                // Separación real entre dos puntos vecinos de esta fila. El 0.92 deja un
                // respiro visual para que no se toquen justo en el borde.
                const anchoMax = (anchoBanda / (enEstaFila + 1)) * 0.92;

                pts.push({ x, y, anchoMax, intensidad: tema.intensidadCalor, tema, etiquetaSemana: clave });
            });
        });

        return { puntos: pts, columnas: claves };
    }, [curso]);

    // Pintado del campo de densidad
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = REJILLA_ANCHO;
        canvas.height = REJILLA_ALTO;

        const imagen = ctx.createImageData(REJILLA_ANCHO, REJILLA_ALTO);

        if (puntos.length === 0) {
            // Lienzo frío en vez de blanco: un mapa vacío no debe parecer un error de carga.
            for (let i = 0; i < imagen.data.length; i += 4) {
                imagen.data[i] = 40; imagen.data[i + 1] = 60; imagen.data[i + 2] = 160;
                imagen.data[i + 3] = 255;
            }
            ctx.putImageData(imagen, 0, 0);
            return;
        }

        // El estilo difuminado usa halos mas anchos para que se fundan entre si; el nitido,
        // mas estrechos para que cada tema quede aislado.
        const factor = estilo === "difuminado" ? 62 : 44;
        const radio = Math.max(7, Math.min(22, factor / Math.sqrt(puntos.length + 1)));
        const dosSigma2 = 2 * radio * radio;

        // Amplitud de la deformacion. En "nitido" es cero: ahi lo que se busca es justamente
        // que el halo sea limpio y atribuible a un solo tema.
        const deformacion = estilo === "nitido" ? 0 : radio * 0.55;

        const campo = new Float32Array(REJILLA_ANCHO * REJILLA_ALTO);

        for (let gy = 0; gy < REJILLA_ALTO; gy++) {
            for (let gx = 0; gx < REJILLA_ANCHO; gx++) {
                // Se desplaza el punto de muestreo con ruido antes de medir distancias: las
                // manchas dejan de ser circulos y toman contorno organico.
                const mx = gx + (ruido(gx * 0.07, gy * 0.07) - 0.5) * 2 * deformacion;
                const my = gy + (ruido(gx * 0.07 + 51.3, gy * 0.07 + 17.9) - 0.5) * 2 * deformacion;

                let valorCelda = 0;

                if (estilo === "difuminado") {
                    // Maximo suave (log-sum-exp): las manchas vecinas se funden en una forma
                    // continua, pero el resultado sigue dominado por el tema mas cercano, asi
                    // que NO reaparece el calor falso por aglomeracion que tenia la suma.
                    let acumulado = 0;
                    for (const p of puntos) {
                        const dx = mx - p.x * REJILLA_ANCHO;
                        const dy = my - p.y * REJILLA_ALTO;
                        const v = p.intensidad * Math.exp(-(dx * dx + dy * dy) / dosSigma2);
                        acumulado += Math.exp(v * 14);
                    }
                    valorCelda = Math.log(acumulado) / 14;
                } else {
                    // MAXIMO estricto. Con suma, dos temas dominados juntos producian una
                    // zona mas caliente que un tema debil solo: el color reflejaba cuantos
                    // temas habia cerca en vez de lo bien que los lleva el alumno.
                    for (const p of puntos) {
                        const dx = mx - p.x * REJILLA_ANCHO;
                        const dy = my - p.y * REJILLA_ALTO;
                        const v = p.intensidad * Math.exp(-(dx * dx + dy * dy) / dosSigma2);
                        if (v > valorCelda) valorCelda = v;
                    }
                }

                campo[gy * REJILLA_ANCHO + gx] = valorCelda;
            }
        }

        for (let i = 0; i < campo.length; i++) {
            // Sin normalizar por el maximo observado: la escala es absoluta (0 = dominado,
            // 1 = a repasar). Normalizar haria que el peor tema saliera siempre rojo aunque
            // el alumno lo llevara bien, y el mapa nunca podria decir "vas bien en todo".
            let t = campo[i];

            if (estilo === "contornos") {
                // Cuantizado en franjas de nivel, como un mapa topografico. Se pierde
                // gradacion fina a cambio de que el salto entre niveles caiga en un borde
                // visible en vez de diluirse en un degradado.
                const franjas = 9;
                t = Math.round(t * franjas) / franjas;
            }

            const [r, g, b] = color(t);
            const j = i * 4;
            imagen.data[j] = r;
            imagen.data[j + 1] = g;
            imagen.data[j + 2] = b;
            imagen.data[j + 3] = 255;
        }

        ctx.putImageData(imagen, 0, 0);
    }, [puntos, estilo]);

    if (conDatos.length === 0) {
        return (
            <div className={compacto
                ? "bg-muted/30 border border-border rounded-xl p-5 text-center"
                : "bg-card border border-border rounded-xl p-8 text-center"}>
                <h3 className="font-display font-bold text-lg">
                    {compacto ? "Aún no hay datos de esta semana" : "Tu mapa todavía está vacío"}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                    {compacto
                        ? "Practica los temas de esta semana y aquí verás cuáles llevas bien y cuáles conviene repasar."
                        : "Resuelve algunas evaluaciones y aquí verás, semana por semana, en qué temas estás sólido y cuáles conviene repasar."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!compacto && conDatos.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {conDatos.map((c, i) => (
                        <button
                            key={String(c.cursoId ?? i)}
                            onClick={() => { setCursoActivo(i); setSeleccionado(null); }}
                            className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold border transition-colors ${
                                i === cursoActivo
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card border-border hover:bg-muted/60"
                            }`}
                        >
                            {c.cursoEmoji} {c.cursoNombre}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border">
                    <h3 className="font-display font-bold text-lg">
                        Mapa de calor · {curso?.cursoNombre}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Las zonas <strong className="text-rose-600">rojas</strong> son los temas que más
                        conviene repasar; las <strong className="text-blue-600">azules</strong>, los que
                        ya dominas. Cada columna es una semana.
                    </p>
                </div>

                {/* El contenedor tiene proporción fija para que el campo no se deforme */}
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                        style={{ imageRendering: "auto" }}
                    />

                    {/* Etiquetas de tema sobre el campo */}
                    {puntos.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => setSeleccionado(p)}
                            style={{
                                left: `${p.x * 100}%`,
                                top: `${p.y * 100}%`,
                                maxWidth: `${p.anchoMax * 100}%`,
                            }}
                            // Dos líneas como mucho: un nombre largo se parte en vez de
                            // ensanchar la píldora hasta chocar con la vecina. Si aun así no
                            // cabe, se corta y queda el nombre completo en el `title` y en el
                            // panel de detalle al pulsar.
                            className="absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold leading-tight text-white bg-black/50 hover:bg-black/75 backdrop-blur-[2px] transition-colors text-center line-clamp-2 break-words"
                            title={`${p.tema.concepto} · ${p.etiquetaSemana}`}
                        >
                            <span className="line-clamp-2">{p.tema.concepto}</span>
                        </button>
                    ))}
                </div>

                {/* Eje de semanas */}
                {!compacto && <div className="flex border-t border-border bg-muted/30">
                    {columnas.map((c) => (
                        <div key={c}
                             className="flex-1 min-w-0 px-1 py-2 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground truncate"
                             title={c}>
                            {c}
                        </div>
                    ))}
                </div>}

                {/* Selector de estilo */}
                {!compacto && (
                    <div className="px-4 pt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground mr-1">Estilo:</span>
                        {ESTILOS.map((e) => (
                            <button
                                key={e.id}
                                onClick={() => cambiarEstilo(e.id)}
                                title={e.descripcion}
                                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold border transition-colors ${
                                    estilo === e.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card border-border hover:bg-muted/60"
                                }`}
                            >
                                {e.nombre}
                            </button>
                        ))}
                    </div>
                )}

                {/* Leyenda */}
                <div className="p-4 border-t border-border flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">Lo dominas</span>
                    <div className="flex-1 h-3 rounded-full"
                         style={{
                             background: `linear-gradient(to right, ${PARADAS
                                 .map(([p, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${p * 100}%`)
                                 .join(", ")})`,
                         }} />
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">A repasar</span>
                </div>
            </div>

            {!compacto && seleccionado && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h4 className="font-display font-bold text-lg">{seleccionado.tema.concepto}</h4>
                            <p className="text-sm text-muted-foreground">{seleccionado.etiquetaSemana}</p>
                        </div>
                        <button onClick={() => setSeleccionado(null)}
                                className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                            Cerrar
                        </button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                        <div className="bg-muted/40 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Nivel</div>
                            <div className="font-bold mt-0.5">
                                {seleccionado.tema.nivel === "DOMINADO" ? "Lo dominas"
                                    : seleccionado.tema.nivel === "EN_PROGRESO" ? "Vas avanzando"
                                    : seleccionado.tema.nivel === "DEBIL" ? "Conviene repasar"
                                    : "Aún faltan datos"}
                            </div>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Preguntas resueltas</div>
                            <div className="font-bold mt-0.5">{seleccionado.tema.observaciones}</div>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Nivel de Bloom</div>
                            <div className="font-bold mt-0.5">{seleccionado.tema.nivelBloom ?? "—"}</div>
                        </div>
                    </div>
                    {!seleccionado.tema.confiable && (
                        <p className="text-xs text-muted-foreground mt-3 italic">
                            Con tan pocas preguntas resueltas todavía no podemos afirmar nada con
                            seguridad sobre este tema. Practica un poco más y volvemos a mirarlo.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
