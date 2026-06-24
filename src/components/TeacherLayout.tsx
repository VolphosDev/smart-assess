import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { Home, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/lib/icon-mapper";

export default function TeacherLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border/80 shadow-xs">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/docente" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            Semantika · Docente
          </Link>
          <nav className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
            <NavLink
              to="/docente"
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              <Home className="w-4 h-4" /> Mis cursos
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/");
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground mr-1"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
            <UserAvatar name={user.nombre || user.name || "Docente"} className="w-9 h-9" />
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
