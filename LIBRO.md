# La casa

Lo que tienen en común las aplicaciones propias de este equipo, para que se
reconozcan como de la misma familia antes de leer una palabra. La primera fue
**BONK** (finanzas) y es la que manda: todo lo de aquí sale de ella. La segunda
es **CLAC** (contraseñas).

Este paquete guarda lo compartible. Cada aplicación lo usa como dependencia
local (`"casa": "file:../casa"`) y se trae de aquí las paletas, la hoja base y
las piezas de interfaz, en vez de copiarlas y dejar que se separen con el tiempo.

> BONK todavía no lo usa: tiene su propia copia de todo esto, idéntica a la
> 2.31.0. Pasarla a la casa es un trabajo aparte, que se hará cuando se decida.

## Lo que es igual en todas

**Estructura.** Barra lateral oscura de 232 px con la marca arriba —el icono de
28 px y el nombre en mayúsculas, blanco y en negrita— y las pestañas debajo. Por
debajo de 1080 px de ventana se queda en iconos de 64 px, con el nombre de cada
pestaña al pasar el ratón. A la derecha, una cabecera translúcida y pegajosa con
el título de la pantalla y, en su esquina, la acción principal.

**Color.** Las nueve paletas de `estilos/paletas.css` (Grafito, Índigo, Marea,
Sepia, Ciruela, Heat, Arasaka, Ghost y 2049), en claro y en oscuro. Cada una
redefine doce tonos y el resto se deriva solo. Los contrastes están medidos: 7:1
el texto principal, 4,5:1 el atenuado y el blanco sobre el acento, 3:1 el sutil.

**Significado.** El verde, el rojo y el ámbar no cambian con la paleta. En BONK
son dinero que entra y que sale; en las demás, lo que está bien, lo que está mal
y lo que avisa. Nunca se usan como decoración.

**Letra.** La del sistema: Segoe UI Variable, y Cascadia Mono para lo que tiene
que leerse carácter a carácter. En BONK se probaron tres tipografías propias y
ninguna casó; la decisión está tomada y vale para toda la casa.

**Iconos.** Lucide, a trazo 1,8 sobre lienzo de 24.

**Idioma.** Castellano de España, llano, escrito desde el lado de quien usa la
aplicación: se nombran las cosas por lo que son para él, no por cómo están
hechas por dentro.

**Datos.** Todo se queda en el ordenador. No hay cuenta, ni nube, ni registro.
Si una aplicación tiene que salir a internet, sale lo mínimo, lo dice antes y se
puede apagar.

**Técnica.** Electron + React + TypeScript, con `node:sqlite` para los datos. Nada
que compile código nativo: en este equipo solo hay Node y git. Instalador NSIS y
zip portátil, sin firmar.

## El icono

Lienzo de 256 con las esquinas a 58. Un degradado en diagonal, de abajo a la
izquierda a arriba a la derecha, que gira **100,5°** en el círculo de tono de
OKLCH. Encima, un dibujo blanco y macizo, con el peso de las barras de BONK y
asentado a la misma altura que ellas (y = 189).

Cada aplicación arranca el giro donde lo acaba la anterior:

| Puesto | Aplicación | De | A |
|---|---|---|---|
| 0 | BONK | verde, 151° (`#30c167`) | azul, 252° (`#0e8af1`) |
| 1 | CLAC | azul, 252° (`#40a7ff`) | magenta, 352° (`#d65094`) |
| 2 | la siguiente | magenta, 352° | ámbar, 93° |

El de BONK es su `resources/icon.ico` de siempre y **no se toca**. Los demás los
genera `marca/marca.mjs`:

```
node marca/marca.mjs clac ../clac/resources
```

Para una aplicación nueva: se añade su nombre al final de `FAMILIA` y su dibujo a
`GLIFOS`, y el color le sale solo.

## Lo que hay aquí

- `estilos/paletas.css` — las variables y las nueve paletas.
- `estilos/base.css` — barra lateral, cabecera, tarjetas, botones, campos,
  casillas, segmentados, diálogos, avisos, tablas, píldoras y el selector de
  paleta.
- `src/tema.ts` — poner el tema antes del primer fotograma, sin fogonazo.
- `src/paletas.ts` — la lista de paletas para el selector de Ajustes.
- `src/menu.tsx` — `MenuContextual` y `useMenu`: el clic derecho de BONK, con
  los iconos de Lucide.
- `src/ui.tsx` — `Modal`, `Confirm`, `AvisosProvider`/`useAvisos`, `Field`,
  `Checkbox`, `Segmented`, `EmptyState`, `Loading` y `SelectorPaleta`.
- `marca/marca.mjs` — la regla del icono, y el PNG y el ICO escritos a mano.
