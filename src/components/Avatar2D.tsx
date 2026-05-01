import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type State = "idle" | "speaking" | "listening" | "thinking";

export default function Avatar2D({ state = "idle", className }: { state?: State; className?: string }) {
  const speaking = state === "speaking";
  const listening = state === "listening";
  const thinking = state === "thinking";

  return (
    <div className={cn("relative aspect-square w-full max-w-[360px] mx-auto", className)}>
      {/* Glow rings */}
      <div className="absolute inset-0 rounded-full bg-primary-gradient blur-3xl opacity-40 animate-blob" />
      <div className="absolute inset-6 rounded-full bg-coral-gradient blur-2xl opacity-30 animate-blob [animation-delay:-4s]" />

      {/* Listening pulse rings */}
      {listening && (
        <>
          <span className="absolute inset-0 rounded-full border-4 border-accent animate-pulse-ring" />
          <span className="absolute inset-0 rounded-full border-4 border-accent animate-pulse-ring [animation-delay:-0.8s]" />
        </>
      )}

      {/* Avatar disc */}
      <motion.div
        animate={{ y: speaking ? [0, -4, 0] : [0, -8, 0] }}
        transition={{ duration: speaking ? 0.5 : 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-4 rounded-full bg-hero-gradient shadow-glow grid place-items-center overflow-hidden"
      >
        {/* Face */}
        <div className="relative w-2/3 h-2/3">
          {/* Eyes */}
          <motion.div
            animate={{ scaleY: thinking ? [1, 0.1, 1] : 1 }}
            transition={{ duration: thinking ? 1.4 : 0, repeat: Infinity }}
            className="absolute top-[25%] left-[20%] w-[18%] aspect-square rounded-full bg-background"
          >
            <div className="absolute bottom-1 right-1 w-2/5 h-2/5 rounded-full bg-foreground" />
          </motion.div>
          <motion.div
            animate={{ scaleY: thinking ? [1, 0.1, 1] : 1 }}
            transition={{ duration: thinking ? 1.4 : 0, repeat: Infinity }}
            className="absolute top-[25%] right-[20%] w-[18%] aspect-square rounded-full bg-background"
          >
            <div className="absolute bottom-1 left-1 w-2/5 h-2/5 rounded-full bg-foreground" />
          </motion.div>

          {/* Cheeks */}
          <div className="absolute top-[55%] left-[8%] w-[15%] aspect-square rounded-full bg-accent/60 blur-sm" />
          <div className="absolute top-[55%] right-[8%] w-[15%] aspect-square rounded-full bg-accent/60 blur-sm" />

          {/* Mouth */}
          <div className="absolute top-[62%] left-1/2 -translate-x-1/2 flex items-end gap-[2px] h-[18%]">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="w-[6px] rounded-full bg-foreground"
                animate={
                  speaking
                    ? { height: ["30%", "100%", "50%", "90%", "40%"] }
                    : { height: "20%" }
                }
                transition={{
                  duration: 0.45,
                  repeat: speaking ? Infinity : 0,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
                style={{ height: speaking ? undefined : i === 2 ? "30%" : "20%" }}
              />
            ))}
          </div>
        </div>

        {/* Sparkles */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <span className="absolute top-4 left-1/2 text-2xl">✨</span>
          <span className="absolute bottom-6 right-6 text-xl">⭐</span>
          <span className="absolute top-1/2 left-3 text-lg">💫</span>
        </motion.span>
      </motion.div>

      {/* State badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-card border border-border shadow-soft text-xs font-bold uppercase tracking-wider">
        {state === "idle" && "👋 Listo"}
        {state === "speaking" && "🗣️ Hablando"}
        {state === "listening" && "🎙️ Escuchando"}
        {state === "thinking" && "💭 Pensando"}
      </div>
    </div>
  );
}