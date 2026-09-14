import { motion } from "framer-motion";

export function QuizLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-16 max-w-md mx-auto text-center space-y-8">
            <motion.div
                animate={{
                    y: [0, -12, 0],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="w-20 h-20 rounded-3xl bg-primary grid place-items-center text-4xl shadow-glow"
            >
                📖
            </motion.div>
            
            <div className="space-y-3">
                {/* Tono informativo, no festivo.
                    Decía "¡Tu tutora IA está preparando el juego!" y prometía preguntas
                    "divertidas". Esto es una evaluación cuyos resultados sustentan un estudio:
                    anunciarla como un juego resta seriedad a lo que el alumno está a punto de
                    hacer, y desentona en la pantalla de un docente o de un jurado.
                    El texto de abajo dice lo que de verdad está pasando, que además explica
                    por qué tarda. */}
                <h2 className="font-display font-bold text-2xl md:text-3xl text-balance">
                    Generando tus preguntas
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Estamos analizando el material de la semana para redactar preguntas sobre su
                    contenido. Esto suele tardar unos segundos.
                </p>
            </div>

            <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden relative border border-border">
                <motion.div
                    className="bg-primary h-full rounded-full"
                    animate={{
                        width: ["5%", "95%"],
                    }}
                    transition={{
                        duration: 15,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                />
            </div>

            <div className="text-xs font-bold text-primary animate-pulse tracking-wider uppercase">
                Generando preguntas... ¡Prepárate!
            </div>
        </div>
    );
}
export default QuizLoading;
