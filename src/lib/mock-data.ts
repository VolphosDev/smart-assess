export type Course = {
  id: string;
  name: string;
  emoji: string;
  color: "primary" | "lime" | "coral";
  progress: number;
  nextExam?: string;
};

export const courses: Course[] = [
  { id: "bio", name: "Biología Celular", emoji: "🧬", color: "lime", progress: 72, nextExam: "Mitosis y meiosis" },
  { id: "his", name: "Historia del Perú", emoji: "🏛️", color: "coral", progress: 48, nextExam: "Independencia" },
  { id: "mat", name: "Álgebra Lineal", emoji: "📐", color: "primary", progress: 91 },
  { id: "lit", name: "Literatura", emoji: "📚", color: "coral", progress: 35, nextExam: "El Modernismo" },
];

export type Question = {
  id: string;
  type: "open" | "mcq" | "tf";
  prompt: string;
  options?: string[];
  expectedHint?: string;
};

export const examQuestions: Question[] = [
  {
    id: "q1",
    type: "open",
    prompt: "Explica con tus propias palabras qué es la mitosis y por qué es importante para los organismos pluricelulares.",
    expectedHint: "División celular, dos células hijas idénticas, crecimiento y reparación.",
  },
  {
    id: "q2",
    type: "open",
    prompt: "¿Cuál es la diferencia principal entre la mitosis y la meiosis?",
    expectedHint: "Mitosis = células somáticas idénticas; meiosis = gametos con la mitad de cromosomas.",
  },
  {
    id: "q3",
    type: "mcq",
    prompt: "¿En qué fase del ciclo celular ocurre la replicación del ADN?",
    options: ["Fase G1", "Fase S", "Fase G2", "Fase M"],
    expectedHint: "Fase S",
  },
  {
    id: "q4",
    type: "tf",
    prompt: "La citocinesis es la división del núcleo en dos núcleos hijos. ¿Verdadero o falso?",
    options: ["Verdadero", "Falso"],
    expectedHint: "Falso — es la división del citoplasma.",
  },
  {
    id: "q5",
    type: "open",
    prompt: "Menciona dos ejemplos de células del cuerpo humano que se dividen frecuentemente por mitosis.",
    expectedHint: "Células de la piel, mucosa intestinal, médula ósea.",
  },
];

export type AttemptHistory = {
  id: string;
  course: string;
  topic: string;
  date: string;
  score: number;
  durationMin: number;
};

export const history: AttemptHistory[] = [
  { id: "a1", course: "Biología", topic: "Fotosíntesis", date: "2026-04-28", score: 18, durationMin: 12 },
  { id: "a2", course: "Historia", topic: "Virreinato", date: "2026-04-25", score: 15, durationMin: 14 },
  { id: "a3", course: "Álgebra", topic: "Matrices", date: "2026-04-22", score: 19, durationMin: 9 },
  { id: "a4", course: "Literatura", topic: "Romanticismo", date: "2026-04-18", score: 12, durationMin: 17 },
  { id: "a5", course: "Biología", topic: "Genética", date: "2026-04-14", score: 17, durationMin: 11 },
];

export const leaderboard = [
  { rank: 1, name: "Camila R.", points: 2480, streak: 14, you: false, avatar: "🦊" },
  { rank: 2, name: "Mateo L.", points: 2310, streak: 9, you: false, avatar: "🐼" },
  { rank: 3, name: "Tú", points: 2185, streak: 7, you: true, avatar: "🚀" },
  { rank: 4, name: "Sofía A.", points: 2050, streak: 5, you: false, avatar: "🦄" },
  { rank: 5, name: "Diego P.", points: 1920, streak: 3, you: false, avatar: "🐯" },
  { rank: 6, name: "Lucía M.", points: 1780, streak: 6, you: false, avatar: "🦋" },
  { rank: 7, name: "Andrés V.", points: 1640, streak: 2, you: false, avatar: "🐙" },
];