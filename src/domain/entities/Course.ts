export interface Material {
  id?: string;
  mongoId?: string;
  nombreArchivo: string;
  visible: boolean;
  tipo?: string;
}

export interface Week {
  id: string | number;
  numSem: string;
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
