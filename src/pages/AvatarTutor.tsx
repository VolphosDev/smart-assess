import {useState, useEffect, useRef} from "react";
import {useParams, useSearchParams, Link} from "react-router-dom";
import {ArrowLeft, Mic, MicOff} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {intentosApi} from "@/api/courses";
import {toast} from "sonner";
import {cn} from "@/lib/utils";

type EstadoAvatar = "idle" | "pensando" | "hablando" | "esperando" | "escuchando" | "feliz" | "triste";

interface TurnData {
    turno: number;
    pregunta: string;
    conceptoClave: string;
    pistaSiNoResponde: string;
    respuestaEstudiante?: string;
    feedback?: string;
    puntuacion?: number;
}


//Avatar anime

function AriaSvg({ estado }: { estado: EstadoAvatar }) {
    const [bocaAbierta, setBocaAbierta] = useState(false);

    useEffect(() => {
        if (estado !== "hablando") { setBocaAbierta(false); return; }
        const id = setInterval(() => setBocaAbierta(v => !v), 160);
        return () => clearInterval(id);
    }, [estado]);

    const blush = estado === "feliz" ? 0.85 : estado === "escuchando" ? 0.6 : 0.35;

    const FUR       = "#F5EBE0"; // light cream fur (second image)
    const FUR_LIGHT = "#FFFDF9"; // snout area
    const FUR_DARK  = "#8D7B68"; // brown stripes
    const OUTLINE   = "#2C2523"; // soft dark brown outlines (second image style)
    const EAR_IN    = "#F3A3B0"; // pink inner ear
    const GLASSES   = "#FFB703"; // golden intelligence glasses
    const NOSE      = "#2C2523";
    const MOUTH_C   = "#2C2523";

    const Base = () => (
        <>
            {/* Orejas externas */}
            <path d="M20,32 Q12,12 18,2 Q28,4 34,20 Z" fill={FUR} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M80,32 Q88,12 82,2 Q72,4 66,20 Z" fill={FUR} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>

            {/* Orejas internas */}
            <path d="M22,29 Q16,15 20,6 Q26,8 29,20 Z" fill={EAR_IN}/>
            <path d="M78,29 Q84,15 80,6 Q74,8 71,20 Z" fill={EAR_IN}/>

            {/* Cola del gato */}
            <path d="M68,90 Q82,90 84,78 Q86,68 90,70 Q88,80 78,94" fill={FUR} stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Cuerpo */}
            <path d="M32,96 C29,80 34,74 50,74 C66,74 71,80 68,96 Z" fill={FUR} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>

            {/* Paticas */}
            <ellipse cx="42" cy="95" rx="4.5" ry="2.5" fill={FUR} stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="42" y1="93" x2="42" y2="97" stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="58" cy="95" rx="4.5" ry="2.5" fill={FUR} stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="58" y1="93" x2="58" y2="97" stroke={OUTLINE} strokeWidth="1"/>

            {/* Cabeza */}
            <ellipse cx="50" cy="46" rx="34" ry="29" fill={FUR} stroke={OUTLINE} strokeWidth="1.8"/>

            {/* Zona del hocico (más clara) */}
            <ellipse cx="50" cy="58" rx="16" ry="11" fill={FUR_LIGHT}/>

            {/* Rayas de la frente */}
            <path d="M49,18 Q50,24 50,28 Q51,24 51,18 Z" fill={FUR_DARK}/>
            <path d="M42,20 Q44,25 45,29 Q46,25 44,20 Z" fill={FUR_DARK}/>
            <path d="M58,20 Q56,25 55,29 Q54,25 56,20 Z" fill={FUR_DARK}/>

            {/* Rayas de los cachetes (izq) */}
            <path d="M12,46 Q18,48 22,49 Q18,49 12,48 Z" fill={FUR_DARK}/>
            <path d="M10,52 Q16,53 20,54 Q16,55 10,54 Z" fill={FUR_DARK}/>

            {/* Rayas de los cachetes (der) */}
            <path d="M88,46 Q82,48 78,49 Q82,49 88,48 Z" fill={FUR_DARK}/>
            <path d="M90,52 Q84,53 80,54 Q84,55 90,54 Z" fill={FUR_DARK}/>
        </>
    );

    const Libros = () => (
        <>
            {/* Libro 1 (abajo - Rojo-Naranja) */}
            <rect x="15" y="111" width="70" height="9" rx="2" fill="#E76F51" stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="22" y1="111" x2="22" y2="120" stroke={OUTLINE} strokeWidth="1.2"/>
            <line x1="25" y1="111" x2="25" y2="120" stroke={OUTLINE} strokeWidth="1.2"/>

            {/* Libro 2 (medio - Turquesa/Verde) */}
            <rect x="18" y="103" width="64" height="8" rx="2" fill="#2A9D8F" stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="25" y1="103" x2="25" y2="111" stroke={OUTLINE} strokeWidth="1.2"/>
            <line x1="28" y1="103" x2="28" y2="111" stroke={OUTLINE} strokeWidth="1.2"/>

            {/* Libro 3 (arriba - Amarillo-Oro) */}
            <rect x="22" y="96" width="56" height="7" rx="1.5" fill="#E9C46A" stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="29" y1="96" x2="29" y2="103" stroke={OUTLINE} strokeWidth="1.2"/>
        </>
    );

    const Ojos = () => {
        if (estado === "feliz") return (
            <>
                {/* Ojos cerrados felices tipo arco */}
                <path d="M24,54 Q33,44 42,54" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M58,54 Q67,44 76,54" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round"/>
            </>
        );
        if (estado === "triste") return (
            <>
                <circle cx="33" cy="52" r="8.5" fill={OUTLINE}/>
                <circle cx="31" cy="49" r="2.5" fill="white"/>
                <circle cx="35" cy="55" r="1.2" fill="white"/>
                <circle cx="67" cy="52" r="8.5" fill={OUTLINE}/>
                <circle cx="65" cy="49" r="2.5" fill="white"/>
                <circle cx="69" cy="55" r="1.2" fill="white"/>
                {/* Lágrimas */}
                <path d="M29,60 Q27,70 31,72 Q35,70 33,60 Z" fill="#93C5FD" opacity="0.85"/>
                <path d="M71,60 Q69,70 73,72 Q77,70 75,60 Z" fill="#93C5FD" opacity="0.85"/>
            </>
        );
        if (estado === "pensando") return (
            <>
                <circle cx="33" cy="52" r="8.5" fill={OUTLINE}/>
                <circle cx="34" cy="48" r="2.5" fill="white"/>
                <circle cx="31" cy="54" r="1.2" fill="white"/>
                <circle cx="67" cy="52" r="8.5" fill={OUTLINE}/>
                <circle cx="68" cy="48" r="2.5" fill="white"/>
                <circle cx="65" cy="54" r="1.2" fill="white"/>
            </>
        );
        const ex = estado === "escuchando" ? 1 : 0;
        return (
            <>
                <circle cx="33" cy="52" r={8.5 + ex} fill={OUTLINE}/>
                <circle cx="31" cy="49" r="2.5" fill="white"/>
                <circle cx="35" cy="55" r="1.2" fill="white"/>
                <circle cx="67" cy="52" r={8.5 + ex} fill={OUTLINE}/>
                <circle cx="65" cy="49" r="2.5" fill="white"/>
                <circle cx="69" cy="55" r="1.2" fill="white"/>
            </>
        );
    };

    const Cejas = () => {
        if (estado === "feliz") return (
            <>
                <path d="M24,42 Q33,38 42,42" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
                <path d="M58,42 Q67,38 76,42" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
            </>
        );
        if (estado === "triste") return (
            <>
                <path d="M24,44 Q33,48 42,45" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
                <path d="M58,45 Q67,48 76,44" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
            </>
        );
        if (estado === "pensando") return (
            <>
                <path d="M24,45 Q33,43 42,45" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
                <path d="M58,43 Q67,39 76,42" stroke={OUTLINE} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85"/>
            </>
        );
        return (
            <>
                <path d="M24,45 Q33,42 42,45" stroke={OUTLINE} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                <path d="M58,45 Q67,42 76,45" stroke={OUTLINE} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
            </>
        );
    };

    const Lentes = () => (
        <>
            <circle cx="33" cy="52" r="12" fill="none" stroke={GLASSES} strokeWidth="2.2"/>
            <circle cx="67" cy="52" r="12" fill="none" stroke={GLASSES} strokeWidth="2.2"/>
            <path d="M45,52 Q50,54 55,52" fill="none" stroke={GLASSES} strokeWidth="2.2"/>
            <path d="M21,52 Q17,50 14,48" fill="none" stroke={GLASSES} strokeWidth="1.5"/>
            <path d="M79,52 Q83,50 86,48" fill="none" stroke={GLASSES} strokeWidth="1.5"/>
        </>
    );

    const Boca = () => {
        const Nariz = () => (
            <polygon points="50,60 47.5,63 52.5,63" fill={NOSE} stroke={NOSE} strokeWidth="0.5" strokeLinejoin="round"/>
        );
        const LineaNariz = () => (
            <line x1="50" y1="63" x2="50" y2="66" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
        );

        if (estado === "hablando") return (
            <>
                <Nariz/>
                <LineaNariz/>
                {bocaAbierta ? (
                    <path d="M46,66 C46,73 54,73 54,66 Z" fill="#C06060" stroke={OUTLINE} strokeWidth="1.5"/>
                ) : (
                    <>
                        <path d="M45,66 Q48,69 50,67" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M50,67 Q52,69 55,66" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
                    </>
                )}
            </>
        );
        if (estado === "feliz") return (
            <>
                <Nariz/>
                <LineaNariz/>
                <path d="M44,66 Q50,76 56,66" fill="none" stroke={MOUTH_C} strokeWidth="2" strokeLinecap="round"/>
            </>
        );
        if (estado === "triste") return (
            <>
                <Nariz/>
                <LineaNariz/>
                <path d="M46,69 Q50,64 54,69" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
            </>
        );
        return (
            <>
                <Nariz/>
                <LineaNariz/>
                <path d="M45,66 Q48,69 50,67" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M50,67 Q52,69 55,66" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
            </>
        );
    };

    const Bigotes = () => (
        <>
            <line x1="16" y1="64" x2="28" y2="66" stroke={OUTLINE} strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
            <line x1="14" y1="68" x2="28" y2="69" stroke={OUTLINE} strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
            <line x1="16" y1="72" x2="28" y2="71" stroke={OUTLINE} strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
            <line x1="72" y1="66" x2="84" y2="64" stroke={OUTLINE} strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
            <line x1="72" y1="69" x2="86" y2="68" stroke={OUTLINE} strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
            <line x1="72" y1="71" x2="84" y2="72" stroke={OUTLINE} strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
        </>
    );

    const Extras = () => {
        if (estado === "pensando") return (
            <>
                {/* Nubecita de pensamiento */}
                <circle cx="76" cy="6" r="2.2" fill="#FFFDF9" stroke={OUTLINE} strokeWidth="1" opacity="0.85"/>
                <circle cx="78" cy="0" r="3.8" fill="#FFFDF9" stroke={OUTLINE} strokeWidth="1.2" opacity="0.9"/>
                
                <path d="M 68,-12
                         A 6,6 0 0,1 74,-18
                         A 9,9 0 0,1 88,-19
                         A 7,7 0 0,1 95,-12
                         A 6,6 0 0,1 93,-5
                         L 72,-5
                         A 5,5 0 0,1 68,-12 Z" 
                      fill="#FFFDF9" stroke={OUTLINE} strokeWidth="1.6"/>

                {/* Pescadito nadando dentro de la nubecita */}
                <g className="swimming-fish">
                    {/* Cola */}
                    <polygon points="87,-12 91.5,-8.5 91.5,-15.5" fill="#FF9F1C"/>
                    {/* Cuerpo */}
                    <ellipse cx="81.5" cy="-12" rx="5.5" ry="3" fill="#FF9F1C"/>
                    {/* Ojo */}
                    <circle cx="79" cy="-13" r="0.7" fill="#FFF"/>
                </g>
            </>
        );
        if (estado === "feliz") return (
            <>
                <path d="M10 36 L11.5 31 L13 36 L18 37 L13 38 L11.5 43 L10 38 L5 37 Z" fill="#FFD700" opacity="0.9"/>
                <path d="M82 30 L83.5 25 L85 30 L90 31 L85 32 L83.5 37 L82 32 L77 31 Z" fill="#FFD700" opacity="0.9"/>
            </>
        );
        return null;
    };

    return (
        <svg width="260" height="382" viewBox="0 -25 100 147" xmlns="http://www.w3.org/2000/svg">
            <style>
                {`
                    @keyframes float-fish {
                        0% { transform: translate(0px, 0px) scaleX(1); }
                        48% { transform: translate(-8px, 0.5px) scaleX(1); }
                        50% { transform: translate(-8px, 0.5px) scaleX(-1); }
                        98% { transform: translate(0px, 0px) scaleX(-1); }
                        100% { transform: translate(0px, 0px) scaleX(1); }
                    }
                    .swimming-fish {
                        animation: float-fish 3s ease-in-out infinite;
                        transform-origin: 81.5px -12px;
                    }
                `}
            </style>
            <Libros/>
            <Base/>
            <Ojos/>
            <Cejas/>
            <Lentes/>
            {/* Cachetes */}
            <ellipse cx="26" cy="62" rx="6" ry="3.5" fill="#F4A0C8" opacity={blush}/>
            <ellipse cx="74" cy="62" rx="6" ry="3.5" fill="#F4A0C8" opacity={blush}/>
            <Bigotes/>
            <Boca/>
            <Extras/>
        </svg>
    );
}


