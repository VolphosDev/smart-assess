export interface AttemptAnswer {
  preguntaTexto: string;
  respuestaEstudiante: string;
  esCorrecta: boolean;
  tipoPregunta: string;
  /** Nivel de Bloom del lote de preguntas y tema puntual de esta pregunta. Alimentan el
   *  mapa de conocimiento por concepto (backend: ConocimientoBktService); opcionales para
   *  no romper llamadas existentes que aún no los envían. */
  nivelBloom?: string | null;
  conceptos?: string | null;
  /** Criterio con el que se calificó la pregunta y explicación del juez. Se persisten para
   *  que el historial pueda mostrar qué era lo correcto y por qué, no solo si acertó. */
  respuestaCorrecta?: string | null;
  retroalimentacion?: string | null;
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
  nombreTema?: string | null;
  tipoEvaluacion?: string | null;
  respuestas: {
    pregunta: string;
    respuesta: string;
    esCorrecta: boolean;
    /** Nullable: los intentos guardados antes de que se persistieran estos campos no los
     *  tienen, y la interfaz debe seguir funcionando con ellos. */
    respuestaCorrecta?: string | null;
    retroalimentacion?: string | null;
    nivelBloom?: string | null;
    conceptos?: string | null;
  }[];
}
