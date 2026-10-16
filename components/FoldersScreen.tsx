'use client'

import { ChevronRight, FolderClosed, Inbox, Minus, Pin, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { SOLID } from '@/lib/notes'
import type { Filter, Folder, Note } from '@/lib/types'

export function FoldersScreen({
  folders,
  notes,
  onOpen,
  onNewFolder,
  onDeleteFolder,
}: {
  folders: Folder[]
  notes: Note[]
  onOpen: (f: Filter) => void
  onNewFolder: () => void
  onDeleteFolder: (f: Folder) => void
}) {
  const [editing, setEditing] = useState(false)
  const alive = notes.filter((n) => !n.deleted_at)
  const count = (fn: (n: Note) => boolean) => alive.filter(fn).length
  const trash = notes.filter((n) => n.deleted_at).length

  const row = (key: string, label: string, icon: React.ReactNode, color: string, n: number, f: Filter) => (
    <button key={key} className="row" onClick={() => onOpen(f)}>
      <span className="row-ico" style={{ color }}>
        {icon}
      </span>
      <span className="row-main">
        <strong>{label}</strong>
      </span>
      <span className="row-end">
        {n}
        <ChevronRight size={17} />
      </span>
    </button>
  )

  return (
    <div className="screen">
      <div className="page-head">
        <button className="btn btn-ghost" style={{ height: 40, padding: '0 16px' }} onClick={() => setEditing((e) => !e)}>
          {editing ? 'OK' : 'Editar'}
        </button>
        <button className="icon-btn glass liquid" onClick={onNewFolder} aria-label="Nueva carpeta">
          <Plus size={20} />
        </button>
      </div>
      <h1 className="page-title">Carpetas</h1>

      <div className="group-label">Notaker</div>
      <div className="list">
        {row('all', 'Todas las notas', <Inbox size={19} />, 'var(--accent)', alive.length, 'all')}
        {row('pinned', 'Fijadas', <Pin size={18} />, 'var(--accent)', count((n) => n.pinned), 'pinned')}
      </div>

      <div className="group-label">Mis carpetas</div>
      {folders.length === 0 ? (
        <div className="list">
          <button className="row" onClick={onNewFolder}>
            <span className="row-ico" style={{ color: 'var(--accent)' }}>
              <Plus size={18} />
            </span>
            <span className="row-main">
              <strong>Crear carpeta</strong>
            </span>
          </button>
        </div>
      ) : (
        <div className="list">
          {folders.map((f) =>
            editing ? (
              <div key={f.id} className="row">
                <button className="minus" onClick={() => onDeleteFolder(f)} aria-label={`Eliminar ${f.name}`}>
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="row-ico" style={{ color: SOLID[f.color] }}>
                  <FolderClosed size={18} />
                </span>
                <span className="row-main">
                  <strong>{f.name}</strong>
                </span>
              </div>
            ) : (
              row(f.id, f.name, <FolderClosed size={18} />, SOLID[f.color], count((n) => n.folder_id === f.id), f.id)
            ),
          )}
        </div>
      )}

      <div className="group-label">Otros</div>
      <div className="list">{row('trash', 'Eliminado recientemente', <Trash2 size={18} />, '#ff4558', trash, 'trash')}</div>
    </div>
  )
}
