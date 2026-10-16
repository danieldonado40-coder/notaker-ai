'use client'

import { CheckSquare, FolderClosed, Home, Mic, Settings2 } from 'lucide-react'

export type Tab = 'home' | 'folders' | 'tasks' | 'settings'

export function BottomNav({ tab, onTab, onMic }: { tab: Tab; onTab: (t: Tab) => void; onMic: () => void }) {
  const item = (t: Tab, label: string, Icon: typeof Home) => (
    <button className={`icon-btn ${tab === t ? 'active' : ''}`} onClick={() => onTab(t)} aria-label={label} aria-current={tab === t}>
      <Icon size={20} strokeWidth={2.1} />
    </button>
  )
  return (
    <nav className="dock glass-dark liquid" aria-label="Navegación">
      {item('home', 'Inicio', Home)}
      {item('folders', 'Carpetas', FolderClosed)}
      <button className="mic-btn" onClick={onMic} aria-label="Nueva nota de voz">
        <Mic size={26} strokeWidth={2.2} />
      </button>
      {item('tasks', 'Tareas', CheckSquare)}
      {item('settings', 'Ajustes', Settings2)}
    </nav>
  )
}
