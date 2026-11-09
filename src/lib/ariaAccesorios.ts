import { createContext } from "react";

/**
 * Accesorios que Aria lleva puestos en la vista del alumno (los compra en la tienda).
 * Lo provee AppLayout; fuera de él (docente, administrador) Aria sale sin accesorios.
 */
export const AccesoriosAriaContext = createContext<string[]>([]);

/** Estilo de Aria: "clasica" (crema y colorida, para primaria), "nocturna" (gata tuxedo juvenil) o "perro". */
export type VarianteAria = "clasica" | "nocturna" | "perro";
export const VarianteAriaContext = createContext<VarianteAria>("clasica");

const CLAVE_VARIANTE = "semantika.varianteAria";

/**
 * Lo que eligió el alumno en la tienda (primero lo guardado en el servidor, que es lo que ven sus
 * compañeros en su perfil; luego este navegador); si no eligió, la que le toca por su grado.
 */
export function varianteElegida(inicial?: VarianteAria | null, delServidor?: VarianteAria | null): VarianteAria {
    if (delServidor) return delServidor;
    try {
        const v = localStorage.getItem(CLAVE_VARIANTE);
        if (v === "clasica" || v === "nocturna" || v === "perro") return v;
    } catch { /* sin almacenamiento */ }
    return inicial ?? "clasica";
}

export function guardarVariante(v: VarianteAria) {
    try { localStorage.setItem(CLAVE_VARIANTE, v); } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new Event("semantika:variante-aria"));
}
