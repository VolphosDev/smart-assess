import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Sparkles, ShieldCheck } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
              <Sparkles className="w-5 h-5" />
            </span>
            Semantika · Admin
          </Link>
          <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-bold text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Panel administrador
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
            <div className="w-10 h-10 rounded-2xl bg-primary-gradient grid place-items-center text-lg shadow-soft text-primary-foreground">
              🛡️
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