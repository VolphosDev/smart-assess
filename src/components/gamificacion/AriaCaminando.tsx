import { useContext, useId } from "react";
import { AccesoriosAriaContext, VarianteAriaContext } from "@/lib/ariaAccesorios";
import { AriaSvg, type ExpresionAria } from "@/components/Aria";

/** Ancho del lienzo y posición de la cabeza; el reflejo al caminar a la izquierda parte de aquí. */
const ANCHO = 176;
const CABEZA = { x: 78, y: 6, width: 94, height: 84 };
/** Mismo grosor de línea que la cabeza a esta escala: si difieren, se notan dos dibujos pegados. */
const LINEA = 1.85;

/**
 * Aria caminando en cuatro patas.
 *
 * UN SOLO DIBUJO. La cabeza es la de AriaSvg, con sus expresiones y accesorios, pero se monta como
 * un <svg> anidado en este mismo lienzo: comparte escala y grosor de línea con el cuerpo. El cuello
 * queda detrás de la cabeza y las caderas detrás del cuerpo, para que ninguna unión se vea. Cada
 * pata es un único contorno, y el relleno es plano, igual que la Aria sentada.
 *
 * Mira hacia `mirando`; la cabeza nunca se refleja, solo el cuerpo.
 */
export function AriaCaminando({ className, caminando = true, mirando = "derecha", estado = "feliz" }: {
    className?: string;
    caminando?: boolean;
    mirando?: "derecha" | "izquierda";
    estado?: ExpresionAria;
}) {
    const puestos = useContext(AccesoriosAriaContext);
    const dorada = puestos.includes("dorada");
    const variante = useContext(VarianteAriaContext);
    const nocturna = variante === "nocturna" && !dorada;
    const perro = variante === "perro" && !dorada;
    const idRecorte = `aria-cuerpo-${useId().replace(/:/g, "")}`;

    const FUR = dorada ? "#FCD34D" : nocturna ? "#26222E" : perro ? "#E9A85C" : "#FBF3EA";
    const FUR_LEJOS = dorada ? "#F0B93A" : nocturna ? "#1C1924" : perro ? "#CF8F4C" : "#E9DCCB";
    const FUR_LUZ = dorada ? "#FEF3C7" : perro ? "#FFF4E3" : "#FFFFFF";
    const FUR_DARK = dorada ? "#D97706" : nocturna ? "#3A3444" : perro ? "#C47F3E" : "#C2A38C";
    const TRONCO = nocturna ? "#3F4A5E" : FUR;
    const PATA = nocturna ? "#FFFFFF" : perro ? FUR_LUZ : FUR;
    const PATA_LEJOS = nocturna ? "#D9D4E2" : perro ? "#EAD9C0" : FUR_LEJOS;
    const T = nocturna ? "#0F0B15" : "#2B2140";
    const anim = caminando ? "" : " quieta";
    const izquierda = mirando === "izquierda";

    const pata = (x: number, clase: string, lejana = false) => {
        const contorno = `M${x - 7},98 C${x - 8},108 ${x - 7},116 ${x - 8},122 C${x - 9},129 ${x + 9},130 ${x + 9},123 C${x + 8},116 ${x + 7},108 ${x + 7},98 Z`;
        return (
            <g className={`aria-pata ${clase}${anim}`} style={{ transformOrigin: `${x}px 100px` }}>
                <path d={contorno} fill={lejana ? FUR_LEJOS : FUR} />
                <path d={`M${x - 8},120 C${x - 9},129 ${x + 9},130 ${x + 9},123 L${x + 8.4},119 Q${x},122.5 ${x - 8},120 Z`}
                      fill={lejana ? PATA_LEJOS : PATA} />
                <path d={contorno} fill="none" stroke={T} strokeWidth={LINEA} strokeLinejoin="round" />
                <path d={`M${x + 1},124.5 L${x + 1.4},128 M${x + 5},124 L${x + 5.4},127.4`} stroke={T} strokeWidth="1.1" strokeLinecap="round" />
            </g>
        );
    };

    const COLA = perro ? "M40,84 C30,82 24,74 26,62 C27,57 25,54 22,53" : "M40,90 C24,90 14,78 16,62 C17,54 12,48 6,50";
    const TRONCO_D = "M36,92 C34,76 48,68 66,68 C84,68 100,66 112,70 C124,74 128,86 124,98 C120,109 104,111 84,111 C62,111 38,110 36,92 Z";

    return (
        <div className={`relative ${className ?? ""}`} role="img" aria-label="Aria caminando">
            <style>{`
                /* En el tramo que avanza la pata va levantada; en el que apoya, pegada al suelo. */
                @keyframes aria-paso-a { 0%,100% { transform: rotate(20deg); } 50% { transform: rotate(-20deg); } 75% { transform: translateY(-7px) rotate(2deg); } }
                @keyframes aria-paso-b { 0%,100% { transform: rotate(-20deg); } 25% { transform: translateY(-7px) rotate(2deg); } 50% { transform: rotate(20deg); } }
                @keyframes aria-polvo { 0% { transform: translate(0,0) scale(.5); opacity: .55; } 100% { transform: translate(-20px,-9px) scale(1.5); opacity: 0; } }
                /* Aplastar y estirar: al apoyar la pata el cuerpo se achata; en el aire se estira. */
                @keyframes aria-trote {
                    0%, 100% { transform: translateY(0) scale(1, 1); }
                    25% { transform: translateY(1.5px) scale(1.03, 0.96); }
                    60% { transform: translateY(-4px) scale(0.98, 1.03); }
                }
                /* La cabeza sigue al cuerpo con un leve retraso (acción secundaria). */
                @keyframes aria-cabeceo {
                    0%, 100% { transform: translateY(0) rotate(-3deg); }
                    30% { transform: translateY(2px) rotate(-1deg); }
                    65% { transform: translateY(-5px) rotate(3deg); }
                }
                @keyframes aria-cola-paso { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(12deg); } }
                @keyframes aria-sombra { 0%,100% { transform: scaleX(1); opacity: .16; } 50% { transform: scaleX(.88); opacity: .1; } }
                .aria-pata { transform-box: view-box; }
                .aria-paso-a { animation: aria-paso-a .4s ease-in-out infinite; }
                .aria-paso-b { animation: aria-paso-b .4s ease-in-out infinite; }
                .aria-trote { animation: aria-trote .2s ease-in-out infinite; transform-origin: 84px 128px; transform-box: view-box; }
                .aria-cabeceo { animation: aria-cabeceo .4s ease-in-out .06s infinite; transform-box: view-box; }
                .aria-cola-paso { animation: aria-cola-paso .4s ease-in-out infinite; transform-origin: 40px 88px; transform-box: view-box; }
                .aria-sombra-paso { animation: aria-sombra .2s ease-in-out infinite; transform-origin: 84px 130px; transform-box: view-box; }
                .aria-polvo { animation: aria-polvo .4s ease-out infinite; transform-box: fill-box; transform-origin: center; }
                .quieta { animation: none !important; }
                @media (prefers-reduced-motion: reduce) {
                    .aria-paso-a, .aria-paso-b, .aria-trote, .aria-cabeceo, .aria-cola-paso, .aria-sombra-paso, .aria-polvo { animation: none; }
                }
            `}</style>

            <svg viewBox={`0 0 ${ANCHO} 136`} className="w-full h-auto block" style={{ overflow: "visible" }}>
                <defs>
                    <clipPath id={idRecorte}><path d={TRONCO_D} /></clipPath>
                </defs>

                <g transform={izquierda ? `translate(${ANCHO},0) scale(-1,1)` : undefined}>
                    <ellipse className={`aria-sombra-paso${anim}`} cx="84" cy="130" rx="50" ry="4.5" fill={T} opacity=".14" />

                    {caminando && [52, 96].map((x, i) => (
                        <circle key={x} className="aria-polvo" cx={x} cy="125" r="4.5" fill="#CBD5E1" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}

                    {/* Las caderas quedan detrás del tronco: la pata nace de él, no se le pega. */}
                    {pata(50, "aria-paso-b", true)}
                    {pata(98, "aria-paso-a", true)}
                    {pata(62, "aria-paso-a")}
                    {pata(112, "aria-paso-b")}

                    <g className={`aria-trote${anim}`}>
                        <g className={`aria-cola-paso${anim}`}>
                            <path d={COLA} fill="none" stroke={T} strokeWidth="9.2" strokeLinecap="round" />
                            <path d={COLA} fill="none" stroke={FUR} strokeWidth="5.6" strokeLinecap="round" />
                            {perro
                                ? <path d="M25,55.5 C24,54 23,53.3 22,53" fill="none" stroke={FUR_LUZ} strokeWidth="5.6" strokeLinecap="round" />
                                : !nocturna && <path d="M10,49.4 C8,49.4 7,50 6,50" fill="none" stroke={FUR_DARK} strokeWidth="5.6" strokeLinecap="round" />}
                        </g>

                        <path d={TRONCO_D} fill={TRONCO} />
                        <g clipPath={`url(#${idRecorte})`}>
                            <ellipse cx="84" cy="113" rx="46" ry="11" fill={nocturna ? "#4B5770" : FUR_LUZ} />
                            {perro && <path d="M52,62 C66,60 92,60 100,64 C102,76 90,82 74,82 C60,82 50,76 52,62 Z" fill={FUR_DARK} />}
                            {!nocturna && !perro && (
                                <path d="M56,66 Q58,75 59,82 Q61,75 60,66 Z M68,66 Q70,75 71,82 Q73,75 72,66 Z M80,66 Q82,75 83,82 Q85,75 84,66 Z" fill={FUR_DARK} />
                            )}
                        </g>
                        <path d={TRONCO_D} fill="none" stroke={T} strokeWidth={LINEA} strokeLinejoin="round" />

                        {nocturna && (
                            <>
                                {/* Mochila de la juvenil, con los cuadernos asomando */}
                                <rect x="50" y="46" width="7" height="14" rx="1" fill="#38BDF8" stroke={T} strokeWidth="1.2" transform="rotate(-10 53 53)" />
                                <rect x="58" y="45" width="7" height="14" rx="1" fill="#A3E635" stroke={T} strokeWidth="1.2" transform="rotate(8 61 52)" />
                                <rect x="46" y="52" width="30" height="24" rx="7" fill="#FB7185" stroke={T} strokeWidth={LINEA} />
                                <rect x="52" y="62" width="18" height="10" rx="3" fill="#F43F5E" stroke={T} strokeWidth="1.2" />
                                <path d="M76,58 C84,62 88,74 86,88" fill="none" stroke={T} strokeWidth="3.4" strokeLinecap="round" />
                                <path d="M76,58 C84,62 88,74 86,88" fill="none" stroke="#FB7185" strokeWidth="1.6" strokeLinecap="round" />
                            </>
                        )}
                        {puestos.includes("bufanda") && <path d="M96,78 Q112,92 128,82 L130,90 Q112,102 94,86 Z M102,88 L98,106 L105,108 L110,92 Z" fill="#EF4444" stroke={T} strokeWidth={LINEA} strokeLinejoin="round" />}
                    </g>
                </g>

                <g className={`aria-cabeceo${anim}`}
                   style={{ transformOrigin: `${izquierda ? ANCHO - (CABEZA.x + CABEZA.width / 2) : CABEZA.x + CABEZA.width / 2}px 84px` }}>
                    <AriaSvg estado={estado} recorte="cara" soloCabeza
                             marco={{ ...CABEZA, x: izquierda ? ANCHO - CABEZA.x - CABEZA.width : CABEZA.x }} />
                </g>

                {!puestos.includes("bufanda") && (nocturna ? null : (
                    <g transform={izquierda ? `translate(${ANCHO},0) scale(-1,1)` : undefined}>
                        <g className={`aria-trote${anim}`}>
                            {perro
                                ? <path d="M100,80 Q114,90 128,84 L116,104 Z" fill="#EF4444" stroke={T} strokeWidth={LINEA} strokeLinejoin="round" />
                                : <>
                                    <path d="M113,87 L105,82 L105,92 Z M113,87 L121,82 L121,92 Z" fill="#8B5CF6" stroke={T} strokeWidth="1.5" strokeLinejoin="round" />
                                    <circle cx="113" cy="87" r="2.3" fill="#6D28D9" stroke={T} strokeWidth="1.1" />
                                </>}
                        </g>
                    </g>
                ))}
            </svg>
        </div>
    );
}
