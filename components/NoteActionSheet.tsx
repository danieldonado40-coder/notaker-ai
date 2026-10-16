'use client'

import {
  Copy,
  FolderClosed,
  Pin,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import type { Folder, Note } from '@/lib/types'

type Props = {
  open: boolean
  note: Note | null
  folders: Folder[]
  onClose: () => void
  onTogglePin: (id: string, current: boolean) => void
  onMoveFolder: (id: string, folderId: string | null) => void
  onDuplicate: (note: Note) => void
  onDelete: (id: string) => void
  onExtractTasks: (note: Note) => void
}

export function NoteActionSheet({
  open,
  note,
  folders,
  onClose,
  onTogglePin,
  onMoveFolder,
  onDuplicate,
  onDelete,
  onExtractTasks,
}: Props) {
  if (!open || !note) return null

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grabber" />
        <div className="sheet-head">
          <h3>Opciones de la nota</h3>
          <button className="icon-btn sm glass" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="action-list">
          <button
            className="row"
            onClick={() => {
              onTogglePin(note.id, note.pinned)
              onClose()
            }}
          >
            <span className="row-ico" style={{ color: 'var(--accent)' }}>
              <Pin size={18} />
            </span>
            <span className="row-main">
              <strong>{note.pinned ? 'Desfijar nota' : 'Fijar nota'}</strong>
            </span>
          </button>

          <button
            className="row"
            onClick={() => {
              onExtractTasks(note)
              onClose()
            }}
          >
            <span className="row-ico" style={{ color: 'var(--accent)' }}>
              <Send size={18} />
            </span>
            <span className="row-main">
              <strong>Extraer actividades a Notion</strong>
            </span>
          </button>

          <button
            className="row"
            onClick={() => {
              onDuplicate(note)
              onClose()
            }}
          >
            <span className="row-ico" style={{ color: 'var(--accent)' }}>
              <Copy size={18} />
            </span>
            <span className="row-main">
              <strong>Duplicar nota</strong>
            </span>
          </button>

          {/* Selector rápido de carpeta */}
          <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
              Mover a carpeta:
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className={`tag ${note.folder_id === null ? 'selected' : ''}`}
                style={{
                  border: note.folder_id === null ? '1px solid var(--accent)' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onMoveFolder(note.id, null)
                  onClose()
                }}
              >
                Sin carpeta
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  className="tag"
                  style={{
                    border: note.folder_id === f.id ? '1px solid var(--accent)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    onMoveFolder(note.id, f.id)
                    onClose()
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <button
            className="row danger"
            onClick={() => {
              onDelete(note.id)
              onClose()
            }}
          >
            <span className="row-ico" style={{ color: '#ff4558' }}>
              <Trash2 size={18} />
            </span>
            <span className="row-main">
              <strong>{note.deleted_at ? 'Eliminar definitivamente' : 'Eliminar nota'}</strong>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
