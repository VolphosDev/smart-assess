import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown, KeyRound, Loader2, Lock, Trash2, Unlock, UserCog, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { administradoresApi, type Administrador, type PermisoCatalogo } from "@/services/administradores";
import { usePermisos } from "@/lib/permisos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Mensaje legible del error del backend (que llega como texto JSON). */
function mensajeDeError(err: unknown, porDefecto: string) {
  const texto = err instanceof Error ? err.message : String(err ?? "");
  try {
    const p = JSON.parse(texto);
    return p.message || p.error || porDefecto;
  } catch {
    return texto || porDefecto;
  }
}

/**
 * Administradores del colegio y sus permisos.
 *
 * Solo se pueden marcar los permisos que tiene quien opera: el backend rechaza otorgar (o
 * quitar) uno que no se tiene, y aquí esas casillas aparecen deshabilitadas para no invitar al
 * error. Los administradores principales y la propia cuenta no se editan desde esta pantalla.
 */
export default function Administradores() {
  const queryClient = useQueryClient();
  const { usuario, tiene } = usePermisos();
  const misPermisos = new Set(usuario.permisos ?? []);

  const { data: catalogo = [] } = useQuery<PermisoCatalogo[]>({
    queryKey: ["permisos-catalogo"],
    queryFn: () => administradoresApi.catalogo(),
    staleTime: Infinity,
  });
  const { data: admins = [], isLoading } = useQuery<Administrador[]>({
    queryKey: ["administradores"],
    queryFn: () => administradoresApi.listar(),
  });

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [editando, setEditando] = useState<Administrador | null>(null);
  const [permisosEdicion, setPermisosEdicion] = useState<string[]>([]);

  const refrescar = () => queryClient.invalidateQueries({ queryKey: ["administradores"] });

  const crear = useMutation({
    mutationFn: () => administradoresApi.crear({ nombre, correo, password, permisos: seleccion }),
    onSuccess: () => {
      toast.success("Miniadministrador creado");
      setNombre(""); setCorreo(""); setPassword(""); setSeleccion([]);
      refrescar();
    },
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo crear el administrador")),
  });
  const guardarPermisos = useMutation({
    mutationFn: () => administradoresApi.cambiarPermisos(editando!.id, permisosEdicion),
    onSuccess: () => { toast.success("Permisos actualizados"); setEditando(null); refrescar(); },
    onError: (e) => toast.error(mensajeDeError(e, "No se pudieron cambiar los permisos")),
  });
  const bloquear = useMutation({
    mutationFn: (id: number) => administradoresApi.alternarBloqueo(id),
    onSuccess: (r) => { toast.success(r.cuentaBloqueada ? "Cuenta bloqueada" : "Cuenta desbloqueada"); refrescar(); },
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo cambiar el bloqueo")),
  });
  const eliminar = useMutation({
    mutationFn: (id: number) => administradoresApi.eliminar(id),
    onSuccess: () => { toast.success("Administrador eliminado"); refrescar(); },
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo eliminar")),
  });

  const alternar = (lista: string[], p: string) => (lista.includes(p) ? lista.filter((x) => x !== p) : [...lista, p]);
  const descripcion = (p: string) => catalogo.find((c) => c.permiso === p)?.descripcion ?? p;

  const formularioValido = nombre.trim() && correo.trim() && password.length >= 8 && seleccion.length > 0;

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-hero-gradient rounded-xl p-8 shadow-sm relative overflow-hidden"
      >
        <UserCog className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.25] text-white pointer-events-none" />
        <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-3">
          Administradores
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 max-w-2xl">Quién administra tu colegio</h1>
        <p className="opacity-90 max-w-xl text-sm">
          Crea miniadministradores con solo los permisos que necesitan. Nadie puede otorgar un permiso que no tiene.
        </p>
      </motion.section>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Alta */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (formularioValido) crear.mutate(); }}
          className="bg-card border border-border rounded-xl shadow-xs p-6 space-y-4 h-fit text-left"
        >
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Nuevo miniadministrador
          </h3>
          <Input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Correo o usuario" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          <Input type="password" placeholder="Contraseña (mínimo 8 caracteres)" value={password}
                 onChange={(e) => setPassword(e.target.value)} />
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Permisos</p>
            {catalogo.map(({ permiso, descripcion: d }) => {
              const puede = misPermisos.has(permiso);
              return (
                <label key={permiso}
                       className={cn("flex items-start gap-2 text-sm rounded-lg p-2 border border-transparent",
                         puede ? "cursor-pointer hover:bg-muted/50" : "opacity-50 cursor-not-allowed")}
                       title={puede ? undefined : "No tienes este permiso, así que no puedes otorgarlo"}>
                  <Checkbox checked={seleccion.includes(permiso)} disabled={!puede}
                            onCheckedChange={() => setSeleccion(alternar(seleccion, permiso))} />
                  <span>{d}</span>
                </label>
              );
            })}
          </div>
          <Button type="submit" className="w-full" disabled={!formularioValido || crear.isPending}>
            {crear.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear miniadministrador"}
          </Button>
        </form>

        {/* Lista */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-bold text-base">Administradores del colegio</h3>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{admins.length}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <ul className="divide-y divide-border">
              {admins.map((a) => {
                const esYo = String(a.id) === String(usuario.id);
                const editable = !a.adminPrincipal && !esYo && tiene("ADMINISTRADORES_GESTIONAR");
                return (
                  <li key={a.id} className="px-6 py-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{a.nombre}</span>
                          {a.adminPrincipal && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              <Crown className="w-3 h-3" /> Principal
                            </span>
                          )}
                          {esYo && <span className="text-[10px] font-bold text-muted-foreground">(tú)</span>}
                          {a.cuentaBloqueada && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive">Bloqueado</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{a.correo}</div>
                      </div>
                      {editable && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button type="button" onClick={() => { setEditando(a); setPermisosEdicion(a.permisos); }}
                                  className="p-1.5 rounded-lg border border-border/80 text-primary hover:bg-primary/10 flex items-center gap-1 text-xs font-semibold">
                            <KeyRound className="w-3.5 h-3.5" /> Permisos
                          </button>
                          <button type="button" onClick={() => bloquear.mutate(a.id)} disabled={bloquear.isPending}
                                  className="p-1.5 rounded-lg border border-border/80 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-1 text-xs font-semibold disabled:opacity-50">
                            {a.cuentaBloqueada ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {a.cuentaBloqueada ? "Desbloquear" : "Bloquear"}
                          </button>
                          <button type="button" disabled={eliminar.isPending}
                                  onClick={() => { if (confirm(`¿Eliminar al administrador ${a.nombre}?`)) eliminar.mutate(a.id); }}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                  title="Eliminar administrador">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {a.permisos.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                          {descripcion(p)}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={editando !== null} onOpenChange={(o) => { if (!o) setEditando(null); }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="w-5 h-5 text-primary" /> Permisos de {editando?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {catalogo.map(({ permiso, descripcion: d }) => {
              const puede = misPermisos.has(permiso);
              return (
                <label key={permiso}
                       className={cn("flex items-start gap-2 text-sm rounded-lg p-2", puede ? "cursor-pointer hover:bg-muted/50" : "opacity-50 cursor-not-allowed")}
                       title={puede ? undefined : "No tienes este permiso: no puedes otorgarlo ni quitarlo"}>
                  <Checkbox checked={permisosEdicion.includes(permiso)} disabled={!puede}
                            onCheckedChange={() => setPermisosEdicion(alternar(permisosEdicion, permiso))} />
                  <span>{d}</span>
                </label>
              );
            })}
          </div>
          <Button onClick={() => guardarPermisos.mutate()} disabled={guardarPermisos.isPending} className="w-full">
            {guardarPermisos.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar permisos"}
          </Button>
          <p className="text-xs text-muted-foreground">Los cambios rigen en la siguiente acción del administrador, sin que tenga que volver a entrar.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
