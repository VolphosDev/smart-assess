import { useEffect, useState } from "react";

/**
 * Aria: el rostro de la plataforma.
 *
 * POR QUE ESTA AQUI Y NO EN UNA PAGINA. Este SVG vivia dentro de `AvatarTutor.tsx`, asi que
 * Aria solo podia existir en la pantalla de tutoria por voz. Sacarla a un componente propio
 * es lo que permite que sea el mismo personaje quien te recibe, te ensena la aplicacion y te
 * devuelve la sintesis al final — en vez de una cara que aparece en un rincon del sistema.
 *
 * DONDE DEBE APARECER, Y DONDE NO. En la entrada (bienvenida, tutorial) y en la salida
 * (resultados). NUNCA mientras el alumno responde preguntas: ahi seria un "seductive detail"
 * —elemento atractivo pero irrelevante— y esos, segun Harp y Mayer (1998), PERJUDICAN el
 * aprendizaje porque desvian la atencion del contenido. La misma cara que motiva al entrar,
 * distrae en mitad de un reactivo de analisis.
 */
export type EstadoAvatar =
    | "idle" | "pensando" | "hablando" | "esperando" | "escuchando" | "feliz" | "triste";

export function AriaSvg({ estado }: { estado: EstadoAvatar }) {
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
