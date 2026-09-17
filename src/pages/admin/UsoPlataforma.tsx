import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Download, Loader2, Search, UserCheck, UserX, Users, CalendarCheck } from "lucide-react";
import { usoApi, type UsoPorAlumno } from "@/api/uso";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PERIODOS = [7, 14, 30] as const;

const formatoCorto = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit" });
const formatoLargo = new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric", month: "short" });

function fechaLocal(iso: string) {
    const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(a, m - 1, d);
}

function haceCuanto(iso: string | null) {
    if (!iso) return "Nunca";
    const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (dias <= 0) return "Hoy";
    if (dias === 1) return "Ayer";
    if (dias < 30) return `Hace ${dias} días`;
    return formatoCorto.format(new Date(iso));
}

function descargarCsv(filas: UsoPorAlumno[], desde: string, hasta: string) {
    const escapar = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lineas = [
        ["Alumno", "Correo o usuario", "Días de uso", "Accesos", "Último acceso"].map(escapar).join(","),
        ...filas.map((f) => [f.nombre, f.correo, f.diasDeUso, f.accesos, f.ultimoAcceso ?? ""].map(escapar).join(",")),
    ];
    const blob = new Blob(["﻿" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uso-plataforma_${desde}_a_${hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function Cifra({ icono: Icono, titulo, valor, detalle }: {
    icono: typeof Users;
    titulo: string;
    valor: string | number;
    detalle?: string;
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Icono className="w-4 h-4" /> {titulo}
            </div>
            <div className="font-display text-3xl font-bold mt-2 tabular-nums">{valor}</div>
            {detalle && <div className="text-xs text-muted-foreground mt-1">{detalle}</div>}
        </div>
    );
}

function TooltipDia({ active, payload }: { active?: boolean; payload?: { payload: { fecha: string; alumnos: number; accesos: number } }[] }) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
            <div className="font-semibold capitalize">{formatoLargo.format(fechaLocal(p.fecha))}</div>
            <div className="text-muted-foreground mt-0.5">
                <span className="font-bold text-foreground tabular-nums">{p.alumnos}</span> {p.alumnos === 1 ? "alumno" : "alumnos"} ·{" "}
                <span className="tabular-nums">{p.accesos}</span> {p.accesos === 1 ? "acceso" : "accesos"}
            </div>
        </div>
    );
}

export default function UsoPlataforma() {
    const [dias, setDias] = useState<number>(30);
    const [busqueda, setBusqueda] = useState("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["uso-plataforma", dias],
        queryFn: () => usoApi.obtener(dias),
    });

    const alumnos = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        const lista = data?.porAlumno ?? [];
        return texto
            ? lista.filter((a) => a.nombre.toLowerCase().includes(texto) || a.correo.toLowerCase().includes(texto))
            : lista;
    }, [data, busqueda]);

    const maxDias = Math.max(1, ...(data?.porAlumno ?? []).map((a) => a.diasDeUso));
    const cifras = data?.cifras;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold">Uso de la plataforma</h1>
                    <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
                        Cuántos días entra cada alumno. Se cuenta un día de uso por cada día en que inició sesión.
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-border self-start">
                    {PERIODOS.map((p) => (
                        <button
                            key={p}
                            onClick={() => setDias(p)}
                            className={cn(
                                "min-h-[36px] px-3 rounded-md text-sm font-semibold transition-colors",
                                dias === p ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {p} días
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 grid place-items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : isError || !data || !cifras ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                    No se pudo cargar el uso de la plataforma.
                </div>
            ) : (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                    >
                        <Cifra icono={UserCheck} titulo="Activos hoy" valor={cifras.activosHoy}
                               detalle={`de ${cifras.totalAlumnos} alumnos`} />
                        <Cifra icono={Users} titulo="Últimos 7 días" valor={cifras.activosUltimos7Dias}
                               detalle={`de ${cifras.totalAlumnos} entraron al menos una vez`} />
                        <Cifra icono={CalendarCheck} titulo="Días de uso promedio" valor={cifras.promedioDiasDeUso}
                               detalle={`en los últimos ${data.dias} días`} />
                        <Cifra icono={UserX} titulo="Sin ingresar" valor={cifras.sinIngresarEnElPeriodo}
                               detalle={`en los últimos ${data.dias} días`} />
                    </motion.div>

                    <section className="bg-card border border-border rounded-xl shadow-xs">
                        <div className="p-5 border-b border-border">
                            <h2 className="font-display font-bold text-lg flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-primary" /> Alumnos que entraron cada día
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Del {formatoLargo.format(fechaLocal(data.desde))} al {formatoLargo.format(fechaLocal(data.hasta))}
                            </p>
                        </div>
                        <div className="h-64 px-2 py-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.porDia} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="fecha"
                                        tickFormatter={(f: string) => formatoCorto.format(fechaLocal(f))}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        interval="preserveStartEnd"
                                        minTickGap={16}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        width={32}
                                    />
                                    <Tooltip content={<TooltipDia />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }} />
                                    <Bar dataKey="alumnos" name="Alumnos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="bg-card border border-border rounded-xl shadow-xs">
                        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="font-display font-bold text-lg">Uso por alumno</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Ordenado de menos a más días de uso, para ver primero a quien conviene acompañar.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        placeholder="Buscar alumno"
                                        className="pl-9 h-10 w-full sm:w-56"
                                    />
                                </div>
                                <button
                                    onClick={() => descargarCsv(data.porAlumno, data.desde, data.hasta)}
                                    disabled={data.porAlumno.length === 0}
                                    className="h-10 px-3 rounded-lg border border-border bg-card hover:bg-muted/60 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 shrink-0"
                                >
                                    <Download className="w-4 h-4" /> CSV
                                </button>
                            </div>
                        </div>

                        {data.porAlumno.length === 0 ? (
                            <p className="p-8 text-center text-sm text-muted-foreground">Todavía no hay alumnos registrados.</p>
                        ) : alumnos.length === 0 ? (
                            <p className="p-8 text-center text-sm text-muted-foreground">Ningún alumno coincide con la búsqueda.</p>
                        ) : (
                            <div>
                                <div className="hidden sm:grid grid-cols-[1fr_180px_90px_120px] gap-4 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                                    <span>Alumno</span>
                                    <span>Días de uso</span>
                                    <span className="text-right">Accesos</span>
                                    <span className="text-right">Último acceso</span>
                                </div>
                                <ul className="divide-y divide-border">
                                    {alumnos.map((a) => (
                                        <li key={a.correo} className="grid grid-cols-2 sm:grid-cols-[1fr_180px_90px_120px] gap-x-4 gap-y-2 px-5 py-3 items-center">
                                            <div className="col-span-2 sm:col-span-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{a.nombre}</p>
                                                <p className="text-xs text-muted-foreground truncate">{a.correo}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {a.diasDeUso === 0 ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-foreground">
                                                        <UserX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Sin ingresar
                                                    </span>
                                                ) : (
                                                    <>
                                                        <div className="h-1.5 flex-1 max-w-[110px] rounded-full bg-muted overflow-hidden">
                                                            <div className="h-full rounded-full bg-primary" style={{ width: `${(a.diasDeUso / maxDias) * 100}%` }} />
                                                        </div>
                                                        <span className="text-sm font-bold tabular-nums">{a.diasDeUso}</span>
                                                    </>
                                                )}
                                            </div>
                                            <span className="hidden sm:block text-right text-sm tabular-nums text-muted-foreground">{a.accesos}</span>
                                            <span className="text-right text-sm text-muted-foreground">{haceCuanto(a.ultimoAcceso)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
