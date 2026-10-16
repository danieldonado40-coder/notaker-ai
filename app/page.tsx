'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BottomNav, type Tab } from '@/components/BottomNav'
import { Editor } from '@/components/Editor'
import { FoldersScreen } from '@/components/FoldersScreen'
import { HomeScreen } from '@/components/HomeScreen'
import { NewFolderDialog } from '@/components/NewFolderDialog'
import { NoteActionSheet } from '@/components/NoteActionSheet'
import { SettingsScreen } from '@/components/SettingsScreen'
import { TaskReviewSheet } from '@/components/TaskReviewSheet'
import { TasksScreen } from '@/components/TasksScreen'
import { LiquidBg, Toast, type ToastData } from '@/components/ui'
import { VoiceScreen } from '@/components/VoiceScreen'
import { useSettings } from '@/hooks/useSettings'
import { normalize, noteTitle } from '@/lib/notes'
import { repo } from '@/lib/repo'
import type {
  DetectedTask,
  Filter,
  Folder,
  FolderColor,
  Note,
  NotionTask,
} from '@/lib/types'

export default function App() {
  const [settings, updateSettings] = useSettings()

  // Estados de datos
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [tasks, setTasks] = useState<NotionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(false)

  // Navegación y filtros
  const [tab, setTab] = useState<Tab>('home')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)

  // Modales y pantallas
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [menuNote, setMenuNote] = useState<Note | null>(null)
  const [reviewState, setReviewState] = useState<{
    open: boolean
    tasks: DetectedTask[]
    sourceName: string
    noteId?: string
  }>({
    open: false,
    tasks: [],
    sourceName: '',
  })
  const [toast, setToast] = useState<ToastData | null>(null)

  const showToast = (text: string, action?: { label: string; run: () => void }) => {
    setToast({ id: Date.now(), text, action })
    setTimeout(() => {
      setToast((curr) => (curr?.text === text ? null : curr))
    }, 3800)
  }

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      const { notes: n, folders: f } = await repo.load()
      setNotes(n)
      setFolders(f)
      const t = await repo.listTasks()
      setTasks(t)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrado de notas
  const filteredNotes = useMemo(() => {
    let list = notes

    if (filter === 'trash') {
      list = list.filter((n) => n.deleted_at !== null)
    } else {
      list = list.filter((n) => n.deleted_at === null)
      if (filter === 'pinned') {
        list = list.filter((n) => n.pinned)
      } else if (filter !== 'all') {
        list = list.filter((n) => n.folder_id === filter)
      }
    }

    if (query.trim()) {
      const q = normalize(query.trim())
      list = list.filter((n) => normalize(n.content).includes(q))
    }

    return list
  }, [notes, filter, query])

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  )

  // Acciones sobre notas
  const handleCreateNote = async (
    initialContent = '',
    folderId: string | null = null,
  ) => {
    const targetFolder =
      folderId ?? (filter !== 'all' && filter !== 'pinned' && filter !== 'trash' ? filter : null)
    const newNote = await repo.createNote({
      content: initialContent,
      folder_id: targetFolder,
    })
    setNotes((prev) => [newNote, ...prev])
    setActiveNoteId(newNote.id)
    return newNote
  }

  const handleUpdateNote = async (id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    )
    await repo.updateNote(id, patch)
  }

  const handleDeleteNote = async (id: string) => {
    const target = notes.find((n) => n.id === id)
    if (!target) return

    if (target.deleted_at) {
      // Eliminar definitivamente
      setNotes((prev) => prev.filter((n) => n.id !== id))
      if (activeNoteId === id) setActiveNoteId(null)
      await repo.purgeNote(id)
      showToast('Nota eliminada definitivamente')
    } else {
      // Mover a papelera
      const now = new Date().toISOString()
      handleUpdateNote(id, { deleted_at: now })
      if (activeNoteId === id) setActiveNoteId(null)
      showToast('Nota movida a Eliminado recientemente', {
        label: 'Deshacer',
        run: () => handleUpdateNote(id, { deleted_at: null }),
      })
    }
  }

  const handleDuplicateNote = async (source: Note) => {
    const dup = await repo.createNote({
      content: source.content,
      folder_id: source.folder_id,
    })
    setNotes((prev) => [dup, ...prev])
    showToast('Nota duplicada')
  }

  // Acciones de carpetas
  const handleCreateFolder = async (name: string, color: FolderColor) => {
    const folder = await repo.createFolder(name, color)
    setFolders((prev) => [...prev, folder])
    showToast(`Carpeta "${name}" creada`)
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (confirm(`¿Eliminar la carpeta "${folder.name}"? Las notas pasarán a "Sin carpeta".`)) {
      setFolders((prev) => prev.filter((f) => f.id !== folder.id))
      setNotes((prev) =>
        prev.map((n) => (n.folder_id === folder.id ? { ...n, folder_id: null } : n)),
      )
      await repo.deleteFolder(folder.id)
      if (filter === folder.id) setFilter('all')
      showToast('Carpeta eliminada')
    }
  }

  // Acciones de voz e IA
  const handleVoiceComplete = async ({
    noteContent,
    tasks: detectedTasks,
  }: {
    noteContent: string
    tasks: DetectedTask[]
    transcript: string
  }) => {
    setVoiceOpen(false)

    // Si ya estamos dentro de una nota, añadimos lo dicho a la nota actual
    if (activeNoteId && activeNote) {
      const sep = activeNote.content.trim() ? '\n\n' : ''
      const updatedContent = `${activeNote.content}${sep}${noteContent}`
      await handleUpdateNote(activeNoteId, { content: updatedContent })

      if (detectedTasks && detectedTasks.length > 0) {
        setReviewState({
          open: true,
          tasks: detectedTasks,
          sourceName: noteTitle(updatedContent),
          noteId: activeNoteId,
        })
      } else {
        showToast('Dictado añadido a la nota')
      }
    } else {
      // Si estamos en la vista general, creamos una nota nueva
      const newNote = await handleCreateNote(noteContent)

      if (detectedTasks && detectedTasks.length > 0) {
        // Mostrar pantalla de confirmación antes de enviar a Notion (Requisito A5)
        setReviewState({
          open: true,
          tasks: detectedTasks,
          sourceName: noteTitle(noteContent),
          noteId: newNote.id,
        })
      } else {
        showToast('Nota de voz guardada')
      }
    }
  }

  const handleConfirmTasksToNotion = async (selected: DetectedTask[]) => {
    setTasksLoading(true)
    try {
      const created = await repo.sendTasks(selected, reviewState.sourceName)
      setTasks((prev) => [...created, ...prev])
      setReviewState({ open: false, tasks: [], sourceName: '' })
      showToast(`✨ ${created.length} actividades enviadas a Notion`)
    } catch (err) {
      console.error(err)
      showToast('Error al enviar tareas a Notion')
    } finally {
      setTasksLoading(false)
    }
  }

  const handleToggleTask = async (task: NotionTask) => {
    const nextDone = !task.done
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t)),
    )
    await repo.setTaskDone(task.id, nextDone)
  }

  const pendingTasksCount = useMemo(
    () => tasks.filter((t) => !t.done).length,
    [tasks],
  )

  const toggleTheme = () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: next })
  }

  return (
    <>
      <LiquidBg />

      <main className="shell">
        {/* Panel izquierdo: Lista de notas, Carpetas, Tareas o Ajustes */}
        <div className="left">
          {tab === 'home' && (
            <HomeScreen
              name={settings.name}
              notes={filteredNotes}
              folders={folders}
              filter={filter}
              query={query}
              loading={loading}
              openId={activeNoteId}
              pendingTasks={pendingTasksCount}
              theme={settings.theme}
              onToggleTheme={toggleTheme}
              onFilter={(f) => setFilter(f)}
              onQuery={setQuery}
              onNewNote={() => handleCreateNote()}
              onVoice={() => setVoiceOpen(true)}
              onOpenNote={(id) => setActiveNoteId(id)}
              onNoteMenu={(n) => setMenuNote(n)}
              onGoTasks={() => setTab('tasks')}
              onNewFolder={() => setFolderDialogOpen(true)}
            />
          )}

          {tab === 'folders' && (
            <FoldersScreen
              folders={folders}
              notes={notes}
              onOpen={(f) => {
                setFilter(f)
                setTab('home')
              }}
              onNewFolder={() => setFolderDialogOpen(true)}
              onDeleteFolder={handleDeleteFolder}
            />
          )}

          {tab === 'tasks' && (
            <TasksScreen
              tasks={tasks}
              loading={tasksLoading}
              onToggle={handleToggleTask}
              onRefresh={loadData}
            />
          )}

          {tab === 'settings' && (
            <SettingsScreen
              settings={settings}
              update={updateSettings}
              speechSupported={
                typeof window !== 'undefined' &&
                !!(
                  (window as any).SpeechRecognition ||
                  (window as any).webkitSpeechRecognition
                )
              }
            />
          )}

          {/* Barra de navegación inferior flotante tipo Liquid Glass */}
          <BottomNav
            tab={tab}
            onTab={(t) => {
              setTab(t)
              if (t !== 'home') setActiveNoteId(null)
            }}
            onMic={() => setVoiceOpen(true)}
          />
        </div>

        {/* Panel derecho: Editor de nota (Split en Desktop / Slide en Mobile) */}
        <aside className={`right ${activeNoteId ? 'open' : ''}`}>
          <Editor
            note={activeNote}
            folders={folders}
            model={settings.model}
            onClose={() => setActiveNoteId(null)}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onVoice={() => setVoiceOpen(true)}
            onExtractTasks={(extracted) => {
              setReviewState({
                open: true,
                tasks: extracted,
                sourceName: activeNote ? noteTitle(activeNote.content) : 'Nota',
                noteId: activeNote?.id,
              })
            }}
          />
        </aside>
      </main>

      {/* Pantalla completa de grabación de voz (estilo liquid audio de referencia) */}
      <VoiceScreen
        open={voiceOpen}
        lang={settings.lang}
        model={settings.model}
        onClose={() => setVoiceOpen(false)}
        onComplete={handleVoiceComplete}
      />

      {/* Sheet de confirmación de tareas detectadas para Notion (Requisito A5) */}
      <TaskReviewSheet
        open={reviewState.open}
        tasks={reviewState.tasks}
        sourceName={reviewState.sourceName}
        loading={tasksLoading}
        onClose={() =>
          setReviewState({ open: false, tasks: [], sourceName: '' })
        }
        onConfirm={handleConfirmTasksToNotion}
      />

      {/* Menú de opciones de nota */}
      <NoteActionSheet
        open={!!menuNote}
        note={menuNote}
        folders={folders}
        onClose={() => setMenuNote(null)}
        onTogglePin={(id, cur) => handleUpdateNote(id, { pinned: !cur })}
        onMoveFolder={(id, fId) => handleUpdateNote(id, { folder_id: fId })}
        onDuplicate={handleDuplicateNote}
        onDelete={handleDeleteNote}
        onExtractTasks={(n) => {
          setMenuNote(null)
          // Activar extracción
          import('@/lib/ai').then(({ runAiAction }) => {
            runAiAction('tasks', n.content, settings.model).then((res) => {
              if (res.tareas) {
                setReviewState({
                  open: true,
                  tasks: res.tareas,
                  sourceName: noteTitle(n.content),
                  noteId: n.id,
                })
              }
            })
          })
        }}
      />

      {/* Diálogo para crear carpeta nueva */}
      <NewFolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreate={handleCreateFolder}
      />

      {/* Notificaciones Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
