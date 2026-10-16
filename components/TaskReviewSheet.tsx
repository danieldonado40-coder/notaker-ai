'use client'

import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { DetectedTask, Priority } from '@/lib/types'

type Props = {
  open: boolean
  tasks: DetectedTask[]
  sourceName?: string
  loading?: boolean
  onClose: () => void
  onConfirm: (selectedTasks: DetectedTask[]) => void
}

export function TaskReviewSheet({
  open,
  tasks: initialTasks,
  sourceName = 'Nota de voz',
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const [items, setItems] = useState<
    { task: DetectedTask; enabled: boolean }[]
  >([])

  // Sincronizar cuando cambia initialTasks o se abre
  const [lastInitial, setLastInitial] = useState(initialTasks)
  if (initialTasks !== lastInitial) {
    setLastInitial(initialTasks)
    setItems(initialTasks.map((t) => ({ task: { ...t }, enabled: true })))
  }

  if (!open) return null

  const enabledCount = items.filter((i) => i.enabled).length

  const updateTask = (index: number, patch: Partial<DetectedTask>) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, task: { ...item.task, ...patch } } : item,
      ),
    )
  }

  const toggleEnabled = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, enabled: !item.enabled } : item,
      ),
    )
  }

  const removeTask = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addNew = () => {
    setItems((prev) => [
      ...prev,
      {
        task: {
          titulo: 'Nueva actividad',
          prioridad: 'Media',
          fecha: new Date().toLocaleDateString('en-CA'),
        },
        enabled: true,
      },
    ])
  }

  const handleConfirm = () => {
    const selected = items.filter((i) => i.enabled).map((i) => i.task)
    onConfirm(selected)
  }

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
          <div>
            <h3>Actividades detectadas</h3>
            <p>
              Revisa antes de sincronizar con tu <strong>Notion</strong>
            </p>
          </div>
          <button
            className="icon-btn sm glass"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 10px' }}>
            <p>No se encontraron tareas en esta grabación.</p>
            <button
              className="btn btn-ghost"
              onClick={addNew}
              style={{ marginTop: 10 }}
            >
              <Plus size={16} /> Añadir una tarea manual
            </button>
          </div>
        ) : (
          <div className="review-list">
            {items.map((item, index) => {
              const { task, enabled } = item
              return (
                <div
                  key={index}
                  className={`review-item ${enabled ? '' : 'off'}`}
                >
                  <button
                    className={`check ${enabled ? 'on' : ''}`}
                    onClick={() => toggleEnabled(index)}
                    aria-label={enabled ? 'Deseleccionar' : 'Seleccionar'}
                  >
                    {enabled && <Check size={14} strokeWidth={3} />}
                  </button>

                  <div className="r-main">
                    <input
                      className="r-title"
                      value={task.titulo}
                      onChange={(e) =>
                        updateTask(index, { titulo: e.target.value })
                      }
                      placeholder="Nombre de la actividad…"
                      disabled={!enabled}
                    />

                    <div className="r-meta">
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CalendarDays size={14} color="var(--accent)" />
                        <input
                          type="date"
                          className="mini"
                          value={task.fecha || ''}
                          onChange={(e) =>
                            updateTask(index, {
                              fecha: e.target.value || null,
                            })
                          }
                          disabled={!enabled}
                        />
                      </label>

                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={14} color="var(--accent)" />
                        <input
                          type="time"
                          className="mini"
                          value={task.hora || ''}
                          onChange={(e) =>
                            updateTask(index, {
                              hora: e.target.value || null,
                            })
                          }
                          disabled={!enabled}
                        />
                      </label>

                      <div className="mini-seg">
                        {(['Alta', 'Media', 'Baja'] as Priority[]).map((p) => (
                          <button
                            key={p}
                            className={task.prioridad === p ? 'on' : ''}
                            onClick={() => updateTask(index, { prioridad: p })}
                            disabled={!enabled}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        className="icon-btn sm"
                        style={{ marginLeft: 'auto', color: 'var(--text-3)' }}
                        onClick={() => removeTask(index)}
                        aria-label="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              className="btn btn-ghost btn-block"
              style={{ height: 42, fontSize: 13, border: '1px dashed var(--sep)' }}
              onClick={addNew}
            >
              <Plus size={15} /> Añadir otra actividad
            </button>
          </div>
        )}

        <div className="sheet-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Descartar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={loading || enabledCount === 0}
          >
            {loading ? (
              'Enviando a Notion…'
            ) : (
              <>
                <Send size={16} /> Enviar {enabledCount} a Notion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
