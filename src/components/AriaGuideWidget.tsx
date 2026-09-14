import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Sparkles, X, ChevronRight, ChevronLeft, Volume2, VolumeX, 
  Gamepad2, Compass, Brain, Award, RefreshCcw, 
  CheckCircle2, Play, MousePointerClick
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EstadoAvatarGuide = "idle" | "hablando" | "feliz" | "sorprendido";

// ── SVG de Aria (Avatar Tutorial RPG) ──────────────────────────────────────────────
function AriaAvatarSvg({ estado, className = "w-12 h-12" }: { estado: EstadoAvatarGuide; className?: string }) {
  const [bocaAbierta, setBocaAbierta] = useState(false);

  useEffect(() => {
    if (estado !== "hablando") {
      setBocaAbierta(false);
      return;
    }
    const id = setInterval(() => setBocaAbierta((v) => !v), 160);
    return () => clearInterval(id);
  }, [estado]);

  const blush = estado === "feliz" ? 0.85 : 0.45;
  const FUR = "#F5EBE0";
  const FUR_LIGHT = "#FFFDF9";
  const FUR_DARK = "#8D7B68";
  const OUTLINE = "#2C2523";
  const EAR_IN = "#F3A3B0";

  return (
    <svg viewBox="0 0 100 120" className={cn("transition-transform duration-300", className)}>
      {/* Orejas externas */}
      <path d="M20,32 Q12,12 18,2 Q28,4 34,20 Z" fill={FUR} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M80,32 Q88,12 82,2 Q72,4 66,20 Z" fill={FUR} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />

      {/* Orejas internas */}
      <path d="M22,29 Q16,15 20,6 Q26,8 29,20 Z" fill={EAR_IN} />
      <path d="M78,29 Q84,15 80,6 Q74,8 71,20 Z" fill={EAR_IN} />

      {/* Cabeza */}
      <ellipse cx="50" cy="46" rx="34" ry="29" fill={FUR} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="50" cy="58" rx="16" ry="11" fill={FUR_LIGHT} />

      {/* Rayas frente */}
      <path d="M49,18 Q50,24 50,28 Q51,24 51,18 Z" fill={FUR_DARK} />
      <path d="M42,20 Q44,25 45,29 Q46,25 44,20 Z" fill={FUR_DARK} />
      <path d="M58,20 Q56,25 55,29 Q54,25 56,20 Z" fill={FUR_DARK} />

      {/* Rubores */}
      <ellipse cx="28" cy="54" rx="5" ry="3" fill="#E76F51" opacity={blush} />
      <ellipse cx="72" cy="54" rx="5" ry="3" fill="#E76F51" opacity={blush} />

      {/* Ojos según estado */}
      {estado === "feliz" ? (
        <>
          <path d="M31,44 Q36,36 41,44" fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M59,44 Q64,36 69,44" fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : estado === "sorprendido" ? (
        <>
          <circle cx="36" cy="42" r="6" fill={OUTLINE} />
          <circle cx="64" cy="42" r="6" fill={OUTLINE} />
          <circle cx="38" cy="40" r="2" fill="#FFF" />
          <circle cx="66" cy="40" r="2" fill="#FFF" />
        </>
      ) : (
        <>
          <ellipse cx="36" cy="42" rx="4.5" ry="5.5" fill={OUTLINE} />
          <ellipse cx="64" cy="42" rx="4.5" ry="5.5" fill={OUTLINE} />
          <circle cx="38" cy="40" r="1.5" fill="#FFF" />
          <circle cx="66" cy="40" r="1.5" fill="#FFF" />
        </>
      )}

      {/* Gafas moradas */}
      <circle cx="36" cy="43" r="11" fill="none" stroke="#A855F7" strokeWidth="2.2" />
      <circle cx="64" cy="43" r="11" fill="none" stroke="#A855F7" strokeWidth="2.2" />
      <line x1="47" y1="43" x2="53" y2="43" stroke="#A855F7" strokeWidth="2.2" />

      {/* Nariz */}
      <polygon points="50,52 47,48 53,48" fill={OUTLINE} />

      {/* Boca animada */}
      {bocaAbierta ? (
        <path d="M45,56 Q50,64 55,56 Z" fill="#E76F51" stroke={OUTLINE} strokeWidth="1.5" />
      ) : estado === "feliz" ? (
        <path d="M45,55 Q50,61 55,55" fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M46,56 Q50,59 54,56" fill="none" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

export interface StepGuide {
  id: string;
  targetSelector?: string;
  badge: string;
  titulo: string;
  descripcion: string;
  tip?: string;
  requireClick?: boolean;
  clickTargetSelector?: string;
  nextText?: string;
}

const PASOS_TOUR_INTERACTIVO: StepGuide[] = [
  {
    id: "bienvenida",
    badge: "Misión 1: ¡Bienvenido A bordo!",
    titulo: "¡Hola! Soy Aria, tu Tutora Interactiva 🎒",
    descripcion: "Te llevaré de la mano paso a paso para que conozcas los módulos y herramientas principales de tu plataforma.",
    tip: "Presiona '¡Empezar Misión!' para comenzar el recorrido.",
    nextText: "¡Empezar Misión! 🚀",
  },
  {
    id: "hero-banner",
    targetSelector: '[data-guide="hero-banner"]',
    badge: "Misión 2: Inicio y Saludo Principal",
    titulo: "Panel Principal y Acción Directa 🏠",
    descripcion: "Este banner detecta tu avance actual y te ofrece el botón directo para rendir tu práctica recomendada.",
    tip: "Presiona '¡Siguiente Componente!' para continuar.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "stats-cards",
    targetSelector: '[data-guide="stats-cards"]',
    badge: "Misión 3: Rendimiento General",
    titulo: "Racha, Promedio General y Prácticas 📊",
    descripcion: "Monitorea tus **Días Seguidos** practicando (racha), tu **Promedio General** sobre 20 y el total de exámenes rendidos.",
    tip: "Presiona '¡Siguiente Componente!' para continuar.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "temas-reforzar",
    targetSelector: '[data-guide="temas-reforzar"]',
    badge: "Misión 4: Refuerzo Inteligente",
    titulo: "Temas Concretos que Debes Reforzar 💡",
    descripcion: "La plataforma analiza tus respuestas y te muestra los conceptos puntuales donde necesitas más práctica.",
    tip: "Presiona '¡Siguiente Componente!' para ver tu rango.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "tarjeta-progreso",
    targetSelector: '[data-guide="tarjeta-progreso"]',
    badge: "Misión 4: Tu Rango y Puntos RPG",
    titulo: "Nivel de Progreso y Puntos Acumulados 🏆",
    descripcion: "Acumula puntos de progreso y sube de rango personal demostrando tu constancia día a día.",
    tip: "Presiona '¡Siguiente Componente!' para ver tus cursos.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "seccion-cursos",
    targetSelector: '[data-guide="seccion-cursos"], [data-guide="lista-cursos"]',
    badge: "Misión 5: Cursos Inscritos",
    titulo: "Tus Cursos y Modalidades de Práctica 📚",
    descripcion: "Ingresa a cualquiera de tus materias y rinde evaluaciones en modo Adaptativo, Avatar Tutor Aria o VideoTutor.",
    tip: "Presiona '¡Continuar Misión!' para ir al Mapa de Conocimiento.",
    nextText: "¡Continuar Misión! 🚀",
  },
  {
    id: "clic-mapa",
    targetSelector: '[data-guide="nav-mapa"]',
    clickTargetSelector: '[data-guide="nav-mapa"]',
    badge: "Misión 6: Diagnóstico Cognitivo",
    titulo: "Haz clic en 'Mapa de Conocimiento' 🧠",
    descripcion: "Haz clic en la pestaña **'Mapa de Conocimiento'** resaltada en el menú superior.",
    tip: "👇 Presiona 'Mapa de Conocimiento' en la barra superior.",
    requireClick: true,
  },
  {
    id: "resumen-mapa-stats",
    targetSelector: '[data-guide="resumen-mapa-stats"]',
    badge: "Misión 7: Resumen del Mapa",
    titulo: "Tarjetas de Temas Evaluados y Niveles 📊",
    descripcion: "Resumen rápido del total de temas evaluados, conceptos dominados, en progreso y los que requieren refuerzo urgente.",
    tip: "Presiona '¡Siguiente Componente!' para ver la nube de nodos.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "explicacion-mapa",
    targetSelector: '[data-guide="mapa-nodos"]',
    badge: "Misión 8: Mapa de Calor por Tema",
    titulo: "Nube de Nodos de Conceptos 🧬",
    descripcion: "Las cápsulas en **Verde** indican temas dominados (≥75%), **Amarillo** en progreso (50-74%) y **Rojo** los que debes reforzar (<50%).",
    tip: "Presiona '¡Siguiente Componente!' para ver la matriz.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "matriz-cursos",
    targetSelector: '[data-guide="matriz-cursos"]',
    badge: "Misión 9: Matriz Bi-dimensional",
    titulo: "Matriz Cursos x Semanas 📅",
    descripcion: "Cruza tus asignaturas por semanas. Cada celda muestra tu porcentaje de aciertos e intentos acumulados.",
    tip: "Presiona '¡Siguiente Componente!' para ver la curva de evolución.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "curva-progreso",
    targetSelector: '[data-guide="curva-progreso"]',
    badge: "Misión 10: Curva de Progreso",
    titulo: "Curva de Evolución Académica 📈",
    descripcion: "Grafica tu nota promedio semana a semana para monitorear tu crecimiento continuo.",
    tip: "Presiona '¡Siguiente Componente!' para ver el panel lateral.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "desglose-panel",
    targetSelector: '[data-guide="desglose-panel"]',
    badge: "Misión 11: Desglose Cognitivo",
    titulo: "Panel Lateral de Detalle 🔍",
    descripcion: "Muestra el porcentaje exacto de aciertos, preguntas contestadas y nivel Bloom del tema seleccionado.",
    tip: "Presiona '¡Ir al Historial!' para avanzar.",
    nextText: "¡Ir al Historial! 🚀",
  },
  {
    id: "clic-historial",
    targetSelector: '[data-guide="nav-historial"]',
    clickTargetSelector: '[data-guide="nav-historial"]',
    badge: "Misión 12: Registro de Intentos",
    titulo: "Haz clic en 'Historial' 🏆",
    descripcion: "Haz clic en la pestaña **'Historial'** en el menú superior para revisar tus calificaciones.",
    tip: "👇 Presiona 'Historial' en el menú superior.",
    requireClick: true,
  },
  {
    id: "boton-descargar",
    targetSelector: '[data-guide="boton-descargar"]',
    badge: "Misión 13: Exportación de Datos",
    titulo: "Botón de Descarga de Preguntas y Respuestas 📥",
    descripcion: "Permite descargar a tu computadora un informe detallado en HTML/JSON con tus preguntas, respuestas y retroalimentaciones.",
    tip: "Presiona '¡Siguiente Componente!' para ver tu gráfico.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "grafico-evolucion",
    targetSelector: '[data-guide="grafico-evolucion"]',
    badge: "Misión 14: Evolución de Calificaciones",
    titulo: "Gráfico Histórico de Notas 📈",
    descripcion: "Evolución gráfica de tus notas obtenidas en tus últimos exámenes rendidos.",
    tip: "Presiona '¡Siguiente Componente!' para ver tu promedio.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "tarjeta-promedio",
    targetSelector: '[data-guide="tarjeta-promedio"]',
    badge: "Misión 15: Promedio General",
    titulo: "Tarjeta de Promedio Acumulado 🎯",
    descripcion: "Muestra tu nota promedio histórica general calculada sobre la escala de 20 puntos.",
    tip: "Presiona '¡Siguiente Componente!' para ver tus exámenes.",
    nextText: "¡Siguiente Componente! ➡️",
  },
  {
    id: "tarjetas-historial",
    targetSelector: '[data-guide="tarjetas-historial"]',
    badge: "Misión 16: Exámenes e Informes IA",
    titulo: "Tarjetas de Intentos y Retroalimentación 📝",
    descripcion: "Revisa cada examen rendido con las notas sobre 20 y las sugerencias pedagógicas detalladas de la IA.",
    tip: "Presiona '¡Regresar a Inicio!' para concluir.",
    nextText: "¡Regresar a Inicio! 🚀",
  },
  {
    id: "clic-inicio",
    targetSelector: '[data-guide="nav-inicio"]',
    clickTargetSelector: '[data-guide="nav-inicio"]',
    badge: "Misión 17: Regresar al Inicio",
    titulo: "Haz clic en 'Inicio' para Regresar 🏠",
    descripcion: "¡Casi terminamos! Haz clic en la pestaña **'Inicio'** del menú superior para regresar a la pantalla principal.",
    tip: "👇 Presiona 'Inicio' en la barra de navegación superior.",
    requireClick: true,
  },
  {
    id: "finalizar-tour",
    badge: "Misión 18: ¡Tour Completado! 🎉",
    titulo: "¡Felicidades, Misión Cumplida! 🏆",
    descripcion: "Has completado el recorrido completo de Semantika. Ahora conoces todas las herramientas: tu panel, el mapa de conocimiento y tu historial. ¡A practicar!",
    tip: "Presiona '¡Finalizar Tour!' para cerrar la guía.",
    nextText: "¡Finalizar Tour! 🎉",
  },
];

export default function AriaGuideWidget() {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [estadoAvatar, setEstadoAvatar] = useState<EstadoAvatarGuide>("idle");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const primerNombre = user.name?.split(" ")[0] || "Aventurero/a";

  // Auto-mostrar el modal de bienvenida únicamente para nuevos usuarios al entrar a /app
  useEffect(() => {
    const welcomeSeen = localStorage.getItem("aria_welcome_seen");
    if (!welcomeSeen && location.pathname === "/app") {
      setWelcomeModalOpen(true);
    }
  }, [location.pathname]);

  // Manejo de síntesis de voz (SpeechSynthesis)
  const hablarVoz = (texto: string) => {
    if (!soundEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const textoLimpio = texto
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "");

    const utterance = new SpeechSynthesisUtterance(textoLimpio);
    utterance.lang = "es-ES";
    utterance.rate = 1.02;
    utterance.pitch = 1.15;

    utterance.onstart = () => setEstadoAvatar("hablando");
    utterance.onend = () => setEstadoAvatar("feliz");
    utterance.onerror = () => setEstadoAvatar("idle");

    window.speechSynthesis.speak(utterance);
  };

  // Posicionar la máscara de spotlight transparente cuando cambia el paso
  useEffect(() => {
    if (!tourActive) {
      setTargetRect(null);
      localStorage.removeItem("aria_tour_step");
      window.dispatchEvent(new Event("aria_tour_change"));
      return;
    }

    const currentStep = PASOS_TOUR_INTERACTIVO[currentStepIndex];
    if (!currentStep) return;

    localStorage.setItem("aria_tour_step", currentStep.id);
    window.dispatchEvent(new Event("aria_tour_change"));

    hablarVoz(currentStep.descripcion);

    if (!currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(currentStep.targetSelector!);
      if (element) {
        const rawRect = element.getBoundingClientRect();
        setTargetRect(rawRect);
      } else {
        setTargetRect(null);
      }
    };

    // Auto-scrollear de forma suave al componente
    const element = document.querySelector(currentStep.targetSelector);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    // Actualizaciones multietapa mientras se completa la animación de scroll
    updateRect();
    const t1 = setTimeout(updateRect, 100);
    const t2 = setTimeout(updateRect, 250);
    const t3 = setTimeout(updateRect, 450);
    const t4 = setTimeout(updateRect, 650);

    // Escuchar scroll (capture=true para divs con scroll interno) y resize dinámico
    window.addEventListener("scroll", updateRect, { capture: true, passive: true });
    window.addEventListener("resize", updateRect, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("scroll", updateRect, { capture: true });
      window.removeEventListener("resize", updateRect);
    };
  }, [tourActive, currentStepIndex, location.pathname]);

  // Manejar el evento interactivo de clic real por parte del usuario
  useEffect(() => {
    if (!tourActive) return;

    const currentStep = PASOS_TOUR_INTERACTIVO[currentStepIndex];
    if (!currentStep || !currentStep.requireClick || !currentStep.clickTargetSelector) return;

    const targetElement = document.querySelector(currentStep.clickTargetSelector);
    if (!targetElement) return;

    const handleUserClick = () => {
      setEstadoAvatar("sorprendido");
      setTimeout(() => {
        if (currentStepIndex < PASOS_TOUR_INTERACTIVO.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          finalizarTour();
        }
      }, 250);
    };

    targetElement.addEventListener("click", handleUserClick, { once: true });
    return () => {
      targetElement.removeEventListener("click", handleUserClick);
    };
  }, [tourActive, currentStepIndex]);

  const cerrarBienvenida = (marcarComoVisto = true) => {
    if (marcarComoVisto) {
      localStorage.setItem("aria_welcome_seen", "true");
    }
    setWelcomeModalOpen(false);
  };

  const iniciarTour = () => {
    cerrarBienvenida(true);
    setMenuOpen(false);
    setCurrentStepIndex(0);
    localStorage.setItem("aria_tour_active", "true");
    window.dispatchEvent(new Event("aria_tour_change"));
    setTourActive(true);
    setEstadoAvatar("hablando");
    if (location.pathname !== "/app") {
      navigate("/app");
    }
  };

  const finalizarTour = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    localStorage.removeItem("aria_tour_active");
    localStorage.removeItem("aria_tour_step");
    window.dispatchEvent(new Event("aria_tour_change"));
    setTourActive(false);
    setTargetRect(null);
    setEstadoAvatar("feliz");
    setTimeout(() => setEstadoAvatar("idle"), 3000);
  };

  const pasoSiguiente = () => {
    if (currentStepIndex < PASOS_TOUR_INTERACTIVO.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      finalizarTour();
    }
  };

  const pasoAnterior = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const pasoActual = PASOS_TOUR_INTERACTIVO[currentStepIndex];

  // Determinar la posición inteligente del cuadro HUD de Aria para NUNCA tapar el elemento
  const targetEnParteInferior = targetRect && targetRect.top > window.innerHeight / 2;

  return (
    <>
      {/* ── BOTÓN FLOTANTE LANZADOR GUÍA ARIA (Estilo videojuego HUD) ────────────────────────────── */}
      {!tourActive && (
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir Menú Guía Aria"
          className={cn(
            "fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-3 p-2.5 pr-4 rounded-2xl",
            "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300",
            "ring-4 ring-purple-500/20 active:scale-95 border border-purple-300/40"
          )}
        >
          <div className="relative w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/40 shadow-inner shrink-0">
            <AriaAvatarSvg estado={estadoAvatar} className="w-11 h-11" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-purple-600 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs tracking-wide uppercase text-purple-100">
                Guía Aria 🎮
              </span>
              <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-spin-slow" />
            </div>
            <span className="text-[11px] text-white/90 font-medium">Asistente Interactiva</span>
          </div>
        </button>
      )}

      {/* ── MENÚ DE SELECCIÓN DE TOURS / GUÍAS ───────────────────────────── */}
      {menuOpen && !tourActive && (
        <div className="fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-50 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-3xl p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-foreground leading-tight">
                  Centro de Guía de Aria
                </h3>
                <p className="text-[11px] text-muted-foreground">Misiones interactivas de aprendizaje</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={iniciarTour}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-950 dark:text-purple-200 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-xs">🎮 Tour Guiado Interactivo</p>
                <p className="text-[10px] opacity-80 truncate">Aria te lleva de la mano por el sistema</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate("/app/mapa-conocimiento");
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted text-foreground transition-colors text-left"
            >
              <Brain className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-xs">Ir al Mapa de Conocimiento</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate("/app/historial");
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted text-foreground transition-colors text-left"
            >
              <Award className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-xs">Ir al Historial de Calificaciones</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-500" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Voz de Aria {soundEnabled ? "Activada" : "Silenciada"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setWelcomeModalOpen(true);
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <RefreshCcw className="w-3 h-3" /> Ver Bienvenida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE BIENVENIDA ESTILO VIDEOJUEGO INTRO ───────────────────────────── */}
      {welcomeModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarBienvenida(true);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300"
        >
          <div className="w-full max-w-lg bg-card border-2 border-purple-500/40 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 text-center relative overflow-hidden">
            {/* Botón de cierre X */}
            <button
              type="button"
              onClick={() => cerrarBienvenida(true)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Adornos retro/game visuales */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-center">
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 p-1 shadow-xl">
                <div className="w-full h-full bg-card rounded-[22px] flex items-center justify-center overflow-hidden">
                  <AriaAvatarSvg estado="feliz" className="w-24 h-24" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Sparkles className="w-3.5 h-3.5" /> Misión Inicial
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">
                ¡Bienvenido/a, {primerNombre}! 🎒
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Soy **Aria**, tu tutora y guía interactiva en Semantika. Te llevaré de la mano paso a paso para que aprendas a usar tu plataforma.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 text-left text-xs space-y-2">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-500" /> ¿Qué haremos en la guía interactiva?
              </p>
              <ul className="space-y-1 text-muted-foreground pl-5 list-disc">
                <li>Te indicaré exactamente dónde hacer clic en la aplicación real.</li>
                <li>Exploraremos tu Mapa de Conocimiento y tu Historial de Calificaciones.</li>
                <li>Aprenderás cómo funcionan tus evaluaciones adaptativas y por avatar.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={iniciarTour}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                ¡Sí, iniciar Tour Guiado!
              </button>

              <button
                type="button"
                onClick={() => cerrarBienvenida(true)}
                className="h-12 px-5 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-sm transition-colors"
              >
                Omitir por ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MÁSCARA SPOTLIGHT + HUD DE DIÁLOGO DE ARIA ──────────────────────────────────── */}
      {tourActive && pasoActual && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* BLOQUEADOR: 4 divs alrededor del hueco, o fondo completo si no hay objetivo */}
          {targetRect ? (() => {
            const PAD = 14;
            const posX = Math.max(4, targetRect.left - PAD);
            const posY = Math.max(4, targetRect.top - PAD);
            const posW = targetRect.width + (PAD * 2);
            const posH = targetRect.height + (PAD * 2);
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const dark = { pointerEvents: "auto" as const, background: "rgba(0,0,0,0.72)" };

            return (
              <>
                {/* Cuatro franjas que cubren todo EXCEPTO el hueco del spotlight */}
                <div className="fixed z-40" style={{ ...dark, top: 0, left: 0, width: vw, height: posY }} />
                <div className="fixed z-40" style={{ ...dark, top: posY + posH, left: 0, width: vw, height: Math.max(0, vh - posY - posH) }} />
                <div className="fixed z-40" style={{ ...dark, top: posY, left: 0, width: posX, height: posH }} />
                <div className="fixed z-40" style={{ ...dark, top: posY, left: posX + posW, width: Math.max(0, vw - posX - posW), height: posH }} />

                {/* Cuando el paso NO requiere clic: bloqueamos también el hueco */}
                {!pasoActual.requireClick && (
                  <div
                    className="fixed z-[41]"
                    style={{ top: posY, left: posX, width: posW, height: posH, pointerEvents: "auto", cursor: "not-allowed" }}
                  />
                )}

                {/* RECUADRO RESALTE MORADO (solo visual, sin eventos) */}
                <div
                  className="fixed z-50 pointer-events-none flex flex-col items-center transition-all duration-150"
                  style={{ top: posY, left: posX, width: posW, height: posH }}
                >
                  <div className="w-full h-full rounded-2xl border-4 border-purple-400 shadow-[0_0_35px_rgba(168,85,247,0.85)] animate-pulse" />
                  <div
                    className={cn(
                      "absolute bg-purple-600 text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-50 whitespace-nowrap",
                      posY < 70 ? "-bottom-10" : "-top-10"
                    )}
                  >
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>{pasoActual.requireClick ? "¡HAZ CLIC AQUÍ!" : "🔍 COMPONENTE DESTACADO"}</span>
                  </div>
                </div>
              </>
            );
          })() : (
            /* Sin objetivo: fondo oscuro completo, bloquea todos los clics */
            <div className="fixed inset-0 bg-black/70 z-40" style={{ pointerEvents: "auto" }} />
          )}

          {/* BARRA HUD DE DIÁLOGO DE ARIA (Posición Inteligente Top/Bottom para no obstruir) */}
          <div
            className={cn(
              "fixed left-4 right-4 z-50 pointer-events-auto w-full max-w-2xl bg-card border-2 border-purple-500/50 shadow-2xl rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-300",
              targetEnParteInferior
                ? "top-20 sm:top-24 sm:left-1/2 sm:-translate-x-1/2"
                : "bottom-4 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2"
            )}
          >
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 p-0.5 shadow-md shrink-0">
              <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center overflow-hidden">
                <AriaAvatarSvg estado={estadoAvatar} className="w-16 h-16" />
              </div>
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  {pasoActual.badge}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Paso {currentStepIndex + 1} de {PASOS_TOUR_INTERACTIVO.length}
                </span>
              </div>

              <h4 className="font-display font-bold text-base text-foreground leading-snug">
                {pasoActual.titulo}
              </h4>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {pasoActual.descripcion.replace(/\*\*/g, "")}
              </p>

              {pasoActual.tip && (
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium pt-0.5">
                  {pasoActual.tip}
                </p>
              )}
            </div>

            {/* BOTONES DE CONTROL DE MISIÓN / TOUR */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={pasoAnterior}
                disabled={currentStepIndex === 0}
                className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground disabled:opacity-30 transition-colors"
                title="Paso anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {!pasoActual.requireClick && (
                <button
                  type="button"
                  onClick={pasoSiguiente}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {currentStepIndex === PASOS_TOUR_INTERACTIVO.length - 1 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> ¡Finalizar Tour!
                    </>
                  ) : (
                    <>
                      {pasoActual.nextText || "Siguiente"} <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {pasoActual.requireClick && (
                <div className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                  <MousePointerClick className="w-4 h-4" /> Esperando tu clic...
                </div>
              )}

              {currentStepIndex === PASOS_TOUR_INTERACTIVO.length - 1 && (
                <button
                  type="button"
                  onClick={finalizarTour}
                  className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors text-xs font-semibold"
                  title="Finalizar del tour"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
