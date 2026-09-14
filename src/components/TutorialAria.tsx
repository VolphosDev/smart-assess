import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, Volume2, VolumeX } from "lucide-react";
import { AriaSvg, type EstadoAvatar } from "@/components/Aria";
import { cn } from "@/lib/utils";

/**
 * Recorrido guiado de primer ingreso, narrado por Aria.
 *
 * POR QUE EXISTE, Y POR QUE NO ES ADORNO. El estudio dura cuatro semanas y cada alumno
 * entrará cuatro o cinco veces. Un alumno que no entiende el recorrido en su primera sesión
 * probablemente no vuelve, y sin adherencia no hay datos que analizar. Durante el desarrollo
 * se vio de sobra que el flujo confunde: el paso de elegir cómo practicar quedaba bajo el
 * pliegue, la prueba de ubicación aparecía sin avisar y al terminarla la pantalla se quedaba
 * en blanco. Esto es seguro de recolección de datos, no decoración.
 *
 * POR QUE ARIA Y NO UN CARRUSEL. Aria ya es la tutora socrática del sistema. Que sea la misma
 * voz la que recibe, explica y devuelve la síntesis final la convierte en un personaje
 * coherente en vez de una mascota pegada encima. A favor juega el efecto persona (Lester et
 * al., 1997) y el metaanálisis de agentes pedagógicos de Schroeder, Adesope y Gilbert (2013),
 * que reporta un efecto positivo pequeño sobre el aprendizaje.
 *
 * DONDE NO APARECE. Nunca mientras el alumno responde. Harp y Mayer (1998) documentaron que
 * los elementos atractivos pero irrelevantes —"seductive details"— perjudican el aprendizaje
 * al desviar la atención del contenido. La misma cara que motiva al entrar, estorba en mitad
 * de un reactivo de análisis.
 */

const CLAVE_VISTO = "semantika.tutorial.visto.v1";

interface Paso {
    titulo: string;
    texto: string;
    /** Cómo se muestra Aria mientras lo cuenta. */
    estado: EstadoAvatar;
}

/**
 * Los pasos siguen el ORDEN REAL de la aplicación, no una lista de funcionalidades. El alumno
 * no necesita saber que hay RAG ni comité de agentes: necesita saber qué le toca hacer y por
 * qué le conviene.
 */
const PASOS: Paso[] = [
    {
        titulo: "Hola, soy Aria",
        texto: "Voy a acompañarte en esta plataforma. Te enseño en un minuto cómo funciona, "
            + "y luego te dejo tranquilo para que practiques.",
        estado: "feliz",
    },
    {
        titulo: "1 · Lee el material de tu semana",
        texto: "Tu profesor sube el material de cada semana. Ábrelo y léelo primero: todas las "
            + "preguntas que verás salen de ahí, no de internet ni de otro libro.",
        estado: "hablando",
    },
    {
        titulo: "2 · Una prueba corta para ubicarte",
        texto: "La primera vez en cada semana te haré unas preguntas breves. No es un examen y "
            + "no lleva nota: solo sirve para saber por dónde empezar contigo, para no aburrirte "
            + "con lo que ya sabes ni abrumarte con lo que todavía no.",
        estado: "pensando",
    },
    {
        titulo: "3 · Elige cómo quieres practicar",
        texto: "Puedes responder preguntas, conversar conmigo, ver una videolección o buscar "
            + "errores en un texto. Algunas aparecerán recomendadas y dan puntos extra, pero "
            + "puedes elegir la que quieras: ninguna está bloqueada.",
        estado: "hablando",
    },
    {
        titulo: "Tu mapa de calor",
        texto: "A medida que respondes, se dibuja un mapa de tus temas. Lo azul ya lo dominas; "
            + "lo rojo conviene repasarlo. Es la forma más rápida de saber por dónde seguir.",
        estado: "idle",
    },
    {
        titulo: "Si te equivocas, no pasa nada",
        texto: "Equivocarse aquí es parte del método: cada fallo me dice qué explicarte mejor. "
            + "Cuando no sepas algo, dímelo con confianza — no te voy a bajar la nota por eso.",
        estado: "feliz",
    },
];

interface Props {
    /** Fuerza la apertura aunque ya se haya visto (para el botón "ver tutorial"). */
    abiertoForzado?: boolean;
    onCerrar?: () => void;
}

export function TutorialAria({ abiertoForzado = false, onCerrar }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [paso, setPaso] = useState(0);
    const [conVoz, setConVoz] = useState(false);

    // Primera visita: se abre solo. Se marca como visto al cerrarlo, no al abrirlo, para que
    // alguien que cierre la pestaña a mitad vuelva a encontrarlo.
    useEffect(() => {
        if (abiertoForzado) { setAbierto(true); setPaso(0); return; }
        try {
            if (!localStorage.getItem(CLAVE_VISTO)) setAbierto(true);
        } catch {
            // Modo privado: no se abre solo, pero el boton manual sigue estando.
        }
    }, [abiertoForzado]);

    // La voz se detiene al cambiar de paso y al cerrar. `speechSynthesis` pertenece a la
    // PAGINA: si no se cancela, Aria sigue hablando encima de la pantalla siguiente.
    useEffect(() => {
        if (!abierto || !conVoz) return;
        const u = new SpeechSynthesisUtterance(PASOS[paso].texto);
        u.lang = "es-PE";
        u.rate = 0.95;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        return () => speechSynthesis.cancel();
    }, [paso, abierto, conVoz]);

    useEffect(() => {
        return () => speechSynthesis.cancel();
    }, []);

    const cerrar = () => {
        speechSynthesis.cancel();
        try { localStorage.setItem(CLAVE_VISTO, "1"); } catch { /* sin persistencia */ }
        setAbierto(false);
        onCerrar?.();
    };

    if (!abierto) return null;

    const actual = PASOS[paso];
    const ultimo = paso === PASOS.length - 1;

    return (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Paso {paso + 1} de {PASOS.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setConVoz((v) => !v)}
                            title={conVoz ? "Silenciar a Aria" : "Escuchar a Aria"}
                            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                        >
                            {conVoz ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        {/* Salir siempre disponible: un tutorial del que no se puede escapar
                            es una trampa, y el alumno que ya sabe moverse lo agradece. */}
                        <button
                            type="button"
                            onClick={cerrar}
                            title="Saltar el tutorial"
                            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-6 flex gap-5 items-start">
                    <div className="w-24 shrink-0 hidden sm:block">
                        <AriaSvg estado={actual.estado} />
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={paso}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.18 }}
                            className="flex-1 min-w-0 space-y-2"
                        >
                            <h2 className="font-display font-bold text-xl leading-tight">{actual.titulo}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">{actual.texto}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 pb-5">
                    <div className="flex gap-1.5">
                        {PASOS.map((_, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full transition-all",
                                    i === paso ? "w-5 bg-primary" : "w-1.5 bg-border"
                                )}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {paso > 0 && (
                            <button
                                type="button"
                                onClick={() => setPaso((p) => p - 1)}
                                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4" /> Atrás
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => (ultimo ? cerrar() : setPaso((p) => p + 1))}
                            className="inline-flex items-center gap-2 min-h-[40px] px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90"
                        >
                            {ultimo ? "Empezar" : "Siguiente"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/** Permite volver a verlo desde la cabecera, sin tener que borrar el navegador. */
export function reabrirTutorial() {
    try { localStorage.removeItem(CLAVE_VISTO); } catch { /* sin persistencia */ }
}
