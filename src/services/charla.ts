import { apiClient } from "./http/client";

export type EtapaCharla = "PRIMARIA" | "SECUNDARIA";
export type EstiloCharla = "PRIMARIA" | "JUVENIL" | "SOBRIO";

/** Si no se conoce el grado se usa el sobrio: no incomoda a nadie, y lo infantil a un mayor sí. */
export function estiloDe(etapa?: EtapaCharla, ciclo?: string | null): EstiloCharla {
    if (etapa === "PRIMARIA") return "PRIMARIA";
    return ciclo === "VI" ? "JUVENIL" : "SOBRIO";
}

export interface PreguntaCharla {
    enunciado: string;
    opciones_o_respuesta?: string[] | string;
    tipo_pregunta: string;
    nivel_bloom?: string;
    concepto?: string;
    repaso?: boolean;
    /** Solo existen después de responder: el servidor las entrega con la calificación. */
    respuesta_correcta?: string;
    justificacion_pregunta?: string;
}

export interface Charla {
    ronda_id: string;
    preguntas: PreguntaCharla[];
    etapa: EtapaCharla;
    ciclo?: string | null;
    desafio: boolean;
}

export interface ConceptoSemana {
    concepto: string;
    porcentaje: number;
    estado: "SIN_EMPEZAR" | "EN_CAMINO" | "CASI" | "DOMINADO";
}

export interface EstadoCharla {
    etapa: EtapaCharla;
    ciclo?: string | null;
    charlas: number;
    desafioDisponible: boolean;
    conceptos: ConceptoSemana[];
}

export const charlaApi = {
    iniciar: (mongoId: string, desafio: boolean) => apiClient.post<Charla>("/charla/iniciar", { mongoId, desafio }),
    estado: (mongoId: string) => apiClient.get<EstadoCharla>(`/charla/estado?mongoId=${encodeURIComponent(mongoId)}`),
};
