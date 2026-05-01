import { NavLink, Outlet, Link } from "react-router-dom";
import { Home, Mic, History, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", icon: Home, label: "Inicio", end: true },
  { to: "/app/practica", icon: Mic, label: "Practicar" },
  { to: "/app/historial", icon: History, label: "Historial" },
  { to: "/app/ranking", icon: Trophy, label: "Ranking" },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
              <Sparkles className="w-5 h-5" />
            </span>
            Vocali
          </Link>
          <nav className="hidden md:flex items-center gap-1 bg-card rounded-full p-1 border border-border shadow-soft">
            {nav.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                <Icon className="w-4 h-4" /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-secondary/50">
              <span className="text-lg">🔥</span>
              <span className="font-bold text-sm">7 días</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-coral-gradient grid place-items-center text-lg shadow-soft">
              🚀
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-30 bg-card/95 backdrop-blur border border-border rounded-3xl shadow-soft flex justify-around p-2">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-[11px] font-semibold flex-1",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}