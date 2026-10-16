import type { FolderColor, Note } from './types'

export const FOLDER_COLORS: FolderColor[] = ['blue', 'sky', 'indigo', 'mint', 'lemon', 'rose']

export const SOLID: Record<FolderColor, string> = {
  blue: '#3d7bf7',
  sky: '#22a6f2',
  indigo: '#5b5cf0',
  mint: '#20b37a',
  lemon: '#d6b40b',
  rose: '#ef4f86',
}

export const tintVar = (c?: FolderColor | null) => (c ? `var(--tint-${c})` : 'var(--tint-none)')

export function noteTitle(content: string) {
  const line = content.split('\n').find((l) => l.trim())
  return line ? line.trim().slice(0, 90) : 'Nota nueva'
}

export function noteBodyLines(content: string) {
  const lines = content.split('\n')
  const first = lines.findIndex((l) => l.trim())
  return lines
    .slice(first + 1)
    .map((l) => l.trim())
    .filter(Boolean)
}

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const DAY = 86_400_000

export function groupNotes(notes: Note[], withPinned = true) {
  const groups: { label: string; notes: Note[] }[] = []
  const push = (label: string, n: Note) => {
    let g = groups.find((x) => x.label === label)
    if (!g) groups.push((g = { label, notes: [] }))
    g.notes.push(n)
  }
  const today = startOfDay(new Date())
  for (const n of notes) {
    if (withPinned && n.pinned) {
      push('Fijadas', n)
      continue
    }
    const d = new Date(n.updated_at)
    const diff = (today - startOfDay(d)) / DAY
    if (diff <= 0) push('Hoy', n)
    else if (diff === 1) push('Ayer', n)
    else if (diff < 7) push('Últimos 7 días', n)
    else if (diff < 30) push('Últimos 30 días', n)
    else {
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      push(label.charAt(0).toUpperCase() + label.slice(1), n)
    }
  }
  // "Fijadas" siempre primero
  return groups.sort((a, b) => (a.label === 'Fijadas' ? -1 : b.label === 'Fijadas' ? 1 : 0))
}

export function formatShort(iso: string) {
  const d = new Date(iso)
  const diff = (startOfDay(new Date()) - startOfDay(d)) / DAY
  if (diff <= 0) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Ayer'
  if (diff < 7) return d.toLocaleDateString('es-ES', { weekday: 'long' })
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function formatLong(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTaskDate(fecha?: string | null, hora?: string | null) {
  if (!fecha) return null
  const [y, m, d] = fecha.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const diff = (startOfDay(date) - startOfDay(new Date())) / DAY
  const label =
    diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  return hora ? `${label} · ${hora}` : label
}

export function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export function dateContext() {
  const now = new Date()
  return {
    today: now.toLocaleDateString('en-CA'),
    todayLong: now.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
