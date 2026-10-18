import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/services";

/**
 * Permisos de administración. El backend es quien decide (cada endpoint pide el suyo); aquí
 * solo se usan para no mostrar pantallas y botones que responderían 403.
 */
export type Permiso =
  | "CUENTAS_GESTIONAR"
  | "CONTRASENAS_RESTABLECER"
  | "CURSOS_GESTIONAR"
  | "NOTAS_VER"
  | "USO_VER"
  | "METRICAS_IA_VER"
  | "AUDITORIA_VER"
  | "ADMINISTRADORES_GESTIONAR";

export interface UsuarioSesion {
  id: string;
  email: string;
  name?: string;
  role: string;
  colegio?: string | null;
  permisos?: string[];
  adminPrincipal?: boolean;
}

export function usuarioGuardado(): UsuarioSesion | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null;
  } catch {
    return null;
  }
}

/**
 * Permisos vigentes. Arranca con los del login y los refresca con /auth/me, que los lee de la
 * base: si un administrador principal cambia los permisos de un miniadministrador, su menú se
 * actualiza sin que tenga que volver a entrar.
 */
export function usePermisos() {
  const guardado = usuarioGuardado();
  const { data } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const me = await authApi.me();
      const actual = usuarioGuardado();
      if (actual) {
        localStorage.setItem("user", JSON.stringify({ ...actual, ...me }));
      }
      return me as UsuarioSesion;
    },
    staleTime: 30_000,
    enabled: !!localStorage.getItem("token"),
  });
  const usuario = { ...(guardado ?? {}), ...(data ?? {}) } as UsuarioSesion;
  const permisos = new Set(usuario.permisos ?? []);
  return {
    usuario,
    cargando: !data && !guardado?.permisos,
    tiene: (p: Permiso) => permisos.has(p),
    algunoDe: (...ps: Permiso[]) => ps.some((p) => permisos.has(p)),
  };
}

/** Secciones del panel de administración y el permiso que exige cada una (en orden del menú). */
export const SECCIONES_ADMIN: { ruta: string; permisos: Permiso[] }[] = [
  { ruta: "/admin", permisos: ["CUENTAS_GESTIONAR", "CONTRASENAS_RESTABLECER", "NOTAS_VER"] },
  { ruta: "/admin/trazabilidad", permisos: ["AUDITORIA_VER"] },
  { ruta: "/admin/metricas-ia", permisos: ["METRICAS_IA_VER"] },
  { ruta: "/admin/uso", permisos: ["USO_VER"] },
  { ruta: "/admin/administradores", permisos: ["ADMINISTRADORES_GESTIONAR"] },
];

/** Primera sección a la que el administrador tiene acceso (a donde se le redirige). */
export function primeraSeccionPermitida(permisos: string[] | undefined): string | null {
  const set = new Set(permisos ?? []);
  const s = SECCIONES_ADMIN.find((sec) => sec.permisos.some((p) => set.has(p)));
  return s ? s.ruta : null;
}
