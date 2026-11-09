# Aria: estilos y animación

## Estilos

`VarianteAria` en `lib/ariaAccesorios.ts`: `clasica` (primaria), `nocturna` (juvenil, con skate y mochila) y `perro`. El alumno elige en la tienda y se guarda en el servidor. Sin elección, sale la de su etapa. La "Aria dorada" manda sobre el estilo.

## Cómo se anima

Todo está en `components/Aria.tsx`. Sigue los principios de `lib/movimiento.ts`.

| Capa | Qué hace |
|---|---|
| Cuerpo y cabeza | Grupos separados: respiración, y la cabeza va con un leve retraso |
| Reacciones | Clases `aria-rx-*`, una por expresión; se reinician al cambiar de estado |
| Cara | El cambio de expresión se disimula con un parpadeo rápido |
| Parpadeo y mirada | Intervalos irregulares con temporizadores |
| Boca | Tres aperturas. Sigue a la voz con el evento `semantika:aria-palabra` (`lib/vozAria.ts`); si la voz no avisa, usa un patrón irregular |

La variable CSS `--e` es la energía del personaje: 1 en la clásica, 0.62 en la juvenil y 1.2 en el perrito. `--d` es el lado al que dirige sus gestos.

Las miniaturas no se animan: recorte `cara`, cabeza en `AriaCaminando` o `vida={false}`. Con "reducir movimiento" se apagan las animaciones.

## Gestos de los comodines

| Estado | Comodín | Gesto |
|---|---|---|
| `sopla` | Congelar | Toma aire e infla los cachetes |
| `zarpa` | 50/50 | Pata con garras |
| `invoca` | +15 s | Se estira y alza la pata |
| `idea` | Pista | Alza la pata y aparece un foco |

Los tiempos del gesto van atados a `ENTRADA_MS` e `IMPACTO_MS` de `AriaComodin.tsx`: si cambian unos, hay que ajustar los otros.

## Caminar

`AriaCaminando` es un solo SVG. La cabeza de `AriaSvg` entra con la prop `marco`, como `<svg>` anidado, para compartir escala y grosor de línea con el cuerpo. Las uniones quedan ocultas detrás de la cabeza y del tronco. Si se cambia la escala de la cabeza (`CABEZA`), hay que ajustar `LINEA`.

No es nivel Duolingo: para eso haría falta un rig en Rive hecho por un animador.
