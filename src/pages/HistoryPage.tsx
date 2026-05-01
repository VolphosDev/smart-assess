import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { history } from "@/lib/mock-data";

export default function HistoryPage() {
  const data = [...history].reverse().map((h) => ({ name: h.topic, score: h.score }));
  const avg = (history.reduce((a, b) => a + b.score, 0) / history.length).toFixed(1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold mb-1">Tu progreso</h1>
        <p className="text-muted-foreground">Revisa cada intento, descubre tus puntos fuertes y los temas a reforzar.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-xl">Evolución de notas</h3>
            <span className="text-sm text-muted-foreground">Últimos {history.length} intentos</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[0, 20]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-hero-gradient rounded-3xl p-6 shadow-glow text-primary-foreground flex flex-col justify-center">
          <div className="text-sm font-bold uppercase tracking-widest opacity-90 mb-2">Promedio general</div>
          <div className="font-display font-bold text-6xl mb-1">{avg}</div>
          <div className="opacity-90">de 20 puntos · ¡vas mejorando! 📈</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-display font-bold text-xl">Intentos recientes</h3>
        </div>
        <ul className="divide-y divide-border">
          {history.map((h, i) => (
            <motion.li
              key={h.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-5 hover:bg-muted/40 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-gradient grid place-items-center text-2xl shrink-0">
                {h.course === "Biología" ? "🧬" : h.course === "Historia" ? "🏛️" : h.course === "Álgebra" ? "📐" : "📚"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{h.topic}</div>
                <div className="text-sm text-muted-foreground">{h.course} · {new Date(h.date).toLocaleDateString("es-PE", { day: "numeric", month: "short" })} · {h.durationMin} min</div>
              </div>
              <div className={`px-4 py-2 rounded-full font-display font-bold ${h.score >= 17 ? "bg-success/20 text-success" : h.score >= 14 ? "bg-primary/15 text-primary" : "bg-accent/20 text-accent"}`}>
                {h.score}/20
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}