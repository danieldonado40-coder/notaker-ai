'use client'

import { CalendarDays, CheckSquare, MoreHorizontal, Pin, Square } from 'lucide-react'
import { formatShort, noteBodyLines, noteTitle, tintVar } from '@/lib/notes'
import type { Folder, Note } from '@/lib/types'

export function NoteCard({
  note,
  folder,
  selected,
  index = 0,
  onOpen,
  onMore,
}: {
  note: Note
  folder?: Folder
  selected?: boolean
  index?: number
  onOpen: () => void
  onMore: () => void
}) {
  const lines = noteBodyLines(note.content).slice(0, 3)
  return (
    <div
      role="button"
      tabIndex={0}
      className={`note-card ${selected ? 'selected' : ''}`}
      style={{ ['--tint' as string]: tintVar(folder?.color), animationDelay: `${Math.min(index, 8) * 35}ms` }}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
    >
      <h3>{noteTitle(note.content)}</h3>
      {lines.length > 0 ? (
        <div className="note-lines">
          {lines.map((l, i) => {
            const todo = l.startsWith('☐')
            const done = l.startsWith('☑')
            return (
              <span key={i} className={`line ${done ? 'done' : ''}`}>
                {todo && <Square size={14} />}
                {done && <CheckSquare size={14} />}
                {todo || done ? l.slice(1).trim() : l}
              </span>
            )
          })}
        </div>
      ) : (
        <div className="note-lines">
          <span className="line">Sin texto adicional</span>
        </div>
      )}
      <div className="note-foot">
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {note.pinned && <Pin size={14} className="pin-badge" fill="currentColor" />}
          {folder && <span className="tag">{folder.name}</span>}
        </span>
        <span className="note-date">
          <CalendarDays size={13} /> {formatShort(note.updated_at)}
        </span>
      </div>
      <button
        className="more"
        aria-label="Más opciones"
        onClick={(e) => {
          e.stopPropagation()
          onMore()
        }}
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  )
}
