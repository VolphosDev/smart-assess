import { useContext, useEffect, useState } from "react";
import { AccesoriosAriaContext, VarianteAriaContext, type VarianteAria } from "@/lib/ariaAccesorios";


export type EstadoAvatar =
    | "idle" | "pensando" | "hablando" | "esperando" | "escuchando" | "feliz" | "triste";

export type ExpresionAria =
    | EstadoAvatar
    | "sorprendido" | "guino" | "emocionado" | "confundido" | "leyendo" | "celebrando" | "orgullosa"
    | "durmiendo"
    // Gestos de los comodines y de la pista
    | "sopla" | "zarpa" | "invoca" | "idea";

/** Cara que usa cada gesto: el gesto agrega cuerpo y brazo, no redibuja los ojos. */
const ROSTRO_DEL_GESTO: Partial<Record<ExpresionAria, ExpresionAria>> = {
    sopla: "esperando", zarpa: "emocionado", invoca: "emocionado", idea: "guino",
};

interface AriaSvgProps {
    estado: ExpresionAria;
    /** Con clase, el tamaño lo decide el CSS; sin ella se mantiene el tamaño fijo de la tutoría. */
    className?: string;
    /** "cara" recorta cuerpo y libros para huecos pequeños (botón flotante, avatar). */
    recorte?: "completa" | "cara";
    /** Accesorios de la tienda. Sin la prop, se usan los que el alumno lleva puestos. */
    accesorios?: string[];
    /** Solo la cabeza (sin cuerpo, cola, corbatín ni bufanda): para montarla sobre otro cuerpo, como al caminar. */
    soloCabeza?: boolean;
    /** "clasica" (crema, para primaria), "nocturna" (gata tuxedo juvenil) o "perro". Sin la prop, la del alumno. */
    variante?: VarianteAria;
    /** false en miniaturas repetidas (catalogo de la tienda), donde tanto movimiento distrae. */
    vida?: boolean;
    /** Hacia donde dirige sus gestos: 1 a la derecha, -1 a la izquierda. */
    lado?: 1 | -1;
    /** Posicion y tamano dentro de otro SVG, para que la cabeza y su cuerpo sean un solo dibujo. */
    marco?: { x: number; y: number; width: number; height: number };
}

/**
 * Animacion de personaje. Sigue los principios de src/lib/movimiento.ts: anticipacion antes del
 * salto, aplastar y estirar, y la cabeza con un leve retraso sobre el cuerpo (accion secundaria).
 * --e es la energia del personaje: la misma coreografia, mas contenida en la juvenil.
 */
