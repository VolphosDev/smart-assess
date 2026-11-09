import type { EstiloCharla } from "@/services/charla";

const TINTA = "#2B2140";

/** Fondo de la cabecera de la tienda: mismo mundo que la charla de cada edad. */
export function FondoTienda({ estilo }: { estilo: EstiloCharla }) {
    if (estilo === "SOBRIO") {
        return (
            <div aria-hidden className="absolute inset-0 pointer-events-none">
                <span className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#6E51F4]" />
                <span className="absolute -bottom-48 -right-20 w-[520px] h-[520px] rounded-full bg-[#7558F5]" />
            </div>
        );
    }
    return (
        <svg aria-hidden viewBox="0 0 1200 340" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none">
            {estilo === "PRIMARIA" ? <Kiosco /> : <Atardecer />}
        </svg>
    );
}

/** Puesto con toldo de rayas en el patio de la charla de primaria. */
function Kiosco() {
    return (
        <>
            <rect width="1200" height="340" fill="#A9E4FF" />
            <circle cx="1105" cy="118" r="36" fill="#FFD95E" stroke={TINTA} strokeWidth="5" />
            <path d="M70 130q-26 0-26-22t26-22q7-24 36-24t38 25q26 0 26 21t-26 22Z" fill="#fff" stroke={TINTA} strokeWidth="5" />
            <path d="M-10 290C200 240 420 245 620 280S1040 310 1210 262V350H-10Z" fill="#8FDB6E" stroke={TINTA} strokeWidth="5" />
            {Array.from({ length: 12 }, (_, i) => (
                <path key={i} d={`M${i * 100} -5H${i * 100 + 100}V34a50 22 0 0 1-100 0Z`} fill={i % 2 ? "#fff" : "#FF7A2F"} stroke={TINTA} strokeWidth="5" />
            ))}
        </>
    );
}

const SILUETA = [
    { x: -10, y: 214, w: 150 }, { x: 130, y: 250, w: 130 }, { x: 250, y: 196, w: 120 }, { x: 360, y: 262, w: 170 },
    { x: 520, y: 236, w: 120 }, { x: 630, y: 270, w: 190 }, { x: 810, y: 240, w: 130 }, { x: 930, y: 262, w: 140 }, { x: 1060, y: 222, w: 150 },
];

/** La azotea de 1.° y 2.° de secundaria, con los edificios bajos para no competir con el texto. */
function Atardecer() {
    return (
        <>
            <rect width="1200" height="340" fill="#FFB27A" />
            <rect width="1200" height="120" fill="#FF8F6B" />
            <rect width="1200" height="46" fill="#E8668A" />
            <circle cx="1105" cy="150" r="52" fill="#FFE27A" stroke={TINTA} strokeWidth="5" />
            {SILUETA.map((e) => <rect key={e.x} x={e.x} y={e.y} width={e.w} height={340 - e.y} fill="#6F58D9" stroke={TINTA} strokeWidth="5" />)}
            <rect x="-10" y="312" width="1220" height="40" fill="#FF7A2F" stroke={TINTA} strokeWidth="5" />
        </>
    );
}
