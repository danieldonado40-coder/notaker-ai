'use client'

import {
  Check,
  CheckCircle2,
  Database,
  Download,
  Globe,
  KeyRound,
  Moon,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from 'lucide-react'
import type { Settings, Theme } from '@/hooks/useSettings'
import { CLAUDE_MODELS, SPEECH_LANGS } from '@/lib/models'

export function SettingsScreen({
  settings,
  update,
  speechSupported,
}: {
  settings: Settings
  update: (p: Partial<Settings>) => void
  speechSupported: boolean
}) {
  const known = CLAUDE_MODELS.some((m) => m.id === settings.model)

  const handleExportBackup = () => {
    try {
      const notes = localStorage.getItem('notaker.notes') || '[]'
      const folders = localStorage.getItem('notaker.folders') || '[]'
      const tasks = localStorage.getItem('notaker.tasks') || '[]'
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        notes: JSON.parse(notes),
        folders: JSON.parse(folders),
        tasks: JSON.parse(tasks),
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notaker-backup-${new Date().toLocaleDateString('en-CA')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error exportando copia de seguridad')
    }
  }

  const handleImportBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.notes && Array.isArray(data.notes)) {
          localStorage.setItem('notaker.notes', JSON.stringify(data.notes))
          if (data.folders) localStorage.setItem('notaker.folders', JSON.stringify(data.folders))
          if (data.tasks) localStorage.setItem('notaker.tasks', JSON.stringify(data.tasks))
          alert('¡Copia de seguridad restaurada! Recargando...')
          window.location.reload()
        } else {
          alert('El archivo no contiene un formato de copia válido.')
        }
      } catch (err) {
        alert('Error al leer el archivo de copia de seguridad.')
      }
    }
    input.click()
  }

  return (
    <div className="screen">
      <div className="page-head" />
      <h1 className="page-title">Ajustes</h1>

      <div className="promo liquid">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Sparkles size={20} />
          <h4 style={{ margin: 0 }}>Claude IA Conectado</h4>
        </div>
        <p>
          Tu API Key de Anthropic está activa en el servidor. La transcripción limpia, extracción de tareas y herramientas de redacción funcionan con IA real.
        </p>
      </div>

      <div className="group-label">Perfil</div>
      <div className="list">
        <label className="row">
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <User size={18} />
          </span>
          <span className="row-main">
            <strong>Nombre</strong>
          </span>
          <input
            className="select"
            value={settings.name}
            onChange={(e) => update({ name: e.target.value })}
            aria-label="Nombre"
            style={{ color: 'var(--text)' }}
          />
        </label>
      </div>

      <div className="group-label">Modelo de Claude</div>
      <div className="list">
        {CLAUDE_MODELS.map((m) => (
          <button key={m.id} className="row" onClick={() => update({ model: m.id })}>
            <span className="row-ico" style={{ color: 'var(--accent)' }}>
              <Sparkles size={18} />
            </span>
            <span className="row-main">
              <strong>{m.label}</strong>
              <small>{m.hint}</small>
            </span>
            {settings.model === m.id && <Check size={19} color="var(--accent)" strokeWidth={2.6} />}
          </button>
        ))}
        <label className="row">
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <KeyRound size={18} />
          </span>
          <span className="row-main">
            <strong>Otro modelo</strong>
            <small>ID exacto de Anthropic</small>
          </span>
          <input
            className="select"
            placeholder="claude-…"
            value={known ? '' : settings.model}
            onChange={(e) => update({ model: e.target.value.trim() || CLAUDE_MODELS[0].id })}
            aria-label="ID de modelo personalizado"
            style={{ color: 'var(--text)' }}
          />
        </label>
      </div>

      <div className="group-label">Dictado de voz</div>
      <div className="list">
        <label className="row">
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <Globe size={18} />
          </span>
          <span className="row-main">
            <strong>Idioma</strong>
            {!speechSupported && <small style={{ color: '#ff9f0a' }}>Este navegador no soporta dictado</small>}
          </span>
          <select className="select" value={settings.lang} onChange={(e) => update({ lang: e.target.value })}>
            {SPEECH_LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="group-label">Apariencia</div>
      <div className="list">
        <div className="row">
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <Moon size={18} />
          </span>
          <span className="row-main">
            <strong>Tema</strong>
          </span>
          <div className="seg" style={{ minWidth: 200 }}>
            {(['auto', 'light', 'dark'] as Theme[]).map((t) => (
              <button key={t} className={settings.theme === t ? 'on' : ''} onClick={() => update({ theme: t })}>
                {t === 'auto' ? 'Auto' : t === 'light' ? 'Claro' : 'Oscuro'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="group-label">Copia de seguridad y datos</div>
      <div className="list">
        <button className="row" onClick={handleExportBackup}>
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <Download size={18} />
          </span>
          <span className="row-main">
            <strong>Exportar copia de seguridad</strong>
            <small>Descargar archivo JSON con todas tus notas y tareas</small>
          </span>
        </button>
        <button className="row" onClick={handleImportBackup}>
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <Upload size={18} />
          </span>
          <span className="row-main">
            <strong>Restaurar copia</strong>
            <small>Importar notas desde un archivo JSON</small>
          </span>
        </button>
      </div>

      <div className="group-label">Integraciones</div>
      <div className="list">
        <div className="row">
          <span className="row-ico" style={{ color: '#34c759' }}>
            <Sparkles size={18} />
          </span>
          <span className="row-main">
            <strong>Anthropic Claude</strong>
            <small>API Key configurada en el servidor</small>
          </span>
          <span className="row-end">
            <span className="status-dot" /> Activo
          </span>
        </div>
        <div className="row">
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <Database size={18} />
          </span>
          <span className="row-main">
            <strong>Notion</strong>
            <small>Entorno preparado (pendiente agregar token)</small>
          </span>
          <span className="row-end">
            <span className="status-dot off" /> Pendiente
          </span>
        </div>
        <div className="row">
          <span className="row-ico" style={{ color: 'var(--accent)' }}>
            <ShieldCheck size={18} />
          </span>
          <span className="row-main">
            <strong>Modo Personal</strong>
            <small>Solo para ti · Almacenamiento local en tu dispositivo</small>
          </span>
        </div>
      </div>

      <p className="page-sub" style={{ textAlign: 'center', marginTop: 22 }}>
        Notaker · v1.0
      </p>
    </div>
  )
}