// ── TTS con voz femenina ──────────────────────────────────────────────────

function useTTS() {

    const vozRef = useRef<SpeechSynthesisVoice | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


    useEffect(() => {

        // Nombres conocidos de voces femeninas en español (por OS/navegador)

        const VOCES_FEMENINAS = [

            "Paulina", "Monica", "Mónica", "Helena", "Laura",

            "Lucia", "Lucía", "Valeria", "Camila", "Isabella",

            "Sabina", "Jorge", // Google es-US a veces es femenina

        ];


        const seleccionar = () => {

            const voces = speechSynthesis.getVoices();

            let voz = voces.find(v =>

                v.lang.startsWith("es") &&

                VOCES_FEMENINAS.some(n => v.name.includes(n))
            );

            // Fallback: cualquier voz en español

            if (!voz) voz = voces.find(v => v.lang.startsWith("es"));

            vozRef.current = voz ?? null;

        };


        seleccionar();

        speechSynthesis.addEventListener("voiceschanged", seleccionar);

        return () => speechSynthesis.removeEventListener("voiceschanged", seleccionar);

    }, []);


    const hablar = (texto: string, onEnd?: () => void) => {

        speechSynthesis.cancel();
        utteranceRef.current = null;

        const u = new SpeechSynthesisUtterance(texto);

        u.lang = "es-PE";

        u.rate = 0.93;

        u.pitch = 1.35; // más agudo = más femenino de fallback

        if (vozRef.current) u.voice = vozRef.current;

        if (onEnd) {
            u.onend = () => {
                utteranceRef.current = null;
                onEnd();
            };
            u.onerror = () => {
                utteranceRef.current = null;
                onEnd();
            };
        }

        utteranceRef.current = u; // Guardar referencia para evitar Garbage Collection
        speechSynthesis.speak(u);

    };


    const parar = () => {
        speechSynthesis.cancel();
        utteranceRef.current = null;
    };

    return {hablar, parar};

}


