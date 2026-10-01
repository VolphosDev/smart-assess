import { apiClient } from "./http/client";

export interface UsoPorDia {
    fecha: string;
    alumnos: number;
    accesos: number;
}

export interface UsoPorAlumno {
    nombre: string;
    correo: string;
    diasDeUso: number;
    accesos: number;
    ultimoAcceso: string | null;
}

export interface UsoPlataforma {
    dias: number;
    desde: string;
    hasta: string;
    cifras: {
        totalAlumnos: number;
        activosHoy: number;
        activosUltimos7Dias: number;
        promedioDiasDeUso: number;
        sinIngresarEnElPeriodo: number;
    };
    porDia: UsoPorDia[];
    porAlumno: UsoPorAlumno[];
}

export const usoApi = {
    obtener: (dias: number) => apiClient.get<UsoPlataforma>(`/admin/uso?dias=${dias}`),
};
