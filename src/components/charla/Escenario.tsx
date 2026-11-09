import type { ReactNode } from "react";
import type { EstiloCharla } from "@/services/charla";

/** Contorno de Aria: los fondos lo comparten para que personaje y lugar sean un mismo dibujo. */
const TINTA = "#2B2140";
const CONTORNO = 6;

/** Primaria conversa en un patio soleado; 1.° y 2.° de secundaria, en una azotea al atardecer. */
export function Escenario({ estilo, children }: { estilo: Exclude<EstiloCharla, "SOBRIO">; children: ReactNode }) {
    return (
        <div className="relative overflow-hidden rounded-[2rem] border-[3px] border-[var(--j-tinta)] min-h-[620px] alto:min-h-[calc(100vh-9rem)] flex flex-col">
            {estilo === "PRIMARIA" ? <Patio /> : <Azotea />}
            <div className="relative z-10 flex-1 flex flex-col">{children}</div>
        </div>
    );
}

/** Aria se apoya en el suelo del escenario, en vez de flotar delante de él. */
export function SombraDeAria({ sobreRuedas = false }: { sobreRuedas?: boolean }) {
    return <div aria-hidden className={`absolute ${sobreRuedas ? "bottom-5" : "bottom-0"} left-1/2 -translate-x-1/2 w-3/4 h-6 rounded-[50%] bg-[#2B2140]/40`} />;
}

function Patio() {
    return (
        <svg aria-hidden viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
            <rect width="1200" height="760" fill="#A9E4FF" />
            <g className="charla-sol" style={{ transformOrigin: "1050px 110px" }}>
                {Array.from({ length: 12 }, (_, i) => (
                    <rect key={i} x="1042" y="16" width="16" height="42" rx="8" fill="#FFC83D" stroke={TINTA} strokeWidth="5" transform={`rotate(${i * 30} 1050 110)`} />
                ))}
            </g>
            <circle cx="1050" cy="110" r="48" fill="#FFD95E" stroke={TINTA} strokeWidth={CONTORNO} />
            <path d="M1020 118a34 34 0 0 0 58 12" fill="none" stroke="#F5A800" strokeWidth="6" strokeLinecap="round" />
            <g className="charla-nube-a" fill="#fff" stroke={TINTA} strokeWidth={CONTORNO}><path d="M120 150q-44 0-44-36t44-36q10-38 58-38t60 40q42 0 42 35t-42 35Z" /></g>
            <g className="charla-nube-b" fill="#fff" stroke={TINTA} strokeWidth={CONTORNO}><path d="M640 110q-32 0-32-27t32-27q8-28 44-28t44 30q30 0 30 26t-30 26Z" /></g>
            <path d="M-10 560C200 450 420 450 620 540S1040 620 1210 500V770H-10Z" fill="#8FDB6E" stroke={TINTA} strokeWidth={CONTORNO} />
            <path d="M-10 660C260 590 520 610 760 660S1080 700 1210 650V770H-10Z" fill="#62C24A" stroke={TINTA} strokeWidth={CONTORNO} />
            <path d="M60 720q30-20 70 0M820 725q34-22 74 0M520 700q26-16 56 0" fill="none" stroke="#3F9A32" strokeWidth="6" strokeLinecap="round" />
            {[[90, 640, "#FF7A2F"], [250, 620, "#F472B6"], [960, 660, "#FFC83D"], [1110, 620, "#F472B6"], [720, 690, "#FF7A2F"]].map(([x, y, c], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <path d="M0 0V30" stroke={TINTA} strokeWidth="5" />
                    {[0, 72, 144, 216, 288].map((a) => <circle key={a} r="9" cx="0" cy="-12" fill={c as string} stroke={TINTA} strokeWidth="4" transform={`rotate(${a})`} />)}
                    <circle r="7" fill="#FFE27A" stroke={TINTA} strokeWidth="4" />
                </g>
            ))}
        </svg>
    );
}

const EDIFICIOS = [
    { x: -10, y: 390, w: 210, h: 260, color: "#6F58D9", luz: "#8B76EE" },
    { x: 190, y: 300, w: 190, h: 350, color: "#5B3BEF", luz: "#7A5EF5" },
    { x: 370, y: 410, w: 230, h: 240, color: "#7C5AA6", luz: "#9476BF" },
    { x: 590, y: 340, w: 180, h: 310, color: "#5B3BEF", luz: "#7A5EF5" },
    { x: 760, y: 260, w: 220, h: 390, color: "#6F58D9", luz: "#8B76EE" },
    { x: 970, y: 380, w: 240, h: 270, color: "#7C5AA6", luz: "#9476BF" },
];

function Azotea() {
    return (
        <svg aria-hidden viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
            <rect width="1200" height="760" fill="#FFB27A" />
            <rect width="1200" height="220" fill="#FF8F6B" />
            <rect width="1200" height="90" fill="#E8668A" />
            <circle cx="170" cy="280" r="74" fill="#FFE27A" stroke={TINTA} strokeWidth={CONTORNO} />
            <g className="charla-nube-a" fill="#FFF3E0" stroke={TINTA} strokeWidth={CONTORNO}><path d="M430 170q-34 0-34-28t34-28q8-30 46-30t48 32q32 0 32 27t-32 27Z" /></g>
            {EDIFICIOS.map((e, i) => (
                <g key={i}>
                    <rect x={e.x} y={e.y} width={e.w} height={e.h} fill={e.color} stroke={TINTA} strokeWidth={CONTORNO} />
                    <rect x={e.x + 3} y={e.y + 3} width={Math.round(e.w * 0.28)} height={e.h} fill={e.luz} />
                    {Array.from({ length: 12 }, (_, v) => {
                        const col = v % 3, fila = Math.floor(v / 3);
                        const vy = e.y + 32 + fila * 66;
                        if (vy > 590) return null;
                        return <rect key={v} x={e.x + 34 + col * Math.round((e.w - 70) / 3)} y={vy} width="30" height="38" rx="6" fill={(v + i) % 4 === 0 ? "#3A23B5" : "#FFD95E"} stroke={TINTA} strokeWidth="5" className={(v + i) % 7 === 0 ? "charla-ventana" : undefined} style={{ animationDelay: `${v * 0.7}s` }} />;
                    })}
                </g>
            ))}
            <rect x="-10" y="596" width="1220" height="34" fill="#FF7A2F" stroke={TINTA} strokeWidth={CONTORNO} />
            <rect x="-10" y="630" width="1220" height="140" fill="#C9B8E8" stroke={TINTA} strokeWidth={CONTORNO} />
            <path d="M-10 668H1210M-10 716H1210" stroke="#A793CF" strokeWidth="5" />
            {[60, 240, 420, 600, 780, 960, 1140].map((x, i) => <path key={x} d={`M${x + (i % 2 ? 60 : 0)} 630V668M${x + 40} 668V716M${x + (i % 2 ? 0 : 70)} 716V760`} stroke="#A793CF" strokeWidth="5" />)}
        </svg>
    );
}
