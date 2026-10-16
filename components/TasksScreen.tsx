'use client'

import { CalendarDays, Check, FileText, ListChecks, RefreshCw } from 'lucide-react'
import { formatTaskDate } from '@/lib/notes'
import type { NotionTask } from '@/lib/types'

export function TasksScreen({
  tasks,
  loading,
  onToggle,
  onRefresh,
}: {
  tasks: NotionTask[]
  loading: boolean
  onToggle: (t: NotionTask) => void
  onRefresh: () => void
}) {
  const pending = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  const card = (t: NotionTask, i: number) => (
    <div key={t.id} className={`task-card ${t.done ? 'done' : ''}`} style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
      <button className={`check ${t.done ? 'on' : ''}`} onClick={() => onToggle(t)} aria-label={t.done ? 'Marcar pendiente' : 'Completar'}>
        {t.done && <Check size={15} strokeWidth={3} />}
      </button>
      <div className="t-main">
        <strong className={t.done ? 'done-text' : ''}>{t.titulo}</strong>
        <div className="t-meta">
          {formatTaskDate(t.fecha, t.hora) && (
            <span className="pill">
              <CalendarDays size={12} /> {formatTaskDate(t.fecha, t.hora)}
            </span>
          )}
          <span className={`pill prio-${t.prioridad}`}>{t.prioridad}</span>
          {t.origen && (
            <span className="pill">
              <FileText size={12} /> {t.origen}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="screen">
      <div className="page-head">
        <span className="notion-badge">
          <span className="status-dot off" /> Notion · modo demo
        </span>
        <button className="icon-btn glass liquid" onClick={onRefresh} aria-label="Actualizar">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
      <h1 className="page-title">Tareas</h1>
      <p className="page-sub">Actividades detectadas en tus notas y enviadas a Notion.</p>

      {pending.length === 0 && done.length === 0 && !loading && (
        <div className="empty-state">
          <ListChecks size={32} />
          <div>
            Aún no hay tareas.
            <br />
            Graba una nota de voz y di algo como
            <br />
            <em>“mañana tengo que llamar a Laura a las 3”</em>.
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <div className="group-label">Pendientes · {pending.length}</div>
          <div className="note-list">{pending.map(card)}</div>
        </>
      )}
      {done.length > 0 && (
        <>
          <div className="group-label">Completadas</div>
          <div className="note-list">{done.map(card)}</div>
        </>
      )}
    </div>
  )
}
