export interface AttemptAnswer {
  preguntaTexto: string;
  respuestaEstudiante: string;
  esCorrecta: boolean;
  tipoPregunta: string;
}

export interface SaveAttemptRequest {
  usuarioId: number | string;
  semanaId: number | string;
  notaFinal: number;
  tecnica?: string;
  respuestas: AttemptAnswer[];
}

export interface AttemptRecord {
  id: number | string;
  semana: number;
  cursoNombre: string;
  cursoEmoji: string;
  nota: number;
  fecha: string;
  tecnica?: string;
  attemptNumber?: number;
  respuestas: {
    pregunta: string;
    respuesta: string;
    esCorrecta: boolean;
  }[];
}