// ── MediaRecorder para captura de Audio y envío ───────────────────────────
function useAudioRecorder(onAudioReady: (blob: Blob) => void, onError?: (msg: string) => void) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const startTimeRef = useRef<number>(0);
    const [escuchando, setEscuchando] = useState(false);

    const [supported] = useState(() => {
        return typeof window !== "undefined" && !!window.MediaRecorder;
    });

    const iniciar = async () => {
        if (!supported) return;

        // Limpiar cualquier grabación previa
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.error("Error al detener MediaRecorder previo:", e);
            }
        }
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach(track => track.stop());
            } catch (e) {
                console.error("Error al limpiar stream previo:", e);
            }
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const duration = Date.now() - startTimeRef.current;
                
                if (duration < 1500) {
                    onError?.("La grabación es demasiado corta. Por favor, habla un poco más.");
                } else if (audioBlob.size > 0) {
                    onAudioReady(audioBlob);
                } else {
                    onError?.("No se grabó ningún audio. Intenta de nuevo.");
                }

                // Detener micrófonos para apagar el LED del sistema
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };

            recorder.start();
            startTimeRef.current = Date.now();
            setEscuchando(true);
            console.log("🟢 Grabación iniciada con MediaRecorder");
        } catch (error: any) {
            console.error('Error al acceder al micrófono:', error);
            const msg = error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
                ? "Necesito permiso para acceder al micrófono."
                : `Error de micrófono: ${error.message}`;
            onError?.(msg);
            setEscuchando(false);
        }
    };

    const detener = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.error("Error al detener la grabación:", e);
            }
            setEscuchando(false);
        }
    };

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {}
            }
            if (streamRef.current) {
                try {
                    streamRef.current.getTracks().forEach(track => track.stop());
                } catch (e) {}
            }
        };
    }, []);

    return { iniciar, detener, escuchando, supported };
}


