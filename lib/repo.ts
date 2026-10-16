/**
 * Capa de datos del FRONT (fase 1).
 *
 * Todo vive en localStorage para poder diseñar y probar la app sin backend.
 * En la fase 2 se reemplaza la implementación `localRepo` por una que hable con
 * Supabase (notas/carpetas) y con /api/notion (tareas), manteniendo esta misma interfaz.
 */
import { FOLDER_COLORS, uid } from './notes'
import type { DetectedTask, Folder, FolderColor, Note, NotionTask } from './types'

export interface Repo {
  load(): Promise<{ notes: Note[]; folders: Folder[] }>
  createNote(input: { content: string; folder_id: string | null }): Promise<Note>
  updateNote(id: string, patch: Partial<Note>): Promise<void>
  purgeNote(id: string): Promise<void>
  createFolder(name: string, color?: FolderColor): Promise<Folder>
  deleteFolder(id: string): Promise<void>
  listTasks(): Promise<NotionTask[]>
  sendTasks(tasks: DetectedTask[], origen: string): Promise<NotionTask[]>
  setTaskDone(id: string, done: boolean): Promise<void>
}

const K = { notes: 'notaker.notes', folders: 'notaker.folders', tasks: 'notaker.tasks', seeded: 'notaker.seeded' }

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function seed() {
  if (localStorage.getItem(K.seeded)) return
  const now = Date.now()
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString()
  const folders: Folder[] = [
    { id: uid(), name: 'Trabajo', color: 'blue', created_at: iso(9000) },
    { id: uid(), name: 'Personal', color: 'mint', created_at: iso(8000) },
    { id: uid(), name: 'Ideas', color: 'indigo', created_at: iso(7000) },
  ]
  const [work, personal, ideas] = folders
  const note = (content: string, minsAgo: number, folder: Folder | null, pinned = false): Note => ({
    id: uid(),
    folder_id: folder?.id ?? null,
    content,
    pinned,
    created_at: iso(minsAgo + 30),
    updated_at: iso(minsAgo),
    deleted_at: null,
  })
  const notes: Note[] = [
    note('Bienvenido a Notaker 👋\nToca el micrófono azul y habla: transcribo todo, lo ordeno y si detecto tareas te las propongo para enviarlas a Notion.\n☐ Prueba una nota de voz\n☐ Crea una carpeta\n☑ Abrir Notaker', 2, null, true),
    note('Reunión de producto\nRevisamos el rendimiento de la campaña, el calendario de contenido y las tareas del próximo sprint.\n☐ Enviar resumen al equipo\n☐ Preparar propuesta de landing', 90, work),
    note('Lista del súper\n☐ Leche de avena\n☐ Café en grano\n☑ Pan integral\n☐ Fresas', 60 * 26, personal),
    note('App de hábitos\nUna app que te pregunte por voz cómo te fue el día y genere un diario automático.', 60 * 24 * 4, ideas),
    note('Viaje a Cartagena\nVuelos el viernes por la mañana. Reservar hotel cerca de la ciudad amurallada.', 60 * 24 * 12, personal),
  ]
  write(K.folders, folders)
  write(K.notes, notes)
  write(K.tasks, [])
  localStorage.setItem(K.seeded, '1')
}

export const localRepo: Repo = {
  async load() {
    seed()
    await wait(120)
    return { notes: read<Note[]>(K.notes, []), folders: read<Folder[]>(K.folders, []) }
  },
  async createNote({ content, folder_id }) {
    const now = new Date().toISOString()
    const n: Note = { id: uid(), folder_id, content, pinned: false, created_at: now, updated_at: now, deleted_at: null }
    write(K.notes, [n, ...read<Note[]>(K.notes, [])])
    return n
  },
  async updateNote(id, patch) {
    write(
      K.notes,
      read<Note[]>(K.notes, []).map((n) => (n.id === id ? { ...n, ...patch } : n)),
    )
  },
  async purgeNote(id) {
    write(
      K.notes,
      read<Note[]>(K.notes, []).filter((n) => n.id !== id),
    )
  },
  async createFolder(name, color) {
    const folders = read<Folder[]>(K.folders, [])
    const f: Folder = {
      id: uid(),
      name,
      color: color ?? FOLDER_COLORS[folders.length % FOLDER_COLORS.length],
      created_at: new Date().toISOString(),
    }
    write(K.folders, [...folders, f])
    return f
  },
  async deleteFolder(id) {
    write(
      K.folders,
      read<Folder[]>(K.folders, []).filter((f) => f.id !== id),
    )
    write(
      K.notes,
      read<Note[]>(K.notes, []).map((n) => (n.folder_id === id ? { ...n, folder_id: null } : n)),
    )
  },
  async listTasks() {
    await wait(250)
    return read<NotionTask[]>(K.tasks, [])
  },
  async sendTasks(tasks, origen) {
    try {
      const res = await fetch('/api/notion/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, origen }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.created) {
          write(K.tasks, [...json.created, ...read<NotionTask[]>(K.tasks, [])])
          return json.created
        }
      }
    } catch (err) {
      console.warn('Fallo conectando con /api/notion/tasks:', err)
    }

    // Fallback local
    const created: NotionTask[] = tasks.map((t) => ({
      ...t,
      id: uid(),
      origen,
      done: false,
      created_at: new Date().toISOString(),
    }))
    write(K.tasks, [...created, ...read<NotionTask[]>(K.tasks, [])])
    return created
  },
  async setTaskDone(id, done) {
    write(
      K.tasks,
      read<NotionTask[]>(K.tasks, []).map((t) => (t.id === id ? { ...t, done } : t)),
    )
  },
}

export const repo: Repo = localRepo
