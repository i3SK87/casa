/**
 * El tema, puesto antes de que se pinte nada.
 *
 * Es el mismo apaño que estrenó BONK contra el fogonazo blanco del arranque:
 * los ajustes llegan por el puente, que es asíncrono, y mientras tanto React ya
 * ha dibujado con el juego de variables por defecto, que es el claro. Aquí se
 * guarda en el navegador lo último que se sabe y se aplica de golpe al cargar,
 * antes de montar nada. Cuando llegan los ajustes de verdad, mandan ellos.
 *
 * Cada aplicación guarda lo suyo con su propio prefijo: comparten la casa, no
 * el almacén del navegador.
 */

export type Tema = 'system' | 'light' | 'dark'

/** Apunta lo que hay puesto para el próximo arranque. */
export function recordarTema(app: string, theme: Tema, palette: string): void {
  try {
    localStorage.setItem(`${app}:tema`, theme)
    localStorage.setItem(`${app}:paleta`, palette)
  } catch {
    // Sin sitio donde guardar se vive igual: solo se pierde el arranque limpio.
  }
}

/** Resuelve «automático» contra el sistema; los otros dos se creen tal cual. */
export function esOscuro(theme: string): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Viste el elemento raíz con un tema y una paleta concretos. */
export function vestir(theme: string, palette: string): void {
  const raiz = document.documentElement
  raiz.setAttribute('data-theme', esOscuro(theme) ? 'dark' : 'light')
  raiz.setAttribute('data-palette', palette)
}

/** Deja el elemento raíz vestido antes del primer dibujo. */
export function aplicarTemaGuardado(app: string): void {
  let theme = 'system'
  let palette = 'grafito'
  try {
    theme = localStorage.getItem(`${app}:tema`) ?? theme
    palette = localStorage.getItem(`${app}:paleta`) ?? palette
  } catch {
    // Ni leerlo se puede: se arranca con lo de fábrica.
  }
  vestir(theme, palette)
}

/**
 * «Automático» tiene que seguir al sistema también con la ventana abierta:
 * cambiar Windows a oscuro a media tarde no puede dejar la aplicación en claro
 * hasta el siguiente arranque. Devuelve la función que deja de escuchar.
 */
export function seguirAlSistema(leer: () => { theme: string; palette: string }): () => void {
  const consulta = window.matchMedia('(prefers-color-scheme: dark)')
  const alCambiar = (): void => {
    const { theme, palette } = leer()
    if (theme === 'system') vestir(theme, palette)
  }
  consulta.addEventListener('change', alCambiar)
  return () => consulta.removeEventListener('change', alCambiar)
}
