import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { evaluacionApi } from "@/services/courses";
import { enVivoApi, mensajeError, type PreguntaEnVivo } from "@/services/enVivo";

const CANTIDAD = 8;

/**
 * Botón del docente para abrir una clase en vivo con el material de la semana. Las preguntas
 * las genera el mismo motor que las prácticas (opción múltiple, validadas por el comité de IA),
 * así el docente no tiene que escribirlas.
 */
export default function LanzarClaseEnVivo({ semanaId, mongoId, deshabilitado }: {
    semanaId: string;
    mongoId?: string;
    deshabilitado?: boolean;
}) {
    const navigate = useNavigate();
    const [preparando, setPreparando] = useState(false);

    const lanzar = async () => {
        if (!mongoId) return;
        setPreparando(true);
        try {
            const res = await evaluacionApi.generarPreguntas(mongoId, "OPCION_MULTIPLE", CANTIDAD);
            const preguntas: PreguntaEnVivo[] = (res?.preguntas ?? [])
                .filter((p: any) => Array.isArray(p.opciones_o_respuesta) && p.respuesta_correcta)
                .map((p: any) => ({ enunciado: p.enunciado, opciones: p.opciones_o_respuesta, correcta: p.respuesta_correcta }));
            if (preguntas.length === 0) throw new Error("La IA no devolvió preguntas de opción múltiple. Intenta de nuevo.");
            const { codigo } = await enVivoApi.crear(semanaId, preguntas);
            navigate(`/docente/en-vivo/${codigo}`);
        } catch (e) {
            toast.error(mensajeError(e, "No se pudo abrir la clase en vivo."));
        } finally {
            setPreparando(false);
        }
    };

    return (
        <section className="pieza rounded-3xl bg-[var(--j-indigo)] text-white p-5 flex flex-wrap items-center gap-4">
            <span className="text-4xl" aria-hidden>📡</span>
            <div className="flex-1 min-w-[220px]">
                <h2 className="font-juego text-2xl font-extrabold leading-tight">Clase en vivo</h2>
                <p className="text-sm text-white/85">
                    Proyecta {CANTIDAD} preguntas de este tema y tus alumnos responden desde su celular, con ranking en vivo.
                    No cuenta para la nota.
                </p>
            </div>
            <button
                type="button"
                onClick={lanzar}
                disabled={deshabilitado || !mongoId || preparando}
                title={!mongoId ? "Primero sube un material a esta semana" : undefined}
                className="boton-juego h-12 px-6 bg-[var(--j-oro)] text-[var(--j-tinta)] text-xl"
            >
                {preparando ? "Preparando preguntas…" : "Iniciar"}
            </button>
        </section>
    );
}
