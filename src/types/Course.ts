export interface Material {
  id?: string;
  mongoId?: string;
  nombreArchivo: string;
  visible: boolean;
  tipo?: string;
  subtemas?: string[];
}

export interface Week {
  id: string | number;
  /** Ordinal de la semana, ej. "Semana 1". Siempre presente. */
  numSem: string;
  /**
   * Nombre del tema que el docente le pone a la semana, ej. "El signo lingüístico".
   * Opcional: si el docente aún no lo definió, las vistas caen a `numSem`.
   */
  nombreTema?: string | null;
  totalPreguntas: number;
  materiales: Material[];
}

export interface Course {
  id: string | number;
  name: string;
  emoji?: string;
  color?: string;
  teacherId?: string;
  description?: string;
  weeks?: number;
  studentIds?: string[];
}
