'use client'

import { useState } from 'react'
import { FOLDER_COLORS, SOLID } from '@/lib/notes'
import type { FolderColor } from '@/lib/types'
import { Sheet } from './ui'

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (name: string, color: FolderColor) => void
}

export function NewFolderDialog({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<FolderColor>('blue')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim(), color)
    setName('')
    setColor('blue')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nueva carpeta"
      subtitle="Organiza tus notas por temas"
    >
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          className="field"
          placeholder="Nombre de la carpeta (ej. Proyectos, Universidad…)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
            Color de la carpeta
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                style={{
                  width: 36,
                  height: 36,
                  padding: 0,
                  borderRadius: '50%',
                  backgroundColor: SOLID[c],
                  border: color === c ? '3px solid var(--text)' : 'none',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="sheet-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim()}
          >
            Guardar
          </button>
        </div>
      </form>
    </Sheet>
  )
}
