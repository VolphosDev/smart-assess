import { apiClient } from "./http/client";
import type { VarianteAria } from "@/lib/ariaAccesorios";

/** Nivel, XP y monedas del alumno. Miden actividad, no dominio: ver GamificacionService. */
export interface ResumenJugador {
    xp: number;
    nivel: number;
    xpEnNivel: number;
    xpDelNivel: number;
    monedas: number;
    racha: number;
    titulo: string;
    tituloEmoji: string;
    apodo: string;
    /** Accesorios que Aria lleva puestos ("gorro", "bufanda"…). */
    ariaEquipado: string[];
    /** Etapa escolar según el grado del alumno; decide el estilo de Aria por defecto. */
    etapa: "PRIMARIA" | "SECUNDARIA" | null;
    /** Estilo de Aria guardado en el servidor; null si nunca eligió (se usa el de su etapa). */
    ariaVariante: VarianteAria | null;
    /** Si sus compañeros de curso pueden ver su perfil. */
    perfilVisible: boolean;
}

/**
 * Perfil de juego de un compañero de curso (o el propio). Nunca trae nombre ni notas:
 * solo apodo, actividad y cómo cuida a su Aria. Ver PerfilService en el backend.
 */
export interface PerfilJugador {
    apodo: string;
    esTu: boolean;
    visible: boolean;
    privado: boolean;
    nivel?: number;
    titulo?: string;
    tituloEmoji?: string;
    racha?: number;
    mejorRacha?: number;
    conceptosDominados?: number;
    practicas?: number;
    medallas?: { oro: number; plata: number; bronce: number };
    aria?: {
        variante: VarianteAria;
        equipado: string[];
        coleccion: string[];
        totalColeccion: number;
        animo: "orgullosa" | "feliz" | "durmiendo";
    };
}

export interface Billetera {
    saldo: number;
    desglose: { practica: number; aria: number; rachas: number; premios: number; gastos: number };
    hoyCompletasRestantes: number;
    hoyMediasRestantes: number;
    rachaMasLarga: number;
    siguienteHito: number | null;
    movimientos: { cantidad: number; motivo: string; fecha: string }[];
}

export interface ArticuloTienda {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    ranura: "CABEZA" | "CUELLO" | "PELAJE";
    comprado: boolean;
    puesto: boolean;
}

export interface Tienda {
    saldo: number;
    accesorios: ArticuloTienda[];
    precioProtector: number;
    diasProtegidos: string[];
    mananaProtegido: boolean;
}

export interface FilaLiga {
    /** Índice en la tabla completa: si salta, hay compañeros ocultos entre medio. */
    orden: number;
    posicion: number;
    apodo: string;
    xp: number;
    esTu: boolean;
    /** Id cifrado para abrir su perfil. */
    perfilId: string;
}

export interface LigaSemanal {
    cursoId: number;
    curso: string;
    cursos: { id: number; nombre: string }[];
    desde: string;
    hasta: string;
    participantes: number;
    miPosicion: number;
    miXp: number;
    xpParaSubir: number | null;
    filas: FilaLiga[];
}

export interface JefeSemana {
    cursoId: number;
    curso: string;
    jefe: string;
    nombre: string;
    lema: string;
    vidaMaxima: number;
    danio: number;
    derrotado: boolean;
    miAporte: number;
    colaboradores: number;
    alumnos: number;
    cofre: number;
    hasta: string;
}

/** Poderes del contrarreloj (ver PoderesService en el backend, que fija precios y límites). */
export type Poder = "TIEMPO" | "CONGELAR" | "MITAD" | "PISTA";

export interface PreguntaParaPista {
    enunciado: string;
    opciones: string[] | null;
    respuestaCorrecta: string | null;
    concepto: string | null;
}

export const gamificacionApi = {
    resumen: () => apiClient.get<ResumenJugador>("/gamificacion/resumen"),
    liga: (cursoId?: number) =>
        apiClient.get<LigaSemanal>(`/gamificacion/liga${cursoId ? `?cursoId=${cursoId}` : ""}`),
    perfil: (perfilId: string) => apiClient.get<PerfilJugador>(`/gamificacion/perfil/${encodeURIComponent(perfilId)}`),
    ajustarPerfil: (cambios: { visible?: boolean; variante?: VarianteAria }) =>
        apiClient.put<{ visible: boolean; variante: VarianteAria | null }>("/gamificacion/perfil", cambios),
    opcionesApodo: () => apiClient.get<{ opciones: string[] }>("/gamificacion/apodos"),
    cambiarApodo: (apodo: string) => apiClient.put<{ apodo: string }>("/gamificacion/apodo", { apodo }),
    jefe: (cursoId?: number) =>
        apiClient.get<JefeSemana>(`/gamificacion/jefe${cursoId ? `?cursoId=${cursoId}` : ""}`),
    billetera: () => apiClient.get<Billetera>("/gamificacion/monedas"),
    tienda: () => apiClient.get<Tienda>("/gamificacion/tienda"),
    comprarAccesorio: (id: string) => apiClient.post<{ saldo: number }>(`/gamificacion/tienda/accesorios/${id}`),
    comprarProtector: () => apiClient.post<{ saldo: number }>("/gamificacion/tienda/protector"),
    equipar: (equipado: string[]) => apiClient.put<{ equipado: string[] }>("/gamificacion/aria", { equipado }),
    precioPoder: (partidaId: string, poder: Poder) =>
        apiClient.get<{ precio: number }>(`/gamificacion/poderes/precio?partidaId=${encodeURIComponent(partidaId)}&poder=${poder}`),
    usarPoder: (partidaId: string, poder: Poder, pregunta?: PreguntaParaPista) =>
        apiClient.post<{ saldo: number; precio: number; restantes: number; pista?: string }>("/gamificacion/poderes", { partidaId, poder, pregunta }),
    bonoPartida: (partidaId: string, rapidas: number, comboMaximo: number) =>
        apiClient.post<{ bono: number }>(`/gamificacion/partidas/${encodeURIComponent(partidaId)}/bono`, { rapidas, comboMaximo }),
};
