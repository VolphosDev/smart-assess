import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, X, Send, Volume2, VolumeX, HelpCircle, 
  BookOpen, Award, Compass, ChevronDown, 
  RotateCcw, Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/api/client";

export type EstadoAvatarHelp = "idle" | "pensando" | "hablando" | "escuchando" | "feliz";

interface MensajeHelp {
  id: string;
  sender: "aria" | "usuario";
  texto: string;
  timestamp: string;
}

// ── SVG de Aria (Asistente Tutor) ──────────────────────────────────────────────
function AriaAvatarSvg({ estado, className = "w-10 h-10" }: { estado: EstadoAvatarHelp; className?: string }) {
  const [bocaAbierta, setBocaAbierta] = useState(false);

  useEffect(() => {
    if (estado !== "hablando") {
      setBocaAbierta(false);
      return;
    }
    const id = setInterval(() => setBocaAbierta((v) => !v), 160);
    return () => clearInterval(id);
  }, [estado]);

  const blush = estado === "feliz" ? 0.85 : estado === "escuchando" ? 0.6 : 0.4;
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
      {estado === "pensando" ? (
        <>
          <ellipse cx="36" cy="42" rx="4" ry="4" fill={OUTLINE} />
          <ellipse cx="64" cy="42" rx="4" ry="4" fill={OUTLINE} />
          <path d="M32,35 Q36,32 40,35" fill="none" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M60,35 Q64,32 68,35" fill="none" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : estado === "feliz" ? (
        <>
          <path d="M31,44 Q36,36 41,44" fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M59,44 Q64,36 69,44" fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="36" cy="42" rx="4.5" ry="5.5" fill={OUTLINE} />
          <ellipse cx="64" cy="42" rx="4.5" ry="5.5" fill={OUTLINE} />
          <circle cx="38" cy="40" r="1.5" fill="#FFF" />
          <circle cx="66" cy="40" r="1.5" fill="#FFF" />
        </>
      )}

      {/* Gafas doradas estilo Canvas Tutor */}
      <circle cx="36" cy="43" r="11" fill="none" stroke="#FFB703" strokeWidth="2.2" />
      <circle cx="64" cy="43" r="11" fill="none" stroke="#FFB703" strokeWidth="2.2" />
      <line x1="47" y1="43" x2="53" y2="43" stroke="#FFB703" strokeWidth="2.2" />

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

// ── FAQ Preguntas Frecuentes estilo Canvas Support ──────────────────────────────
const FAQ_OPCIONES = [
  {
    id: "evaluaciones",
    icon: BookOpen,
    label: "¿Cómo realizar mis evaluaciones?",
    respuesta:
      "¡Es muy sencillo! En cada semana de tu curso encontrarás 3 modalidades interactiva:\n" +
      "1. **Adaptativa**: Preguntas escritas con ajuste dinámico de dificultad.\n" +
      "2. **Avatar Tutor (Aria)**: Diálogo conversacional por voz y texto conmigo.\n" +
      "3. **VideoTutor**: Análisis guiado de fragmentos interactivos de video.",
  },
  {
    id: "notas",
    icon: Award,
    label: "¿Dónde consulto mis notas e historial?",
    respuesta:
      "Puedes ver tus calificaciones detalladas y avances desde la pestaña **Historial** en la barra superior. Allí verás tus intentos completados, puntajes y la retroalimentación entregada por los agentes.",
  },
  {
    id: "mapa",
    icon: Compass,
    label: "¿Qué es el Mapa de Conocimiento?",
    respuesta:
      "El **Mapa de Conocimiento** te muestra visualmente los conceptos clave que vas dominando (nodos en verde o azul) y aquellos que requieren más práctica (nodos amarillos o rojos), permitiéndote reforzar de forma focalizada.",
  },
  {
    id: "duda_curso",
    icon: HelpCircle,
    label: "Tengo una duda sobre un tema del curso",
    respuesta:
      "¡Escríbeme tu duda aquí mismo en el chat! Puedo explicarte conceptos académicos, aclararte términos complejos o darte pistas para resolver tus tareas.",
  },
];

export default function AriaHelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [estado, setEstado] = useState<EstadoAvatarHelp>("idle");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inputTexto, setInputTexto] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [mensajes, setMensajes] = useState<MensajeHelp[]>([
    {
      id: "bienvenida",
      sender: "aria",
      texto:
        "¡Hola! Soy **Aria**, tu asistente de ayuda de Semantika. 🐾\n¿En qué te puedo ayudar hoy con tu plataforma o tus evaluaciones?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [mensajes, isOpen, isMinimized]);

  // Síntesis de voz (Text To Speech) en español
  const hablarVoz = (textoLimpio: string) => {
    if (!soundEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // Eliminar formato Markdown para la voz
    const textoParaVoz = textoLimpio
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "");

    const utterance = new SpeechSynthesisUtterance(textoParaVoz);
    utterance.lang = "es-ES";
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Tono más cálido para Aria

    utterance.onstart = () => setEstado("hablando");
    utterance.onend = () => setEstado("idle");
    utterance.onerror = () => setEstado("idle");

    window.speechSynthesis.speak(utterance);
  };

  const responderMensaje = async (consulta: string, respuestaPersonalizada?: string) => {
    const userMsg: MensajeHelp = {
      id: Date.now().toString(),
      sender: "usuario",
      texto: consulta,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMensajes((prev) => [...prev, userMsg]);
    setInputTexto("");
    setEstado("pensando");
    setIsTyping(true);

    let finalAnswer = "";

    if (respuestaPersonalizada) {
      // Si proviene de un FAQ directo
      await new Promise((r) => setTimeout(r, 600));
      finalAnswer = respuestaPersonalizada;
    } else {
      // Consultar al backend Gemini si está disponible, o dar respuesta inteligente
      try {
        const promptAyuda =
          "Eres Aria, una tutora y asistente de ayuda académica amable y motivadora en la plataforma educativa Semantika. " +
          "Responde al estudiante de manera clara, concisa y empática en máximo 3 párrafos cortos. " +
          `Pregunta del alumno: "${consulta}"`;

        const res = await apiClient.post<{ text?: string } | string>("/gemini/ask", { prompt: promptAyuda });
        if (typeof res === "string") {
          finalAnswer = res;
        } else if (res && typeof res.text === "string") {
          finalAnswer = res.text;
        } else {
          finalAnswer =
            "Entiendo tu consulta. Recuerda que en cada semana del curso puedes repasar tus temas en el Mapa de Conocimiento o dialogar en mi modo Avatar Tutor en las evaluaciones.";
        }
      } catch (err) {
        console.warn("Respuesta local de contingencia para el asistente de ayuda:", err);
        finalAnswer =
          "¡Excelente pregunta! Recuerda que estoy siempre aquí para ayudarte. Si requieres orientación sobre un ejercicio específico, puedes revisar los recursos de la semana o consultar el Mapa de Conocimiento.";
      }
    }

    setIsTyping(false);
    setEstado("feliz");

    const ariaMsg: MensajeHelp = {
      id: (Date.now() + 1).toString(),
      sender: "aria",
      texto: finalAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMensajes((prev) => [...prev, ariaMsg]);
    hablarVoz(finalAnswer);

    setTimeout(() => {
      setEstado("idle");
    }, 4000);
  };

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTexto.trim() || isTyping) return;
    responderMensaje(inputTexto.trim());
  };

  const handleReiniciarChat = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setMensajes([
      {
        id: "bienvenida",
        sender: "aria",
        texto:
          "¡Hola! Soy **Aria**, tu asistente de ayuda de Semantika. 🐾\n¿En qué te puedo ayudar hoy con tu plataforma o tus evaluaciones?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setEstado("idle");
  };

  return (
    <>
      {/* ── BOTÓN FLOTANTE LAUNCHER ESTILO CANVAS ────────────────────────────── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Abrir asistente de ayuda Aria"
          className={cn(
            "fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 p-2.5 pr-4 rounded-full",
            "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300",
            "ring-4 ring-orange-500/20 active:scale-95"
          )}
        >
          <div className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/40 shadow-inner">
            <AriaAvatarSvg estado="idle" className="w-10 h-10" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-orange-500 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-1">
              <span className="font-display font-bold text-xs tracking-wide">Ayuda Aria</span>
              <Sparkles className="w-3 h-3 text-yellow-200 animate-spin-slow" />
            </div>
            <span className="text-[10px] text-white/90 font-medium">Asistente en línea</span>
          </div>
        </button>
      )}

      {/* ── VENTANA POPUP / PANEL DE ASISTENCIA ───────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 transition-all duration-300 ease-in-out flex flex-col bg-card border border-border shadow-2xl overflow-hidden",
            isMinimized
              ? "bottom-20 right-4 sm:bottom-6 sm:right-6 w-72 h-14 rounded-2xl"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[390px] h-[520px] max-h-[85vh] rounded-3xl"
          )}
        >
          {/* ENCABEZADO PANEL DE AYUDA DE ARIA */}
          <div className="bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-rose-500/90 backdrop-blur-md text-white p-3.5 px-4 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/40 shadow-inner shrink-0">
                <AriaAvatarSvg estado={estado} className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-sm tracking-tight leading-none text-white">
                    Aria Canvas Help
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mr-1 animate-pulse" />
                    En vivo
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-medium mt-0.5">
                  {estado === "pensando"
                    ? "Pensando respuesta..."
                    : estado === "hablando"
                    ? "Respondiendo..."
                    : "Asistente educativa interactiva"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Desactivar voz de Aria" : "Activar voz de Aria"}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/60" />}
              </button>

              <button
                type="button"
                onClick={handleReiniciarChat}
                title="Reiniciar conversación"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expandir" : "Minimizar"}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", isMinimized && "rotate-180")} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Cerrar ayuda"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CONTENIDO INTERIOR CUANDO NO ESTÁ MINIMIZADO */}
          {!isMinimized && (
            <div className="flex flex-col flex-1 min-h-0 bg-background/50">
              {/* ÁREA DE MENSAJES Y CHAT */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
                {mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex flex-col max-w-[85%]", msg.sender === "usuario" ? "ml-auto items-end" : "mr-auto items-start")}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs",
                        msg.sender === "usuario"
                          ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                          : "bg-muted/80 text-foreground border border-border/80 rounded-bl-xs"
                      )}
                    >
                      <div
                        className="prose prose-xs dark:prose-invert max-w-none space-y-1.5"
                        dangerouslySetInnerHTML={{
                          __html: msg.texto
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="mr-auto flex items-center gap-2 p-3 bg-muted/60 border border-border/60 rounded-2xl rounded-bl-xs text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Aria está redactando la ayuda...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* OPCIONES RÁPIDAS FAQ ESTILO CANVAS */}
              <div className="p-2 px-3 bg-card border-t border-border/60 shrink-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                  Atajos de ayuda rápida
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {FAQ_OPCIONES.map((faq) => {
                    const IconComp = faq.icon;
                    return (
                      <button
                        key={faq.id}
                        type="button"
                        onClick={() => responderMensaje(faq.label, faq.respuesta)}
                        disabled={isTyping}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border text-[11px] font-medium text-foreground whitespace-nowrap transition-all shrink-0 active:scale-95 disabled:opacity-50"
                      >
                        <IconComp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{faq.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CAMPO DE ENTRADA DE TEXTO */}
              <form onSubmit={handleEnviar} className="p-3 bg-card border-t border-border flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputTexto}
                  onChange={(e) => setInputTexto(e.target.value)}
                  placeholder="Escribe tu consulta o duda académica..."
                  disabled={isTyping}
                  className="flex-1 bg-muted/50 border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputTexto.trim() || isTyping}
                  className="w-8 h-8 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center shadow-xs transition-all active:scale-95 disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
