/**
 * La marca de la casa: cómo se construye el icono de cada aplicación.
 *
 * Todas llevan lo mismo que el de BONK, que es el primero y el que manda:
 *
 *   - Lienzo de 256 con las esquinas redondeadas a 58.
 *   - Un degradado en diagonal, de abajo a la izquierda a arriba a la derecha,
 *     que da un giro de 100,5° en el círculo de tono de OKLCH. La luz baja de
 *     0,716 a 0,628 y el croma sube de 0,176 a 0,1815 por el camino.
 *   - Un dibujo en blanco, macizo, con el grosor de trazo de las barras de BONK.
 *
 * Lo único que cambia de una a otra es DÓNDE empieza el giro: cada aplicación
 * arranca en el tono en que acaba la anterior. BONK va del verde (151°) al azul
 * (251,6°); la segunda, del azul al magenta; la tercera seguiría del magenta al
 * naranja. Puestas en fila en la barra de tareas, los degradados se dan la mano.
 *
 * El icono de BONK no se genera aquí: es su `resources/icon.ico` de siempre, y
 * se queda como está. Esto reproduce su regla para las que vienen detrás.
 *
 * Se dibuja sin librerías de imagen —en este equipo no hay nada que compile
 * código nativo—: cada figura es una función que dice si un punto cae dentro,
 * cada píxel se muestrea dieciséis veces para suavizar los cantos, y el PNG y el
 * ICO se escriben a mano con el zlib de Node.
 *
 *   node marca.mjs <aplicación> <carpeta de salida>
 */
import { deflateSync, crc32 } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/* ---------- La regla del color ---------- */

/** El degradado de BONK, medido sobre su icono. */
export const BONK = {
  inicio: { L: 0.7159, C: 0.1758, h: 151.0987 },
  fin: { L: 0.628, C: 0.1815, h: 251.5844 }
}

const GIRO = BONK.fin.h - BONK.inicio.h

/** El degradado de la aplicación que ocupa el puesto `n` de la familia (BONK es la 0). */
export function degradadoDe(n) {
  const desplazamiento = GIRO * n
  return {
    inicio: { ...BONK.inicio, h: (BONK.inicio.h + desplazamiento) % 360 },
    fin: { ...BONK.fin, h: (BONK.fin.h + desplazamiento) % 360 }
  }
}

/** Las aplicaciones de la casa, por orden de llegada. */
export const FAMILIA = ['bonk', 'clac']

function oklchASrgb({ L, C, h }) {
  const rad = (h * Math.PI) / 180
  const a = C * Math.cos(rad)
  const b = C * Math.sin(rad)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lineal = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
  return lineal.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
    return Math.round(Math.min(1, Math.max(0, v)) * 255)
  })
}

/** El color en el punto `t` del degradado (0 abajo a la izquierda, 1 arriba a la derecha). */
function colorEn(degradado, t) {
  const { inicio, fin } = degradado
  // El giro va siempre hacia delante, 100,5°, aunque cruce el cero.
  let dh = fin.h - inicio.h
  if (dh < 0) dh += 360
  return oklchASrgb({
    L: inicio.L + (fin.L - inicio.L) * t,
    C: inicio.C + (fin.C - inicio.C) * t,
    h: (inicio.h + dh * t) % 360
  })
}

export function hex([r, g, b]) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/* ---------- Las figuras, en coordenadas del lienzo de 256 ---------- */

