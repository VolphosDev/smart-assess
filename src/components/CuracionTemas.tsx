import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2, Tags, X } from "lucide-react";
import { curacionTemasApi, type TemaCurable } from "@/api/curacionTemas";
import { reproducirClic } from "@/lib/sonidos";

/**
 * Panel para que el docente depure los temas extraídos automáticamente.
 *
 * La pieza clave es la EVIDENCIA: junto a cada tema se muestran los fragmentos del documento
 * que lo originaron. Sin eso el docente tendría que adivinar si "Índice de contenidos" es un
 * tema real o basura de una página de créditos; leyendo el texto lo ve en dos segundos.
 *
 * Los temas sin decidir se muestran al alumno. Ocultar por defecto lo no revisado dejaría al
 * alumno sin temas mientras el docente no entrara a validarlos.
 */

interface Props {
    materialId: string;
    nombreArchivo: string;
}

export default function CuracionTemas({ materialId, nombreArchivo }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [expandido, setExpandido] = useState<string | null>(null);

    // La evidencia del tema desplegado se pide sola, no viene en el listado.
    const { data: evidencia, isLoading: cargandoEvidencia } = useQuery({
        queryKey: ["curacion-evidencia", materialId, expandido],
        queryFn: () => curacionTemasApi.evidenciaDe(materialId, expandido!),
        enabled: !!expandido,
        // La evidencia de un tema no cambia mientras no se reingiera el material, así que
        // volver a abrirlo no debe costar otra búsqueda vectorial.
        staleTime: 10 * 60_000,
    });
    const queryClient = useQueryClient();

    const { data: temas = [], isLoading } = useQuery({
        queryKey: ["curacion-temas", materialId],
        queryFn: () => curacionTemasApi.temasDe(materialId),
        enabled: abierto,
    });

    const clave = ["curacion-temas", materialId];

    const decidir = useMutation({
        mutationFn: ({ tema, aceptado }: { tema: string; aceptado: boolean }) =>
            curacionTemasApi.decidir(materialId, tema, aceptado),

        /**
         * Pinta la decisión ANTES de que conteste el servidor.
         *
         * Antes el color solo cambiaba cuando volvía la respuesta y se recargaba la lista
         * entera. Con 16 temas y una recarga por clic, el docente pulsaba la X, veía el aviso
         * "tema descartado" y la fila seguía exactamente igual un buen rato: parece que no
         * funcionó y se vuelve a pulsar.
         *
         * Si la petición falla se deshace y se avisa, asi que no se llega a mentir sobre algo
         * que no se guardó.
         */
        onMutate: async ({ tema, aceptado }) => {
            await queryClient.cancelQueries({ queryKey: clave });
            const previo = queryClient.getQueryData<any[]>(clave);

            queryClient.setQueryData<any[]>(clave, (actual) =>
                (actual ?? []).map((t) => (t.tema === tema ? { ...t, aceptado } : t)));

            return { previo };
        },

        onError: (_e, _vars, contexto: any) => {
            // Devolver la lista a como estaba: dejar el color puesto sería afirmar que se
            // guardó algo que no se guardó.
            if (contexto?.previo) queryClient.setQueryData(clave, contexto.previo);
            toast.error("No se pudo guardar la decisión.");
        },

        onSuccess: (r) => {
            toast.success(r.mensaje);
            // La lista de temas del alumno cambia, así que se invalida también.
            queryClient.invalidateQueries({ queryKey: ["semana"] });
        },

        // Se confirma contra el servidor al final, gane o pierda: si la actualización
        // optimista se desvió de lo real, aquí se corrige.
        onSettled: () => queryClient.invalidateQueries({ queryKey: clave }),
    });

    const revisados = temas.filter((t) => t.aceptado !== null).length;
    const descartados = temas.filter((t) => t.aceptado === false).length;

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
                onClick={() => { reproducirClic(); setAbierto((v) => !v); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left min-h-[56px]"
            >
                <Tags className="w-5 h-5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Temas detectados en este material</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {abierto && temas.length > 0
                            ? `${temas.length} temas · ${revisados} revisados · ${descartados} ocultos al alumno`
                            : `Revise cuáles son temas reales · ${nombreArchivo}`}
                    </p>
                </div>
                <ChevronDown className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""}`} />
            </button>

            {abierto && (
                <div className="border-t border-border p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Estos temas los extrajo la IA del documento. Algunos pueden venir de un
                        índice o una portada y no ser temas reales. Pulse un tema para leer el
                        texto del que salió.
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : temas.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Este material todavía no tiene temas extraídos.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {temas.map((t: TemaCurable) => {
                                const descartado = t.aceptado === false;
                                const aceptado = t.aceptado === true;
                                const estaExpandido = expandido === t.tema;

                                return (
                                    <motion.li
                                        key={t.tema}
                                        layout
                                        className={`rounded-lg border overflow-hidden ${
                                            descartado ? "border-border bg-muted/40 opacity-70"
                                                : aceptado ? "border-emerald-500/30 bg-emerald-500/5"
                                                : "border-border bg-background"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 p-3">
                                            <button
                                                onClick={() => setExpandido(estaExpandido ? null : t.tema)}
                                                className="flex-1 min-w-0 text-left"
                                                title="Ver el texto del que salió este tema"
                                            >
                                                <span className={`font-semibold text-sm ${descartado ? "line-through" : ""}`}>
                                                    {t.tema}
                                                </span>
                                                {t.aceptado === null && (
                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                                        sin revisar
                                                    </span>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => { reproducirClic(); decidir.mutate({ tema: t.tema, aceptado: true }); }}
                                                disabled={decidir.isPending}
                                                title="Es un tema real"
                                                className={`grid place-items-center w-9 h-9 rounded-lg border transition-colors shrink-0 ${
                                                    aceptado ? "bg-emerald-600 text-white border-emerald-600"
                                                        : "border-border hover:bg-emerald-600/10 hover:border-emerald-600/40"
                                                }`}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => { reproducirClic(); decidir.mutate({ tema: t.tema, aceptado: false }); }}
                                                disabled={decidir.isPending}
                                                title="No es un tema; ocultarlo a los alumnos"
                                                className={`grid place-items-center w-9 h-9 rounded-lg border transition-colors shrink-0 ${
                                                    descartado ? "bg-rose-600 text-white border-rose-600"
                                                        : "border-border hover:bg-rose-600/10 hover:border-rose-600/40"
                                                }`}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {estaExpandido && (
                                            <div className="px-3 pb-3 border-t border-border/60 pt-3 space-y-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    Texto del documento que originó este tema
                                                </p>
                                                {cargandoEvidencia ? (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Buscando el texto de origen...
                                                    </div>
                                                ) : !evidencia || evidencia.evidencia.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground italic">
                                                        No se pudo recuperar el texto de origen.
                                                    </p>
                                                ) : (
                                                    evidencia.evidencia.map((frag, i) => (
                                                        <p key={i} className="text-xs bg-muted/60 rounded p-2 leading-relaxed">
                                                            {frag}
                                                        </p>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </motion.li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
