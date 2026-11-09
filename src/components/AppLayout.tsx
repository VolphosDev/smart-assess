import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { Home, History, Sparkles, LogOut, Loader2, ShieldAlert, Check, Brain, HelpCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/lib/icon-mapper";
import { authApi } from "@/services/auth";
import { SelectorTema } from "./SelectorTema";
import AriaGuideWidget from "./AriaGuideWidget";
import { abrirBienvenidaAria } from "@/lib/ariaEventos";
import { ModalPortal } from "@/components/ModalPortal";
import { PantallaMantenimiento } from "@/components/PantallaMantenimiento";
import { enMantenimiento } from "@/lib/mantenimiento";
import BarraJugador from "./gamificacion/BarraJugador";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gamificacionApi } from "@/services/gamificacion";
import { AccesoriosAriaContext, VarianteAriaContext, varianteElegida, type VarianteAria } from "@/lib/ariaAccesorios";

const nav = [
  { to: "/app", icon: Home, label: "Inicio", end: true },
  { to: "/app/mapa-conocimiento", icon: Brain, label: "Mapa de Conocimiento" },
  { to: "/app/historial", icon: History, label: "Historial" },
  { to: "/app/en-vivo", icon: Radio, label: "En vivo" },
];

const GUIA_NAV: Record<string, string> = {
  "/app": "nav-inicio",
  "/app/mapa-conocimiento": "nav-mapa",
  "/app/historial": "nav-historial",
  "/app/en-vivo": "nav-en-vivo",
};

