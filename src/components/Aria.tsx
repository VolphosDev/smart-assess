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

/**
 * Caras extra que solo usa la guía. Van en un tipo aparte y no dentro de `EstadoAvatar`
 * porque AvatarTutor declara `Record<EstadoAvatar, string>`: si se ampliara ese tipo, la
 * tutoría por voz dejaría de compilar hasta etiquetar caras que nunca muestra.
 */
export type ExpresionAria =
    | EstadoAvatar
    | "sorprendido" | "guino" | "emocionado" | "confundido" | "leyendo" | "celebrando" | "orgullosa";

interface AriaSvgProps {
    estado: ExpresionAria;
    /** Con clase, el tamaño lo decide el CSS; sin ella se mantiene el tamaño fijo de la tutoría. */
    className?: string;
    /** "cara" recorta cuerpo y libros para huecos pequeños (botón flotante, avatar). */
    recorte?: "completa" | "cara";
}

export function AriaSvg({ estado, className, recorte = "completa" }: AriaSvgProps) {
    const [bocaAbierta, setBocaAbierta] = useState(false);

    useEffect(() => {
        if (estado !== "hablando") { setBocaAbierta(false); return; }
        const id = setInterval(() => setBocaAbierta(v => !v), 160);
        return () => clearInterval(id);
    }, [estado]);

    const blush =
        estado === "feliz" || estado === "emocionado" || estado === "celebrando" ? 0.85
        : estado === "escuchando" || estado === "guino" || estado === "orgullosa" ? 0.6
        : 0.35;

    // Parpadeo solo con ojos abiertos y redondos: "parpadear" un arco cerrado no se ve y
    // unas estrellas encogiéndose parecen un fallo del dibujo.
    const parpadea = ["idle", "hablando", "esperando", "escuchando", "sorprendido", "confundido"].includes(estado);

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

    const Estrella = ({ cx, cy }: { cx: number; cy: number }) => {
        const puntos = Array.from({ length: 10 }, (_, i) => {
            const r = i % 2 === 0 ? 9 : 4;
            const a = (Math.PI / 5) * i - Math.PI / 2;
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(" ");
        return <polygon points={puntos} fill={GLASSES} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round"/>;
    };

    const Ojos = () => {
        if (estado === "sorprendido") return (
            <>
                <circle cx="33" cy="52" r="10" fill="white" stroke={OUTLINE} strokeWidth="1.6"/>
                <circle cx="33" cy="52" r="5.5" fill={OUTLINE}/>
                <circle cx="31" cy="50" r="1.8" fill="white"/>
                <circle cx="67" cy="52" r="10" fill="white" stroke={OUTLINE} strokeWidth="1.6"/>
                <circle cx="67" cy="52" r="5.5" fill={OUTLINE}/>
                <circle cx="65" cy="50" r="1.8" fill="white"/>
            </>
        );
        if (estado === "guino") return (
            <>
                <circle cx="33" cy="52" r="8.5" fill={OUTLINE}/>
                <circle cx="31" cy="49" r="2.5" fill="white"/>
                <circle cx="35" cy="55" r="1.2" fill="white"/>
                <path d="M59,53 Q67,45 75,53" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round"/>
            </>
        );
        if (estado === "emocionado") return (
            <>
                <Estrella cx={33} cy={52}/>
                <Estrella cx={67} cy={52}/>
            </>
        );
        if (estado === "confundido") return (
            <>
                <circle cx="33" cy="52" r="8.5" fill={OUTLINE}/>
                <circle cx="31" cy="49" r="2.5" fill="white"/>
                <circle cx="67" cy="53" r="6" fill={OUTLINE}/>
                <circle cx="65.5" cy="51" r="1.8" fill="white"/>
            </>
        );
        if (estado === "leyendo") return (
            <>
                {/* Mirada hacia abajo: medio ojo con el párpado bajado */}
                <path d="M24.5,54 A8.5,8.5 0 0 0 41.5,54 Z" fill={OUTLINE}/>
                <path d="M58.5,54 A8.5,8.5 0 0 0 75.5,54 Z" fill={OUTLINE}/>
                <circle cx="31" cy="57" r="1.4" fill="white"/>
                <circle cx="65" cy="57" r="1.4" fill="white"/>
                <line x1="24" y1="54" x2="42" y2="54" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round"/>
                <line x1="58" y1="54" x2="76" y2="54" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round"/>
            </>
        );
        if (estado === "orgullosa") return (
            <>
                <path d="M25,51 Q33,57 41,51" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M59,51 Q67,57 75,51" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round"/>
            </>
        );
        if (estado === "feliz" || estado === "celebrando") return (
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
        if (estado === "sorprendido") return (
            <>
                <path d="M24,37 Q33,32 42,37" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8"/>
                <path d="M58,37 Q67,32 76,37" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8"/>
            </>
        );
        if (estado === "confundido") return (
            <>
                <path d="M24,40 Q33,35 42,39" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85"/>
                <path d="M58,45 Q67,43 76,46" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85"/>
            </>
        );
        if (estado === "orgullosa" || estado === "guino") return (
            <>
                <path d="M24,41 Q33,37 42,41" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
                <path d="M58,40 Q67,35 76,40" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
            </>
        );
        if (estado === "feliz" || estado === "emocionado" || estado === "celebrando") return (
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
        if (estado === "emocionado" || estado === "celebrando") return (
            <>
                <Nariz/>
                <LineaNariz/>
                <path d="M43,65.5 Q50,79 57,65.5 Z" fill="#C06060" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M46.5,71 Q50,68.5 53.5,71 Q50,75 46.5,71 Z" fill="#F4A0C8"/>
            </>
        );
        if (estado === "sorprendido") return (
            <>
                <Nariz/>
                <ellipse cx="50" cy="69.5" rx="3.2" ry="4" fill="#C06060" stroke={OUTLINE} strokeWidth="1.5"/>
            </>
        );
        if (estado === "confundido") return (
            <>
                <Nariz/>
                <path d="M44,69 Q47,66 50,69 Q53,72 56,69" fill="none" stroke={MOUTH_C} strokeWidth="1.6" strokeLinecap="round"/>
            </>
        );
        if (estado === "guino" || estado === "orgullosa") return (
            <>
                <Nariz/>
                <LineaNariz/>
                <path d="M45,67 Q51,73 57,65" fill="none" stroke={MOUTH_C} strokeWidth="2" strokeLinecap="round"/>
            </>
        );
        if (estado === "leyendo") return (
            <>
                <Nariz/>
                <path d="M47,67 Q50,68.5 53,67" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
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
        if (estado === "feliz" || estado === "emocionado") return (
            <>
                <path d="M10 36 L11.5 31 L13 36 L18 37 L13 38 L11.5 43 L10 38 L5 37 Z" fill="#FFD700" opacity="0.9"/>
                <path d="M82 30 L83.5 25 L85 30 L90 31 L85 32 L83.5 37 L82 32 L77 31 Z" fill="#FFD700" opacity="0.9"/>
            </>
        );
        if (estado === "sorprendido") return (
            <g className="aria-rebote">
                <rect x="88" y="-4" width="4.5" height="13" rx="2.2" fill="#E76F51" stroke={OUTLINE} strokeWidth="1"/>
                <circle cx="90.2" cy="13.5" r="2.4" fill="#E76F51" stroke={OUTLINE} strokeWidth="1"/>
            </g>
        );
        if (estado === "confundido") return (
            <g className="aria-rebote">
                <path d="M83,2 Q83,-6 90,-6 Q97,-6 97,0 Q97,5 91,7 L91,11" fill="none" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="91" cy="16" r="2" fill="#7C3AED"/>
            </g>
        );
        if (estado === "guino") return (
            <path className="aria-destello" d="M86 36 L87.5 31 L89 36 L94 37.5 L89 39 L87.5 44 L86 39 L81 37.5 Z" fill="#FFD700" stroke={OUTLINE} strokeWidth="0.6"/>
        );
        if (estado === "leyendo") return (
            <>
                {/* Libro abierto sostenido delante del cuerpo */}
                <path d="M50,80 Q40,76 30,78 L30,93 Q40,91 50,95 Z" fill="#FFFDF9" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M50,80 Q60,76 70,78 L70,93 Q60,91 50,95 Z" fill="#FFFDF9" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round"/>
                <line x1="34" y1="83" x2="46" y2="84.5" stroke="#8D7B68" strokeWidth="1" strokeLinecap="round"/>
                <line x1="34" y1="87" x2="46" y2="88.5" stroke="#8D7B68" strokeWidth="1" strokeLinecap="round"/>
                <line x1="54" y1="84.5" x2="66" y2="83" stroke="#8D7B68" strokeWidth="1" strokeLinecap="round"/>
                <line x1="54" y1="88.5" x2="66" y2="87" stroke="#8D7B68" strokeWidth="1" strokeLinecap="round"/>
            </>
        );
        if (estado === "orgullosa") return (
            <>
                {/* Medalla */}
                <path d="M45,74 L50,84 L55,74" fill="none" stroke="#7C3AED" strokeWidth="3" strokeLinejoin="round"/>
                <circle cx="50" cy="87" r="5.5" fill={GLASSES} stroke={OUTLINE} strokeWidth="1.5"/>
                <path d="M50 84 L51 86.3 L53.4 86.5 L51.6 88 L52.2 90.4 L50 89.1 L47.8 90.4 L48.4 88 L46.6 86.5 L49 86.3 Z" fill="#FFFDF9"/>
            </>
        );
        if (estado === "celebrando") return (
            <g className="aria-confeti">
                <rect x="6" y="6" width="4" height="7" rx="1" fill="#E76F51" transform="rotate(-25 8 9)"/>
                <rect x="88" y="10" width="4" height="7" rx="1" fill="#2A9D8F" transform="rotate(30 90 13)"/>
                <rect x="20" y="-14" width="3.5" height="6" rx="1" fill="#7C3AED" transform="rotate(15 22 -11)"/>
                <rect x="74" y="-18" width="3.5" height="6" rx="1" fill="#FFB703" transform="rotate(-35 76 -15)"/>
                <circle cx="50" cy="-10" r="2.2" fill="#F4A0C8"/>
                <circle cx="36" cy="2" r="1.8" fill="#FFB703"/>
                <circle cx="64" cy="0" r="1.8" fill="#2A9D8F"/>
                <circle cx="95" cy="-4" r="1.8" fill="#E76F51"/>
                <circle cx="4" cy="-6" r="1.8" fill="#7C3AED"/>
                <path d="M10 36 L11.5 31 L13 36 L18 37 L13 38 L11.5 43 L10 38 L5 37 Z" fill="#FFD700" opacity="0.9"/>
            </g>
        );
        return null;
    };

    // El recorte "cara" encuadra la cabeza con un poco de aire para las orejas.
    const viewBox = recorte === "cara" ? "4 -2 92 82" : "0 -25 100 147";

    return (
        <svg
            {...(className ? { className } : { width: 260, height: 382 })}
            viewBox={viewBox}
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Aria, la tutora de Semantika"
        >
            <style>
                {`
                    @keyframes aria-parpadeo {
                        0%, 92%, 100% { transform: scaleY(1); }
                        95% { transform: scaleY(0.1); }
                    }
                    .aria-ojos-parpadean {
                        animation: aria-parpadeo 4.2s ease-in-out infinite;
                        transform-origin: 50px 52px;
                    }
                    @keyframes aria-rebote {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                    .aria-rebote { animation: aria-rebote 0.9s ease-in-out infinite; }
                    @keyframes aria-destello {
                        0%, 100% { opacity: 0.2; transform: scale(0.6); }
                        50% { opacity: 1; transform: scale(1); }
                    }
                    .aria-destello { animation: aria-destello 1.4s ease-in-out infinite; transform-origin: 87.5px 37.5px; }
                    @keyframes aria-confeti {
                        0% { transform: translateY(-4px); opacity: 0.6; }
                        50% { opacity: 1; }
                        100% { transform: translateY(4px); opacity: 0.6; }
                    }
                    .aria-confeti { animation: aria-confeti 1.1s ease-in-out infinite alternate; }
                    @media (prefers-reduced-motion: reduce) {
                        .aria-ojos-parpadean, .aria-rebote, .aria-destello, .aria-confeti, .swimming-fish { animation: none; }
                    }
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
            {recorte === "completa" && <Libros/>}
            <Base/>
            <g className={parpadea ? "aria-ojos-parpadean" : undefined}>
                <Ojos/>
            </g>
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
