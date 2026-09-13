/**
 * Las nueve paletas de la casa, para el selector de Ajustes.
 *
 * Cada muestra enseña los tres tonos que definen la paleta —fondo, tarjeta y
 * acento— en su versión oscura, que es donde más se distinguen unas de otras.
 * Los valores son los de `estilos/paletas.css`; si se toca uno allí, se toca
 * aquí.
 */

export type Paleta =
  | 'grafito'
  | 'indigo'
  | 'marea'
  | 'sepia'
  | 'ciruela'
  | 'heat'
  | 'arasaka'
  | 'ghost'
  | '2049'

export interface MuestraPaleta {
  id: Paleta
  label: string
  hint: string
  bg: string
  card: string
  accent: string
}

export const PALETAS: MuestraPaleta[] = [
  { id: 'grafito', label: 'Grafito', hint: 'Grises neutros y azul', bg: '#14161a', card: '#1d2027', accent: '#6fb0ff' },
  { id: 'indigo', label: 'Índigo', hint: 'Azul violáceo, más frío', bg: '#151420', card: '#1f1d33', accent: '#a5a0ff' },
  { id: 'marea', label: 'Marea', hint: 'Verde azulado, sobrio', bg: '#0f1918', card: '#182625', accent: '#5fd8c4' },
  { id: 'sepia', label: 'Sepia', hint: 'Cálido, tono papel', bg: '#1a1714', card: '#241f1b', accent: '#e0ac5c' },
  { id: 'ciruela', label: 'Ciruela', hint: 'Vino y rosa', bg: '#1a1218', card: '#241a21', accent: '#f090c4' },
  { id: 'heat', label: 'Heat', hint: 'Los Ángeles de noche', bg: '#0e1418', card: '#162026', accent: '#5fb0d4' },
  { id: 'arasaka', label: 'Arasaka', hint: 'Negro corporativo y rojo', bg: '#0b0c0e', card: '#15171b', accent: '#ff3b47' },
  { id: 'ghost', label: 'Ghost', hint: 'Violeta de noche y neón aqua', bg: '#12101a', card: '#1c1a26', accent: '#6ae7e6' },
  { id: '2049', label: '2049', hint: 'Azul profundo y violeta', bg: '#070919', card: '#0f1730', accent: '#e07ac0' }
]

export function esPaleta(valor: unknown): valor is Paleta {
  return PALETAS.some((p) => p.id === valor)
}
