/**
 * El menú del clic derecho, el de BONK.
 *
 * Sale donde está el puntero y lleva lo que se hace a diario sobre una fila. La
 * ficha completa sigue estando a un clic izquierdo: esto es el atajo, no su
 * sustituto.
 *
 * Va por un portal a la raíz: el velo de los diálogos lleva desenfoque, y un
 * desenfoque hace que lo de dentro se posicione contra él en vez de contra la
 * ventana. Colgando de la fila, además, una fila con `overflow` lo recortaría.
 *
 * La diferencia con el de BONK es solo el icono: allí es un nombre de su propio
 * catálogo y aquí el componente de Lucide, que es lo que usan las demás.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as EventoRaton, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, type LucideIcon } from 'lucide-react'

export interface OpcionMenu {
  etiqueta: string
  /** Sin icono se le guarda el hueco, para que las etiquetas queden alineadas. */
  icono?: LucideIcon
  /** La que está puesta, con la marca delante: para menús que eligen entre varias. */
  marcada?: boolean
  /** Una aclaración pequeña al otro lado, como un atajo de teclado. */
  pista?: string
  onElegir: () => void
  /** En rojo y separada del resto: borrar no se pulsa sin querer. */
  peligrosa?: boolean
}

/** Cuánto se le deja al menú respirar contra el borde de la ventana. */
const MARGEN = 8

/**
 * El clic que cierra el menú no cuenta para nada más.
 *
 * Cerrar va por `pointerdown`, pero el `click` que viene detrás es otro evento
 * y llegaba entero a lo que hubiera debajo: cerrar el menú sobre una fila la
 * abría de paso. Se le pone un cepo de un solo uso al siguiente clic, como hacen
 * los menús de Windows: el primero cierra y el segundo ya actúa.
 *
 * El cepo vive aquí fuera porque al cerrarse el menú se desmonta, y su limpieza
 * lo quitaría antes de que llegara el clic. Se retira solo, o en cuanto empieza
 * otra pulsación.
 */
let retirarCepo: (() => void) | null = null

function tragarSiguienteClic(): void {
  retirarCepo?.()
  const tragar = (evento: MouseEvent): void => {
    evento.preventDefault()
    evento.stopPropagation()
    retirarCepo?.()
  }
  const otraPulsacion = (): void => retirarCepo?.()
  window.addEventListener('click', tragar, true)
  window.addEventListener('pointerdown', otraPulsacion, true)
  retirarCepo = () => {
    window.removeEventListener('click', tragar, true)
    window.removeEventListener('pointerdown', otraPulsacion, true)
    retirarCepo = null
  }
}

export function MenuContextual({
  x,
  y,
  opciones,
  onCerrar
}: {
  x: number
  y: number
  opciones: OpcionMenu[]
  onCerrar: () => void
}): ReactNode {
  const caja = useRef<HTMLDivElement>(null)
  const [sitio, setSitio] = useState({ x, y })

  // Medido y recolocado antes de pintarse: pulsando abajo del todo, un menú
  // anclado al puntero se saldría de la ventana.
  useLayoutEffect(() => {
    const nodo = caja.current
    if (!nodo) return
    const { width, height } = nodo.getBoundingClientRect()
    setSitio({
      x: Math.max(MARGEN, Math.min(x, window.innerWidth - width - MARGEN)),
      y: Math.max(MARGEN, Math.min(y, window.innerHeight - height - MARGEN))
    })
  }, [x, y])

  // El primero enfocado —o el marcado—: Escape y las flechas funcionan sin ratón.
  useEffect(() => {
    const marcada = caja.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
    ;(marcada ?? caja.current?.querySelector('button'))?.focus()
  }, [])

  // Se cierra con casi todo: pulsar fuera, Escape, otro clic derecho, la rueda
  // o cambiar el tamaño de la ventana. En captura, para enterarse antes que lo
  // de debajo.
  useEffect(() => {
    const fuera = (evento: Event): void => {
      if (caja.current?.contains(evento.target as Node)) return
      if (evento.type === 'pointerdown' && (evento as PointerEvent).button === 0) tragarSiguienteClic()
      onCerrar()
    }
    const rueda = (evento: WheelEvent): void => {
      if (caja.current?.contains(evento.target as Node)) return
      onCerrar()
    }
    const tecla = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        evento.stopPropagation()
        onCerrar()
      }
    }
    window.addEventListener('pointerdown', fuera, true)
    window.addEventListener('contextmenu', fuera, true)
    window.addEventListener('keydown', tecla, true)
    window.addEventListener('resize', onCerrar)
    window.addEventListener('wheel', rueda, true)
    window.addEventListener('blur', onCerrar)
    return () => {
      window.removeEventListener('pointerdown', fuera, true)
      window.removeEventListener('contextmenu', fuera, true)
      window.removeEventListener('keydown', tecla, true)
      window.removeEventListener('resize', onCerrar)
      window.removeEventListener('wheel', rueda, true)
      window.removeEventListener('blur', onCerrar)
    }
  }, [onCerrar])

  const conFlechas = (evento: React.KeyboardEvent<HTMLDivElement>): void => {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return
    evento.preventDefault()
    const botones = [...(caja.current?.querySelectorAll('button') ?? [])]
    const donde = botones.indexOf(document.activeElement as HTMLButtonElement)
    const paso = evento.key === 'ArrowDown' ? 1 : -1
    botones[(donde + paso + botones.length) % botones.length]?.focus()
  }

  return createPortal(
    <div ref={caja} className="menu-contextual" role="menu" style={{ left: sitio.x, top: sitio.y }} onKeyDown={conFlechas}>
      {opciones.map((opcion) => {
        const Icono = opcion.icono
        return (
          <button
            key={opcion.etiqueta}
            type="button"
            role={opcion.marcada == null ? 'menuitem' : 'menuitemradio'}
            aria-checked={opcion.marcada}
            className={`menu-contextual-opcion${opcion.peligrosa ? ' peligrosa' : ''}${opcion.marcada ? ' marcada' : ''}`}
            onClick={() => {
              onCerrar()
              opcion.onElegir()
            }}
          >
            {opcion.marcada ? <Check size={15} /> : Icono ? <Icono size={15} /> : <span className="menu-contextual-hueco" />}
            {opcion.etiqueta}
            {opcion.pista && <span className="menu-contextual-pista">{opcion.pista}</span>}
          </button>
        )
      })}
    </div>,
    document.body
  )
}

/**
 * El menú de una lista: qué fila y en qué punto. `abrir` va en el
 * `onContextMenu` de la fila, y la fila con menú lleva la clase `marcada`
 * mientras está abierto, para que se vea sobre cuál se ha pulsado.
 */
export function useMenu<T>(): {
  menu: { de: T; x: number; y: number } | null
  abrir: (de: T) => (evento: EventoRaton) => void
  cerrar: () => void
} {
  const [menu, setMenu] = useState<{ de: T; x: number; y: number } | null>(null)
  const abrir = useCallback(
    (de: T) => (evento: EventoRaton) => {
      evento.preventDefault()
      evento.stopPropagation()
      setMenu({ de, x: evento.clientX, y: evento.clientY })
    },
    []
  )
  const cerrar = useCallback(() => setMenu(null), [])
  return { menu, abrir, cerrar }
}
