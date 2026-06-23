import { Navigate, Outlet, useLocation } from "react-router-dom";

type Role = "STUDENT" | "TEACHER" | "ADMIN";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

/**
 * Guarda de ruta: verifica que exista un token y que el rol del usuario
 * esté entre los roles permitidos.
 *
 * Si no hay sesión → redirige a "/" (login).
 * Si hay sesión pero el rol no coincide → redirige a "/" (login).
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // Sin token → al login
  if (!token || !userStr) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Parsear usuario almacenado
  let user: { role: string } | null = null;
  try {
    user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Si se especificaron roles permitidos, verificar
  if (allowedRoles && user) {
    const userRole = user.role.toUpperCase() as Role;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  }

  return <Outlet />;
}
