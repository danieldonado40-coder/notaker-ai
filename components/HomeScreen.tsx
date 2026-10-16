'use client'

import {
  ChevronRight,
  ListChecks,
  Mic,
  Moon,
  PenLine,
  Pin,
  Plus,
  Search,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import { greeting, groupNotes } from '@/lib/notes'
import type { Filter, Folder, Note } from '@/lib/types'
import type { Theme } from '@/hooks/useSettings'
import { NoteCard } from './NoteCard'

type Props = {
  name: string
  notes: Note[]
  folders: Folder[]
  filter: Filter
  query: string
  loading: boolean
  openId: string | null
  pendingTasks: number
  theme: Theme
  onToggleTheme: () => void
  onFilter: (f: Filter) => void
  onQuery: (q: string) => void
  onNewNote: () => void
  onVoice: () => void
  onOpenNote: (id: string) => void
  onNoteMenu: (n: Note) => void
  onGoTasks: () => void
  onNewFolder: () => void
}

export function HomeScreen(p: Props) {
  const folderById = new Map(p.folders.map((f) => [f.id, f]))
  const groups = groupNotes(p.notes, p.filter !== 'pinned')
  const current = p.folders.find((f) => f.id === p.filter)
  const showBento = p.filter === 'all' && !p.query
  const initials = p.name.trim().slice(0, 1).toUpperCase() || 'N'

  return (
    <div className="screen">
      <div className="topbar">
        <div className="hello">
          <div className="avatar">{initials}</div>
          <div className="hello-text">
            <small>{greeting()} 👋</small>
            <strong>{p.name}</strong>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="icon-btn glass liquid"
            onClick={p.onToggleTheme}
            title={p.theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Cambiar tema"
          >
            {p.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="icon-btn glass liquid"
            onClick={p.onNewNote}
            title="Nueva nota"
            aria-label="Nueva nota"
          >
            <PenLine size={19} />
          </button>
        </div>
      </div>

      <h1 className="display">
        {p.filter === 'all' ? (
          <>
            ¿Qué vamos a <em>anotar</em> hoy?
          </>
        ) : p.filter === 'pinned' ? (
          'Fijadas'
        ) : p.filter === 'trash' ? (
          'Eliminado recientemente'
        ) : (
          current?.name ?? 'Notas'
        )}
      </h1>

      <label className="search glass liquid">
        <Search size={18} />
        <input
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder="Buscar notas…"
          enterKeyHint="search"
          aria-label="Buscar notas"
        />
        {p.query ? (
          <button className="icon-btn" onClick={() => p.onQuery('')} aria-label="Limpiar búsqueda">
            <X size={16} />
          </button>
        ) : (
          <button className="icon-btn" onClick={p.onVoice} aria-label="Nota de voz">
            <Mic size={17} />
          </button>
        )}
      </label>

      {showBento && (
        <div className="bento" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button className="tile liquid" onClick={p.onNewNote}>
            <div className="tile-ico">
              <PenLine size={20} />
            </div>
            <div className="tile-row">
              <div>
                <h4>Nueva nota</h4>
                <p>Escribe tus ideas</p>
              </div>
              <span className="chev">
                <ChevronRight size={16} />
              </span>
            </div>
          </button>

          <button className="tile tasks liquid" onClick={p.onGoTasks}>
            <div className="tile-ico">
              <ListChecks size={20} />
            </div>
            <div className="tile-row">
              <div>
                <h4>Tareas</h4>
                <p>{p.pendingTasks ? `${p.pendingTasks} pendientes` : 'Todo al día'}</p>
              </div>
              <span className="chev">
                <ChevronRight size={16} />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Botón flotante para dictado de voz / grabar actividades */}
      <button
        className="floating-mic"
        onClick={p.onVoice}
        title="Hablar y anotar con IA"
        aria-label="Hablar y anotar con IA"
      >
        <Mic size={26} strokeWidth={2.4} />
      </button>

      <div className="chips" role="tablist" aria-label="Carpetas">
        <button className={`chip ${p.filter === 'all' ? 'active' : ''}`} onClick={() => p.onFilter('all')}>
          Todas
        </button>
        <button className={`chip ${p.filter === 'pinned' ? 'active' : ''}`} onClick={() => p.onFilter('pinned')}>
          <Pin size={13} /> Fijadas
        </button>
        {p.folders.map((f) => (
          <button key={f.id} className={`chip ${p.filter === f.id ? 'active' : ''}`} onClick={() => p.onFilter(f.id)}>
            {f.name}
          </button>
        ))}
        <button className={`chip ${p.filter === 'trash' ? 'active' : ''}`} onClick={() => p.onFilter('trash')} aria-label="Eliminado recientemente">
          <Trash2 size={13} />
        </button>
        <button className="chip" onClick={p.onNewFolder} aria-label="Nueva carpeta">
          <Plus size={14} />
        </button>
      </div>

      {p.loading ? (
        <div className="empty-state">Cargando…</div>
      ) : p.notes.length === 0 ? (
        <div className="empty-state">
          <PenLine size={30} />
          <div>{p.query ? 'Sin resultados' : p.filter === 'trash' ? 'No hay notas eliminadas' : 'Aún no hay notas aquí'}</div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.label}>
            <div className="group-label">
              {g.label === 'Fijadas' && <Pin size={12} />}
              {g.label}
            </div>
            <div className="note-list">
              {g.notes.map((n, i) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  index={i}
                  folder={n.folder_id ? folderById.get(n.folder_id) : undefined}
                  selected={p.openId === n.id}
                  onOpen={() => p.onOpenNote(n.id)}
                  onMore={() => p.onNoteMenu(n)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