export default function AppLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [showConsent, setShowConsent] = useState(() => {
    return user.role === "student" && !user.consentimientoAceptado;
  });
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);
  // El tema de juego también va en <body>: los modales se montan fuera de este árbol (portales)
  // y sin esto conservarían el vidrio esmerilado. Se quita al salir de la vista del alumno.
  useEffect(() => {
    document.body.classList.add("tema-juego");
    return () => document.body.classList.remove("tema-juego");
  }, []);
  // Misma consulta que BarraJugador (comparten caché): de aquí salen los accesorios de Aria.
  const { data: resumenJugador } = useQuery({
    queryKey: ["gamificacion", "resumen"],
    queryFn: gamificacionApi.resumen,
    staleTime: 30_000,
    enabled: !enMantenimiento,
  });
  // Estilo de Aria: el que eligió el alumno en la tienda, o el de su etapa escolar.
  const queryClient = useQueryClient();
  const [variante, setVariante] = useState<VarianteAria>(() => varianteElegida());
  useEffect(() => {
    const actualizar = () => setVariante(varianteElegida(resumenJugador?.etapa, resumenJugador?.ariaVariante));
    actualizar();
    window.addEventListener("semantika:variante-aria", actualizar);
    return () => window.removeEventListener("semantika:variante-aria", actualizar);
  }, [resumenJugador?.etapa, resumenJugador?.ariaVariante]);
  // Quien eligió su Aria antes de que se guardara en el servidor: se sube una vez, para que sus
  // compañeros la vean igual en su perfil.
  useEffect(() => {
    if (!resumenJugador || resumenJugador.ariaVariante) return;
    let local: string | null = null;
    try { local = localStorage.getItem("semantika.varianteAria"); } catch { /* sin almacenamiento */ }
    if (local === "clasica" || local === "nocturna" || local === "perro") {
      gamificacionApi.ajustarPerfil({ variante: local })
        .then(() => queryClient.invalidateQueries({ queryKey: ["gamificacion", "resumen"] }))
        .catch(() => { /* se reintenta en la próxima carga */ });
    }
  }, [resumenJugador, queryClient]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptConsent = async () => {
    if (!acceptedCheckbox) return;
    setIsSubmitting(true);
    try {
      await authApi.registrarConsentimiento("v2.0");
      const updatedUser = { ...user, consentimientoAceptado: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setShowConsent(false);
    } catch (e) {
      console.error("Error al registrar consentimiento:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VarianteAriaContext.Provider value={variante}>
    <AccesoriosAriaContext.Provider value={resumenJugador?.ariaEquipado ?? []}>
    <div className="tema-juego min-h-screen">
      {showConsent && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 text-left animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                  <ShieldAlert className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">
                    Consentimiento de Datos
                  </h3>
                  <p className="text-xs text-muted-foreground">Políticas de Uso y Privacidad de la Plataforma</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Semantika trata tus datos por encargo de tu colegio, conforme a la Ley N.° 29733 de Protección de Datos Personales. Antes de usar la plataforma, necesitamos tu consentimiento.
                </p>
                <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                  <p className="font-bold text-xs text-foreground/80 uppercase tracking-wider mb-2">
                    ¿Qué datos serán evaluados y guardados?
                  </p>
                  <ul className="space-y-2 text-xs text-foreground/90 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✔</span>
                      <span><strong>Accesos e Inicios de Sesión:</strong> Monitoreo de actividad y frecuencia de uso del sistema.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✔</span>
                      <span><strong>Registro de Notas:</strong> Seguimiento y promedio del desempeño académico y de tus calificaciones.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✔</span>
                      <span><strong>Respuestas de Evaluaciones:</strong> Respuestas escritas y grabaciones de voz enviadas a los tutores de IA.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✔</span>
                      <span><strong>Para qué se usan:</strong> Para darte práctica adaptada a tu nivel, mostrar tu progreso a ti y a tus docentes, y mejorar el servicio. No se venden; el servicio de IA recibe tus respuestas sin tu nombre ni tu correo.</span>
                    </li>
                  </ul>
                </div>
                <p className="text-xs">
                  Puedes retirar tu consentimiento o pedir acceso, corrección o eliminación de tus datos en cualquier momento a través de tu colegio o del soporte de Semantika.
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={acceptedCheckbox}
                      onChange={(e) => setAcceptedCheckbox(e.target.checked)}
                      className="sr-only peer"
                      disabled={isSubmitting}
                    />
                    <div className="w-5 h-5 border border-input rounded bg-background peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                      {acceptedCheckbox && <Check className="w-3.5 h-3.5 text-primary-foreground font-bold" />}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-foreground/95 leading-normal">
                    Doy mi consentimiento previo, informado, expreso e inequívoco para el tratamiento de mis datos según lo descrito. Si tengo menos de 14 años, mi padre, madre o tutor lo autorizó ante mi colegio.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!acceptedCheckbox || isSubmitting}
                  onClick={handleAcceptConsent}
                  className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando registro...
                    </>
                  ) : (
                    "Aceptar y continuar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <header className="sticky top-0 z-30 bg-card border-b border-border/80 shadow-xs">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            {/* En celular el nombre cede su sitio a la barra de nivel y monedas. */}
            <span className="hidden sm:inline">Semantika</span>
          </Link>
          <nav data-guide="nav-desktop" className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
            {nav.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                data-guide={GUIA_NAV[to]}
                title={label}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                <Icon className="w-4 h-4" /> <span className="hidden xl:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {!enMantenimiento && <BarraJugador />}
            {/* Permite volver a ver el recorrido sin borrar el navegador: un alumno que se
                pierde en la semana 3 no deberia tener que limpiar datos del sitio para que
                Aria se lo vuelva a explicar. */}
            <button
              type="button"
              data-guide="boton-ayuda"
              onClick={abrirBienvenidaAria}
              title="Ver el tutorial otra vez"
              className="h-9 w-9 hidden sm:grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </button>
            <SelectorTema />
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/");
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
            {/* En celular, el tutorial sigue a mano en el botón flotante de Aria; el avatar es decorativo. */}
            <UserAvatar name={user.nombre || user.name || "Estudiante"} className="w-9 h-9 hidden sm:flex" />
          </div>
        </div>
      </header>

      <main className="container py-8 pb-24 md:pb-8">
        {/* En preparación, el alumno ve la pantalla de mantenimiento en cualquier ruta suya.
            Docentes y administradores usan otros layouts y siguen trabajando. */}
        {enMantenimiento ? <PantallaMantenimiento /> : <Outlet />}
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-30 bg-card border border-border rounded-xl shadow-lg flex justify-around p-2">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-guide={GUIA_NAV[to]}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[11px] font-semibold flex-1",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <AriaGuideWidget pausado={showConsent || enMantenimiento} />
    </div>
    </AccesoriosAriaContext.Provider>
    </VarianteAriaContext.Provider>
  );
}