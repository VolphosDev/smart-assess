import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    History,
    Search,
    Download,
    RefreshCw,
    Shield,
    FileUp,
    FileX,
    BookPlus,
    BookOpen,
    Trash2,
    CalendarPlus,
    UserPlus,
    UserMinus,
    Filter,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Clock,
    Layers,
    FileText,
    CheckCircle2
} from "lucide-react";
import { auditoriaApi, type RegistroAuditoriaDTO } from "@/services/auditoria";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formatoFechaHora = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
});

const formatoFechaCorta = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
});

function tiempoRelativo(fechaIso: string): string {
    const timestamp = new Date(fechaIso).getTime();
    if (isNaN(timestamp)) return fechaIso;
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffSec < 60) return "Hace un momento";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} ${diffHoras === 1 ? "hora" : "horas"}`;
    if (diffDias === 1) return "Ayer";
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return formatoFechaCorta.format(new Date(fechaIso));
}

interface MetaAccion {
    etiqueta: string;
    icono: any;
    colorBadge: string;
    colorIcono: string;
    categoria: "material" | "curso" | "semana" | "matricula" | "otro";
}

function obtenerMetaAccion(accion: string): MetaAccion {
    switch (accion) {
        case "MATERIAL_SUBIDO":
            return {
                etiqueta: "Material Subido",
                icono: FileUp,
                colorBadge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
                colorIcono: "text-emerald-600 dark:text-emerald-400",
                categoria: "material"
            };
        case "MATERIAL_ELIMINADO":
            return {
                etiqueta: "Material Eliminado",
                icono: FileX,
                colorBadge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
                colorIcono: "text-amber-600 dark:text-amber-400",
                categoria: "material"
            };
        case "CURSO_CREADO":
            return {
                etiqueta: "Curso Creado",
                icono: BookPlus,
                colorBadge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
                colorIcono: "text-blue-600 dark:text-blue-400",
                categoria: "curso"
            };
        case "CURSO_ACTUALIZADO":
            return {
                etiqueta: "Curso Actualizado",
                icono: BookOpen,
                colorBadge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
                colorIcono: "text-indigo-600 dark:text-indigo-400",
                categoria: "curso"
            };
        case "CURSO_ELIMINADO":
            return {
                etiqueta: "Curso Eliminado",
                icono: Trash2,
                colorBadge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
                colorIcono: "text-rose-600 dark:text-rose-400",
                categoria: "curso"
            };
        case "SEMANA_CREADA":
            return {
                etiqueta: "Semana Creada",
                icono: CalendarPlus,
                colorBadge: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
                colorIcono: "text-violet-600 dark:text-violet-400",
                categoria: "semana"
            };
        case "ALUMNO_MATRICULADO":
            return {
                etiqueta: "Alumno Matriculado",
                icono: UserPlus,
                colorBadge: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
                colorIcono: "text-teal-600 dark:text-teal-400",
                categoria: "matricula"
            };
        case "ALUMNO_RETIRADO":
            return {
                etiqueta: "Alumno Retirado",
                icono: UserMinus,
                colorBadge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
                colorIcono: "text-orange-600 dark:text-orange-400",
                categoria: "matricula"
            };
        default:
            return {
                etiqueta: accion.replace(/_/g, " "),
                icono: History,
                colorBadge: "bg-muted text-muted-foreground border-border",
                colorIcono: "text-muted-foreground",
                categoria: "otro"
            };
    }
}

function TarjetaCifra({
    icono: Icono,
    titulo,
    valor,
    detalle,
    color
}: {
    icono: any;
    titulo: string;
    valor: string | number;
    detalle?: string;
    color?: string;
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {titulo}
                </span>
                <span className={cn("p-2 rounded-lg bg-muted/60", color)}>
                    <Icono className="w-4 h-4" />
                </span>
            </div>
            <div className="font-display text-3xl font-bold mt-2 tabular-nums">{valor}</div>
            {detalle && <div className="text-xs text-muted-foreground mt-1">{detalle}</div>}
        </div>
    );
}

function descargarCsv(filas: RegistroAuditoriaDTO[]) {
    const escapar = (v: string | number | null | undefined) =>
        `"${String(v ?? "").replace(/"/g, '""')}"`;
    const encabezados = [
        "Fecha",
        "Actor (Correo)",
        "Rol",
        "Acción",
        "Tipo de Recurso",
        "ID Recurso",
        "Detalle de la Operación"
    ];

    const lineas = [
        encabezados.map(escapar).join(","),
        ...filas.map((f) => [
            f.fecha,
            f.actor,
            f.rol,
            f.accion,
            f.recurso,
            f.recursoId,
            f.detalle
        ].map(escapar).join(","))
    ];

    const blob = new Blob(["\uFEFF" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trazabilidad_auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Trazabilidad() {
    const [busquedaActor, setBusquedaActor] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
    const [accionSeleccionada, setAccionSeleccionada] = useState<string>("TODAS");
    const [pagina, setPagina] = useState<number>(0);
    const tamano = 50;

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["auditoria", busquedaActor, accionSeleccionada, pagina],
        queryFn: () =>
            auditoriaApi.listar({
                actor: busquedaActor,
                accion: accionSeleccionada === "TODAS" ? undefined : accionSeleccionada,
                pagina,
                tamano
            }),
        staleTime: 30_000
    });

    const registros = data?.registros ?? [];
    const total = data?.total ?? 0;
    const accionesDisponibles = data?.acciones ?? [];
    const totalPaginas = Math.ceil(total / tamano);

    // Filtrar localmente por categoría si el usuario usa las píldoras
    const registrosFiltrados = useMemo(() => {
        if (filtroCategoria === "TODAS") return registros;
        return registros.filter((r) => {
            const meta = obtenerMetaAccion(r.accion);
            return meta.categoria === filtroCategoria;
        });
    }, [registros, filtroCategoria]);

    // Métricas calculadas para las tarjetas
    const metricas = useMemo(() => {
        let materiales = 0;
        let cursosSem = 0;
        let matriculas = 0;
        const actoresUnicos = new Set<string>();

        registros.forEach((r) => {
            if (r.actor) actoresUnicos.add(r.actor);
            if (r.accion.startsWith("MATERIAL_")) materiales++;
            else if (r.accion.startsWith("CURSO_") || r.accion.startsWith("SEMANA_")) cursosSem++;
            else if (r.accion.startsWith("ALUMNO_")) matriculas++;
        });

        return {
            materiales,
            cursosSem,
            matriculas,
            actores: actoresUnicos.size
        };
    }, [registros]);

    return (
        <div className="space-y-6">
            {/* Encabezado y Acciones Principales */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
                        <History className="w-4 h-4" /> Registro Inmutable de Actividad
                    </div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">
                        Trazabilidad y Auditoría
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
                        Supervisión histórica de acciones privilegiadas ejecutadas por docentes y administradores:
                        creación de cursos, adición de semanas, publicación de material didáctico y gestión de matrículas.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="gap-2 text-xs font-semibold"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin text-primary")} />
                        Actualizar
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => descargarCsv(registrosFiltrados)}
                        disabled={registrosFiltrados.length === 0}
                        className="gap-2 text-xs font-semibold shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Aviso de Integridad y Respaldo Institucional (RNFS-09) */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200 flex items-start gap-3 shadow-xs">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                    <span className="font-bold">Garantía de Auditoría Institucional (RNFS-09 y RFS-07):</span>
                    <p className="text-blue-800/90 dark:text-blue-300/90">
                        Cada registro es transaccionalmente independiente (<code>REQUIRES_NEW</code>) y de solo lectura.
                        No admite eliminación ni modificación manual por ningún usuario para garantizar la validez probatoria de auditoría.
                    </p>
                </div>
            </div>

            {/* Tarjetas de Resumen Rápido */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <TarjetaCifra
                    icono={History}
                    titulo="Total de Eventos"
                    valor={total}
                    detalle={`Página ${pagina + 1} de ${Math.max(1, totalPaginas)}`}
                    color="text-primary"
                />
                <TarjetaCifra
                    icono={FileUp}
                    titulo="Materiales Subidos / Modificados"
                    valor={metricas.materiales}
                    detalle="En este lote auditado"
                    color="text-emerald-500"
                />
                <TarjetaCifra
                    icono={Layers}
                    titulo="Cursos y Semanas"
                    valor={metricas.cursosSem}
                    detalle="Estructura curricular creada"
                    color="text-indigo-500"
                />
                <TarjetaCifra
                    icono={GraduationCap}
                    titulo="Movimientos de Matrícula"
                    valor={metricas.matriculas}
                    detalle="Inscripciones y retiros"
                    color="text-teal-500"
                />
            </div>

            {/* Barra de Filtros */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Búsqueda por Actor / Correo */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar por correo de docente o admin..."
                            value={busquedaActor}
                            onChange={(e) => {
                                setBusquedaActor(e.target.value);
                                setPagina(0);
                            }}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    {/* Selector de Acción específica */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        <select
                            value={accionSeleccionada}
                            onChange={(e) => {
                                setAccionSeleccionada(e.target.value);
                                setPagina(0);
                            }}
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="TODAS">Todas las acciones</option>
                            {accionesDisponibles.map((acc) => (
                                <option key={acc} value={acc}>
                                    {obtenerMetaAccion(acc).etiqueta}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Píldoras de Categoría Rápida */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
                    <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center">
                        Categoría:
                    </span>
                    {[
                        { id: "TODAS", label: "Todas" },
                        { id: "material", label: "Material Didáctico" },
                        { id: "curso", label: "Cursos" },
                        { id: "semana", label: "Semanas" },
                        { id: "matricula", label: "Matrícula" }
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFiltroCategoria(cat.id)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                                filtroCategoria === cat.id
                                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla de Registros de Auditoría */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-muted/60 text-muted-foreground border-b border-border font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3.5">Fecha y Hora</th>
                                <th className="px-4 py-3.5">Actor (Docente / Admin)</th>
                                <th className="px-4 py-3.5">Acción</th>
                                <th className="px-4 py-3.5">Recurso Afectado</th>
                                <th className="px-4 py-3.5">Detalle de la Operación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                                            <span className="font-semibold">Cargando registros de auditoría…</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : registrosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="p-3 bg-muted rounded-full">
                                                <History className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <span className="font-semibold text-sm text-foreground">
                                                No se encontraron registros de auditoría
                                            </span>
                                            <p className="text-xs text-muted-foreground max-w-sm">
                                                {busquedaActor || accionSeleccionada !== "TODAS" || filtroCategoria !== "TODAS"
                                                    ? "Prueba cambiando o limpiando los filtros de búsqueda."
                                                    : "Aún no se han ejecutado acciones privilegiadas en la plataforma."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                registrosFiltrados.map((r, i) => {
                                    const meta = obtenerMetaAccion(r.accion);
                                    const IconoAccion = meta.icono;
                                    const fechaObj = new Date(r.fecha);
                                    const fechaValida = !isNaN(fechaObj.getTime());

                                    return (
                                        <motion.tr
                                            key={`${r.fecha}-${r.actor}-${r.accion}-${i}`}
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15, delay: i * 0.015 }}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            {/* Fecha y Hora */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                                    <div>
                                                        <div className="font-semibold text-foreground">
                                                            {tiempoRelativo(r.fecha)}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground" title={r.fecha}>
                                                            {fechaValida ? formatoFechaHora.format(fechaObj) : r.fecha}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Actor y Rol */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold grid place-items-center text-[11px] border border-primary/20 shrink-0">
                                                        {(r.actor || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-foreground truncate max-w-[200px]" title={r.actor}>
                                                            {r.actor}
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] px-1.5 py-0 h-4 border font-medium",
                                                                r.rol === "TEACHER"
                                                                    ? "border-blue-300 text-blue-700 bg-blue-50/50 dark:border-blue-800 dark:text-blue-300"
                                                                    : r.rol === "ADMIN"
                                                                    ? "border-purple-300 text-purple-700 bg-purple-50/50 dark:border-purple-800 dark:text-purple-300"
                                                                    : "border-border text-muted-foreground"
                                                            )}
                                                        >
                                                            {r.rol === "TEACHER" ? "Docente" : r.rol === "ADMIN" ? "Admin" : r.rol || "Usuario"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Acción */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border",
                                                        meta.colorBadge
                                                    )}
                                                >
                                                    <IconoAccion className={cn("w-3.5 h-3.5", meta.colorIcono)} />
                                                    {meta.etiqueta}
                                                </span>
                                            </td>

                                            {/* Recurso */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="capitalize">{r.recurso || "General"}</span>
                                                    {r.recursoId ? (
                                                        <span className="text-[11px] text-muted-foreground font-mono">
                                                            #{r.recursoId}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>

                                            {/* Detalle */}
                                            <td className="px-4 py-3.5">
                                                <div className="text-foreground max-w-md break-words font-normal text-xs">
                                                    {r.detalle || "Sin detalle registrado."}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Barra de Paginación */}
                {total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs">
                        <div className="text-muted-foreground">
                            Mostrando{" "}
                            <span className="font-semibold text-foreground">
                                {registrosFiltrados.length}
                            </span>{" "}
                            de <span className="font-semibold text-foreground">{total}</span> eventos registrados
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                                disabled={pagina <= 0 || isLoading}
                                className="h-8 px-2.5 gap-1 text-xs"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                            </Button>
                            <span className="text-muted-foreground font-medium px-2">
                                Página {pagina + 1} de {Math.max(1, totalPaginas)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagina((p) => p + 1)}
                                disabled={pagina + 1 >= totalPaginas || isLoading}
                                className="h-8 px-2.5 gap-1 text-xs"
                            >
                                Siguiente <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
