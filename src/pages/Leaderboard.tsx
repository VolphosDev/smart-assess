import { motion } from "framer-motion";
import { leaderboard } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold mb-2">Ranking del curso 🏅</h1>
        <p className="text-muted-foreground">Esta semana en Biología Celular · 5to Secundaria</p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-2xl mx-auto">
        {[top3[1], top3[0], top3[2]].map((p, i) => {
          const place = i === 1 ? 1 : i === 0 ? 2 : 3;
          const heights = ["h-32", "h-44", "h-24"];
          const grads = ["bg-primary-gradient", "bg-lime-gradient", "bg-coral-gradient"];
          const medals = ["🥈", "🥇", "🥉"];
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center"
            >
              <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-3xl grid place-items-center text-3xl md:text-4xl shadow-glow mb-2", grads[i])}>
                {p.avatar}
              </div>
              <div className="text-xs md:text-sm font-bold truncate max-w-full text-center">{p.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{p.points} pts</div>
              <div className={cn("w-full rounded-t-3xl shadow-soft grid place-items-center text-3xl md:text-5xl border-2 border-b-0 border-border bg-card", heights[i])}>
                {medals[i]}
                <div className="font-display font-bold text-xl md:text-2xl text-foreground">#{place}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of list */}
      <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden max-w-2xl mx-auto">
        <ul className="divide-y divide-border">
          {rest.map((p, i) => (
            <motion.li
              key={p.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4",
                p.you && "bg-primary/10 border-l-4 border-primary"
              )}
            >
              <span className="font-display font-bold text-xl w-8 text-muted-foreground tabular-nums">#{p.rank}</span>
              <span className="text-2xl">{p.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2">
                  {p.name}
                  {p.you && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">tú</span>}
                </div>
                <div className="text-xs text-muted-foreground">🔥 {p.streak} días de racha</div>
              </div>
              <div className="font-display font-bold text-lg tabular-nums">{p.points}</div>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        El ranking se actualiza tras cada evaluación. ¡Sigue practicando para subir posiciones!
      </div>
    </div>
  );
}