/**
 * Las piezas de interfaz que comparten las aplicaciones de la casa.
 *
 * Salen de `src/renderer/src/components/ui.tsx` de BONK y se comportan igual:
 * el diálogo que se arrastra por su cabecera y se recentra con doble clic, el
 * Escape que es siempre del cuadro de más arriba, el foco que entra al abrir y
 * vuelve a su sitio al cerrar. Lo que aquí no está —el campo de importe, el
 * selector de iconos de categoría— es del dinero y se queda en BONK.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { Check, Target, X, type LucideIcon } from 'lucide-react'
import { PALETAS, type Paleta } from './paletas'

/* ---------- Diálogo ---------- */

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  /** Va encima de otro diálogo: más estrecho y con el velo más suave. */
  sobre?: boolean
  estrecho?: boolean
}

export function Modal({ title, onClose, children, footer, wide, sobre, estrecho }: ModalProps): ReactNode {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const origin = useRef({ x: 0, y: 0 })
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      // Con otro diálogo por encima, Escape es del de arriba.
      const velos = document.querySelectorAll('.overlay')
      if (velos.length > 1 && velos[velos.length - 1] !== dialog.current?.parentElement) return
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Al abrir, el foco entra en lo primero que hay que contestar; al cerrar,
  // vuelve a donde estaba. El aspa de la cabecera no cuenta.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const node = dialog.current
    if (node && !node.contains(document.activeElement)) {
      const selector =
        'input:not([disabled]), textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      const primero = [...node.querySelectorAll<HTMLElement>(selector)].find(
        (el) => el.offsetParent !== null && !el.closest('.modal-header')
      )
      ;(primero ?? node).focus()
    }
    return () => previous?.focus?.()
  }, [])

  const moved = offset.x !== 0 || offset.y !== 0

  function startDrag(event: React.PointerEvent<HTMLDivElement>): void {
    if ((event.target as HTMLElement).closest('button')) return
    origin.current = { x: event.clientX - offset.x, y: event.clientY - offset.y }
    const onMove = (move: PointerEvent): void => {
      const margin = 80
      setOffset({
        x: clamp(move.clientX - origin.current.x, -window.innerWidth / 2 + margin, window.innerWidth / 2 - margin),
        y: clamp(move.clientY - origin.current.y, -window.innerHeight / 2 + margin, window.innerHeight / 2 - margin)
      })
    }
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return createPortal(
    <div
      className={`overlay${sobre ? ' sobre' : ''}`}
      onMouseDown={(event) => !moved && event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialog}
        className={`modal${wide ? ' wide' : ''}${sobre ? ' sobre' : ''}${estrecho ? ' estrecho' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, animation: moved ? 'none' : undefined }}
      >
        <div
          className="modal-header"
          onPointerDown={startDrag}
          onDoubleClick={() => setOffset({ x: 0, y: 0 })}
          style={{ cursor: 'grab' }}
          title="Arrastra para mover el diálogo · doble clic para recentrarlo"
        >
          <h2>{title}</h2>
          {moved && (
            <button className="btn ghost icon" onClick={() => setOffset({ x: 0, y: 0 })} aria-label="Recentrar">
              <Target size={16} />
            </button>
          )}
          <button className="btn ghost icon" onClick={onClose} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/* ---------- Confirmación ---------- */

interface ConfirmProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function Confirm({
  title,
  message,
  confirmLabel = 'Aceptar',
  destructive,
  onConfirm,
  onCancel
}: ConfirmProps): ReactNode {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      sobre
      footer={
        <>
          <button className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className={`btn ${destructive ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="small">{message}</div>
    </Modal>
  )
}

/* ---------- Avisos ---------- */

export type TonoAviso = 'info' | 'success' | 'error'

interface Aviso {
  id: number
  message: string
  tone: TonoAviso
}

interface AvisosApi {
  toast: (message: string, tone?: TonoAviso) => void
  fail: (error: unknown) => void
}

const AvisosContext = createContext<AvisosApi | null>(null)

/** Lo que se le puede enseñar a alguien de un error que viene del puente. */
export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error)
  // Electron envuelve lo que lanza el proceso principal con su propia coletilla.
  return texto.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}

export function AvisosProvider({ children }: { children: ReactNode }): ReactNode {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const siguiente = useRef(1)

  const quitar = useCallback((id: number) => setAvisos((lista) => lista.filter((a) => a.id !== id)), [])

  const toast = useCallback(
    (message: string, tone: TonoAviso = 'success') => {
      const id = siguiente.current++
      setAvisos((lista) => [...lista.slice(-3), { id, message, tone }])
      // Los errores se quedan más: hay que tener tiempo de leer qué ha pasado.
      window.setTimeout(() => quitar(id), tone === 'error' ? 6000 : 2800)
    },
    [quitar]
  )

  const api = useMemo<AvisosApi>(
    () => ({ toast, fail: (error: unknown) => toast(mensajeDeError(error), 'error') }),
    [toast]
  )

  return (
    <AvisosContext.Provider value={api}>
      {children}
      {avisos.length > 0 &&
        createPortal(
          <div className="toasts" role="status">
            {avisos.map((aviso) => (
              <div key={aviso.id} className={`toast ${aviso.tone}`} onClick={() => quitar(aviso.id)}>
                <span className="dot" />
                <span>{aviso.message}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </AvisosContext.Provider>
  )
}

export function useAvisos(): AvisosApi {
  const api = useContext(AvisosContext)
  if (!api) throw new Error('useAvisos necesita un AvisosProvider por encima')
  return api
}

/* ---------- Campos ---------- */

interface FieldProps {
  label?: string
  children: ReactNode
  error?: string | null
  hint?: ReactNode
  required?: boolean
  htmlFor?: string
}

export function Field({ label, children, error, hint, required, htmlFor }: FieldProps): ReactNode {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {required && <span className="requerido">*</span>}
        </label>
      )}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (value: boolean) => void
  label: ReactNode
  hint?: ReactNode
  disabled?: boolean
}

export function Checkbox({ checked, onChange, label, hint, disabled }: CheckboxProps): ReactNode {
  return (
    <label className="checkbox" style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="checkbox-text">
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: Array<{ value: T; label: ReactNode }>
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>): ReactNode {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={option.value === value ? 'active' : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Estados vacíos y de carga ---------- */

export function EmptyState({
  icon: Icono,
  title,
  message,
  action
}: {
  icon: LucideIcon
  title: string
  message?: ReactNode
  action?: ReactNode
}): ReactNode {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icono size={24} strokeWidth={1.8} />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}

export function Loading(): ReactNode {
  return (
    <div className="loading">
      <div className="spinner" />
    </div>
  )
}

/* ---------- Selector de paleta ---------- */

export function SelectorPaleta({
  value,
  onChange
}: {
  value: Paleta
  onChange: (paleta: Paleta) => void
}): ReactNode {
  return (
    <div className="palette-grid">
      {PALETAS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`palette-card${value === item.id ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
          aria-pressed={value === item.id}
          title={item.hint}
        >
          <span className="palette-swatch" style={{ background: item.bg }}>
            <span style={{ background: item.card }} />
            <span style={{ background: item.accent }} />
          </span>
          <span className="palette-name">
            {item.label}
            {value === item.id && <Check size={13} strokeWidth={2.4} />}
          </span>
        </button>
      ))}
    </div>
  )
}
