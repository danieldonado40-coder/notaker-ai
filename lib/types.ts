export type Note = {
  id: string
  folder_id: string | null
  content: string
  pinned: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type FolderColor = 'blue' | 'sky' | 'indigo' | 'mint' | 'lemon' | 'rose'

export type Folder = {
  id: string
  name: string
  color: FolderColor
  created_at: string
}

export type Priority = 'Alta' | 'Media' | 'Baja'

/** Tarea detectada por la IA, antes de enviarla a Notion. */
export type DetectedTask = {
  titulo: string
  descripcion?: string
  fecha?: string | null // YYYY-MM-DD
  hora?: string | null // HH:MM
  prioridad: Priority
}

/** Tarea ya enviada a Notion. */
export type NotionTask = DetectedTask & {
  id: string
  url?: string
  origen?: string
  done: boolean
  created_at: string
}

export type VoiceResult = {
  texto: string
  resumen?: string
  tareas: DetectedTask[]
}

export type AiAction = 'summarize' | 'rewrite' | 'bullets' | 'title' | 'tasks'

export type Filter = 'all' | 'pinned' | 'trash' | (string & {})
