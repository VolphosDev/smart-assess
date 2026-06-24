import React from "react";
import { 
  Dna, Landmark, Ruler, BookOpen, FlaskConical, Globe, Palette, Laptop, Music, Book, 
  CheckSquare, ShieldAlert, FileText, AlertTriangle, Image, Bot, Video, Brain, Mic, Type, CheckCircle2, FileEdit, HelpCircle
} from "lucide-react";
import { cn } from "./utils";

export const getCourseIcon = (emojiOrCode: string, className = "w-6 h-6") => {
  if (!emojiOrCode) return <Book className={className} />;
  
  const clean = emojiOrCode.trim();
  const map: Record<string, React.ComponentType<any>> = {
    // Emojis
    "🧬": Dna,
    "🏛️": Landmark,
    "📐": Ruler,
    "📚": BookOpen,
    "🧪": FlaskConical,
    "🌍": Globe,
    "🎨": Palette,
    "💻": Laptop,
    "🎵": Music,
    "📘": Book,
    
    // Codes
    "bio": Dna,
    "his": Landmark,
    "mat": Ruler,
    "lit": BookOpen,
    "che": FlaskConical,
    "geo": Globe,
    "art": Palette,
    "com": Laptop,
    "mus": Music,
    "def": Book,
  };

  const IconComponent = map[clean];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  return (
    <span className={cn("inline-grid place-items-center leading-none text-2xl md:text-3xl", className)}>
      {clean}
    </span>
  );
};

export const getEvalModeIcon = (emojiOrId: string, className = "w-6 h-6") => {
  const map: Record<string, React.ComponentType<any>> = {
    // Emojis/IDs in EvalModeSelect.tsx
    "☑️": CheckSquare,
    "OPCION_MULTIPLE": CheckSquare,
    "⚖️": ShieldAlert,
    "VERDADERO_FALSO": ShieldAlert,
    "✍️": FileText,
    "ABIERTA": FileText,
    "🔍": AlertTriangle,
    "DETECCION_ERRORES": AlertTriangle,
    "🖼️": Image,
    "VISUAL_QUIZ": Image,
    "🤖": Bot,
    "avatar": Bot,
    "🎬": Video,
    "video": Video,
    "🧠": Brain,
    "adaptativa": Brain,
    
    // Mock-data.ts modes / History modes
    "🎙️": Mic,
    "conversation": Mic,
    "🔤": Type,
    "quiz": Type,
    "✅": CheckCircle2,
    "tf": CheckCircle2,
    "📝": FileEdit,
    "classic": FileEdit,
  };

  const IconComponent = map[emojiOrId] || HelpCircle;
  return <IconComponent className={className} />;
};

export const getAvatarInitials = (name = "") => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface UserAvatarProps {
  name: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, className = "w-10 h-10" }) => {
  const initials = getAvatarInitials(name);
  
  // Professional background colors based on name hashing
  const colors = [
    "bg-slate-700 text-slate-100",
    "bg-indigo-700 text-indigo-100",
    "bg-emerald-700 text-emerald-100",
    "bg-sky-700 text-sky-100",
    "bg-zinc-700 text-zinc-100",
    "bg-teal-700 text-teal-100",
  ];
  
  const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorClass = colors[charCodeSum % colors.length];

  return (
    <div className={`rounded-full flex items-center justify-center font-semibold text-xs tracking-wider select-none shrink-0 ${colorClass} ${className}`} title={name}>
      {initials}
    </div>
  );
};
