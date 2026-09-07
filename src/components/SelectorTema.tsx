import { Sun, Moon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTema, type Tema } from "./ThemeProvider";

const OPCIONES: { id: Tema; icono: typeof Sun; etiqueta: string; titulo: string }[] = [
    { id: "claro",  icono: Sun,      etiqueta: "Claro",   titulo: "Tema claro" },
    { id: "suave",  icono: BookOpen, etiqueta: "Lectura", titulo: "Tema de lectura: menos brillo, más cómodo para leer largo rato" },
    { id: "oscuro", icono: Moon,     etiqueta: "Oscuro",  titulo: "Tema oscuro" },
];

/**
 * Selector de tema. Se muestra siempre visible (no escondido en un menú) porque su razón
 * de ser es de accesibilidad: un alumno al que le molesta el brillo tiene que poder
 * cambiarlo en el momento en que le molesta, sin buscar dónde está.
 */
export function SelectorTema({ className }: { className?: string }) {
    const { tema, setTema } = useTema();

    return (
        <div
            role="group"
            aria-label="Elegir tema de color"
            className={cn("flex items-center gap-0.5 bg-muted rounded-lg p-0.5 border border-border", className)}
        >
            {OPCIONES.map(({ id, icono: Icono, etiqueta, titulo }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => setTema(id)}
                    title={titulo}
                    aria-label={titulo}
                    aria-pressed={tema === id}
                    className={cn(
                        "grid place-items-center w-8 h-8 rounded-md transition-all",
                        tema === id
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Icono className="w-4 h-4" />
                    <span className="sr-only">{etiqueta}</span>
                </button>
            ))}
        </div>
    );
}
