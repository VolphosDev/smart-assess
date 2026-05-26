import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { Home, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeacherLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/docente" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
              <Sparkles className="w-5 h-5" />
            </span>
            Semantika · Docente
          </Link>
          <nav className="hidden md:flex items-center gap-1 bg-card rounded-full p-1 border border-border shadow-soft">
            <NavLink
              to="/docente"
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              <Home className="w-4 h-4" /> Mis cursos
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
            <div className="w-10 h-10 rounded-2xl bg-primary-gradient grid place-items-center text-lg shadow-soft text-primary-foreground">
              👩‍🏫
            </div>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
