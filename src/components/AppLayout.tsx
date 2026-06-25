import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { Home, History, Sparkles, LogOut, Loader2, ShieldAlert, Check, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/lib/icon-mapper";
import { authApi } from "@/api/auth";

const nav = [
  { to: "/app", icon: Home, label: "Inicio", end: true },
  { to: "/app/mapa-conocimiento", icon: Brain, label: "Mapa de Conocimiento" },
  { to: "/app/historial", icon: History, label: "Historial" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [showConsent, setShowConsent] = useState(() => {
    return user.role === "student" && !user.consentimientoAceptado;
  });
  const [acceptedCheckbox, setAcceptedCheckbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptConsent = async () => {
    if (!acceptedCheckbox) return;
    setIsSubmitting(true);
    try {
      await authApi.registrarConsentimiento("v1.0");
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
    <div className="min-h-screen bg-background">
      {showConsent && (
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
                Para cumplir con la normativa de protección de datos personales y garantizar el uso ético de tu información, requerimos tu consentimiento antes de que uses la plataforma.
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
                    <span><strong>Uso con Fines de Estudio:</strong> Toda la información guardada se usará de forma segura y ética para fines académicos de estudio e investigación.</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs">
                Puedes retirar tu consentimiento en cualquier momento o solicitar información sobre el uso de tus datos escribiendo al soporte institucional.
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
                  Doy mi consentimiento libre, previo e informado para evaluar mi actividad académica y tratar mis datos según las políticas descritas.
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
      )}
      <header className="sticky top-0 z-30 bg-card border-b border-border/80 shadow-xs">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            Semantika
          </Link>
          <nav className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
            {nav.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                <Icon className="w-4 h-4" /> {label}
              </NavLink>
            ))}
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
            <UserAvatar name={user.nombre || user.name || "Estudiante"} className="w-9 h-9" />
          </div>
        </div>
      </header>

      <main className="container py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-30 bg-card border border-border rounded-xl shadow-lg flex justify-around p-2">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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
    </div>
  );
}
