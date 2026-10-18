import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Crown, Loader2, LogOut, Plus, Power, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { superadminApi, type Colegio } from "@/services/superadmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectorTema } from "@/components/SelectorTema";
import { cn } from "@/lib/utils";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function mensajeDeError(err: unknown, porDefecto: string) {
  const texto = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err ?? "");
  try {
    const p = JSON.parse(texto);
    return p.message || p.error || porDefecto;
  } catch {
    return texto || porDefecto;
  }
}

/**
 * Panel del SUPERADMIN: colegios de la plataforma y su administrador principal.
 *
 * Deliberadamente no muestra nada académico (notas, intentos, nombres de estudiantes): solo el
 * nombre de cada colegio y cuántas cuentas tiene. El superadministrador opera la plataforma;
 * los datos de los estudiantes pertenecen a cada institución.
 */
export default function SuperadminColegios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: colegios = [], isLoading } = useQuery<Colegio[]>({
    queryKey: ["superadmin-colegios"],
    queryFn: () => superadminApi.listar(),
  });
  const refrescar = () => queryClient.invalidateQueries({ queryKey: ["superadmin-colegios"] });

  const [form, setForm] = useState({ nombre: "", adminNombre: "", adminCorreo: "", adminPassword: "" });
  const [agregarA, setAgregarA] = useState<Colegio | null>(null);
  const [nuevoAdmin, setNuevoAdmin] = useState({ nombre: "", correo: "", password: "" });

  const crear = useMutation({
    mutationFn: () => superadminApi.crear(form),
    onSuccess: () => {
      toast.success("Colegio creado con su administrador principal");
      setForm({ nombre: "", adminNombre: "", adminCorreo: "", adminPassword: "" });
      refrescar();
    },
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo crear el colegio")),
  });
  const estado = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => superadminApi.cambiarEstado(id, activo),
    onSuccess: (c) => { toast.success(c.activo ? "Colegio activado" : "Colegio desactivado: sus sesiones se cerraron"); refrescar(); },
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo cambiar el estado")),
  });
  const agregar = useMutation({
    mutationFn: () => superadminApi.agregarAdministrador(agregarA!.id, nuevoAdmin),
    onSuccess: () => {
      toast.success("Administrador principal agregado");
      setAgregarA(null);
      setNuevoAdmin({ nombre: "", correo: "", password: "" });
      refrescar();
    },
    onError: (e) => toast.error(mensajeDeError(e, "No se pudo agregar el administrador")),
  });

  const valido = form.nombre.trim() && form.adminNombre.trim() && form.adminCorreo.trim() && form.adminPassword.length >= 8;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border/80 shadow-xs">
        <div className="container flex h-16 items-center justify-between">
          <span className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            Semantika · Plataforma
          </span>
          <div className="flex items-center gap-3">
            <SelectorTema />
            <button type="button"
                    onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <section className="bg-hero-gradient rounded-xl p-8 shadow-sm relative overflow-hidden">
          <Building2 className="absolute right-6 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.25] text-white pointer-events-none" />
          <span className="inline-block px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold uppercase tracking-wider mb-3">
            Superadministración
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">Colegios</h1>
          <p className="opacity-90 max-w-xl text-sm">
            Cada colegio tiene sus propios administradores, docentes y estudiantes, y nadie ve los datos de otro.
          </p>
        </section>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          <form onSubmit={(e) => { e.preventDefault(); if (valido) crear.mutate(); }}
                className="bg-card border border-border rounded-xl shadow-xs p-6 space-y-3 h-fit text-left">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nuevo colegio
            </h3>
            <Input placeholder="Nombre del colegio" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground pt-2">Administrador principal</p>
            <Input placeholder="Nombre completo" value={form.adminNombre} onChange={(e) => setForm({ ...form, adminNombre: e.target.value })} />
            <Input placeholder="Correo o usuario" value={form.adminCorreo} onChange={(e) => setForm({ ...form, adminCorreo: e.target.value })} />
            <Input type="password" placeholder="Contraseña temporal (mínimo 8)" value={form.adminPassword}
                   onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
            <p className="text-xs text-muted-foreground">Deberá cambiar la contraseña en su primer ingreso.</p>
            <Button type="submit" className="w-full" disabled={!valido || crear.isPending}>
              {crear.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear colegio"}
            </Button>
          </form>

          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-bold text-base">Colegios de la plataforma</h3>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{colegios.length}</span>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <ul className="divide-y divide-border">
                {colegios.map((c) => (
                  <li key={c.id} className={cn("px-6 py-4 space-y-2", !c.activo && "opacity-60")}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{c.nombre}</span>
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold",
                            c.activo ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-destructive/15 text-destructive")}>
                            {c.activo ? "Activo" : "Desactivado"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {plural(c.administradores, "administrador", "administradores")} · {plural(c.docentes, "docente", "docentes")} · {plural(c.estudiantes, "estudiante", "estudiantes")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button type="button" onClick={() => setAgregarA(c)}
                                className="p-1.5 rounded-lg border border-border/80 text-primary hover:bg-primary/10 flex items-center gap-1 text-xs font-semibold">
                          <UserPlus className="w-3.5 h-3.5" /> Administrador
                        </button>
                        <button type="button" disabled={estado.isPending}
                                onClick={() => {
                                  if (!c.activo || confirm(`¿Desactivar ${c.nombre}? Todos sus usuarios perderán el acceso de inmediato.`)) {
                                    estado.mutate({ id: c.id, activo: !c.activo });
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-border/80 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-1 text-xs font-semibold disabled:opacity-50">
                          <Power className="w-3.5 h-3.5" /> {c.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.administradoresPrincipales.map((correo) => (
                        <span key={correo} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                          <Crown className="w-3 h-3 text-amber-600" /> {correo}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Dialog open={agregarA !== null} onOpenChange={(o) => { if (!o) setAgregarA(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <UserPlus className="w-5 h-5 text-primary" /> Administrador principal de {agregarA?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre completo" value={nuevoAdmin.nombre} onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, nombre: e.target.value })} />
            <Input placeholder="Correo o usuario" value={nuevoAdmin.correo} onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, correo: e.target.value })} />
            <Input type="password" placeholder="Contraseña temporal (mínimo 8)" value={nuevoAdmin.password}
                   onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, password: e.target.value })} />
            <Button className="w-full" onClick={() => agregar.mutate()}
                    disabled={agregar.isPending || !nuevoAdmin.nombre.trim() || !nuevoAdmin.correo.trim() || nuevoAdmin.password.length < 8}>
              {agregar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar administrador principal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
