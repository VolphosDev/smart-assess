import { motion } from "framer-motion";
import { Moon, RefreshCw } from "lucide-react";
import { AriaSvg } from "@/components/Aria";
import { Button } from "@/components/ui/button";

interface AriaDescansandoProps {
    onReintentar?: () => void;
    contexto?: "practica" | "tutoria" | "generacion";
    compacto?: boolean;
}

const MENSAJES: Record<NonNullable<AriaDescansandoProps["contexto"]>, string> = {
    practica:
        "No puedo preparar preguntas nuevas en este momento. Vuelve a intentarlo en unos minutos; tus respuestas anteriores están guardadas.",
    tutoria:
        "No puedo conversar contigo ahora mismo. Vuelve a intentarlo en unos minutos; lo que ya conversamos está guardado.",
    generacion:
        "No puedo generar los reactivos en este momento. Vuelve a intentarlo en unos minutos; el material de la semana sigue cargado.",
};

export function AriaDescansando({ onReintentar, contexto = "practica", compacto = false }: AriaDescansandoProps) {
    return (
        <section className={compacto ? "py-8 px-4" : "min-h-[60vh] grid place-items-center px-4"}>
            <div className="w-full max-w-lg mx-auto text-center space-y-5">
                <motion.div
                    className="mx-auto w-40"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <AriaSvg estado="durmiendo" className="w-full h-auto drop-shadow-xl" />
                </motion.div>

                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-glow text-xs font-bold uppercase tracking-wider">
                    <Moon className="w-3.5 h-3.5" /> Aria está descansando
                </span>

                <div className="space-y-2">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                        Aria se quedó dormida
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">{MENSAJES[contexto]}</p>
                </div>

                {onReintentar && (
                    <Button onClick={onReintentar} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Despertar a Aria
                    </Button>
                )}
            </div>
        </section>
    );
}
