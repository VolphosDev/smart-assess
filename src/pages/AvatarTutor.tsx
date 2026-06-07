// src/pages/AvatarTutor.tsx
import {useState, useEffect, useRef} from "react";
import {useParams, useSearchParams, Link} from "react-router-dom";
import {ArrowLeft, Mic, MicOff} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";

// ── Tipos ──────────────────────────────────────────────────────────────────
type EstadoAvatar = "idle" | "pensando" | "hablando" | "esperando" | "escuchando";

interface TurnData {
    turno: number;
    pregunta: string;
    conceptoClave: string;
    pistaSiNoResponde: string;
    respuestaEstudiante?: string;
    feedback?: string;
}

// ── Componente Avatar SVG (ARIA) ───────────────────────────────────────────
function AriaSvg({estado}: { estado: EstadoAvatar }) {
    const mouthPaths: Record<EstadoAvatar, string> = {
        idle: "M42 62 Q50 65 58 62",
        pensando: "M42 63 Q50 63 58 63",
        hablando: "M42 62 Q50 70 58 62",
        esperando: "M42 62 Q50 66 58 62",
        escuchando: "M42 63 Q50 63 58 63",
    };
    const eyeY: Record<EstadoAvatar, number> = {
        idle: 45, pensando: 46, hablando: 44,
        esperando: 45, escuchando: 43
    };

    return (
        <svg width="120" height="130" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="100" rx="30" ry="14" fill="#AFA9EC" opacity="0.35"/>
            <rect x="28" y="78" width="44" height="24" rx="8" fill="#7F77DD"/>
            <rect x="43" y="70" width="14" height="12" rx="4" fill="#FAC775"/>
            <ellipse cx="50" cy="42" rx="32" ry="35" fill="#FAC775"/>
            <ellipse cx="50" cy="16" rx="32" ry="14" fill="#3C3489"/>
            <rect x="18" y="14" width="10" height="28" rx="5" fill="#3C3489"/>
            <rect x="72" y="14" width="10" height="28" rx="5" fill="#3C3489"/>
            <ellipse cx="18" cy="44" rx="5" ry="7" fill="#FAC775"/>
            <ellipse cx="82" cy="44" rx="5" ry="7" fill="#FAC775"/>
            <circle cx="15" cy="51" r="3" fill="#EF9F27" stroke="#BA7517" strokeWidth="0.5"/>
            <ellipse cx="38" cy="44" rx="6" ry="7" fill="white"/>
            <ellipse cx="62" cy="44" rx="6" ry="7" fill="white"/>
            <circle cx="38" cy={eyeY[estado]} r="3.5" fill="#26215C"/>
            <circle cx="62" cy={eyeY[estado]} r="3.5" fill="#26215C"/>
            <circle cx="39.5" cy="43.5" r="1" fill="white"/>
            <circle cx="63.5" cy="43.5" r="1" fill="white"/>
            <path d={mouthPaths[estado]} stroke="#993C1D" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <ellipse cx="30" cy="58" rx="7" ry="4" fill="#F5C4B3" opacity="0.6"/>
            <ellipse cx="70" cy="58" rx="7" ry="4" fill="#F5C4B3" opacity="0.6"/>
        </svg>
    );
}

// ── Hook: Web Speech STT ───────────────────────────────────────────────────
function useSpeechRecognition(onResult: (texto: string) => void) {
    const recRef = useRef<SpeechRecognition | null>(null);
    const [escuchando, setEscuchando] = useState(false);
    const [supported] = useState(() =>
        typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );

    const iniciar = () => {
        if (!supported) return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = "es-PE";
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (e: SpeechRecognitionEvent) => onResult(e.results[0][0].transcript);
        rec.onend = () => setEscuchando(false);
        rec.onerror = () => setEscuchando(false);
        recRef.current = rec;
        rec.start();
        setEscuchando(true);
    };

    const detener = () => {
        recRef.current?.stop();
        setEscuchando(false);
    };

    return {iniciar, detener, escuchando, supported};
}

