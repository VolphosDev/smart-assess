import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, FileText, Sparkles } from "lucide-react";
import { AriaSvg } from "@/components/Aria";

const PAGINAS = [
    { x: -120, y: -60, retraso: 0 },
    { x: 130, y: -40, retraso: 0.5 },
    { x: -100, y: 50, retraso: 1 },
    { x: 115, y: 70, retraso: 1.5 },
];

export function AriaLeyendo({
    className = "w-56 h-56",
    anchoAria = "w-40",
    escala = 1,
    claseHojas = "text-primary/70",
}: {
    className?: string;
    anchoAria?: string;
    escala?: number;
    claseHojas?: string;
}) {
    const sinMovimiento = useReducedMotion();

    return (
        <div className={`relative mx-auto grid place-items-center ${className}`}>
            <div className="absolute inset-[12%] rounded-full bg-primary/15 blur-2xl" aria-hidden />

            {!sinMovimiento && PAGINAS.map((p, i) => (
                <motion.span
                    key={i}
                    aria-hidden
                    className={`absolute ${claseHojas}`}
                    initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 0], x: p.x * escala, y: p.y * escala, rotate: i % 2 ? 25 : -25, scale: 1 }}
                    transition={{ duration: 1.8, delay: p.retraso, repeat: Infinity, ease: "easeOut" }}
                >
                    <FileText className={escala < 0.6 ? "w-3.5 h-3.5" : "w-6 h-6"} />
                </motion.span>
            ))}

            <motion.div
                className={`relative ${anchoAria}`}
                animate={sinMovimiento ? undefined : { y: [0, -4 * escala, 0], rotate: [0, -2, 0, 2, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            >
                <AriaSvg estado="leyendo" className="w-full h-auto" />
            </motion.div>
        </div>
    );
}

export function PantallaMantenimiento() {
    return (
        <section className="min-h-[70vh] grid place-items-center px-4">
            <div className="w-full max-w-xl text-center space-y-6">
                <AriaLeyendo />

                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-glow text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Plataforma en preparación
                </span>

                <div className="space-y-3">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                        Aria está preparando tus evaluaciones
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Estamos incorporando y revisando el material de tus cursos para que cada
                        pregunta que recibas sea precisa y esté basada en lo que realmente estudias.
                        Mientras terminamos, la plataforma no está disponible.
                    </p>
                </div>

                <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-4 text-sm text-left flex gap-3">
                    <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p>
                        <strong>Vuelve a ingresar más tarde o mañana.</strong>{" "}
                        <span className="text-muted-foreground">Tu cuenta y tu progreso están guardados; no perderás nada.</span>
                    </p>
                </div>
            </div>
        </section>
    );
}
