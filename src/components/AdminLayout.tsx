import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Sparkles, ShieldCheck, CalendarDays, History, UserCog } from "lucide-react";
import { SelectorTema } from "./SelectorTema";
import { UserAvatar } from "@/lib/icon-mapper";
import { usePermisos, type Permiso } from "@/lib/permisos";

/**
 * Cada pestaña aparece solo si el administrador tiene alguno de sus permisos. Un
 * miniadministrador ve únicamente las secciones que le asignaron.
 */
const PESTANAS: { to: string; end?: boolean; etiqueta: string; icono: typeof ShieldCheck; permisos: Permiso[] }[] = [
  { to: "/admin", end: true, etiqueta: "Usuarios", icono: ShieldCheck, permisos: ["CUENTAS_GESTIONAR", "CONTRASENAS_RESTABLECER", "NOTAS_VER"] },
  { to: "/admin/trazabilidad", etiqueta: "Trazabilidad", icono: History, permisos: ["AUDITORIA_VER"] },
  { to: "/admin/uso", etiqueta: "Uso", icono: CalendarDays, permisos: ["USO_VER"] },
  { to: "/admin/administradores", etiqueta: "Administradores", icono: UserCog, permisos: ["ADMINISTRADORES_GESTIONAR"] },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { usuario, algunoDe } = usePermisos();
  const visibles = PESTANAS.filter((p) => algunoDe(...p.permisos));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border/80 shadow-xs">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="flex flex-col leading-tight">
              Semantika · Admin
              {usuario.colegio && (
                <span className="text-[11px] font-semibold text-muted-foreground font-sans">{usuario.colegio}</span>
              )}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
            {visibles.map(({ to, end, etiqueta, icono: Icono }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                <Icono className="w-4 h-4" /> {etiqueta}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {/* El selector de tema solo estaba en el layout del alumno, asi que el
                administrador se quedaba con lo que dijera su sistema operativo y sin
                manera de cambiarlo. La preferencia se guarda en la misma clave, de modo
                que elegirla aqui vale tambien para el resto de vistas. */}
            <SelectorTema />
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
            <UserAvatar name={usuario.name || "Administrador"} className="w-9 h-9" />
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