// ── Hook: Web Speech TTS ───────────────────────────────────────────────────
function useTTS() {
    const hablar = (texto: string, onEnd?: () => void) => {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = "es-PE";
        u.rate = 0.95;
        u.pitch = 1.1;
        if (onEnd) u.onend = onEnd;
        speechSynthesis.speak(u);
    };
    const parar = () => speechSynthesis.cancel();
    return {hablar, parar};
}

// ── Página principal ───────────────────────────────────────────────────────
export default function AvatarTutor() {
    const {courseId = "", semanaId = ""} = useParams();
    const [searchParams] = useSearchParams();
    const mongoId = searchParams.get("mongoId") ?? "";
    const tema = searchParams.get("tema") ?? "Análisis del jugador y su impacto en la narración del videojuego en Undertale";

    const [estado, setEstado] = useState<EstadoAvatar>("idle");
    const [turno, setTurno] = useState(1);
    const [historial, setHistorial] = useState<TurnData[]>([]);
    const [turnoActual, setTurnoActual] = useState<TurnData | null>(null);
    const [feedback, setFeedback] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const {hablar, parar} = useTTS();
    const {iniciar, detener, escuchando, supported} = useSpeechRecognition(onRespuestaVoz);

    // Al montar: pedir primera pregunta
    useEffect(() => {
        pedirSiguientePregunta();
    }, []);

    // ── PASO 1: Pedir pregunta al backend ──────────────────────────────────
    async function pedirSiguientePregunta() {
        setCargando(true);
        setEstado("pensando");
        setFeedback("");
        setTurnoActual(null);
        try {
            const res = await fetch("http://localhost:8080/api/archivos/tutor/pregunta", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({tema, mongoId, turno}),
            });
            if (!res.ok) throw new Error("Error HTTP " + res.status);

            const data = await res.json();
            const nuevo: TurnData = {
                turno,
                pregunta: data.pregunta ?? "¿Qué puedes decirme sobre este tema?",
                conceptoClave: data.concepto_clave ?? "",
                pistaSiNoResponde: data.pista_si_no_responde ?? "",
            };
            setTurnoActual(nuevo);
            setEstado("hablando");
            // ARIA habla la pregunta
            hablar(nuevo.pregunta, () => setEstado("esperando"));
        } catch (e) {
            setError("No pude conectarme al servidor.");
            setEstado("idle");
        } finally {
            setCargando(false);
        }
    }

    // ── PASO 2: Estudiante habló → transcripción llega aquí ───────────────
    async function onRespuestaVoz(texto: string) {
        if (!turnoActual) return;
        setEstado("pensando");
        parar();

        const turnoConRespuesta: TurnData = {...turnoActual, respuestaEstudiante: texto};
        setTurnoActual(turnoConRespuesta);

        // SSE: analizar respuesta
        const res = await fetch("http://localhost:8080/api/archivos/tutor/analizar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                pregunta: turnoActual.pregunta,
                respuestaEstudiante: texto,
                tema,
                nivelDificultad: turno <= 2 ? "básico" : turno <= 4 ? "intermedio" : "avanzado",
            }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let feedbackAcumulado = "";

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            buf += decoder.decode(value, {stream: true});
            const lines = buf.split("\n");
            buf = lines.pop()!;
            let evName = "", evData = "";
            for (const line of lines) {
                if (line.startsWith("event:")) evName = line.slice(6).trim();
                else if (line.startsWith("data:")) evData = line.slice(5).trim();
                else if (line === "") {
                    if (evName === "feedback") {
                        feedbackAcumulado += evData;
                        setFeedback(feedbackAcumulado);
                    } else if (evName === "avatar_state") {
                        const d = JSON.parse(evData);
                        setEstado(d.estado as EstadoAvatar);
                    } else if (evName === "done") {
                        // ARIA habla el feedback
                        setEstado("hablando");
                        hablar(feedbackAcumulado, () => {
                            setEstado("idle");
                            // Guardar turno en historial
                            setHistorial(h => [...h, {
                                ...turnoConRespuesta,
                                feedback: feedbackAcumulado
                            }]);
                            setTurno(t => t + 1);
                        });
                    }
                    evName = "";
                    evData = "";
                }
            }
        }
    }

    // ── Labels de estado ───────────────────────────────────────────────────
    const estadoLabel: Record<EstadoAvatar, string> = {
        idle: "esperando...",
        pensando: "pensando...",
        hablando: "hablando",
        esperando: "te escucho cuando quieras",
        escuchando: "escuchando...",
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <Link
                to={`/app/curso/${courseId}/semana/${semanaId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4"/> Volver
            </Link>

            {/* Cabecera */}
            <header className="text-center space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Sesión con ARIA · Turno {turno}
        </span>
                <h1 className="font-display text-3xl font-bold">{tema}</h1>
            </header>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
                <motion.div
                    animate={estado === "hablando" ? {scale: [1, 1.03, 1]} : {}}
                    transition={{repeat: Infinity, duration: 0.45}}
                >
                    <AriaSvg estado={estado}/>
                </motion.div>
                <span className="text-sm text-muted-foreground font-medium">{estadoLabel[estado]}</span>

                {/* Onda de audio cuando escucha */}
                {escuchando && (
                    <motion.div className="flex items-end gap-1 h-6">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-primary rounded-full"
                                animate={{height: ["8px", "20px", "8px"]}}
                                transition={{repeat: Infinity, duration: 0.5, delay: i * 0.1}}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Pregunta actual */}
            <AnimatePresence mode="wait">
                {turnoActual && (
                    <motion.div
                        key={turnoActual.turno}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                        className="bg-card border border-border rounded-2xl p-5 space-y-2"
                    >
            <span className="text-xs font-bold text-muted-foreground uppercase">
              ARIA pregunta:
            </span>
                        <p className="font-semibold text-lg leading-relaxed">
                            {turnoActual.pregunta}
                        </p>
                        {turnoActual.conceptoClave && (
                            <span
                                className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {turnoActual.conceptoClave}
              </span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback de ARIA */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{opacity: 0, y: 6}}
                        animate={{opacity: 1, y: 0}}
                        className="bg-primary/5 border border-primary/20 rounded-2xl p-5"
                    >
            <span className="text-xs font-bold text-primary uppercase block mb-2">
              ARIA responde:
            </span>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón micrófono */}
            {!supported && (
                <p className="text-center text-sm text-amber-600 font-semibold">
                    Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.
                </p>
            )}

            <div className="flex flex-col items-center gap-3">
                {estado === "esperando" && !escuchando && (
                    <motion.button
                        initial={{opacity: 0, scale: 0.9}}
                        animate={{opacity: 1, scale: 1}}
                        onClick={iniciar}
                        disabled={!supported || cargando}
                        className="w-20 h-20 rounded-full bg-primary-gradient text-white grid place-items-center shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                    >
                        <Mic className="w-8 h-8"/>
                    </motion.button>
                )}

                {escuchando && (
                    <motion.button
                        animate={{scale: [1, 1.05, 1]}}
                        transition={{repeat: Infinity, duration: 0.8}}
                        onClick={detener}
                        className="w-20 h-20 rounded-full bg-red-500 text-white grid place-items-center shadow-lg hover:opacity-90"
                    >
                        <MicOff className="w-8 h-8"/>
                    </motion.button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                    {escuchando ? "Habla ahora, pulsa para terminar" : "Pulsa el micrófono para responder"}
                </p>

                {/* Siguiente pregunta (después de recibir feedback) */}
                {estado === "idle" && turnoActual?.feedback !== undefined && (
                    <button
                        onClick={pedirSiguientePregunta}
                        className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition"
                    >
                        Siguiente pregunta →
                    </button>
                )}
            </div>

            {/* Historial de la sesión */}
            {historial.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-display font-bold text-lg">Historial de la sesión</h3>
                    {historial.map((h, i) => (
                        <div key={i} className="bg-secondary/30 rounded-xl p-4 text-sm space-y-1">
                            <p className="font-semibold">Turno {h.turno}: {h.pregunta}</p>
                            <p className="text-muted-foreground">Tu respuesta: {h.respuestaEstudiante}</p>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <p className="text-center text-sm text-destructive font-semibold">{error}</p>
            )}
        </div>
    );
}