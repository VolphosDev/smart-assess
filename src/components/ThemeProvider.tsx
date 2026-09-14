import { createContext, useContext, useEffect, useState } from "react";

/**
 * Temas disponibles.
 *
 * "suave" existe por una razón de accesibilidad concreta, no estética: el fondo de las
 * tarjetas era blanco puro (--card: 0 0% 100%) y el blanco puro a brillo alto produce
 * fatiga visual en sesiones largas de lectura. Para alumnos con dislexia o sensibilidad a
 * la luz, un fondo crema de bajo contraste mejora la comodidad lectora de forma medible.
 * En un producto que le pide a un chico de secundaria leer textos y responder preguntas
 * durante 15 minutos seguidos, eso importa.
 */
export type Tema = "claro" | "suave" | "oscuro";

const CLAVE_ALMACENAMIENTO = "semantika.tema";

interface ContextoTema {
    tema: Tema;
    setTema: (t: Tema) => void;
}

const TemaContext = createContext<ContextoTema>({ tema: "claro", setTema: () => {} });

export function useTema() {
    return useContext(TemaContext);
}

/**
 * Aplica el tema como clase en <html>.
 *
 * Tailwind está configurado con `darkMode: ["class"]`, así que la paleta oscura del
 * proyecto — 255 clases `dark:` y un bloque `.dark` completo en index.css — solo se activa
 * si alguien añade la clase `dark` al documento. Nadie lo hacía: todo ese trabajo estaba
 * escrito y era inalcanzable, incluso con el celular en modo oscuro.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [tema, setTemaEstado] = useState<Tema>(() => {
        try {
            const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO) as Tema | null;
            if (guardado === "claro" || guardado === "suave" || guardado === "oscuro") {
                return guardado;
            }
            // Sin preferencia guardada se entra en CLARO, no en lo que diga el sistema.
            //
            // Antes se respetaba `prefers-color-scheme`, que es lo correcto en una aplicación
            // de uso general. Aquí no: el primer contacto de un alumno de 2do de secundaria
            // —o de un jurado abriendo el enlace— no debería depender de cómo tenga
            // configurado su portátil. Un docente abría el panel y lo veía en azul oscuro sin
            // haber elegido nada, y sin saber que podía cambiarlo.
            //
            // La preferencia manual SÍ se respeta y persiste: quien quiera oscuro lo elige una
            // vez con el selector y no se le vuelve a preguntar.
        } catch {
            // localStorage puede fallar en modo privado; no es motivo para romper la app.
        }
        return "claro";
    });

    useEffect(() => {
        const raiz = document.documentElement;
        raiz.classList.remove("dark", "tema-suave");
        if (tema === "oscuro") raiz.classList.add("dark");
        if (tema === "suave") raiz.classList.add("tema-suave");
        try {
            localStorage.setItem(CLAVE_ALMACENAMIENTO, tema);
        } catch {
            // Preferencia no persistida: el tema igual se aplica en esta sesión.
        }
    }, [tema]);

    return (
        <TemaContext.Provider value={{ tema, setTema: setTemaEstado }}>
            {children}
        </TemaContext.Provider>
    );
}
