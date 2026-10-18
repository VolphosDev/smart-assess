import { Navigate, Outlet } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { usePermisos, primeraSeccionPermitida, type Permiso } from "@/lib/permisos";

/**
 * Muestra la sección solo si el administrador tiene alguno de los permisos indicados; si no,
 * lo lleva a la primera sección que sí puede ver. Es una comodidad de navegación: quien
 * protege los datos es el backend, que responde 403 aunque se llegue aquí por la URL.
 */
export default function RequierePermiso({ permisos }: { permisos: Permiso[] }) {
  const { usuario, tiene } = usePermisos();
  if (permisos.some((p) => tiene(p))) return <Outlet />;

  const destino = primeraSeccionPermitida(usuario.permisos);
  if (destino && destino !== window.location.pathname) return <Navigate to={destino} replace />;

  return (
    <div className="max-w-md mx-auto mt-16 text-center bg-card border border-border rounded-xl p-8 shadow-xs">
      <ShieldOff className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
      <h2 className="font-display font-bold text-lg">Sin permisos asignados</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Tu cuenta de administrador todavía no tiene permisos. Pide al administrador principal de tu
        colegio que te asigne los que necesitas.
      </p>
    </div>
  );
}