// ── Detecta si la respuesta fue positiva o negativa ───────────────────────

function detectarVeredicto(texto: string, puntuacion?: number): EstadoAvatar {
    if (puntuacion !== undefined) {
        if (puntuacion >= 3) return "feliz";
        if (puntuacion === 2) return "idle";
        return "triste";
    }
    const positivos = /muy bien|excelente|correcto|perfecto|¡así es|exactamente|eso es|¡bien|acertaste|correc/i;
    return positivos.test(texto) ? "feliz" : "triste";
}


// ── Animación del avatar según estado ────────────────────────────────────

function animProps(estado: EstadoAvatar) {

    if (estado === "idle" || estado === "esperando")

        return {

            animate: {y: [0, -6, 0]},

            transition: {repeat: Infinity, duration: 2.8, ease: "easeInOut" as const},

        };

    if (estado === "hablando")

        return {

            animate: {scale: [1, 1.025, 1]},

            transition: {repeat: Infinity, duration: 0.38},

        };

    if (estado === "feliz")

        return {

            animate: {scale: [1, 1.08, 0.97, 1.04, 1], y: [0, -8, 0]},

            transition: {duration: 0.55, repeat: 1},

        };

    if (estado === "triste")

        return {

            animate: {y: [0, 3, 0, 3, 0]},

            transition: {duration: 0.6, repeat: Infinity, repeatDelay: 1.5},

        };

    return {animate: {}, transition: {}};

}


// ── Labels de estado ──────────────────────────────────────────────────────

const ESTADO_LABEL: Record<EstadoAvatar, string> = {

    idle: "lista...",

    pensando: "pensando...",

    hablando: "hablando",

    esperando: "te escucho",

    escuchando: "escuchando...",

    feliz: "¡muy bien!",

    triste: "no te preocupes...",

};


// ── Página principal ──────────────────────────────────────────────────────

