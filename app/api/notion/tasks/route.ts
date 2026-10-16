import { NextResponse } from 'next/server'
import type { DetectedTask, NotionTask } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const { tasks, origen } = (await req.json()) as {
      tasks: DetectedTask[]
      origen?: string
    }

    const token = process.env.NOTION_TOKEN
    const dbId = process.env.NOTION_TASKS_DB_ID

    // Si aún no hay token de Notion, devolvemos confirmación en modo local / demo
    if (!token || !dbId) {
      return NextResponse.json({
        success: true,
        mode: 'demo',
        message: 'Token de Notion no configurado. Las tareas se guardaron localmente en Notaker.',
        created: tasks.map((t, idx) => ({
          ...t,
          id: `local-${Date.now()}-${idx}`,
          origen,
          done: false,
          created_at: new Date().toISOString(),
        })),
      })
    }

    // Cuando el usuario configure NOTION_TOKEN y NOTION_TASKS_DB_ID:
    const created: NotionTask[] = []

    for (const t of tasks) {
      const properties: Record<string, any> = {
        // Título de la tarea
        Name: {
          title: [{ text: { content: t.titulo } }],
        },
      }

      // Prioridad
      if (t.prioridad) {
        properties['Prioridad'] = {
          select: { name: t.prioridad },
        }
      }

      // Fecha
      if (t.fecha) {
        const dateObj: { start: string } = {
          start: t.hora ? `${t.fecha}T${t.hora}:00` : t.fecha,
        }
        properties['Fecha'] = { date: dateObj }
      }

      // Origen / Nota
      if (origen) {
        properties['Origen'] = {
          rich_text: [{ text: { content: origen } }],
        }
      }

      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        created.push({
          ...t,
          id: data.id,
          url: data.url,
          origen,
          done: false,
          created_at: new Date().toISOString(),
        })
      } else {
        const err = await res.text()
        console.error('Error insertando tarea en Notion:', err)
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'notion',
      created,
    })
  } catch (err: any) {
    console.error('Error en /api/notion/tasks:', err)
    return NextResponse.json(
      { error: err.message || 'Error procesando tareas en Notion' },
      { status: 500 },
    )
  }
}
