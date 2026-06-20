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
                className="w-20 h-20 rounded-3xl bg-primary-gradient grid place-items-center text-4xl shadow-glow"
            >
                🧠
            </motion.div>
            
            <div className="space-y-3">
                <h2 className="font-display font-bold text-2xl md:text-3xl text-balance">
                    ¡Tu tutora IA está preparando el juego! ✨
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Leyendo el material y redactando preguntas de evaluación divertidas para medir tu nivel de aprendizaje.
                </p>
            </div>

            <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden relative border border-border">
                <motion.div
                    className="bg-primary-gradient h-full rounded-full"
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