const ESTILOS_VIDA = `
    .aria-vida-cuerpo, .aria-rx-cuerpo { transform-box: view-box; transform-origin: 50px 96px; }
    .aria-vida-cabeza, .aria-rx-cabeza, .aria-habla-cabeza { transform-box: view-box; transform-origin: 50px 74px; }
    .aria-vida-cuerpo { animation: aria-respira 3.4s ease-in-out infinite; }
    .aria-vida-cabeza { animation: aria-flota 3.4s ease-in-out -0.45s infinite; }
    .aria-habla-cabeza { animation: aria-asiente .62s ease-in-out infinite alternate; }
    @keyframes aria-respira { 0%,100% { transform: scale(1,1); } 50% { transform: scale(calc(1 - var(--e)*.008), calc(1 + var(--e)*.024)); } }
    @keyframes aria-flota { 0%,100% { transform: translateY(0) rotate(calc(var(--e)*-.9deg)); } 50% { transform: translateY(calc(var(--e)*-.9px)) rotate(calc(var(--e)*.9deg)); } }
    @keyframes aria-asiente { from { transform: translateY(0) rotate(calc(var(--e)*-2.2deg)); } to { transform: translateY(calc(var(--e)*1.2px)) rotate(calc(var(--e)*2.2deg)); } }

    .aria-oreja-i { transform-box: view-box; transform-origin: 26px 28px; animation: aria-oreja 5.3s linear infinite; }
    .aria-oreja-d { transform-box: view-box; transform-origin: 74px 28px; animation: aria-oreja 6.7s linear -2.1s infinite; }
    @keyframes aria-oreja { 0%,91%,100% { transform: rotate(0); } 93% { transform: rotate(-9deg); } 95% { transform: rotate(4deg); } 97% { transform: rotate(-3deg); } }

    .aria-mirada { transition: transform .13s ease-out; }
    .aria-parpado-rapido { transform-box: view-box; transform-origin: 50px 52px; animation: aria-cierra .15s ease-in-out; }
    @keyframes aria-cierra { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.08); } }

    /* El cambio de cara se esconde en un parpadeo: es como los animadores disimulan el relevo. */
    .aria-cara-entra { transform-box: view-box; transform-origin: 50px 54px; animation: aria-cara .17s cubic-bezier(.2,.9,.3,1.3); }
    .aria-boca-entra { transform-box: view-box; transform-origin: 50px 68px; animation: aria-cara .17s cubic-bezier(.2,.9,.3,1.3); }
    @keyframes aria-cara { from { transform: scaleY(.12); } to { transform: scaleY(1); } }
    .aria-extra-entra { transform-box: fill-box; transform-origin: center; animation: aria-extra .32s cubic-bezier(.2,.9,.3,1.5); }
    @keyframes aria-extra { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .aria-rx-cuerpo-feliz { animation: rx-salto .78s both; }
    .aria-rx-cabeza-feliz { animation: rx-cabeza-salto .78s .05s both; }
    .aria-rx-cuerpo-celebrando { animation: rx-salto .66s 3 both; }
    .aria-rx-cabeza-celebrando { animation: rx-cabeza-salto .66s .05s 3 both; }
    .aria-rx-cuerpo-emocionado { animation: rx-brinco .4s 2 both; }
    .aria-rx-cabeza-emocionado { animation: rx-cabeza-brinco .4s .04s 2 both; }
    .aria-rx-cuerpo-sorprendido { animation: rx-susto .5s both; }
    .aria-rx-cabeza-sorprendido { animation: rx-cabeza-susto .5s .03s both; }
    .aria-rx-cuerpo-triste { animation: rx-desinfla .75s ease-out forwards; }
    .aria-rx-cabeza-triste { animation: rx-cabeza-baja .85s .08s ease-out forwards; }
    .aria-rx-cabeza-pensando, .aria-rx-cabeza-confundido { animation: rx-ladea .55s cubic-bezier(.3,1.3,.5,1) forwards; }
    .aria-rx-cabeza-guino { animation: rx-guino .55s cubic-bezier(.3,1.4,.5,1) both; }
    .aria-rx-cuerpo-orgullosa { animation: rx-pecho .7s cubic-bezier(.3,1.4,.5,1) forwards; }
    .aria-rx-cabeza-orgullosa { animation: rx-alza .7s .05s cubic-bezier(.3,1.4,.5,1) forwards; }
    .aria-rx-cabeza-durmiendo { animation: rx-duerme 1.3s ease-in-out forwards; }
    .aria-rx-cuerpo-durmiendo { animation: rx-desinfla 1.3s ease-in-out forwards; }

    @keyframes rx-salto {
        0% { transform: none; animation-timing-function: ease-out; }
        20% { transform: scale(calc(1 + var(--e)*.09), calc(1 - var(--e)*.13)); animation-timing-function: cubic-bezier(.2,.7,.3,1); }
        50% { transform: translateY(calc(var(--e)*-11px)) scale(calc(1 - var(--e)*.07), calc(1 + var(--e)*.11)); animation-timing-function: cubic-bezier(.6,0,.9,.5); }
        74% { transform: scale(calc(1 + var(--e)*.1), calc(1 - var(--e)*.12)); animation-timing-function: ease-out; }
        88% { transform: scale(calc(1 - var(--e)*.02), calc(1 + var(--e)*.03)); }
        100% { transform: none; }
    }
    @keyframes rx-cabeza-salto {
        0% { transform: none; }
        20% { transform: translateY(calc(var(--e)*3px)) rotate(calc(var(--e)*-3deg)); }
        50% { transform: translateY(calc(var(--e)*-12px)) rotate(calc(var(--e)*4deg)); }
        74% { transform: translateY(calc(var(--e)*3px)) rotate(calc(var(--e)*-2deg)); }
        100% { transform: none; }
    }
    @keyframes rx-brinco { 0%,100% { transform: none; } 30% { transform: scale(calc(1 + var(--e)*.05), calc(1 - var(--e)*.08)); } 62% { transform: translateY(calc(var(--e)*-5px)) scale(calc(1 - var(--e)*.03), calc(1 + var(--e)*.06)); } }
    @keyframes rx-cabeza-brinco { 0%,100% { transform: none; } 62% { transform: translateY(calc(var(--e)*-6px)) rotate(calc(var(--e)*2deg)); } }
    @keyframes rx-susto { 0% { transform: none; } 22% { transform: translateY(calc(var(--e)*-4px)) scale(calc(1 - var(--e)*.06), calc(1 + var(--e)*.12)); } 60% { transform: scale(calc(1 + var(--e)*.03), calc(1 - var(--e)*.04)); } 100% { transform: none; } }
    @keyframes rx-cabeza-susto { 0% { transform: none; } 22% { transform: translateY(calc(var(--e)*-7px)) scale(1.04); } 100% { transform: none; } }
    @keyframes rx-desinfla { to { transform: scale(calc(1 + var(--e)*.03), calc(1 - var(--e)*.06)); } }
    @keyframes rx-cabeza-baja { to { transform: translateY(calc(var(--e)*4px)) rotate(calc(var(--e)*-5deg)); } }
    @keyframes rx-ladea { to { transform: translateY(calc(var(--e)*.5px)) rotate(calc(var(--e)*-8deg)); } }
    @keyframes rx-guino { 0%,100% { transform: none; } 45% { transform: rotate(calc(var(--e)*9deg)); } }
    @keyframes rx-pecho { to { transform: scale(calc(1 + var(--e)*.03), calc(1 + var(--e)*.04)); } }
    @keyframes rx-alza { to { transform: translateY(calc(var(--e)*-2.5px)) rotate(calc(var(--e)*3deg)); } }
    @keyframes rx-duerme { to { transform: translateY(calc(var(--e)*6px)) rotate(calc(var(--e)*7deg)); } }


    /* Orejas caídas del perrito: se balancean con retraso respecto a la cabeza. */
    .aria-caida-i { transform-box: view-box; transform-origin: 24px 26px; animation: aria-caida 3.4s ease-in-out infinite; }
    .aria-caida-d { transform-box: view-box; transform-origin: 76px 26px; animation: aria-caida 3.4s ease-in-out -1.7s infinite; }
    @keyframes aria-caida { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
    .aria-rx-cabeza-feliz .aria-caida-i, .aria-rx-cabeza-feliz .aria-caida-d,
    .aria-rx-cabeza-celebrando .aria-caida-i, .aria-rx-cabeza-celebrando .aria-caida-d,
    .aria-rx-cabeza-emocionado .aria-caida-i, .aria-rx-cabeza-emocionado .aria-caida-d { animation: aria-aleteo .39s ease-in-out .08s 2; }
    @keyframes aria-aleteo { 0%,100% { transform: rotate(0); } 35% { transform: rotate(-16deg); } 70% { transform: rotate(12deg); } }

    /* Gestos de los comodines. Sus tiempos van atados al efecto de AriaComodin. --d es el lado. */
    .aria-rx-cuerpo-sopla { animation: rx-toma-aire 1.05s both; }
    .aria-rx-cabeza-sopla { animation: rx-cabeza-sopla 1.05s both; }
    .aria-mejillas { transform-box: fill-box; transform-origin: center; animation: rx-mejillas 1.05s both; }
    @keyframes rx-toma-aire { 0%,100% { transform: none; } 24% { transform: scale(calc(1 + var(--e)*.05), calc(1 + var(--e)*.07)); } 38%,72% { transform: scale(calc(1 + var(--e)*.05), calc(1 - var(--e)*.06)); } }
    @keyframes rx-cabeza-sopla { 0%,100% { transform: none; } 24% { transform: translateY(calc(var(--e)*-2px)) rotate(calc(var(--d)*var(--e)*-9deg)); } 38%,72% { transform: translate(calc(var(--d)*var(--e)*3px),1px) rotate(calc(var(--d)*var(--e)*8deg)); } }
    @keyframes rx-mejillas { 0% { transform: scale(0); } 24%,66% { transform: scale(1); } 80%,100% { transform: scale(0); } }

    .aria-rx-cabeza-zarpa { animation: rx-cabeza-zarpa 1.05s both; }
    @keyframes rx-cabeza-zarpa { 0%,100% { transform: none; } 20% { transform: rotate(calc(var(--d)*var(--e)*-8deg)); } 34%,60% { transform: rotate(calc(var(--d)*var(--e)*7deg)); } }
    .aria-brazo { transform-box: view-box; transform-origin: 66px 84px; }
    .aria-brazo-zarpa { animation: brazo-zarpa 1.05s both; }
    .aria-brazo-invoca { animation: brazo-invoca 1.05s both; }
    .aria-brazo-idea { animation: brazo-idea .55s cubic-bezier(.3,1.5,.5,1) both; }
    @keyframes brazo-zarpa {
        0% { transform: rotate(85deg) scale(.55); opacity: 0; }
        8% { opacity: 1; }
        21% { transform: rotate(-38deg) scale(1.08); animation-timing-function: cubic-bezier(.7,0,.9,.5); }
        32% { transform: rotate(56deg) scale(1.1); }
        62% { transform: rotate(48deg) scale(1.02); opacity: 1; }
        100% { transform: rotate(92deg) scale(.55); opacity: 0; }
    }
    @keyframes brazo-invoca {
        0% { transform: rotate(80deg) scale(.6); opacity: 0; }
        8% { opacity: 1; }
        24% { transform: rotate(-14deg) scale(1.12); }
        38% { transform: rotate(-6deg) scale(1.05); }
        50% { transform: rotate(-16deg) scale(1.12); }
        62% { transform: rotate(-6deg) scale(1.05); }
        78% { transform: rotate(-12deg) scale(1.08); opacity: 1; }
        100% { transform: rotate(80deg) scale(.6); opacity: 0; }
    }
    @keyframes brazo-idea { from { transform: rotate(80deg) scale(.6); opacity: 0; } to { transform: rotate(-10deg) scale(1); opacity: 1; } }
    .aria-rx-cuerpo-invoca { animation: rx-estira 1.05s both; }
    .aria-rx-cabeza-invoca { animation: rx-mira-arriba 1.05s both; }
    .aria-rx-cabeza-idea { animation: rx-alza .5s cubic-bezier(.3,1.4,.5,1) forwards; }
    @keyframes rx-estira { 0%,100% { transform: none; } 12% { transform: scale(calc(1 + var(--e)*.05), calc(1 - var(--e)*.09)); } 28%,75% { transform: translateY(calc(var(--e)*-3px)) scale(calc(1 - var(--e)*.03), calc(1 + var(--e)*.08)); } }
    @keyframes rx-mira-arriba { 0%,100% { transform: none; } 28%,75% { transform: translateY(calc(var(--e)*-4px)) rotate(calc(var(--d)*var(--e)*-6deg)); } }
    .aria-foco { transform-box: fill-box; transform-origin: center bottom; animation: aria-foco .5s .12s cubic-bezier(.2,1.6,.4,1) both; }
    @keyframes aria-foco { from { transform: scale(0); } to { transform: scale(1); } }
    .aria-foco-brillo { transform-box: fill-box; transform-origin: center; animation: aria-brillo 1.3s ease-in-out .5s infinite; }
    @keyframes aria-brillo { 0%,100% { transform: scale(.85); opacity: .35; } 50% { transform: scale(1.2); opacity: .8; } }

    @media (prefers-reduced-motion: reduce) {
        .aria-caida-i, .aria-caida-d, .aria-brazo-idea, .aria-foco, .aria-foco-brillo { animation: none; }
        .aria-vida-cuerpo, .aria-vida-cabeza, .aria-habla-cabeza, .aria-oreja-i, .aria-oreja-d, .aria-parpado-rapido,
        .aria-cara-entra, .aria-boca-entra, .aria-extra-entra, [class*="aria-rx-"] { animation: none; }
    }
`;

