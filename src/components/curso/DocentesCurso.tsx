import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { coursesApi, type RespuestaDocentes } from "@/services/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function mensajeDeError(err: unknown, porDefecto: string): string {
    const crudo = (err as { message?: string })?.message;
    if (!crudo) return porDefecto;
    try {
        const cuerpo = JSON.parse(crudo);
        return cuerpo?.error || porDefecto;
    } catch {
        return crudo.length < 200 ? crudo : porDefecto;
    }
}

export function DocentesCurso({ courseId }: { courseId: string }) {
    const queryClient = useQueryClient();
    const [correo, setCorreo] = useState("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["docentesCurso", courseId],
        queryFn: () => coursesApi.docentes(courseId),
        enabled: !!courseId,
    });
    const docentes = data?.docentes ?? [];
    const puedeGestionar = !!data?.puedoGestionar;

    const agregar = useMutation({
        mutationFn: (c: string) => coursesApi.agregarDocente(courseId, c),
        onSuccess: (respuesta: RespuestaDocentes) => {
            queryClient.setQueryData(["docentesCurso", courseId], respuesta);
            setCorreo("");
            toast.success("Docente añadido al curso");
        },
        onError: (err) => toast.error(mensajeDeError(err, "No se pudo añadir al docente")),
    });

    const quitar = useMutation({
        mutationFn: (docenteId: string) => coursesApi.quitarDocente(courseId, docenteId),
        onSuccess: (respuesta: RespuestaDocentes) => {
            queryClient.setQueryData(["docentesCurso", courseId], respuesta);
            toast.success("Docente quitado del curso");
        },
        onError: (err) => toast.error(mensajeDeError(err, "No se pudo quitar al docente")),
    });

    return (
        <section className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                    <h2 className="font-display font-bold text-lg">Docentes del curso</h2>
                    <p className="text-xs text-muted-foreground">
                        Los co-docentes gestionan semanas, materiales y alumnos. Solo la titular decide quién más enseña aquí.
                    </p>
                </div>
            </div>

            <div className="p-3">
                {isLoading ? (
                    <div className="py-8 grid place-items-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : isError ? (
                    <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                        No se pudo cargar la lista de docentes.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {docentes.map((d) => (
                            <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">
                                        {d.nombre}
                                        {d.titular && (
                                            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                                                Titular
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{d.correo}</p>
                                </div>
                                {puedeGestionar && !d.titular && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={quitar.isPending}
                                        onClick={() => quitar.mutate(d.id)}
                                        className="text-destructive hover:text-destructive shrink-0"
                                    >
                                        <UserMinus className="w-4 h-4 mr-1.5" /> Quitar
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {puedeGestionar && (
                <form
                    className="p-4 border-t border-border flex flex-col sm:flex-row gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (correo.trim()) agregar.mutate(correo.trim());
                    }}
                >
                    <Input
                        type="text"
                        autoCapitalize="none"
                        placeholder="Correo o usuario del docente que quieres añadir"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        disabled={agregar.isPending}
                    />
                    <Button type="submit" disabled={agregar.isPending || !correo.trim()} className="shrink-0">
                        {agregar.isPending
                            ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            : <UserPlus className="w-4 h-4 mr-1.5" />}
                        Añadir docente
                    </Button>
                </form>
            )}
        </section>
    );
}
