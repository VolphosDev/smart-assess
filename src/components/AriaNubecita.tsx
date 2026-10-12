import { AriaSvg } from "@/components/Aria";

/**
 * Nubecita de Aria para las preguntas abiertas.
 *
 * Un alumno que no recuerda la respuesta suele dejarla en blanco o escribir "no sé", y eso se
 * califica con 0 sin que Aria haya podido ver qué recordaba. Pedirle que escriba lo poco que
 * sepa da al juez algo que evaluar y al alumno la sensación de que un intento parcial cuenta.
 */
export function AriaNubecita() {
    return (
        <div className="flex items-end gap-2" role="note">
            <span
                aria-hidden
                className="shrink-0 grid place-items-center rounded-full bg-primary/5 border border-primary/10 w-9 h-9 overflow-hidden"
            >
                <AriaSvg estado="idle" recorte="cara" className="w-7 h-7 translate-y-0.5 opacity-80" />
            </span>
            <p className="relative rounded-2xl rounded-bl-sm border border-primary/15 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-foreground/80 leading-snug">
                Si no estás seguro, escribe lo que recuerdes, aunque sea poco.
            </p>
        </div>
    );
}
