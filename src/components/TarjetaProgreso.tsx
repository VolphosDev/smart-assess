import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Target, Trophy } from "lucide-react";
import { apiClient } from "@/api";

/**
 * Puntos, rango y marca personal del alumno.
 *
 * SEPARACIÓN QUE HAY QUE RESPETAR AL TOCAR ESTE COMPONENTE: los rangos que se muestran aquí
 * (Explorador, Constante, Analista…) son de PROGRESO. NO son el nivel de dominio
 * (Principiante / Intermedio / Avanzado) que decide la dificultad de las preguntas.
 *
 * Por eso los nombres son deliberadamente distintos: si un rango se llamara "Avanzado", el
 * alumno creería que acumulando puntos cambia la dificultad de su práctica, y no es así — esa
 * la determina lo que demuestra al responder.
 *
 * La comparación es contra UNO MISMO (mejor marca), no contra los compañeros. Un ranking
 * público desmotiva justamente a quienes van peor, que son a quienes esto quiere ayudar.
 */

interface Progreso {
    puntos: number;
    rango: string;
    rangoEmoji: string;
    siguienteRango: string | null;
    puntosParaSiguiente: number | null;
    progresoEnRango: number;
    mejorNota: number | null;
    ultimaNota: number | null;
    superoSuMarca: boolean;
    racha: number;
    conceptosDominados: number;
    evaluacionesCompletadas: number;
    desglose: Record<string, number>;
    aclaracion: string;
}

export default function TarjetaProgreso({ usuarioId }: { usuarioId: number | string }) {
    const { data: p } = useQuery<Progreso>({
        queryKey: ["progreso", usuarioId],
        queryFn: () => apiClient.get<Progreso>(`/rendimiento/progreso/${usuarioId}`),
        enabled: !!usuarioId,
    });

    if (!p) return null;

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-4">
                <div className="text-4xl leading-none shrink-0" aria-hidden>{p.rangoEmoji}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Tu rango
                    </p>
                    <h3 className="font-display font-bold text-xl leading-tight">{p.rango}</h3>
                </div>
                <div className="text-right shrink-0">
                    <div className="font-display font-bold text-2xl tabular-nums">{p.puntos}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        puntos
                    </div>
                </div>
            </div>

            {p.siguienteRango && (
                <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(p.progresoEnRango * 100)}%` }}
                            transition={{ duration: 0.6 }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Te faltan <strong>{p.puntosParaSiguiente}</strong> puntos para{" "}
                        <strong>{p.siguienteRango}</strong>
                    </p>
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/40 rounded-lg p-2.5">
                    <Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" />
                    <div className="font-display font-bold">{p.racha}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        días seguidos
                    </div>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5">
                    <Target className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <div className="font-display font-bold">{p.conceptosDominados}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        temas dominados
                    </div>
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5">
                    <Trophy className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                    <div className="font-display font-bold">
                        {p.mejorNota != null ? p.mejorNota.toFixed(1) : "—"}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        tu mejor marca
                    </div>
                </div>
            </div>

            {p.superoSuMarca && p.ultimaNota != null && (
                <p className="text-sm font-semibold text-emerald-600 text-center">
                    ¡Igualaste o superaste tu mejor marca en tu último intento!
                </p>
            )}

            {/* La aclaración viene del servidor a propósito: si alguien cambia el criterio en
                el backend, este texto cambia con él y no se queda mintiendo. */}
            <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                {p.aclaracion}
            </p>
        </div>
    );
}