export function AriaSvg({ estado: estadoPedido, className, recorte = "completa", accesorios, soloCabeza = false, variante, vida = true, lado = 1, marco }: AriaSvgProps) {
    const estado: ExpresionAria = ROSTRO_DEL_GESTO[estadoPedido] ?? estadoPedido;
    // 0 cerrada, 1 entreabierta, 2 abierta
    const [apertura, setApertura] = useState<0 | 1 | 2>(0);
    const [parpado, setParpado] = useState(false);
    const [mirada, setMirada] = useState(0);
    const delAlumno = useContext(AccesoriosAriaContext);
    const puestos = accesorios ?? delAlumno;
    const dorada = puestos.includes("dorada");
    const varianteDelAlumno = useContext(VarianteAriaContext);
    // La dorada manda sobre la variante: es un artículo comprado.
    const nocturna = (variante ?? varianteDelAlumno) === "nocturna" && !dorada;
    const perro = (variante ?? varianteDelAlumno) === "perro" && !dorada;
    const cabeza = ["corona", "gorro", "audifonos"].find((a) => puestos.includes(a));

    // La boca sigue a la voz cuando el navegador avisa de cada palabra; si no avisa (algunas voces
    // en linea no lo hacen), habla con un patron irregular en vez de abrir y cerrar como un metronomo.
    useEffect(() => {
        if (estado !== "hablando") { setApertura(0); return; }
        let pulsos = 0;
        let ultimaPalabra = 0;
        let abierta = false;
        const alPalabra = (e: Event) => {
            pulsos += Math.max(1, Math.round(((e as CustomEvent<number>).detail || 4) / 2.6));
            ultimaPalabra = Date.now();
        };
        const abrir = () => { abierta = true; setApertura(Math.random() < 0.38 ? 2 : 1); };
        window.addEventListener("semantika:aria-palabra", alPalabra);
        const id = setInterval(() => {
            if (abierta) { abierta = false; setApertura(0); return; }
            if (pulsos > 0) { pulsos--; abrir(); return; }
            if (Date.now() - ultimaPalabra > 1200 && Math.random() < 0.78) abrir();
        }, 95);
        return () => { clearInterval(id); window.removeEventListener("semantika:aria-palabra", alPalabra); };
    }, [estado]);

    const blush =
        estado === "feliz" || estado === "emocionado" || estado === "celebrando" ? 0.85
        : estado === "escuchando" || estado === "guino" || estado === "orgullosa" ? 0.6
        : 0.35;

    // Parpadeo solo con ojos abiertos y redondos: "parpadear" un arco cerrado no se ve y
    // unas estrellas encogiéndose parecen un fallo del dibujo.
    const parpadea = ["idle", "hablando", "esperando", "escuchando", "sorprendido", "confundido"].includes(estado);

    // Las miniaturas y la cabeza montada en AriaCaminando no se animan: esa ya trae su propio movimiento.
    const animada = !soloCabeza && recorte === "completa" && vida;

    // Parpadeo a intervalos irregulares, a veces doble: el ciclo fijo es lo que se nota mecanico.
    useEffect(() => {
        if (!animada || !parpadea) return;
        let t: ReturnType<typeof setTimeout>;
        const cerrar = (despues: () => void) => {
            setParpado(true);
            t = setTimeout(() => { setParpado(false); t = setTimeout(despues, 90); }, 160);
        };
        const programar = () => {
            t = setTimeout(() => cerrar(() => (Math.random() < 0.22 ? cerrar(programar) : programar())), 1900 + Math.random() * 3800);
        };
        programar();
        return () => clearTimeout(t);
    }, [animada, parpadea]);

    // De vez en cuando mira a un lado.
    useEffect(() => {
        if (!animada || !parpadea || estado === "hablando") { setMirada(0); return; }
        let t: ReturnType<typeof setTimeout>;
        const mover = () => {
            t = setTimeout(() => {
                setMirada([-1.7, 1.7, 0, 0][Math.floor(Math.random() * 4)]);
                mover();
            }, 1400 + Math.random() * 2600);
        };
        mover();
        return () => clearTimeout(t);
    }, [animada, parpadea, estado]);


    const COLA = "M63,92 C76,94.5 86.5,88 84.6,76.5 C83.6,70.5 86.4,66.2 91,66.6";
    const colaClase = (() => {
        switch (estado) {
            case "feliz": case "emocionado": case "celebrando": return "aria-cola aria-cola-feliz";
            case "sorprendido": return "aria-cola aria-cola-susto";
            case "triste": return "aria-cola aria-cola-triste";
            case "pensando": case "confundido": return "aria-cola aria-cola-duda";
            case "hablando": return "aria-cola aria-cola-habla";
            case "orgullosa": return "aria-cola aria-cola-orgullo";
            case "guino": return "aria-cola aria-cola-guino";
            default: return "aria-cola aria-cola-calma";
        }
    })();
    // Erizada con el susto: el mismo trazo, más grueso.
    const colaGrosor = estado === "sorprendido" ? 6.6 : 4.6;


    // "Aria dorada" (el artículo más caro de la tienda) solo cambia la paleta del pelaje.
    // Variante nocturna: pelaje negro con un tinte violeta (no negro puro, que se ve plano),
    // lentes plateados y orejas apagadas. Más sobria, pensada para secundaria.
    const FUR       = dorada ? "#FCD34D" : nocturna ? "#26222E" : perro ? "#E9A85C" : "#FBF3EA"; // pelaje
    const FUR_LIGHT = dorada ? "#FEF3C7" : perro ? "#FFF4E3" : "#FFFFFF"; // hocico (en la juvenil, máscara blanca de gata tuxedo)
    const FUR_DARK  = dorada ? "#D97706" : nocturna ? "#3A3444" : perro ? "#C47F3E" : "#C2A38C"; // rayas suaves
    const OREJA_PERRO = "#8A5230";
    const OUTLINE   = nocturna ? "#0F0B15" : "#2B2140"; // contorno
    const EAR_IN    = nocturna ? "#E8A0BF" : "#F9A8D4"; // interior de la oreja
    const AMBAR     = "#F5B73B";                      // ojos de la juvenil
    const TRAZO_CLARO = "#F3E8FF";                    // líneas de la cara sobre pelaje negro
    const GLASSES   = nocturna ? "#CBD5E1" : "#7C3AED"; // lentes: plateados o violeta de la marca
    const CORBATIN  = nocturna ? "#475569" : "#8B5CF6";
    const CORBATIN_HONDO = nocturna ? "#334155" : "#6D28D9";
    const CORBATIN_LUZ = nocturna ? "#94A3B8" : "#C4B5FD";
    const ORO       = "#FBBF24"; // borla, estrellas, medalla
    const INDIGO    = "#4338CA";
    const NOSE      = nocturna ? "#E8799F" : "#2B2140";
    const COLA_PERRO = "M63,91 C72,91 79,86 80,77 C80.5,73 83,71 86,71.5";
    const MOUTH_C   = "#2B2140";

    const Orejas = () => (
        <>
            {!perro && <>
            <g className={animada ? "aria-oreja-i" : undefined}>
                <path d="M20,32 Q12,12 18,2 Q28,4 34,20 Z" fill={FUR} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M22,29 Q16,15 20,6 Q26,8 29,20 Z" fill={EAR_IN}/>
            </g>
            <g className={animada ? "aria-oreja-d" : undefined}>
                <path d="M80,32 Q88,12 82,2 Q72,4 66,20 Z" fill={FUR} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M78,29 Q84,15 80,6 Q74,8 71,20 Z" fill={EAR_IN}/>
            </g>
            </>}


        </>
    );

    const Cuerpo = () => (
        <>
            {!soloCabeza && perro && <g className={colaClase}>
                <path d={COLA_PERRO} fill="none" stroke={OUTLINE} strokeWidth={colaGrosor + 4.4} strokeLinecap="round" strokeLinejoin="round"/>
                <path d={COLA_PERRO} fill="none" stroke={FUR} strokeWidth={colaGrosor + 1} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M82,72.4 C83.5,71.4 84.8,71.3 86,71.5" fill="none" stroke={FUR_LIGHT} strokeWidth={colaGrosor + 1} strokeLinecap="round"/>
            </g>}
            {!soloCabeza && !perro && <g className={colaClase}>
                <path d={COLA} fill="none" stroke={OUTLINE} strokeWidth={colaGrosor + 3.4} strokeLinecap="round" strokeLinejoin="round"/>
                <path d={COLA} fill="none" stroke={FUR} strokeWidth={colaGrosor} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M86.6,69.2 C87.6,66.4 89.6,65.4 91.2,66.6" fill="none" stroke={FUR_DARK} strokeWidth={colaGrosor} strokeLinecap="round"/>
                <path d="M83.4,78 C84.6,77.4 85.8,77.6 86.4,78.4" fill="none" stroke={FUR_DARK} strokeWidth="1.6" strokeLinecap="round" opacity="0.8"/>
            </g>}

            {/* Cuerpo */}
            {!soloCabeza && <>
            <path d="M32,96 C29,80 34,74 50,74 C66,74 71,80 68,96 Z" fill={nocturna ? "#3F4A5E" : FUR} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            {nocturna && (
                <>
                    {/* Polerón: capucha detrás del cuello, cordones y bolsillo canguro */}
                    <path d="M33,77 Q50,69 67,77 L65,82 Q50,75 35,82 Z" fill="#556178" stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round"/>
                    <path d="M46,79 L45,88 M54,79 L55,88" stroke="#F8FAFC" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="45" cy="88.5" r="1.1" fill="#F8FAFC"/><circle cx="55" cy="88.5" r="1.1" fill="#F8FAFC"/>
                    <path d="M40,89 Q50,86 60,89 L59,95 L41,95 Z" fill="#4B5770" stroke={OUTLINE} strokeWidth="1.1" strokeLinejoin="round"/>
                </>
            )}

            {perro && <ellipse cx="50" cy="87" rx="9" ry="8" fill={FUR_LIGHT}/>}

            {/* Paticas */}
            <ellipse cx="42" cy="95" rx="4.5" ry="2.5" fill={nocturna ? "#FFFFFF" : perro ? FUR_LIGHT : FUR} stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="42" y1="93" x2="42" y2="97" stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="58" cy="95" rx="4.5" ry="2.5" fill={nocturna ? "#FFFFFF" : perro ? FUR_LIGHT : FUR} stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="58" y1="93" x2="58" y2="97" stroke={OUTLINE} strokeWidth="1"/>
            </>}

        </>
    );

    const CabezaBase = () => (
        <>
            {/* Cabeza */}
            <ellipse cx="50" cy="46" rx="34" ry="29" fill={FUR} stroke={OUTLINE} strokeWidth="1.8"/>

            {/* Zona del hocico (más clara) */}
            {perro ? (
                <>
                    <path d="M45.5,28 Q50,24 54.5,28 L57,50 L43,50 Z" fill={FUR_LIGHT}/>
                    <ellipse cx="50" cy="62" rx="19" ry="12.5" fill={FUR_LIGHT}/>
                    {/* Mancha café alrededor de un ojo: lo que lo hace reconocible */}
                    <ellipse cx="33" cy="51" rx="12.5" ry="11.5" fill={FUR_DARK}/>
                    {/* Orejas caídas */}
                    <g className={animada ? "aria-caida-i" : undefined}>
                        <path d="M24,24 C12,26 6,42 9,58 C11,66 19,66 22,58 C24,48 26,36 30,28 Z" fill={OREJA_PERRO} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M15,40 C12,48 12,55 14,60" fill="none" stroke="#A9683E" strokeWidth="2" strokeLinecap="round"/>
                    </g>
                    <g className={animada ? "aria-caida-d" : undefined}>
                        <path d="M76,24 C88,26 94,42 91,58 C89,66 81,66 78,58 C76,48 74,36 70,28 Z" fill={OREJA_PERRO} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M85,40 C88,48 88,55 86,60" fill="none" stroke="#A9683E" strokeWidth="2" strokeLinecap="round"/>
                    </g>
                </>
            ) : nocturna
                ? <path d="M50,45 C45,45 42,50 40,54 C31,56 28,66 34,71 C40,76.5 60,76.5 66,71 C72,66 69,56 60,54 C58,50 55,45 50,45 Z" fill={FUR_LIGHT}/>
                : <ellipse cx="50" cy="58" rx="16" ry="11" fill={FUR_LIGHT}/>}

            {!perro && <>
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
            </>}

            {/* Sombra suave bajo la cabeza: le da volumen sin cambiar el estilo plano */}
            <ellipse cx="50" cy="73" rx="17" ry="3" fill={OUTLINE} opacity="0.08"/>

        </>
    );

    const Cuello = () => (
        <>
            {/* Corbatín violeta (la juvenil lleva polerón) */}
            {!soloCabeza && perro && <>
            <path d="M33,74 Q50,81 67,74 L51,93 Q50,94.5 49,93 Z" fill="#EF4444" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="42" cy="79" r="1.2" fill="white"/><circle cx="50" cy="84" r="1.2" fill="white"/>
            <circle cx="57" cy="79" r="1.2" fill="white"/><circle cx="50" cy="90" r="0.9" fill="white"/>
            </>}
            {!soloCabeza && !nocturna && !perro && <>
            <path d="M50,79 L40.5,74 L40.5,84 Z" fill={CORBATIN} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M50,79 L59.5,74 L59.5,84 Z" fill={CORBATIN} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M42.5,76.5 L46,78.5" stroke={CORBATIN_LUZ} strokeWidth="1" strokeLinecap="round"/>
            <circle cx="50" cy="79" r="2.5" fill={CORBATIN_HONDO} stroke={OUTLINE} strokeWidth="1.2"/>
            </>}
        </>
    );

    /* Birrete: el detalle que la hace "estudiosa" de un vistazo, incluso en miniatura. */
    const Birrete = () => (
        <>
            <path d="M36,15 L36,21.5 Q50,27 64,21.5 L64,15 Z" fill="#312E81" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M50,3.5 L79,12.5 L50,21.5 L21,12.5 Z" fill={INDIGO} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M50,6 L71,12.5 L50,13.5 L29,12.5 Z" fill="#818CF8" opacity="0.45"/>
            <circle cx="50" cy="12.5" r="1.9" fill={ORO} stroke={OUTLINE} strokeWidth="0.8"/>
            <path d="M50,12.5 Q66,13.5 74.5,15.5 L75.5,24" fill="none" stroke={ORO} strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M73,23.5 L78,23.5 L79,31 L72,31 Z" fill={ORO} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round"/>
        </>
    );

    /* Accesorios de la tienda. Los de cabeza reemplazan al birrete; la bufanda tapa el corbatín. */
    const Gorro = () => (
        <>
            <path d="M19,31 C18,6 82,6 81,31 Z" fill="#EF4444" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <rect x="17" y="24" width="66" height="9" rx="4.5" fill="#FCA5A5" stroke={OUTLINE} strokeWidth="1.6"/>
            <path d="M27,24 V33 M37,24 V33 M47,24 V33 M57,24 V33 M67,24 V33 M77,24 V33" stroke="#EF4444" strokeWidth="1.2" opacity="0.6"/>
            <circle cx="50" cy="6" r="6" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="1.6"/>
        </>
    );
    const Audifonos = () => (
        <>
            <path d="M15,44 C13,4 87,4 85,44" fill="none" stroke={OUTLINE} strokeWidth="6" strokeLinecap="round"/>
            <path d="M15,44 C13,4 87,4 85,44" fill="none" stroke="#4B5563" strokeWidth="3.4" strokeLinecap="round"/>
            <rect x="8" y="36" width="12" height="20" rx="5" fill="#7C3AED" stroke={OUTLINE} strokeWidth="1.8"/>
            <rect x="80" y="36" width="12" height="20" rx="5" fill="#7C3AED" stroke={OUTLINE} strokeWidth="1.8"/>
            <rect x="11" y="40" width="3" height="12" rx="1.5" fill="#C4B5FD"/>
            <rect x="86" y="40" width="3" height="12" rx="1.5" fill="#C4B5FD"/>
        </>
    );
    const Corona = () => (
        <>
            <path d="M30,24 L28,7 L38,15 L44,2 L50,13 L56,2 L62,15 L72,7 L70,24 Q50,28 30,24 Z"
                  fill={ORO} stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="50" cy="20" r="2.6" fill="#EC4899" stroke={OUTLINE} strokeWidth="0.9"/>
            <circle cx="39" cy="20.5" r="1.8" fill="#38BDF8" stroke={OUTLINE} strokeWidth="0.8"/>
            <circle cx="61" cy="20.5" r="1.8" fill="#22C55E" stroke={OUTLINE} strokeWidth="0.8"/>
        </>
    );
    const Bufanda = () => (
        <>
            <path d="M58,80 L61,97 L69,95 L64,79 Z" fill="#DC2626" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M29,72 Q50,81 71,72 L72,80 Q50,90 28,80 Z" fill="#EF4444" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M36,76 L36,84 M50,79 L50,87 M64,76 L64,84" stroke="#FCA5A5" strokeWidth="1.6" strokeLinecap="round"/>
        </>
    );
    /* Gorro de lana gris: lo que lleva por defecto la variante nocturna, en lugar del birrete. */
    const GorroGris = () => (
        <>
            {/* Gorro de lana caído hacia atrás, estilo juvenil, con un parche dorado */}
            <path d="M18,30 C15,8 58,-2 80,12 C88,17 88,26 83,31 Z" fill="#0F766E" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M30,14 Q48,6 66,10" fill="none" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" opacity="0.8"/>
            <path d="M16,25 Q50,19 84,25 L84,33 Q50,27 16,33 Z" fill="#14B8A6" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M24,24 V32 M34,22.6 V30.6 M44,21.8 V29.8 M56,21.8 V29.8 M66,22.6 V30.6 M76,24 V32" stroke="#0F766E" strokeWidth="1.1" opacity="0.6"/>
            <rect x="63" y="13" width="9" height="6.5" rx="1.6" fill="#FBBF24" stroke={OUTLINE} strokeWidth="1.1" transform="rotate(12 67.5 16)"/>
        </>
    );
    const GorroPerro = () => (
        <>
            <path d="M19,31 C17,7 83,7 81,31 Z" fill="#1E3A8A" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M23,19 Q50,10 77,19" fill="none" stroke="#F97316" strokeWidth="3.4" strokeLinecap="round"/>
            <rect x="16" y="24" width="68" height="9" rx="4.5" fill="#3B82F6" stroke={OUTLINE} strokeWidth="1.6"/>
            <path d="M26,24 V33 M36,24 V33 M46,24 V33 M56,24 V33 M66,24 V33 M76,24 V33" stroke="#1E3A8A" strokeWidth="1.1" opacity="0.55"/>
            <circle cx="50" cy="6.5" r="5.5" fill="#F97316" stroke={OUTLINE} strokeWidth="1.6"/>
        </>
    );
    const SobreCabeza = () =>
        cabeza === "gorro" ? Gorro() : cabeza === "audifonos" ? Audifonos() : cabeza === "corona" ? Corona()
            : nocturna ? GorroGris() : perro ? GorroPerro() : Birrete();

    const Libros = () => (
        <>
            {/* Libro 1 (abajo, índigo) */}
            <rect x="15" y="111" width="70" height="9" rx="2" fill="#4F46E5" stroke={OUTLINE} strokeWidth="1.8"/>
            <rect x="78" y="112.5" width="5" height="6" rx="0.8" fill="#F5F3FF"/>
            <line x1="22" y1="111" x2="22" y2="120" stroke="#A5B4FC" strokeWidth="1.4"/>

            {/* Libro 2 (medio, esmeralda) */}
            <rect x="18" y="103" width="64" height="8" rx="2" fill="#10B981" stroke={OUTLINE} strokeWidth="1.8"/>
            <rect x="75" y="104.5" width="5" height="5" rx="0.8" fill="#ECFDF5"/>
            <line x1="25" y1="103" x2="25" y2="111" stroke="#A7F3D0" strokeWidth="1.4"/>

            {/* Libro 3 (arriba, rosa) con cinta marcapáginas */}
            <rect x="22" y="96" width="56" height="7" rx="1.5" fill="#EC4899" stroke={OUTLINE} strokeWidth="1.8"/>
            <line x1="29" y1="96" x2="29" y2="103" stroke="#FBCFE8" strokeWidth="1.4"/>
            <path d="M64,103 L64,108 L66,106.5 L68,108 L68,103" fill={ORO} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round"/>
        </>
    );

    /* La juvenil va sobre su skate, con la mochila de cuadernos al lado (en vez de la pila de libros). */
    const Skate = () => (
        <>
            {/* Mochila con dos cuadernos asomando */}
            <rect x="17" y="73" width="7" height="12" rx="1" fill="#38BDF8" stroke={OUTLINE} strokeWidth="1.2" transform="rotate(-12 20.5 79)"/>
            <rect x="22" y="72" width="7" height="12" rx="1" fill="#A3E635" stroke={OUTLINE} strokeWidth="1.2" transform="rotate(8 25.5 78)"/>
            <path d="M18.5,74.5 v1.5 M18,77.5 v1.5 M17.6,80.5 v1.5" stroke={OUTLINE} strokeWidth="0.9" strokeLinecap="round" transform="rotate(-12 20.5 79)"/>
            <path d="M18,79 Q22.5,71 27,79" fill="none" stroke={OUTLINE} strokeWidth="1.6" strokeLinecap="round"/>
            <rect x="12" y="78" width="21" height="19" rx="6" fill="#FB7185" stroke={OUTLINE} strokeWidth="1.8"/>
            <rect x="15.5" y="86" width="14" height="8.5" rx="3" fill="#F43F5E" stroke={OUTLINE} strokeWidth="1.3"/>
            <path d="M15.5,89.5 H29.5" stroke={OUTLINE} strokeWidth="0.9" opacity="0.6"/>
            <circle cx="22.5" cy="82.3" r="1.7" fill="#FDE68A" stroke={OUTLINE} strokeWidth="0.8"/>

            {/* Tabla con las puntas levantadas, lija arriba y stickers */}
            <path d="M14,97 L86,97 Q92,97 94.5,91.5 L96.5,92.5 Q94.5,101.5 86,101.5 L14,101.5 Q5.5,101.5 3.5,92.5 L5.5,91.5 Q8,97 14,97 Z"
                  fill="#7C3AED" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M8,97.6 L92,97.6" stroke="#1F1B2B" strokeWidth="1.3" opacity="0.85"/>
            <path d="M36,99.6 L44,99.6 M60,99.6 L64,99.6" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="52" cy="99.6" r="1.1" fill="#2DD4BF"/>
            {/* Ejes y ruedas */}
            <path d="M20,101.5 L23,104 L29,104 L32,101.5 M68,101.5 L71,104 L77,104 L80,101.5" fill="#94A3B8" stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round"/>
            <circle cx="22" cy="106" r="3.2" fill="#2DD4BF" stroke={OUTLINE} strokeWidth="1.4"/>
            <circle cx="30" cy="106" r="3.2" fill="#2DD4BF" stroke={OUTLINE} strokeWidth="1.4"/>
            <circle cx="70" cy="106" r="3.2" fill="#2DD4BF" stroke={OUTLINE} strokeWidth="1.4"/>
            <circle cx="78" cy="106" r="3.2" fill="#2DD4BF" stroke={OUTLINE} strokeWidth="1.4"/>
            <circle cx="22" cy="106" r="1" fill="#F8FAFC"/><circle cx="30" cy="106" r="1" fill="#F8FAFC"/>
            <circle cx="70" cy="106" r="1" fill="#F8FAFC"/><circle cx="78" cy="106" r="1" fill="#F8FAFC"/>
        </>
    );

    const Estrella = ({ cx, cy }: { cx: number; cy: number }) => {
        const puntos = Array.from({ length: 10 }, (_, i) => {
            const r = i % 2 === 0 ? 9 : 4;
            const a = (Math.PI / 5) * i - Math.PI / 2;
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(" ");
        return <polygon points={puntos} fill={ORO} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round"/>;
    };

    const OjosJuvenil = () => {
        const ojo = (cx: number, alto = 1, pupila = 1) => (
            <>
                <path d={`M${cx - 10.5},52 C${cx - 9},${52 - 13 * alto} ${cx + 9},${52 - 13 * alto} ${cx + 10.5},52 C${cx + 9},${52 + 11 * alto} ${cx - 9},${52 + 11 * alto} ${cx - 10.5},52 Z`}
                      fill={AMBAR} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round"/>
                <ellipse cx={cx + 0.6} cy={51.5} rx={3.6 * pupila} ry={6.6 * alto * pupila} fill="#1A1424"/>
                <circle cx={cx + 3.6} cy={47.6} r="2.2" fill="white"/>
                <circle cx={cx - 2.6} cy={54.2} r="0.9" fill="white" opacity="0.8"/>
            </>
        );
        const redondo = (cx: number, pupila: number) => (
            <>
                <circle cx={cx} cy={52} r="9.5" fill={AMBAR} stroke={OUTLINE} strokeWidth="1.5"/>
                <circle cx={cx + 0.6} cy={52} r={pupila} fill="#1A1424"/>
                <circle cx={cx + 3.6} cy={48.6} r="2.1" fill="white"/>
                <circle cx={cx - 3} cy={55} r="1" fill="white" opacity="0.85"/>
            </>
        );
        const cerrado = (cx: number, contento: boolean) => (
            <path d={contento ? `M${cx - 9},54 Q${cx},45 ${cx + 9},54` : `M${cx - 9},51 Q${cx},57.5 ${cx + 9},51`}
                  stroke={TRAZO_CLARO} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        );
        const ceja = (d: string) => <path d={d} stroke={TRAZO_CLARO} strokeWidth="2.2" fill="none" strokeLinecap="round"/>;
        switch (estado) {
            case "feliz": case "celebrando": return <>{cerrado(33, true)}{cerrado(67, true)}</>;
            case "durmiendo": return <>{cerrado(33, false)}{cerrado(67, false)}</>;
            case "emocionado": return <>{redondo(33, 4.6)}{redondo(67, 4.6)}</>;
            case "sorprendido": return <>{redondo(33, 2.6)}{redondo(67, 2.6)}</>;
            case "guino": return <>{ojo(33)}{cerrado(67, true)}</>;
            case "triste": return <>{ojo(33, 0.8)}{ojo(67, 0.8)}{ceja("M24,43 L37,39")}{ceja("M76,43 L63,39")}</>;
            case "confundido": case "pensando": return <>{ojo(33)}{ojo(67, 0.7)}{ceja("M60,38 Q67,35 74,39")}</>;
            case "orgullosa": return (
                <>
                    {ojo(33, 0.85)}{ojo(67, 0.85)}
                    {/* Párpados a media asta: mirada segura */}
                    <path d="M22,51 Q33,40 44,51 Z M56,51 Q67,40 78,51 Z" fill={FUR}/>
                    <path d="M22,51 Q33,46 44,51 M56,51 Q67,46 78,51" stroke={OUTLINE} strokeWidth="1.5" fill="none"/>
                </>
            );
            default: return <>{ojo(33)}{ojo(67)}</>;
        }
    };

    const OjosPerro = () => {
        const ojo = (cx: number, r = 7.5) => (
            <>
                <circle cx={cx} cy={52} r={r} fill="#3B2416" stroke={OUTLINE} strokeWidth="1.5"/>
                <circle cx={cx} cy={52.5} r={r * 0.6} fill="#140B06"/>
                <circle cx={cx + 2.6} cy={49} r={r * 0.34} fill="white"/>
                <circle cx={cx - 2.4} cy={55.2} r={r * 0.14} fill="white" opacity="0.85"/>
            </>
        );
        const cerrado = (cx: number, contento: boolean) => (
            <path d={contento ? `M${cx - 8},54 Q${cx},45.5 ${cx + 8},54` : `M${cx - 8},51 Q${cx},57 ${cx + 8},51`}
                  stroke={OUTLINE} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
        );
        const puntos = (dy1: number, dy2: number) => (
            <>
                <ellipse cx="33" cy={40 + dy1} rx="3.6" ry="2.4" fill={FUR_LIGHT} stroke={OUTLINE} strokeWidth="0.8"/>
                <ellipse cx="67" cy={40 + dy2} rx="3.6" ry="2.4" fill={FUR_LIGHT} stroke={OUTLINE} strokeWidth="0.8"/>
            </>
        );
        switch (estado) {
            case "feliz": case "celebrando": return <>{puntos(-1, -1)}{cerrado(33, true)}{cerrado(67, true)}</>;
            case "durmiendo": return <>{puntos(2, 2)}{cerrado(33, false)}{cerrado(67, false)}</>;
            case "emocionado": return <>{puntos(-2, -2)}{ojo(33, 9)}{ojo(67, 9)}</>;
            case "sorprendido": return <>{puntos(-4, -4)}<circle cx="33" cy="52" r="9" fill="white" stroke={OUTLINE} strokeWidth="1.5"/><circle cx="33" cy="52" r="4" fill="#140B06"/><circle cx="67" cy="52" r="9" fill="white" stroke={OUTLINE} strokeWidth="1.5"/><circle cx="67" cy="52" r="4" fill="#140B06"/></>;
            case "guino": return <>{puntos(0, -1)}{ojo(33)}{cerrado(67, true)}</>;
            case "triste": return <>{puntos(3, 3)}{ojo(33, 8)}{ojo(67, 8)}</>;
            case "confundido": case "pensando": return <>{puntos(1, -3)}{ojo(33)}{ojo(67, 6.5)}</>;
            case "orgullosa": return <>{puntos(-1, -1)}{cerrado(33, true)}{ojo(67, 7)}</>;
            default: return <>{puntos(0, 0)}{ojo(33)}{ojo(67)}</>;
        }
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
                {Estrella({ cx: 33, cy: 52 })}
                {Estrella({ cx: 67, cy: 52 })}
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
                <path d="M24.5,54 A8.5,8.5 0 0 0 41.5,54 Z" fill={OUTLINE}/>
                <path d="M58.5,54 A8.5,8.5 0 0 0 75.5,54 Z" fill={OUTLINE}/>
                <circle cx="31" cy="57" r="1.4" fill="white"/>
                <circle cx="65" cy="57" r="1.4" fill="white"/>
                <line x1="24" y1="54" x2="42" y2="54" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round"/>
                <line x1="58" y1="54" x2="76" y2="54" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round"/>
            </>
        );
        if (estado === "durmiendo") return (
            <>
                <path d="M25,53 Q33,60 41,53" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M59,53 Q67,60 75,53" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round"/>
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
                <circle cx="33" cy="55" r="4.2" fill="#8B5CF6" opacity="0.55"/>
                <circle cx="31" cy="49" r="2.6" fill="white"/>
                <circle cx="35.5" cy="55" r="1.2" fill="white"/>
                <circle cx="67" cy="52" r={8.5 + ex} fill={OUTLINE}/>
                <circle cx="67" cy="55" r="4.2" fill="#8B5CF6" opacity="0.55"/>
                <circle cx="65" cy="49" r="2.6" fill="white"/>
                <circle cx="69.5" cy="55" r="1.2" fill="white"/>
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
        if (estado === "durmiendo") return (
            <>
                <path d="M24,46 Q33,44 42,46" stroke={OUTLINE} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"/>
                <path d="M58,46 Q67,44 76,46" stroke={OUTLINE} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"/>
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
            <circle cx="33" cy="52" r="12" fill="#C4B5FD" fillOpacity="0.14" stroke={GLASSES} strokeWidth="2.4"/>
            <circle cx="67" cy="52" r="12" fill="#C4B5FD" fillOpacity="0.14" stroke={GLASSES} strokeWidth="2.4"/>
            <path d="M25,46 Q28,42 32,41.5" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
            <path d="M59,46 Q62,42 66,41.5" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
            <path d="M45,52 Q50,54 55,52" fill="none" stroke={GLASSES} strokeWidth="2.2"/>
            <path d="M21,52 Q17,50 14,48" fill="none" stroke={GLASSES} strokeWidth="1.5"/>
            <path d="M79,52 Q83,50 86,48" fill="none" stroke={GLASSES} strokeWidth="1.5"/>
        </>
    );

    /* Brazo de los gestos: manga en la juvenil, pelaje en las demas. */
    const Brazo = ({ garras = false }: { garras?: boolean }) => {
        const manga = nocturna ? "#3F4A5E" : FUR;
        const pata = nocturna ? "#FFFFFF" : perro ? FUR_LIGHT : FUR;
        return (
            <>
                <path d="M66,84 C72,76 78,68 83,60" fill="none" stroke={OUTLINE} strokeWidth="10.5" strokeLinecap="round"/>
                <path d="M66,84 C72,76 78,68 83,60" fill="none" stroke={manga} strokeWidth="7" strokeLinecap="round"/>
                {garras && <path d="M80,50 L78,41 L83,48 M86,49 L87,40 L89,48 M91,53 L97,46 L93,55" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round"/>}
                <circle cx="85" cy="56" r="7.2" fill={pata} stroke={OUTLINE} strokeWidth="1.8"/>
                <path d="M82,50.5 L82.8,54 M86,49.8 L86,53.5 M90,51.5 L88.8,54.6" stroke={OUTLINE} strokeWidth="1" strokeLinecap="round"/>
            </>
        );
    };

    /* Lo que el gesto agrega sobre el personaje. Se refleja segun hacia donde actua. */
    const Gesto = () => {
        if (!animada || !["zarpa", "invoca", "idea"].includes(estadoPedido)) return null;
        const reflejo = lado < 0 ? { transform: "scaleX(-1)", transformBox: "view-box" as const, transformOrigin: "50px 50px" } : undefined;
        return (
            <g style={reflejo}>
                <g className={`aria-brazo aria-brazo-${estadoPedido}`}><Brazo garras={estadoPedido === "zarpa"} /></g>
                {estadoPedido === "idea" && (
                    <g className="aria-foco">
                        <circle className="aria-foco-brillo" cx="88" cy="24" r="14" fill={ORO} opacity="0.5"/>
                        <path d="M88,14 C81,14 77,19 77,24 C77,28 80,30 81.5,33 L94.5,33 C96,30 99,28 99,24 C99,19 95,14 88,14 Z" fill="#FDE68A" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round"/>
                        <rect x="82.5" y="33" width="11" height="5.5" rx="1.5" fill="#94A3B8" stroke={OUTLINE} strokeWidth="1.3"/>
                        <path d="M84,22 L88,26 L92,22" fill="none" stroke="#B45309" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                )}
            </g>
        );
    };

    const Boca = () => {
        const Nariz = () => perro ? (
            <>
                <path d="M44,57.5 Q50,55 56,57.5 Q55.5,63 50,64 Q44.5,63 44,57.5 Z" fill="#2B2140"/>
                <ellipse cx="47.6" cy="58" rx="2" ry="1.1" fill="white" opacity="0.75"/>
            </>
        ) : (
            <polygon points="50,60 47.5,63 52.5,63" fill={NOSE} stroke={NOSE} strokeWidth="0.5" strokeLinejoin="round"/>
        );
        const Lengua = () => perro ? (
            <path d="M47,68.5 Q47,75 50,75 Q53,75 53,68.5 Z" fill="#F472B6" stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round"/>
        ) : null;
        const LineaNariz = () => (
            <line x1="50" y1="63" x2="50" y2="66" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
        );

        if (estadoPedido === "sopla") return (
            <>
                {Nariz()}
                <ellipse cx={50 + 2 * lado} cy="69" rx="2.4" ry="3" fill="#C06060" stroke={OUTLINE} strokeWidth="1.4"/>
            </>
        );
        if (estado === "hablando") return (
            <>
                {Nariz()}
                {LineaNariz()}
                {apertura === 2 ? (
                    <path d="M46,66 C46,73 54,73 54,66 Z" fill="#C06060" stroke={OUTLINE} strokeWidth="1.5"/>
                ) : apertura === 1 ? (
                    <path d="M47,66.5 C47.5,70 52.5,70 53,66.5 Z" fill="#C06060" stroke={OUTLINE} strokeWidth="1.3"/>
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
                {Nariz()}
                {LineaNariz()}
                {Lengua()}
                <path d="M44,66 Q50,76 56,66" fill="none" stroke={MOUTH_C} strokeWidth="2" strokeLinecap="round"/>
            </>
        );
        if (estado === "emocionado" || estado === "celebrando") return (
            <>
                {Nariz()}
                {LineaNariz()}
                <path d="M43,65.5 Q50,79 57,65.5 Z" fill="#C06060" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M46.5,71 Q50,68.5 53.5,71 Q50,75 46.5,71 Z" fill="#F4A0C8"/>
            </>
        );
        if (estado === "sorprendido") return (
            <>
                {Nariz()}
                <ellipse cx="50" cy="69.5" rx="3.2" ry="4" fill="#C06060" stroke={OUTLINE} strokeWidth="1.5"/>
            </>
        );
        if (estado === "confundido") return (
            <>
                {Nariz()}
                <path d="M44,69 Q47,66 50,69 Q53,72 56,69" fill="none" stroke={MOUTH_C} strokeWidth="1.6" strokeLinecap="round"/>
            </>
        );
        if (estado === "guino" || estado === "orgullosa") return (
            <>
                {Nariz()}
                {LineaNariz()}
                <path d="M45,67 Q51,73 57,65" fill="none" stroke={MOUTH_C} strokeWidth="2" strokeLinecap="round"/>
            </>
        );
        if (estado === "durmiendo") return (
            <>
                {Nariz()}
                <ellipse cx="50" cy="69.5" rx="3.4" ry="2.8" fill={MOUTH_C} opacity="0.4"/>
            </>
        );
        if (estado === "leyendo") return (
            <>
                {Nariz()}
                <path d="M47,67 Q50,68.5 53,67" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
            </>
        );
        if (estado === "triste") return (
            <>
                {Nariz()}
                {LineaNariz()}
                <path d="M46,69 Q50,64 54,69" fill="none" stroke={MOUTH_C} strokeWidth="1.5" strokeLinecap="round"/>
            </>
        );
        return (
            <>
                {Nariz()}
                {LineaNariz()}
                {Lengua()}
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
        if (estado === "durmiendo") return (
            <>
                <text x="74" y="22" fontSize="11" fontWeight="700" fill={OUTLINE} opacity="0.75">z</text>
                <text x="82" y="10" fontSize="14" fontWeight="700" fill={OUTLINE} opacity="0.6">z</text>
                <text x="90" y="-4" fontSize="18" fontWeight="700" fill={OUTLINE} opacity="0.45">z</text>
            </>
        );
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

                {/* Pescadito nadando dentro de la nubecita (el perro sueña con un hueso) */}
                {perro ? (
                    <g className="swimming-fish">
                        <rect x="77" y="-13.6" width="10" height="3.2" rx="1.2" fill="#FFF4E3" stroke={OUTLINE} strokeWidth="0.8"/>
                        <circle cx="76.5" cy="-14" r="2" fill="#FFF4E3" stroke={OUTLINE} strokeWidth="0.8"/>
                        <circle cx="76.5" cy="-10" r="2" fill="#FFF4E3" stroke={OUTLINE} strokeWidth="0.8"/>
                        <circle cx="87.5" cy="-14" r="2" fill="#FFF4E3" stroke={OUTLINE} strokeWidth="0.8"/>
                        <circle cx="87.5" cy="-10" r="2" fill="#FFF4E3" stroke={OUTLINE} strokeWidth="0.8"/>
                        <rect x="77.5" y="-13.1" width="9" height="2.2" fill="#FFF4E3"/>
                    </g>
                ) : <g className="swimming-fish">
                    {/* Cola */}
                    <polygon points="87,-12 91.5,-8.5 91.5,-15.5" fill="#FF9F1C"/>
                    {/* Cuerpo */}
                    <ellipse cx="81.5" cy="-12" rx="5.5" ry="3" fill="#FF9F1C"/>
                    {/* Ojo */}
                    <circle cx="79" cy="-13" r="0.7" fill="#FFF"/>
                </g>}
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
                {/* Libro abierto sostenido delante del cuerpo: tapa violeta asomando tras las hojas */}
                <path d="M27,79 L50,83 L73,79 L73,96 L50,99.5 L27,96 Z" fill="#6D28D9" stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round"/>
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
                <circle cx="50" cy="87" r="5.5" fill={ORO} stroke={OUTLINE} strokeWidth="1.5"/>
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
            {...(marco ?? (className ? { className } : { width: 260, height: 382 }))}
            viewBox={viewBox}
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={perro ? "Aria, el perrito tutor de Semantika" : "Aria, la tutora de Semantika"}
            style={animada ? ({ "--e": nocturna ? 0.62 : perro ? 1.2 : 1, "--d": lado, overflow: "visible" } as React.CSSProperties) : marco ? { overflow: "visible" } : undefined}
        >
            {animada && <style>{ESTILOS_VIDA}</style>}
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

                    .aria-cola { transform-origin: 64px 92px; transform-box: view-box; }
                    @keyframes aria-cola-calma { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(6deg); } }
                    @keyframes aria-cola-feliz { 0%, 100% { transform: rotate(-16deg); } 50% { transform: rotate(14deg); } }
                    @keyframes aria-cola-habla { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(8deg); } }
                    @keyframes aria-cola-susto {
                        0%, 100% { transform: rotate(-22deg) translateY(-1px); }
                        25% { transform: rotate(-19deg) translateY(-1px); }
                        75% { transform: rotate(-25deg) translateY(-1px); }
                    }
                    @keyframes aria-cola-triste { 0%, 100% { transform: rotate(38deg); } 50% { transform: rotate(33deg); } }
                    @keyframes aria-cola-duda {
                        0%, 70%, 100% { transform: rotate(0deg); }
                        78% { transform: rotate(-12deg); }
                        86% { transform: rotate(4deg); }
                    }
                    @keyframes aria-cola-orgullo { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(-8deg); } }
                    @keyframes aria-cola-guino {
                        0%, 60%, 100% { transform: rotate(-2deg); }
                        70% { transform: rotate(-18deg); }
                        80% { transform: rotate(6deg); }
                    }
                    .aria-cola-calma { animation: aria-cola-calma 3.2s ease-in-out infinite; }
                    .aria-cola-feliz { animation: aria-cola-feliz .45s ease-in-out infinite; }
                    .aria-cola-habla { animation: aria-cola-habla 1.3s ease-in-out infinite; }
                    .aria-cola-susto { animation: aria-cola-susto .18s linear infinite; }
                    .aria-cola-triste { animation: aria-cola-triste 3.6s ease-in-out infinite; }
                    .aria-cola-duda { animation: aria-cola-duda 2.4s ease-in-out infinite; }
                    .aria-cola-orgullo { animation: aria-cola-orgullo 2.6s ease-in-out infinite; }
                    .aria-cola-guino { animation: aria-cola-guino 1.8s ease-in-out infinite; }

                    @media (prefers-reduced-motion: reduce) {
                        .aria-ojos-parpadean, .aria-rebote, .aria-destello, .aria-confeti, .swimming-fish, .aria-cola { animation: none; }
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
            {recorte === "completa" && (nocturna ? Skate() : Libros())}
            <g className={animada ? "aria-vida-cuerpo" : undefined}>
                <g key={animada ? estado : "fijo"} className={animada ? `aria-rx-cuerpo aria-rx-cuerpo-${estadoPedido}` : undefined}>{Cuerpo()}</g>
            </g>
            <g className={animada ? (estado === "hablando" ? "aria-habla-cabeza" : "aria-vida-cabeza") : undefined}>
                <g key={animada ? estadoPedido : "fijo"} className={animada ? `aria-rx-cabeza aria-rx-cabeza-${estadoPedido}` : undefined}>
                    {Orejas()}
                    {CabezaBase()}
                    <g className={animada ? "aria-mirada" : undefined} style={animada ? { transform: `translateX(${mirada}px)` } : undefined}>
                        <g className={animada ? (parpado ? "aria-parpado-rapido" : undefined) : parpadea ? "aria-ojos-parpadean" : undefined}>
                            <g className={animada ? "aria-cara-entra" : undefined}>
                                {nocturna ? OjosJuvenil() : perro ? OjosPerro() : Ojos()}
                            </g>
                        </g>
                    </g>
                    {!nocturna && !perro && Cejas()}
                    {!nocturna && !perro && Lentes()}
                    {SobreCabeza()}
                    {/* Cachetes */}
                    <ellipse cx="26" cy="62" rx="6" ry="3.5" fill={nocturna ? "#C084FC" : "#F9A8D4"} opacity={nocturna ? blush * 0.45 : blush}/>
                    <ellipse cx="74" cy="62" rx="6" ry="3.5" fill={nocturna ? "#C084FC" : "#F9A8D4"} opacity={nocturna ? blush * 0.45 : blush}/>
                    {nocturna ? <g style={{ filter: "invert(1)" }} opacity="0.75">{Bigotes()}</g> : !perro && Bigotes()}
                    {animada && estadoPedido === "sopla" && (
                        <>
                            <circle className="aria-mejillas" cx="22" cy="65" r="6.5" fill={nocturna ? "#3A3444" : FUR} stroke={OUTLINE} strokeWidth="1.1"/>
                            <circle className="aria-mejillas" cx="78" cy="65" r="6.5" fill={nocturna ? "#3A3444" : FUR} stroke={OUTLINE} strokeWidth="1.1"/>
                        </>
                    )}
                    <g className={animada ? "aria-boca-entra" : undefined}>{Boca()}</g>
                </g>
            </g>
            <g className={animada ? "aria-vida-cuerpo" : undefined}>
                <g key={animada ? estadoPedido : "fijo"} className={animada ? `aria-rx-cuerpo aria-rx-cuerpo-${estadoPedido}` : undefined}>
                    {Cuello()}
                    {!soloCabeza && puestos.includes("bufanda") && Bufanda()}
                </g>
            </g>
            {Gesto()}
            <g key={animada ? estado : "fijo"} className={animada ? "aria-extra-entra" : undefined}>{Extras()}</g>
        </svg>
    );
}
