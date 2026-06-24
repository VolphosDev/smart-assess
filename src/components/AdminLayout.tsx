import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Sparkles, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/lib/icon-mapper";

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border/80 shadow-xs">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            Semantika · Admin
          </Link>
          <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-bold text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Panel administrador
          </span>
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
            <UserAvatar name="Administrador" className="w-9 h-9" />
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}