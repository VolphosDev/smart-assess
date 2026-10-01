/**
 * Store en memoria + localStorage para mocks. Permite suscripciones
 * reactivas vía useSyncExternalStore.
 */
import { useSyncExternalStore, useRef } from "react";

export type Role = "admin" | "teacher" | "student";

export interface User {
    id: string;
    email: string;
    role: "student" | "teacher" | "admin";
    name: string;
    token: string;
    avatar?: string;
}

export type CourseRecord = {
  id: string;
  name: string;
  emoji: string;
  color: "primary" | "lime" | "coral";
  teacherId: string;
  description?: string;
  weeks: number;
  studentIds: string[];
};

export type MaterialRecord = {
  id: string;
  courseId: string;
  week: number;
  name: string;
  type: string; // pdf | docx | jpg | png
  size: string;
  dataUrl?: string; // base64 para preview
  uploadedAt: string;
};

export type GradeRecord = {
  id: string;
  courseId: string;
  week: number;
  studentId: string;
  topic: string;
  mode: "conversation" | "quiz" | "tf" | "classic";
  score: number;
  date: string;
};

type State = {
  users: User[];
  courses: CourseRecord[];
  materials: MaterialRecord[];
  grades: GradeRecord[];
  session?: { userId: string; role: Role };
};

const STORAGE_KEY = "semantika.mockdb.v1";

const seed: State = {
  users: [
    { id: "u-admin", name: "Admin", email: "admin@colegio.edu", role: "admin", avatar: "🛡️" },
    { id: "u-prof-1", name: "Prof. Rojas", email: "rojas@colegio.edu", role: "teacher", avatar: "👩‍🏫" },
    { id: "u-prof-2", name: "Prof. Salas", email: "salas@colegio.edu", role: "teacher", avatar: "👨‍🏫" },
    { id: "u-est-1", name: "Alex Quispe", email: "alex@colegio.edu", role: "student", avatar: "🚀" },
    { id: "u-est-2", name: "Camila R.", email: "camila@colegio.edu", role: "student", avatar: "🦊" },
    { id: "u-est-3", name: "Mateo L.", email: "mateo@colegio.edu", role: "student", avatar: "🐼" },
    { id: "u-est-4", name: "Sofía A.", email: "sofia@colegio.edu", role: "student", avatar: "🦄" },
  ],
  courses: [
    { id: "bio", name: "Biología Celular", emoji: "🧬", color: "lime", teacherId: "u-prof-1", weeks: 5, studentIds: ["u-est-1", "u-est-2", "u-est-3"] },
    { id: "his", name: "Historia del Perú", emoji: "🏛️", color: "coral", teacherId: "u-prof-1", weeks: 4, studentIds: ["u-est-1", "u-est-4"] },
    { id: "mat", name: "Álgebra Lineal", emoji: "📐", color: "primary", teacherId: "u-prof-2", weeks: 4, studentIds: ["u-est-1", "u-est-2"] },
  ],
  materials: [],
  grades: [
    { id: "g1", courseId: "bio", week: 1, studentId: "u-est-1", topic: "La célula", mode: "conversation", score: 18, date: "2026-04-28" },
    { id: "g2", courseId: "bio", week: 2, studentId: "u-est-1", topic: "Transporte celular", mode: "quiz", score: 16, date: "2026-05-04" },
    { id: "g3", courseId: "bio", week: 1, studentId: "u-est-2", topic: "La célula", mode: "conversation", score: 19, date: "2026-04-29" },
    { id: "g4", courseId: "bio", week: 2, studentId: "u-est-3", topic: "Transporte celular", mode: "tf", score: 14, date: "2026-05-05" },
    { id: "g5", courseId: "his", week: 1, studentId: "u-est-1", topic: "Culturas pre-incas", mode: "classic", score: 15, date: "2026-04-22" },
    { id: "g6", courseId: "mat", week: 1, studentId: "u-est-2", topic: "Vectores", mode: "quiz", score: 19, date: "2026-04-30" },
  ],
};

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {}
  return structuredClone(seed);
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    // evitar persistir dataUrls enormes en localStorage (>4MB)
    const slim: State = {
      ...state,
      materials: state.materials.map((m) => ({
        ...m,
        dataUrl: m.dataUrl && m.dataUrl.length > 200_000 ? undefined : m.dataUrl,
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {}
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const store = {
  getState: () => state,
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  update: (mutator: (s: State) => void) => {
    mutator(state);
    emit();
  },
  reset: () => {
    state = structuredClone(seed);
    emit();
  },
};

function shallowEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!Object.is(a[k], b[k])) return false;
    return true;
  }
  return false;
}

/**
 * useStore con cache de snapshot: si el selector devuelve una estructura
 * equivalente (shallow), reusa la referencia anterior para evitar loops
 * en useSyncExternalStore.
 */
export function useStore<T>(selector: (s: State) => T): T {
  const cache = useRef<{ value: T; has: boolean }>({ value: undefined as any, has: false });
  const get = () => {
    const next = selector(store.getState());
    if (cache.current.has && shallowEqual(cache.current.value, next)) {
      return cache.current.value;
    }
    cache.current = { value: next, has: true };
    return next;
  };
  return useSyncExternalStore((cb) => store.subscribe(cb), get, get);
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}