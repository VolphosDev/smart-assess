import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AriaSvg } from "@/components/Aria";
import { enVivoApi, FICHAS, mensajeError, sinLetra } from "@/services/enVivo";
import { reproducirAcierto, reproducirError } from "@/lib/sonidos";
import { cn } from "@/lib/utils";

const CLAVE = "semantika.enVivo";

/**
 * Lo que ve el alumno en su celular durante una clase en vivo: escribe el código, espera,
 * responde con fichas grandes y ve si acertó. La pregunta completa está en la pizarra; aquí
 * se repite para quien está lejos o necesita leerla de cerca.
 */
export default function ClaseEnVivoAlumno() {
    const qc = useQueryClient();
    const [codigo, setCodigo] = useState<string>(() => { try { return sessionStorage.getItem(CLAVE) ?? ""; } catch { return ""; } });
    const [escrito, setEscrito] = useState("");
    const [faseVista, setFaseVista] = useState<string | null>(null);

    const { data: e, error } = useQuery({
        queryKey: ["en-vivo", "alumno", codigo],
        queryFn: () => enVivoApi.estado(codigo),
        enabled: !!codigo,
        refetchInterval: 1000,
        retry: false,
    });

    // Sonido una sola vez al ver el resultado de cada pregunta.
    const clave = e ? `${e.fase}-${e.indice}` : null;
    if (e && clave !== faseVista) {
        setFaseVista(clave);
        if (e.fase === "RESULTADO" && e.acerte === true) reproducirAcierto();
        if (e.fase === "RESULTADO" && e.acerte === false) reproducirError();
    }

    const unirse = useMutation({
        mutationFn: (c: string) => enVivoApi.unirse(c),
        onSuccess: (d, c) => {
            try { sessionStorage.setItem(CLAVE, c); } catch { /* sin almacenamiento */ }
            setCodigo(c);
            qc.setQueryData(["en-vivo", "alumno", c], d);
        },
        onError: (err) => toast.error(mensajeError(err, "No se pudo entrar a la clase.")),
    });

    const responder = useMutation({
        mutationFn: (opcion: number) => enVivoApi.responder(codigo, opcion),
        onSuccess: (d) => qc.setQueryData(["en-vivo", "alumno", codigo], d),
        onError: (err) => toast.error(mensajeError(err, "No se pudo enviar tu respuesta.")),
    });

    const salir = () => {
        try { sessionStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
        setCodigo("");
        setEscrito("");
    };

    if (!codigo || error) {
        return (
            <div className="max-w-md mx-auto pt-6 space-y-6">
                <div className="pieza rounded-3xl bg-[var(--j-indigo)] text-white p-6 text-center">
                    <div className="w-28 h-36 mx-auto"><AriaSvg estado="emocionado" className="w-full h-full" /></div>
                    <h1 className="font-juego text-4xl font-extrabold leading-none mt-2">Clase en vivo</h1>
                    <p className="text-white/85 mt-2">Escribe el código que tu docente muestra en la pizarra.</p>
                    {error && <p className="mt-3 rounded-xl bg-black/25 px-3 py-2 text-sm">{mensajeError(error, "Esa clase ya no está disponible.")}</p>}
                    <form className="mt-5 flex flex-col gap-3" onSubmit={(ev) => { ev.preventDefault(); if (escrito.length === 6) unirse.mutate(escrito); }}>
                        <input
                            inputMode="numeric"
                            autoFocus
                            maxLength={6}
                            value={escrito}
                            onChange={(ev) => setEscrito(ev.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            aria-label="Código de la clase"
                            className="pieza h-16 rounded-2xl bg-white text-[var(--j-tinta)] text-center font-juego text-4xl font-extrabold tracking-[0.3em] outline-none"
                        />
                        <button type="submit" disabled={escrito.length !== 6 || unirse.isPending}
                                className="boton-juego h-14 bg-[var(--j-oro)] text-[var(--j-tinta)] text-2xl">
                            {unirse.isPending ? "Entrando…" : "Entrar"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }
    if (!e) return null;

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <div className="pieza rounded-2xl bg-card flex items-center justify-between px-4 py-2">
                <span className="font-semibold truncate">{e.apodo}</span>
                <span className="font-juego font-extrabold tabular-nums">{e.puntos} pts{e.puntos > 0 ? `, puesto ${e.puesto}` : ""}</span>
            </div>

            {e.fase === "ESPERA" && (
                <Tarjeta>
                    <div className="w-28 h-36 mx-auto"><AriaSvg estado="esperando" className="w-full h-full" /></div>
                    <p className="font-juego text-3xl font-extrabold">¡Ya estás dentro!</p>
                    <p className="text-white/85">Mira la pizarra. Empezamos cuando tu docente lo indique.</p>
                </Tarjeta>
            )}

            {e.fase === "PREGUNTA" && e.opciones && (
                e.miRespuesta != null ? (
                    <Tarjeta>
                        <div className="w-24 h-32 mx-auto"><AriaSvg estado="pensando" className="w-full h-full" /></div>
                        <p className="font-juego text-3xl font-extrabold">Respuesta enviada</p>
                        <p className="text-white/85">Espera a que se cierre la pregunta.</p>
                    </Tarjeta>
                ) : (
                    <div className="space-y-3">
                        <p className="font-semibold leading-snug">{e.pregunta}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {e.opciones.map((o, i) => {
                                const f = FICHAS[i % FICHAS.length];
                                return (
                                    <button key={i} type="button" disabled={responder.isPending} onClick={() => responder.mutate(i)}
                                            className="boton-juego min-h-[7rem] flex flex-col items-center justify-center gap-1 p-3 text-center"
                                            style={{ background: f.color, color: f.texto }}>
                                        <span className="text-4xl leading-none" aria-hidden>{f.forma}</span>
                                        <span className="text-base leading-tight">{sinLetra(o)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            )}

            {e.fase === "RESULTADO" && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 16 }}>
                    <Tarjeta color={e.acerte ? "#16A34A" : e.acerte === false ? "#E11D48" : undefined}>
                        <div className="w-24 h-32 mx-auto">
                            <AriaSvg estado={e.acerte ? "celebrando" : e.acerte === false ? "confundido" : "esperando"} className="w-full h-full" />
                        </div>
                        <p className="font-juego text-4xl font-extrabold">
                            {e.acerte ? "¡Correcto!" : e.acerte === false ? "Esta vez no" : "No respondiste"}
                        </p>
                        {e.acerte && <p className="font-juego text-3xl font-extrabold text-[var(--j-oro)]">+{e.ganancia}</p>}
                        {e.acerte === false && e.opciones && e.correcta != null && (
                            <p className="text-white/90">La respuesta era: <b>{sinLetra(e.opciones[e.correcta])}</b></p>
                        )}
                        {e.racha >= 2 && <p className="font-juego text-xl font-extrabold">🔥 {e.racha} seguidas</p>}
                    </Tarjeta>
                </motion.div>
            )}

            {e.fase === "FIN" && (
                <Tarjeta>
                    <div className="w-28 h-36 mx-auto"><AriaSvg estado={e.puesto <= 3 ? "celebrando" : "orgullosa"} className="w-full h-full" /></div>
                    <p className="font-juego text-4xl font-extrabold">{e.puesto <= 3 ? ["🥇", "🥈", "🥉"][e.puesto - 1] + " ¡Al podio!" : "¡Buen juego!"}</p>
                    <p className="text-white/85">Terminaste en el puesto {e.puesto} de {e.participantes} con {e.puntos} puntos.</p>
                    <button type="button" onClick={salir} className="boton-juego h-12 px-6 bg-[var(--j-oro)] text-[var(--j-tinta)] text-xl mt-2">Salir</button>
                </Tarjeta>
            )}
        </div>
    );
}

function Tarjeta({ children, color }: { children: React.ReactNode; color?: string }) {
    return (
        <div className={cn("pieza rounded-3xl text-white p-6 text-center space-y-2")} style={{ background: color ?? "var(--j-indigo)" }}>
            {children}
        </div>
    );
}
