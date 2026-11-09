/**
 * Los cuatro jefes de la semana, dibujados con el mismo contorno que Aria para que parezcan del
 * mismo juego. Son simpáticos a propósito: el "enemigo" es el olvido o la duda, no el alumno.
 */
export function MonstruoJefe({ tipo, derrotado, className }: { tipo: string; derrotado: boolean; className?: string }) {
    const T = "#2B2140";
    const ojos = (cx1: number, cx2: number, cy: number, r = 7) => derrotado ? (
        <g stroke={T} strokeWidth="3.2" strokeLinecap="round">
            <path d={`M${cx1 - 5},${cy - 5} L${cx1 + 5},${cy + 5} M${cx1 + 5},${cy - 5} L${cx1 - 5},${cy + 5}`} />
            <path d={`M${cx2 - 5},${cy - 5} L${cx2 + 5},${cy + 5} M${cx2 + 5},${cy - 5} L${cx2 - 5},${cy + 5}`} />
        </g>
    ) : (
        <g>
            <circle cx={cx1} cy={cy} r={r} fill="#fff" stroke={T} strokeWidth="2.6" />
            <circle cx={cx2} cy={cy} r={r} fill="#fff" stroke={T} strokeWidth="2.6" />
            <circle cx={cx1 + 1.5} cy={cy + 1} r={r * 0.45} fill={T} />
            <circle cx={cx2 + 1.5} cy={cy + 1} r={r * 0.45} fill={T} />
        </g>
    );
    const boca = (x: number, y: number) => derrotado
        ? <path d={`M${x - 9},${y + 3} Q${x},${y - 4} ${x + 9},${y + 3}`} fill="none" stroke={T} strokeWidth="2.8" strokeLinecap="round" />
        : <path d={`M${x - 11},${y} Q${x},${y + 9} ${x + 11},${y} Z`} fill={T} stroke={T} strokeWidth="2" strokeLinejoin="round" />;

    let cuerpo: JSX.Element;
    switch (tipo) {
        case "duda": // pulpo
            cuerpo = (
                <>
                    {[18, 34, 50, 66, 82].map((x, i) => (
                        <path key={x} d={`M${x},70 q${i % 2 ? 6 : -6},14 0,24 q${i % 2 ? -5 : 5},4 2,8`} fill="none" stroke={T} strokeWidth="9" strokeLinecap="round" />
                    ))}
                    {[18, 34, 50, 66, 82].map((x, i) => (
                        <path key={`c${x}`} d={`M${x},70 q${i % 2 ? 6 : -6},14 0,24 q${i % 2 ? -5 : 5},4 2,8`} fill="none" stroke="#C084FC" strokeWidth="5" strokeLinecap="round" />
                    ))}
                    <path d="M12,72 C8,30 30,8 50,8 C70,8 92,30 88,72 Z" fill="#A855F7" stroke={T} strokeWidth="2.8" strokeLinejoin="round" />
                    <text x="50" y="30" textAnchor="middle" fontSize="18" fontWeight="900" fill="#F5D0FE" fontFamily="Baloo 2, sans-serif">?</text>
                    {ojos(38, 62, 46)}
                    {boca(50, 60)}
                </>
            );
            break;
        case "pereza": // dragón
            cuerpo = (
                <>
                    <path d="M14,44 L2,26 L22,34 Z M86,44 L98,26 L78,34 Z" fill="#4ADE80" stroke={T} strokeWidth="2.6" strokeLinejoin="round" />
                    <path d="M34,14 L38,2 L44,14 M56,14 L62,2 L66,14" fill="#FDE047" stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
                    <ellipse cx="50" cy="56" rx="38" ry="38" fill="#22C55E" stroke={T} strokeWidth="2.8" />
                    <ellipse cx="50" cy="72" rx="20" ry="14" fill="#BBF7D0" />
                    {derrotado ? ojos(36, 64, 48) : (
                        <g stroke={T} strokeWidth="3" strokeLinecap="round" fill="none">
                            <path d="M29,48 Q36,53 43,48" /><path d="M57,48 Q64,53 71,48" />
                        </g>
                    )}
                    {boca(50, 66)}
                    {!derrotado && <text x="80" y="22" fontSize="12" fontWeight="900" fill="#fff" fontFamily="Baloo 2, sans-serif">z z</text>}
                </>
            );
            break;
        case "distraccion": // murciélago
            cuerpo = (
                <>
                    <path d="M30,50 C14,30 2,40 2,58 C10,52 16,60 22,56 C24,64 30,62 32,62 Z" fill="#6D28D9" stroke={T} strokeWidth="2.6" strokeLinejoin="round" />
                    <path d="M70,50 C86,30 98,40 98,58 C90,52 84,60 78,56 C76,64 70,62 68,62 Z" fill="#6D28D9" stroke={T} strokeWidth="2.6" strokeLinejoin="round" />
                    <path d="M30,30 L26,6 L42,22 Z M70,30 L74,6 L58,22 Z" fill="#7C3AED" stroke={T} strokeWidth="2.6" strokeLinejoin="round" />
                    <circle cx="50" cy="54" r="30" fill="#7C3AED" stroke={T} strokeWidth="2.8" />
                    {derrotado ? ojos(39, 61, 48) : (
                        <g fill="none" stroke="#FDE047" strokeWidth="2.6" strokeLinecap="round">
                            <path d="M39,48 m-7,0 a7,7 0 1,0 7,-7 a4,4 0 1,1 -4,4" />
                            <path d="M61,48 m-7,0 a7,7 0 1,0 7,-7 a4,4 0 1,1 -4,4" />
                        </g>
                    )}
                    {boca(50, 66)}
                </>
            );
            break;
        default: // gólem del olvido
            cuerpo = (
                <>
                    <rect x="2" y="48" width="18" height="30" rx="8" fill="#94A3B8" stroke={T} strokeWidth="2.6" />
                    <rect x="80" y="48" width="18" height="30" rx="8" fill="#94A3B8" stroke={T} strokeWidth="2.6" />
                    <path d="M16,90 C10,40 24,12 50,12 C76,12 90,40 84,90 Z" fill="#64748B" stroke={T} strokeWidth="2.8" strokeLinejoin="round" />
                    <path d="M30,24 L36,34 L32,40 M70,70 L64,78 L70,84" fill="none" stroke={T} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    <circle cx="68" cy="28" r="5" fill="#86EFAC" stroke={T} strokeWidth="1.8" />
                    {ojos(38, 62, 46, 8)}
                    {boca(50, 64)}
                </>
            );
    }

    return (
        <svg viewBox="0 -4 100 110" className={className} role="img" aria-label="Jefe de la semana"
             style={derrotado ? { filter: "grayscale(0.85)", opacity: 0.8 } : undefined}>
            <ellipse cx="50" cy="102" rx="34" ry="4" fill="#000" opacity="0.18" />
            {cuerpo}
        </svg>
    );
}
