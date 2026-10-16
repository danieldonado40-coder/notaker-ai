'use client'

import {
  AlignLeft,
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronLeft,
  FolderClosed,
  List,
  Loader2,
  Mic,
  MoreHorizontal,
  Pin,
  Send,
  Share2,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatLong, noteTitle } from '@/lib/notes'
import { runAiAction } from '@/lib/ai'
import type { AiAction, DetectedTask, Folder, Note } from '@/lib/types'
import { Orb } from './Orb'

type Props = {
  note: Note | null
  folders: Folder[]
  model: string
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Note>) => void
  onDelete: (id: string) => void
  onExtractTasks: (tasks: DetectedTask[]) => void
  onVoice?: () => void
}

export function Editor({
  note,
  folders,
  model,
  onClose,
  onUpdate,
  onDelete,
  onExtractTasks,
  onVoice,
}: Props) {
  const [content, setContent] = useState(note?.content ?? '')
  const [loadingAi, setLoadingAi] = useState<AiAction | null>(null)
  const [folderMenu, setFolderMenu] = useState(false)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sincronizar nota activa
  useEffect(() => {
    setContent(note?.content ?? '')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [note?.id])

  if (!note) {
    return (
      <div className="editor-empty">
        <div>
          <div className="orb-sm">
            <Orb mode="idle" color="#6aa3ff" />
          </div>
          <h3>Ninguna nota seleccionada</h3>
          <p>Selecciona una nota existente o crea una nueva para comenzar.</p>
        </div>
      </div>
    )
  }

  const currentFolder = folders.find((f) => f.id === note.folder_id)

  const handleChange = (newVal: string) => {
    setContent(newVal)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      onUpdate(note.id, {
        content: newVal,
        updated_at: new Date().toISOString(),
      })
    }, 450)
  }

  const togglePin = () => {
    onUpdate(note.id, { pinned: !note.pinned })
  }

  const insertChecklist = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const before = content.substring(0, start)
    const after = content.substring(start)
    const prefix = before.endsWith('\n') || before === '' ? '' : '\n'
    const newContent = `${before}${prefix}☐ ${after}`
    handleChange(newContent)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length + 2, start + prefix.length + 2)
    }, 10)
  }

  const handleAiAction = async (action: AiAction) => {
    if (!content.trim() || loadingAi) return
    setLoadingAi(action)
    try {
      const res = await runAiAction(action, content, model)
      if (action === 'tasks' && res.tareas) {
        onExtractTasks(res.tareas)
      } else if (res.text) {
        if (action === 'title') {
          // Reemplazar la primera línea
          const lines = content.split('\n')
          lines[0] = res.text
          handleChange(lines.join('\n'))
        } else if (action === 'summarize') {
          handleChange(`${content}\n\nResumen IA:\n${res.text}`)
        } else {
          handleChange(res.text)
        }
      }
    } catch (err) {
      console.error('Error ejecutando acción IA:', err)
    } finally {
      setLoadingAi(null)
    }
  }

  return (
    <div className="editor">
      {/* Barra superior de herramientas estilo iOS */}
      <div className="editor-top">
        <button
          className="icon-btn back-btn"
          onClick={onClose}
          aria-label="Regresar"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>

        {/* Selector de carpeta */}
        <div className="title-pill glass liquid" style={{ position: 'relative' }}>
          <FolderClosed size={15} color="var(--accent)" />
          <button
            onClick={() => setFolderMenu(!folderMenu)}
            style={{ fontWeight: 600, fontSize: 13 }}
          >
            {currentFolder ? currentFolder.name : 'Sin carpeta'}
          </button>

          {folderMenu && (
            <div
              className="list"
              style={{
                position: 'absolute',
                top: 48,
                left: 0,
                minWidth: 170,
                zIndex: 40,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <button
                className="row"
                style={{ padding: '8px 14px' }}
                onClick={() => {
                  onUpdate(note.id, { folder_id: null })
                  setFolderMenu(false)
                }}
              >
                <small>Sin carpeta</small>
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  className="row"
                  style={{ padding: '8px 14px' }}
                  onClick={() => {
                    onUpdate(note.id, { folder_id: f.id })
                    setFolderMenu(false)
                  }}
                >
                  <small>{f.name}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="editor-actions">
          <button
            className="icon-btn"
            onClick={insertChecklist}
            title="Añadir tarea / checklist"
            aria-label="Añadir tarea"
          >
            <CheckSquare size={18} />
          </button>
          <button
            className={`icon-btn ${note.pinned ? 'pin-badge' : ''}`}
            onClick={togglePin}
            title={note.pinned ? 'Desfijar' : 'Fijar'}
            aria-label="Fijar nota"
          >
            <Pin size={18} fill={note.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            className="icon-btn"
            onClick={() => onDelete(note.id)}
            title="Eliminar nota"
            aria-label="Eliminar nota"
          >
            <Trash2 size={18} color="#ff4558" />
          </button>
        </div>
      </div>

      {/* Área de escritura y scroll */}
      <div className="editor-scroll">
        <div className="editor-inner">
          <div className="editor-date">{formatLong(note.updated_at)}</div>

          {note.deleted_at && (
            <div className="editor-banner">
              <span>Esta nota está en la papelera</span>
              <div>
                <button
                  className="btn btn-ghost"
                  onClick={() => onUpdate(note.id, { deleted_at: null })}
                >
                  Restaurar
                </button>
              </div>
            </div>
          )}

          {/* Editor de texto multilínea estilo Notas de iPhone */}
          <textarea
            ref={textareaRef}
            className="editor-body"
            value={content}
            onChange={(e) => {
              handleChange(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            placeholder="Título de la nota&#10;Escribe o habla para comenzar…"
            aria-label="Contenido de la nota"
            style={{
              width: '100%',
              border: 0,
              background: 'transparent',
              resize: 'none',
              overflow: 'hidden',
            }}
          />

          {/* Botones de IA Assist (inspirados en las referencias de IA Assistant) */}
          <div className="ai-strip">
            <button
              className="chip"
              onClick={() => handleAiAction('tasks')}
              disabled={!!loadingAi}
            >
              {loadingAi === 'tasks' ? (
                <Loader2 size={13} className="spin" />
              ) : (
                <Send size={13} />
              )}
              Extraer tareas a Notion
            </button>
            <button
              className="chip"
              onClick={() => handleAiAction('summarize')}
              disabled={!!loadingAi}
            >
              {loadingAi === 'summarize' ? (
                <Loader2 size={13} className="spin" />
              ) : (
                <Sparkles size={13} />
              )}
              Resumir nota
            </button>
            <button
              className="chip"
              onClick={() => handleAiAction('rewrite')}
              disabled={!!loadingAi}
            >
              {loadingAi === 'rewrite' ? (
                <Loader2 size={13} className="spin" />
              ) : (
                <AlignLeft size={13} />
              )}
              Reescribir claro
            </button>
            <button
              className="chip"
              onClick={() => handleAiAction('bullets')}
              disabled={!!loadingAi}
            >
              {loadingAi === 'bullets' ? (
                <Loader2 size={13} className="spin" />
              ) : (
                <List size={13} />
              )}
              En viñetas
            </button>
            <button
              className="chip"
              onClick={() => handleAiAction('title')}
              disabled={!!loadingAi}
            >
              {loadingAi === 'title' ? (
                <Loader2 size={13} className="spin" />
              ) : (
                <Sparkles size={13} />
              )}
              Sugerir título
            </button>
          </div>
        </div>
      </div>

      {/* Botón flotante para dictar o capturar tareas mientras escribes */}
      {onVoice && (
        <button
          className="editor-fab"
          onClick={onVoice}
          title="Dictar o capturar tareas con IA"
          aria-label="Dictar o capturar tareas con IA"
        >
          <Mic size={24} strokeWidth={2.4} />
        </button>
      )}
    </div>
  )
}