function dentroDeRectRedondeado(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

/**
 * Los dibujos de cada aplicación. Devuelven si un punto es blanco.
 *
 * El candado de CLAC está medido contra las barras de BONK: el mismo grueso de
 * trazo en el arco (26 frente a 32, que en curva se ve igual de pesado), el
 * mismo ancho total de 136 y el cuerpo asentado a la misma altura que las
 * barras, 189. La ranura del cuerpo es una rendija recta y no el ojo de una
 * cerradura: esa forma es la marca de 1Password.
 */
const GLIFOS = {
  clac(x, y) {
    // Cuerpo: 136 de ancho, asentado en 189 como las barras de BONK.
    const cuerpo = dentroDeRectRedondeado(x, y, 60, 117, 196, 189, 16)
    if (cuerpo) {
      // La rendija, recortada del cuerpo: se ve el degradado por ella.
      const rendija = dentroDeRectRedondeado(x, y, 119, 138, 137, 170, 9)
      return !rendija
    }
    // Arco: centro en (128, 100), radios 26 y 52. Por debajo del centro sigue
    // en recto hasta hundirse en el cuerpo.
    const cx = 128
    const cy = 100
    const interior = 26
    const exterior = 52
    if (y <= cy) {
      const d = Math.hypot(x - cx, y - cy)
      return d >= interior && d <= exterior
    }
    if (y <= 120) {
      const dx = Math.abs(x - cx)
      return dx >= interior && dx <= exterior
    }
    return false
  }
}

/* ---------- Dibujar ---------- */

/** RGBA de `lado × lado` píxeles. */
export function dibujar(app, lado) {
  const glifo = GLIFOS[app]
  if (!glifo) throw new Error(`No hay dibujo para «${app}»`)
  const degradado = degradadoDe(FAMILIA.indexOf(app))
  const escala = 256 / lado
  const muestras = 4
  const datos = Buffer.alloc(lado * lado * 4)

  for (let py = 0; py < lado; py++) {
    for (let px = 0; px < lado; px++) {
      let fondo = 0
      let blanco = 0
      for (let sy = 0; sy < muestras; sy++) {
        for (let sx = 0; sx < muestras; sx++) {
          const x = (px + (sx + 0.5) / muestras) * escala
          const y = (py + (sy + 0.5) / muestras) * escala
          if (!dentroDeRectRedondeado(x, y, 0, 0, 256, 256, 58)) continue
          fondo++
          if (glifo(x, y)) blanco++
        }
      }
      const total = muestras * muestras
      const cobertura = fondo / total
      const i = (py * lado + px) * 4
      if (cobertura === 0) continue
      // Diagonal: 0 en la esquina de abajo a la izquierda, 1 en la de arriba a la derecha.
      const cx = (px + 0.5) * escala
      const cy = (py + 0.5) * escala
      const t = Math.min(1, Math.max(0, (cx + (256 - cy)) / 512))
      const [r, g, b] = colorEn(degradado, t)
      const w = fondo ? blanco / fondo : 0
      datos[i] = Math.round(r + (255 - r) * w)
      datos[i + 1] = Math.round(g + (255 - g) * w)
      datos[i + 2] = Math.round(b + (255 - b) * w)
      datos[i + 3] = Math.round(cobertura * 255)
    }
  }
  return datos
}

/* ---------- PNG e ICO a mano ---------- */

function trozo(tipo, contenido) {
  const cabecera = Buffer.alloc(8)
  cabecera.writeUInt32BE(contenido.length, 0)
  cabecera.write(tipo, 4, 'ascii')
  const suma = Buffer.alloc(4)
  suma.writeUInt32BE(crc32(Buffer.concat([Buffer.from(tipo, 'ascii'), contenido])) >>> 0, 0)
  return Buffer.concat([cabecera, contenido, suma])
}

export function png(rgba, lado) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lado, 0)
  ihdr.writeUInt32BE(lado, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 6 // RGBA
  // Cada fila va precedida del tipo de filtro, 0: sin filtro.
  const filas = Buffer.alloc(lado * (lado * 4 + 1))
  for (let y = 0; y < lado; y++) {
    rgba.copy(filas, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(filas, { level: 9 })),
    trozo('IEND', Buffer.alloc(0))
  ])
}

/** Un ICO con una imagen PNG por talla, que Windows admite desde Vista. */
export function ico(imagenes) {
  const cabecera = Buffer.alloc(6)
  cabecera.writeUInt16LE(0, 0)
  cabecera.writeUInt16LE(1, 2)
  cabecera.writeUInt16LE(imagenes.length, 4)
  const entradas = []
  let desplazamiento = 6 + 16 * imagenes.length
  for (const { lado, datos } of imagenes) {
    const entrada = Buffer.alloc(16)
    entrada[0] = lado >= 256 ? 0 : lado
    entrada[1] = lado >= 256 ? 0 : lado
    entrada.writeUInt16LE(1, 4) // planos
    entrada.writeUInt16LE(32, 6) // bits por píxel
    entrada.writeUInt32LE(datos.length, 8)
    entrada.writeUInt32LE(desplazamiento, 12)
    desplazamiento += datos.length
    entradas.push(entrada)
  }
  return Buffer.concat([cabecera, ...entradas, ...imagenes.map((i) => i.datos)])
}

/* ---------- Desde la consola ---------- */

if (process.argv[1] && process.argv[1].endsWith('marca.mjs')) {
  const [app, salida] = process.argv.slice(2)
  if (!app || !salida) {
    console.log('Uso: node marca.mjs <aplicación> <carpeta de salida>')
    process.exit(1)
  }
  mkdirSync(salida, { recursive: true })
  const tallas = [16, 20, 24, 32, 40, 48, 64, 128, 256]
  const imagenes = tallas.map((lado) => ({ lado, datos: png(dibujar(app, lado), lado) }))
  writeFileSync(join(salida, 'icon.ico'), ico(imagenes))
  writeFileSync(join(salida, 'icon.png'), imagenes[imagenes.length - 1].datos)
  const { inicio, fin } = degradadoDe(FAMILIA.indexOf(app))
  const t0 = hex(colorEn(degradadoDe(FAMILIA.indexOf(app)), 0))
  const t1 = hex(colorEn(degradadoDe(FAMILIA.indexOf(app)), 1))
  console.log(`${app}: de ${t0} (${inicio.h.toFixed(1)}°) a ${t1} (${fin.h.toFixed(1)}°) → ${salida}`)
}
