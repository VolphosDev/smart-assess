import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { semanasApi, type ProgresoIngesta } from "@/api/courses";

/**
 * Barra de progreso de una ingesta en segundo plano.
 *
 * Consulta el estado cada 1,5 s. Se eligió sondeo y no SSE porque el dato es diminuto y el
 * sondeo no deja conexiones abiertas ni necesita reconexión: para una operación que dura
 * minutos y se consulta una vez cada segundo y medio, la complejidad de un flujo de eventos
 * no se paga.
 *
 * El texto del paso importa tanto como el porcentaje. "Resumiendo cada sección · 12 de 40"
 * le dice al docente que el sistema está trabajando; una barra al 65% sin explicación se lee
 * como que se colgó.
 */

interface Props {
    ingestaId: string;
    onTerminado?: (exitoso: boolean) => void;
}

const INTERVALO_MS = 1500;

/** Tras esto se deja de consultar: algo va mal y sondear para siempre no lo arregla. */
const MAX_INTENTOS = 400; // ~10 minutos

export default function ProgresoIngestaBarra({ ingestaId, onTerminado }: Props) {
    const [estado, setEstado] = useState<ProgresoIngesta | null>(null);
    const [abandonado, setAbandonado] = useState(false);
    // En una ref y no en estado: cambiarlo no debe provocar un repintado.
    const intentos = useRef(0);
    const avisado = useRef(false);

    useEffect(() => {
        let vivo = true;
        let temporizador: ReturnType<typeof setTimeout>;

        const consultar = async () => {
            if (!vivo) return;

            if (intentos.current++ > MAX_INTENTOS) {
                setAbandonado(true);
                return;
            }

            try {
                const r = await semanasApi.progresoIngesta(ingestaId);
                if (!vivo) return;
                setEstado(r);

                if (r.terminado) {
                    // La guarda evita avisar dos veces si llega otra respuesta en vuelo.
                    if (!avisado.current) {
                        avisado.current = true;
                        onTerminado?.(r.exitoso ?? false);
                    }
                    return;
                }
            } catch {
                // Un fallo puntual de red no debe matar el seguimiento: se reintenta.
            }
            temporizador = setTimeout(consultar, INTERVALO_MS);
        };

        consultar();
        return () => {
            vivo = false;
            clearTimeout(temporizador);
        };
    }, [ingestaId, onTerminado]);

    if (abandonado) {
        return (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                El procesado está tardando más de lo normal. Puede cerrar esta ventana: si
                termina bien, el material aparecerá en la lista al recargar.
            </div>
        );
    }

    if (!estado) {
        return (
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                Preparando la carga...
            </div>
        );
    }

    const fallo = estado.terminado && !estado.exitoso;
    const listo = estado.terminado && estado.exitoso;

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
                {listo ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : fallo ? (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                        {listo ? "Material listo" : fallo ? "No se pudo procesar" : estado.mensaje}
                    </p>
                    {estado.detalle && !fallo && (
                        <p className="text-xs text-muted-foreground truncate">{estado.detalle}</p>
                    )}
                    {fallo && estado.error && (
                        <p className="text-xs text-rose-600 truncate" title={estado.error}>
                            {estado.error}
                        </p>
                    )}
                </div>

                <span className="font-display font-bold text-lg tabular-nums shrink-0">
                    {estado.porcentaje}%
                </span>
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                    className={
                        fallo ? "h-full bg-rose-500"
                            : listo ? "h-full bg-emerald-500"
                            : "h-full bg-primary"
                    }
                    initial={{ width: 0 }}
                    animate={{ width: `${estado.porcentaje}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>

            {!estado.terminado && (
                <p className="text-xs text-muted-foreground">
                    Puede seguir trabajando; el procesado continúa aunque cierre esta ventana.
                </p>
            )}
        </div>
    );
}