export default function AvatarTutor() {

    const {courseId = "", semanaId = ""} = useParams();
    const [searchParams] = useSearchParams();
    const mongoId = searchParams.get("mongoId") ?? "";
    const tema = searchParams.get("tema") ?? "el material de esta semana";

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const storageKey = `semantika.unfinished_attempt.${user.id}.${courseId}.${semanaId}.avatar`;

    // Si está activada la opción de pruebas para ignorar la continuación, limpiamos el intento guardado
    if (localStorage.getItem("semantika.testing_ignorar_continuar") === "true") {
        localStorage.removeItem(storageKey);
    }

    const [sesionIniciada, setSesionIniciada] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return !!saved;
    });

    const [estado, setEstado] = useState<EstadoAvatar>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.estado || "idle";
            }
        } catch (e) {}
        return "idle";
    });

    const [turno, setTurno] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.turno || 1;
            }
        } catch (e) {}
        return 1;
    });

    const [historial, setHistorial] = useState<TurnData[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.historial || [];
            }
        } catch (e) {}
        return [];
    });

    const [turnoActual, setTurnoActual] = useState<TurnData | null>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.turnoActual || null;
            }
        } catch (e) {}
        return null;
    });

    const [feedback, setFeedback] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.feedback || "";
            }
        } catch (e) {}
        return "";
    });

    const [cargando, setCargando] = useState(false);
    const [error, setErrorState] = useState("");
    const setError = (rawMsg: string) => {
        if (!rawMsg) {
            setErrorState("");
            return;
        }
        const errorLower = rawMsg.toLowerCase();
        if (
            rawMsg.includes("503") || 
            errorLower.includes("service unavailable") || 
            errorLower.includes("high demand") || 
            errorLower.includes("temporary") ||
            errorLower.includes("experiencing high demand")
        ) {
            setErrorState("La IA está experimentando una alta demanda en su capa gratuita en este momento. Por favor, espera unos segundos e inténtalo de nuevo.");
        } else if (
            rawMsg.includes("429") || 
            errorLower.includes("quota") || 
            errorLower.includes("too many requests") || 
            errorLower.includes("limit")
        ) {
            setErrorState("Hay muchas peticiones en la IA, actualmente está ocupada, así que inténtalo de nuevo más tarde.");
        } else {
            setErrorState(rawMsg);
        }
    };

    const [turnoListo, setTurnoListo] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data.turnoListo || false;
            }
        } catch (e) {}
        return false;
    });

    const [modoTexto, setModoTexto] = useState(false);
    const [textoEscrito, setTextoEscrito] = useState("");

    const {hablar, parar} = useTTS();

    // Guardar estado inacabado en localStorage
    useEffect(() => {
        if (sesionIniciada && !cargando) {
            const data = {
                turno,
                historial,
                turnoActual,
                feedback,
                estado: estado === "pensando" || estado === "hablando" ? "esperando" : estado, // evitar quedar en un estado transitorio al recargar
                turnoListo,
                timestamp: Date.now()
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
    }, [turno, historial, turnoActual, feedback, estado, turnoListo, sesionIniciada]);

    // Detener cualquier audio en reproducción al desmontar el componente (cambiar de página o volver al curso)
    useEffect(() => {
        return () => {
            parar();
        };
    }, []);

    const [sesionFinalizada, setSesionFinalizada] = useState(false);
    const [ultimoAudioBlob, setUltimoAudioBlob] = useState<Blob | null>(null);
    const [ultimaRespuestaTexto, setUltimaRespuestaTexto] = useState("");
    const [tipoUltimoIntento, setTipoUltimoIntento] = useState<"pregunta" | "analisis-texto" | "analisis-audio" | null>(null);

    const cantidadParam = searchParams.get("cantidad");
    const totalPreguntas = cantidadParam ? parseInt(cantidadParam, 10) : 5;

    const manejarErrorVoz = (msg: string) => {
        setError(msg);
        setEstado("esperando");
    };

    const {iniciar, detener, escuchando, supported} = useAudioRecorder(onAudioListo, manejarErrorVoz);

    const iniciarVoz = () => {
        setError("");
        parar();
        setEstado("escuchando");
        iniciar();
    };

    const enviarRespuestaTexto = () => {
        if (!textoEscrito.trim()) return;
        setError("");
        onRespuestaVoz(textoEscrito.trim());
        setTextoEscrito("");
    };


    // ── Paso 1: obtener pregunta ──────────────────────────────────────────

    const empezarSesion = () => {
        setSesionIniciada(true);
        pedirSiguientePregunta(1);
    };

    async function pedirSiguientePregunta(turnoNum: number) {
        parar(); // Detener cualquier audio que esté sonando antes de pedir la siguiente pregunta
        if (turnoNum > totalPreguntas) {
            setSesionFinalizada(true);
            return;
        }
        setCargando(true);
        setEstado("pensando");
        setFeedback("");
        setTurnoActual(null);
        setTurnoListo(false);
        setError("");
        setTipoUltimoIntento("pregunta");

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const res = await fetch(`${baseUrl}/archivos/tutor/pregunta`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    tema,
                    mongoId,
                    turno: turnoNum,
                    preguntasEvitar: historial.map(h => h.pregunta)
                }),
            });
            if (!res.ok) {
                let errorMsg = `Error del servidor: HTTP ${res.status}`;
                try {
                    const text = await res.text();
                    if (text) {
                        try {
                            const parsed = JSON.parse(text);
                            errorMsg = parsed.message || parsed.error || text;
                        } catch {
                            errorMsg = text;
                        }
                    }
                } catch {}
                throw new Error(errorMsg);
            }

            const data = await res.json();
            const nuevo: TurnData = {
                turno: turnoNum,
                pregunta: data.pregunta ?? "¿Qué puedes decirme sobre este tema?",
                conceptoClave: data.concepto_clave ?? "",
                pistaSiNoResponde: data.pista_si_no_responde ?? "",
            };
            setTurnoActual(nuevo);
            setEstado("hablando");
            hablar(nuevo.pregunta, () => setEstado("esperando"));
        } catch (err: any) {
            setError(err?.message || "No pude conectarme al servidor.");
            setEstado("idle");
        } finally {
            setCargando(false);
        }
    }


    //Paso 2: procesar respuesta de voz

    async function onRespuestaVoz(texto: string) {
        if (!turnoActual) return;
        setEstado("pensando");
        parar();
        setError("");
        setUltimaRespuestaTexto(texto);
        setTipoUltimoIntento("analisis-texto");

        const turnoConRespuesta: TurnData = {...turnoActual, respuestaEstudiante: texto};
        setTurnoActual(turnoConRespuesta);

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const res = await fetch(`${baseUrl}/archivos/tutor/analizar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    pregunta: turnoActual.pregunta,
                    respuestaEstudiante: texto,
                    tema,
                    nivelDificultad: turno <= 2 ? "básico" : turno <= 4 ? "intermedio" : "avanzado",
                }),
            });

            if (!res.ok) {
                let errorMsg = `Error del servidor: HTTP ${res.status}`;
                try {
                    const text = await res.text();
                    if (text) {
                        try {
                            const parsed = JSON.parse(text);
                            errorMsg = parsed.message || parsed.error || text;
                        } catch {
                            errorMsg = text;
                        }
                    }
                } catch {}
                throw new Error(errorMsg);
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            let feedbackAcumulado = "";
            let evName = "";
            let evData = "";

            const procesarEvento = (name: string, data: string) => {
                if (name === "feedback") {
                    feedbackAcumulado += data;
                    setFeedback(feedbackAcumulado);
                } else if (name === "avatar_state") {
                    try {
                        const d = JSON.parse(data);
                        setEstado(d.estado as EstadoAvatar);
                    } catch (e) {
                        console.error("Error al parsear avatar_state:", e);
                    }
                } else if (name === "done") {
                    const match = feedbackAcumulado.match(/\[PUNTUACION:\s*(\d+)\]/i);
                    const puntuacion = match ? parseInt(match[1], 10) : undefined;
                    const veredicto = detectarVeredicto(feedbackAcumulado, puntuacion);
                    const textToSpeak = feedbackAcumulado.replace(/\[PUNTUACION:\s*\d+\]/i, "").trim();
                    if (!textToSpeak) {
                        setError("No se pudo obtener una respuesta clara. Por favor, intenta de nuevo o escribe tu respuesta.");
                        setEstado("esperando");
                        return;
                    }
                    setEstado(veredicto);
                    setHistorial(h => [...h, {...turnoConRespuesta, feedback: textToSpeak, puntuacion}]);
                    setTurno(t => t + 1);
                    setTurnoListo(true);
                    hablar(textToSpeak);
                } else if (name === "error") {
                    setError(data || "Error al analizar tu respuesta.");
                    setEstado("esperando");
                }
            };

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                buf += decoder.decode(value, {stream: true});
                const lines = buf.split("\n");
                buf = lines.pop()!;
                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        evName = line.slice(6).trim();
                    } else if (line.startsWith("data:")) {
                        const val = line.slice(5).replace(/\r$/, "");
                        evData = evData ? evData + "\n" + val : val;
                    } else if (line.trim() === "") {
                        if (evName) {
                            procesarEvento(evName, evData);
                            evName = "";
                            evData = "";
                        }
                    }
                }
            }

            // Procesar cualquier remanente en buf
            if (buf.trim() !== "") {
                const lines = buf.split("\n");
                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        evName = line.slice(6).trim();
                    } else if (line.startsWith("data:")) {
                        const val = line.slice(5).replace(/\r$/, "");
                        evData = evData ? evData + "\n" + val : val;
                    } else if (line.trim() === "") {
                        if (evName) {
                            procesarEvento(evName, evData);
                            evName = "";
                            evData = "";
                        }
                    }
                }
            }

            // Procesar evento pendiente al cerrar conexión
            if (evName) {
                procesarEvento(evName, evData);
            }
        } catch (err: any) {
            setError(err?.message || "Error al analizar tu respuesta.");
            setEstado("esperando");
        }
    }

    async function onAudioListo(audioBlob: Blob) {
        if (!turnoActual) return;
        setEstado("pensando");
        parar();
        setError("");
        setUltimoAudioBlob(audioBlob);
        setTipoUltimoIntento("analisis-audio");

        const turnoConRespuesta: TurnData = {...turnoActual, respuestaEstudiante: "[Respuesta grabada por audio]"};
        setTurnoActual(turnoConRespuesta);

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "grabacion.webm");
            formData.append("pregunta", turnoActual.pregunta);
            formData.append("tema", tema);
            formData.append("nivelDificultad", turno <= 2 ? "básico" : turno <= 4 ? "intermedio" : "avanzado");

            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const res = await fetch(`${baseUrl}/archivos/tutor/analizar-audio`, {
                method: "POST",
                headers: {
                    "Accept": "text/event-stream",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            if (!res.ok) {
                let errorMsg = `Error del servidor: HTTP ${res.status}`;
                try {
                    const text = await res.text();
                    if (text) {
                        try {
                            const parsed = JSON.parse(text);
                            errorMsg = parsed.message || parsed.error || text;
                        } catch {
                            errorMsg = text;
                        }
                    }
                } catch {}
                throw new Error(errorMsg);
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            let feedbackAcumulado = "";
            let evName = "";
            let evData = "";

            const procesarEvento = (name: string, data: string) => {
                if (name === "feedback") {
                    feedbackAcumulado += data;
                    setFeedback(feedbackAcumulado);
                } else if (name === "avatar_state") {
                    try {
                        const d = JSON.parse(data);
                        setEstado(d.estado as EstadoAvatar);
                    } catch (e) {
                        console.error("Error al parsear avatar_state:", e);
                    }
                } else if (name === "done") {
                    const match = feedbackAcumulado.match(/\[PUNTUACION:\s*(\d+)\]/i);
                    const puntuacion = match ? parseInt(match[1], 10) : undefined;
                    const veredicto = detectarVeredicto(feedbackAcumulado, puntuacion);
                    const textToSpeak = feedbackAcumulado.replace(/\[PUNTUACION:\s*\d+\]/i, "").trim();
                    if (!textToSpeak) {
                        setError("No se pudo obtener una respuesta clara. Por favor, intenta de nuevo o escribe tu respuesta.");
                        setEstado("esperando");
                        return;
                    }
                    setEstado(veredicto);
                    setHistorial(h => [...h, {...turnoConRespuesta, feedback: textToSpeak, puntuacion}]);
                    setTurno(t => t + 1);
                    setTurnoListo(true);
                    hablar(textToSpeak);
                } else if (name === "error") {
                    setError(data || "Error al analizar tu respuesta.");
                    setEstado("esperando");
                }
            };

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                buf += decoder.decode(value, {stream: true});
                const lines = buf.split("\n");
                buf = lines.pop()!;
                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        evName = line.slice(6).trim();
                    } else if (line.startsWith("data:")) {
                        const val = line.slice(5).replace(/\r$/, "");
                        evData = evData ? evData + "\n" + val : val;
                    } else if (line.trim() === "") {
                        if (evName) {
                            procesarEvento(evName, evData);
                            evName = "";
                            evData = "";
                        }
                    }
                }
            }

            // Procesar cualquier remanente en buf
            if (buf.trim() !== "") {
                const lines = buf.split("\n");
                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        evName = line.slice(6).trim();
                    } else if (line.startsWith("data:")) {
                        const val = line.slice(5).replace(/\r$/, "");
                        evData = evData ? evData + "\n" + val : val;
                    } else if (line.trim() === "") {
                        if (evName) {
                            procesarEvento(evName, evData);
                            evName = "";
                            evData = "";
                        }
                    }
                }
            }

            // Procesar evento pendiente al cerrar conexión
            if (evName) {
                procesarEvento(evName, evData);
            }
        } catch (err: any) {
            setError(err?.message || "Error al analizar tu respuesta.");
            setEstado("esperando");
        }
    }

    function reintentarUltimoIntento() {
        setError("");
        if (tipoUltimoIntento === "pregunta") {
            pedirSiguientePregunta(turno);
        } else if (tipoUltimoIntento === "analisis-texto") {
            onRespuestaVoz(ultimaRespuestaTexto);
        } else if (tipoUltimoIntento === "analisis-audio") {
            if (ultimoAudioBlob) {
                onAudioListo(ultimoAudioBlob);
            } else {
                setError("No se encontró el audio previo para reintentar. Por favor graba de nuevo.");
            }
        }
    }

    async function guardarIntento() {
        setCargando(true);
        setError("");
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (!user.id) throw new Error("Usuario no encontrado en la sesión");

            // Convertir puntajes a escala de 20 puntos:
            const maxWeight = 20 / totalPreguntas;
            const notaCalculada = historial.reduce((acc, h) => {
                const pts = h.puntuacion || 1;
                return acc + (pts / 4) * maxWeight;
            }, 0);

            const respuestasDetalle = historial.map(h => ({
                preguntaTexto: h.pregunta,
                tipoPregunta: "ABIERTA",
                respuestaEstudiante: h.respuestaEstudiante || "No respondió",
                esCorrecta: (h.puntuacion !== undefined && h.puntuacion >= 2)
            }));

            await intentosApi.guardar({
                usuarioId: Number(user.id),
                semanaId: semanaId,
                notaFinal: Number(notaCalculada.toFixed(2)),
                tecnica: "avatar",
                respuestas: respuestasDetalle
            });

            toast.success("¡Sesión guardada en tu historial!");
            localStorage.setItem(`semantika.completed_mode.${user.id}.${semanaId}.avatar`, "true");
            localStorage.removeItem(storageKey);
            setSesionFinalizada(true);
        } catch (err: any) {
            console.error("Error al guardar el intento:", err);
            setError(err?.message || "No se pudo guardar la sesión en el historial.");
        } finally {
            setCargando(false);
        }
    }

    const anim = animProps(estado);

    if (sesionFinalizada) {
        const preguntasConPuntaje = historial.filter(h => h.puntuacion !== undefined);
        const promedio = preguntasConPuntaje.length > 0 
            ? (preguntasConPuntaje.reduce((acc, curr) => acc + (curr.puntuacion || 0), 0) / preguntasConPuntaje.length).toFixed(1)
            : null;

        const estadoFinal = promedio && parseFloat(promedio) >= 2.5 ? "feliz" : "triste";
        const mensajeFinal = promedio && parseFloat(promedio) >= 2.5 ? "¡Excelente esfuerzo!" : "¡Sigue practicando!";

        return (
            <div className="max-w-2xl mx-auto space-y-6 pb-20 text-center">
                <Link
                    to={`/app/curso/${courseId}/semana/${semanaId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground self-start mb-4"
                >
                    <ArrowLeft className="w-4 h-4"/> Volver al curso
                </Link>

                <header className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Resumen de Desempeño
                    </span>
                    <h1 className="font-display text-4xl font-bold text-primary">¡Sesión Finalizada!</h1>
                    <p className="text-muted-foreground">
                        Has completado la sesión de tutoría sobre <strong>{tema}</strong>.
                    </p>
                </header>

                {/* Aria Avatar reacts dynamically */}
                <div className="flex flex-col items-center gap-2">
                    <AriaSvg estado={estadoFinal}/>
                    <span className="text-lg font-bold text-foreground">{mensajeFinal}</span>
                </div>

                {promedio && (
                    <div className="bg-primary-gradient text-white rounded-3xl p-6 shadow-lg space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90 block">Puntuación de Razonamiento Promedio</span>
                        <div className="text-5xl font-black">{promedio} <span className="text-2xl font-normal opacity-85">/ 4</span></div>
                        <div className="text-lg font-bold border-t border-white/20 pt-2">
                            Nota equivalente: {((parseFloat(promedio) / 4) * 20).toFixed(1)} / 20
                        </div>
                        <p className="text-sm opacity-90 pt-2">
                            {parseFloat(promedio) >= 3.5 
                                ? "¡Fantástico! Tus respuestas demuestran un nivel muy alto de fundamentación y análisis crítico."
                                : parseFloat(promedio) >= 2.5
                                ? "¡Buen trabajo! Has fundamentado tus ideas, aunque puedes profundizar un poco más en la justificación."
                                : "Sigue practicando para argumentar con mayor nivel de detalle y conectar ideas del material."}
                        </p>
                    </div>
                )}

                <div className="space-y-4 text-left">
                    <h3 className="font-display font-bold text-xl mb-3">Detalle de la Conversación</h3>
                    {historial.map((h, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start gap-4 border-b border-border pb-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                    Pregunta {h.turno}
                                </span>
                                {h.puntuacion !== undefined && (
                                    <div className="flex items-center gap-1">
                                        {[...Array(4)].map((_, idx) => (
                                            <span 
                                                key={idx} 
                                                className={cn(
                                                    "text-lg", 
                                                    idx < (h.puntuacion || 0) ? "text-amber-500" : "text-muted-foreground/30"
                                                )}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                )}
							</div>
                            <p className="font-semibold text-foreground leading-relaxed">{h.pregunta}</p>
                            <div className="bg-secondary/30 rounded-xl p-3 text-sm">
                                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Tu respuesta:</span>
                                <p className="italic text-foreground">"{h.respuestaEstudiante}"</p>
                            </div>
                            {h.feedback && (
                                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-sm">
                                    <span className="text-xs font-bold text-primary uppercase block mb-1">Feedback de ARIA:</span>
                                    <p className="text-foreground leading-relaxed">{h.feedback}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-6">
                    <Link
                        to={`/app/curso/${courseId}/semana/${semanaId}`}
                        className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary text-white font-bold text-md shadow hover:opacity-90 transition hover:scale-105 active:scale-95"
                    >
                        Volver a la Semana
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <Link
                to={`/app/curso/${courseId}/semana/${semanaId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4"/> Volver
            </Link>

            <header className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Sesión con ARIA · Pregunta {Math.min(turno, totalPreguntas)} de {totalPreguntas}
                </span>
                <h1 className="font-display text-3xl font-bold">{tema}</h1>
            </header>

            {/* Error container placed higher up for absolute visibility */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl shadow-sm"
                    >
                        <p className="text-center text-sm text-destructive font-semibold">{error}</p>
                        <button
                            onClick={reintentarUltimoIntento}
                            className="px-5 py-2 rounded-xl bg-destructive text-white text-xs font-bold shadow hover:bg-destructive/90 transition-all"
                        >
                            Reintentar acción
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
                <motion.div {...anim}>
                    <AriaSvg estado={estado}/>
                </motion.div>
                <span className="text-sm text-muted-foreground font-medium">
                    {ESTADO_LABEL[estado]}
                </span>

                {/* Onda mic */}
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

            {/* 🔥 Lógica condicional: Mostrar botón "Empezar" o la interfaz normal */}
            {!sesionIniciada ? (
                <div className="flex flex-col items-center justify-center pt-8">
                    <button
                        onClick={empezarSesion}
                        className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:opacity-90 hover:scale-105 transition-all"
                    >
                        Empezar Sesión
                    </button>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                        Haz clic para iniciar y permitir el audio (cantidad de preguntas: {totalPreguntas}).
                    </p>
                </div>
            ) : (
                <>
                    {/* Pregunta */}
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

                    {/* Feedback */}
                    <AnimatePresence>
                        {feedback && (() => {
                            const match = feedback.match(/\[PUNTUACION:\s*(\d+)\]/i);
                            const puntuacionActual = match ? parseInt(match[1], 10) : undefined;
                            return (
                                <motion.div
                                    key="feedback-card"
                                    initial={{opacity: 0, y: 6}}
                                    animate={{opacity: 1, y: 0}}
                                    className="bg-primary/5 border border-primary/20 rounded-2xl p-5"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-primary/10 pb-2">
                                        <span className="text-xs font-bold text-primary uppercase">
                                            ARIA responde:
                                        </span>
                                        {puntuacionActual !== undefined && (
                                            <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full text-xs font-bold text-primary">
                                                <span>Fundamentación:</span>
                                                <div className="flex">
                                                    {[...Array(4)].map((_, idx) => (
                                                        <span 
                                                            key={idx} 
                                                            className={cn(
                                                                "text-sm", 
                                                                idx < puntuacionActual ? "text-amber-500" : "text-muted-foreground/30"
                                                            )}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm leading-relaxed">{feedback.replace(/\[PUNTUACION:\s*\d+\]/i, "").trim()}</p>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>

                    {turnoListo ? (
                        <div className="flex flex-col items-center justify-center py-4 w-full">
                            {turno <= totalPreguntas ? (
                                <motion.button
                                    initial={{opacity: 0, y: 6}}
                                    animate={{opacity: 1, y: 0}}
                                    onClick={() => {
                                        setModoTexto(false);
                                        pedirSiguientePregunta(turno);
                                    }}
                                    className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-md shadow hover:opacity-90 transition hover:scale-105 active:scale-95"
                                >
                                    Siguiente pregunta →
                                </motion.button>
                            ) : (
                                <motion.button
                                    initial={{opacity: 0, y: 6}}
                                    animate={{opacity: 1, y: 0}}
                                    onClick={guardarIntento}
                                    disabled={cargando}
                                    className="px-8 py-3 rounded-xl bg-primary-gradient text-white font-bold text-md shadow hover:opacity-90 transition hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    {cargando ? "Guardando en historial..." : "Ver resultados de la sesión"}
                                </motion.button>
                            )}
                        </div>
                    ) : modoTexto ? (
                        <div className="w-full bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm text-left">
                            <span className="text-xs font-bold text-muted-foreground uppercase block">
                                Escribe tu respuesta:
                            </span>
                            <textarea
                                value={textoEscrito}
                                onChange={(e) => setTextoEscrito(e.target.value)}
                                placeholder="Escribe aquí lo que piensas..."
                                disabled={cargando}
                                rows={3}
                                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            />
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModoTexto(false);
                                        setTextoEscrito("");
                                    }}
                                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                                >
                                    Usar micrófono
                                </button>
                                <button
                                    type="button"
                                    onClick={enviarRespuestaTexto}
                                    disabled={!textoEscrito.trim() || cargando}
                                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow hover:opacity-90 transition disabled:opacity-50"
                                >
                                    Enviar respuesta
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Botón mic */}
                            {!supported && (
                                <p className="text-center text-sm text-amber-600 font-semibold mb-2">
                                    Usa Chrome o Edge para reconocimiento de voz.
                                </p>
                            )}

                            <div className="flex flex-col items-center gap-3 w-full">
                                {(estado === "esperando" || estado === "hablando") && !escuchando && (
                                    <motion.button
                                        initial={{opacity: 0, scale: 0.9}}
                                        animate={{opacity: 1, scale: 1}}
                                        onClick={iniciarVoz}
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
                                        className="w-20 h-20 rounded-full bg-red-500 text-white grid place-items-center shadow-lg"
                                    >
                                        <MicOff className="w-8 h-8"/>
                                    </motion.button>
                                )}

                                <p className="text-xs text-muted-foreground text-center">
                                    {escuchando ? "Habla ahora, pulsa para terminar" : "Pulsa el micrófono para responder"}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setModoTexto(true)}
                                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition mt-1"
                                >
                                    O responder escribiendo texto
                                </button>

                                <AnimatePresence>
                                    {escuchando && (
                                        <motion.div
                                            key="live-transcript"
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="w-full bg-secondary/40 p-3 rounded-xl border border-border mt-2"
                                        >
                                            <p className="text-sm font-medium text-foreground italic text-center animate-pulse">
                                                Grabando tu voz... Habla ahora.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Historial */}
            {historial.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-display font-bold text-lg">Historial</h3>
                    {historial.map((h, i) => (
                        <div key={i} className="bg-secondary/30 rounded-xl p-4 text-sm space-y-2">
                            <div className="flex justify-between items-center gap-2">
                                <p className="font-semibold text-foreground">Turno {h.turno}: {h.pregunta}</p>
                                {h.puntuacion !== undefined && (
                                    <div className="flex shrink-0">
                                        {[...Array(4)].map((_, idx) => (
                                            <span 
                                                key={idx} 
                                                className={cn(
                                                    "text-sm", 
                                                    idx < (h.puntuacion || 0) ? "text-amber-500" : "text-muted-foreground/30"
                                                )}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-muted-foreground">Tu respuesta: {h.respuestaEstudiante}</p>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}