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

export type WeekTopic = {
  week: number;
  title: string;
  subtopics: string[];
  status: "completado" | "en-curso" | "bloqueado";
  bestScore?: number;
};

export const courseSyllabus: Record<string, WeekTopic[]> = {
  bio: [
    { week: 1, title: "La célula y sus componentes", subtopics: ["Membrana", "Citoplasma", "Núcleo"], status: "completado", bestScore: 18 },
    { week: 2, title: "Transporte celular", subtopics: ["Difusión", "Ósmosis", "Transporte activo"], status: "completado", bestScore: 16 },
    { week: 3, title: "Mitosis y meiosis", subtopics: ["Fases del ciclo", "Mitosis", "Meiosis"], status: "en-curso", bestScore: 14 },
    { week: 4, title: "Genética mendeliana", subtopics: ["Leyes de Mendel", "Cruces", "Herencia"], status: "bloqueado" },
    { week: 5, title: "ADN y replicación", subtopics: ["Estructura ADN", "Replicación", "Mutaciones"], status: "bloqueado" },
  ],
  his: [
    { week: 1, title: "Culturas pre-incas", subtopics: ["Chavín", "Paracas", "Nazca"], status: "completado", bestScore: 15 },
    { week: 2, title: "Imperio Inca", subtopics: ["Organización", "Economía", "Religión"], status: "en-curso", bestScore: 13 },
    { week: 3, title: "Conquista y Virreinato", subtopics: ["Pizarro", "Encomiendas", "Sociedad colonial"], status: "bloqueado" },
    { week: 4, title: "Independencia del Perú", subtopics: ["San Martín", "Bolívar", "Ayacucho"], status: "bloqueado" },
  ],
  mat: [
    { week: 1, title: "Vectores", subtopics: ["Suma", "Producto escalar", "Norma"], status: "completado", bestScore: 19 },
    { week: 2, title: "Matrices", subtopics: ["Operaciones", "Determinantes", "Inversa"], status: "completado", bestScore: 18 },
    { week: 3, title: "Sistemas lineales", subtopics: ["Gauss", "Cramer", "Aplicaciones"], status: "en-curso", bestScore: 17 },
    { week: 4, title: "Espacios vectoriales", subtopics: ["Bases", "Dimensión", "Subespacios"], status: "bloqueado" },
  ],
  lit: [
    { week: 1, title: "Romanticismo", subtopics: ["Características", "Autores", "Obras"], status: "completado", bestScore: 12 },
    { week: 2, title: "Realismo", subtopics: ["Contexto", "Galdós", "Clarín"], status: "en-curso" },
    { week: 3, title: "Modernismo", subtopics: ["Darío", "Vallejo", "Estética"], status: "bloqueado" },
    { week: 4, title: "Generación del 98", subtopics: ["Unamuno", "Machado", "Baroja"], status: "bloqueado" },
  ],
};

export type EvalMode = "conversation" | "quiz" | "tf" | "classic";

export const evalModes: { id: EvalMode; title: string; emoji: string; description: string; bullets: string[]; color: "primary" | "lime" | "coral" | "accent"; duration: string }[] = [
  {
    id: "conversation",
    title: "Conversación con avatar",
    emoji: "🎙️",
    description: "Habla con tu tutor virtual. Él te pregunta, tú respondes en voz alta.",
    bullets: ["Solo voz", "Repite la pregunta cuando quieras", "Calificación con IA"],
    color: "primary",
    duration: "10–15 min",
  },
  {
    id: "quiz",
    title: "Quiz de opción múltiple",
    emoji: "🔤",
    description: "Preguntas con 4 alternativas. Rápido y directo.",
    bullets: ["10 preguntas", "Una alternativa correcta", "Resultado instantáneo"],
    color: "lime",
    duration: "5–8 min",
  },
  {
    id: "tf",
    title: "Verdadero o Falso",
    emoji: "✅",
    description: "Afirmaciones cortas para evaluar conceptos clave.",
    bullets: ["10 afirmaciones", "Marca V o F", "Ideal para repaso veloz"],
    color: "coral",
    duration: "3–5 min",
  },
  {
    id: "classic",
    title: "Examen clásico",
    emoji: "📝",
    description: "Mezcla de preguntas abiertas, opción múltiple y V/F. Como un examen real.",
    bullets: ["Preguntas mixtas", "Tiempo limitado", "Nota sobre 20"],
    color: "accent",
    duration: "20–30 min",
  },
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