import { NextResponse } from 'next/server'
import { dateContext } from '@/lib/notes'
import type { AiAction, DetectedTask, VoiceResult } from '@/lib/types'

// Mapeo amigable de IDs de modelo a identificadores oficiales de Anthropic
function resolveModel(model?: string): string {
  if (!model) return 'claude-sonnet-4-5-20250929'
  const m = model.toLowerCase()
  if (m.includes('haiku')) return 'claude-haiku-4-5-20251001'
  if (m.includes('opus')) return 'claude-opus-4-6'
  if (m.includes('sonnet-4-6')) return 'claude-sonnet-4-6'
  if (m.includes('sonnet')) return 'claude-sonnet-4-5-20250929'
  return model
}

async function callClaude(messages: { role: 'user' | 'assistant'; content: string }[], system: string, modelId: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada en las variables de entorno.')
  }

  const model = resolveModel(modelId)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      temperature: 0.2,
      system,
      messages,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('Error de Anthropic API:', res.status, errorText)
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''
  return content
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, transcript, content, model } = body as {
      action?: 'analyze-voice' | AiAction
      transcript?: string
      content?: string
      model?: string
    }

    const { today, todayLong, timeZone } = dateContext()

    // ── 1. Análisis de Nota de Voz (Transcripción + Tareas estructuradas) ──
    if (action === 'analyze-voice' && transcript) {
      const systemPrompt = `Eres el asistente de voz inteligente de Notaker, una aplicación de notas premium estilo iOS.
Tu labor es procesar una transcripción de voz en bruto dictada por el usuario en español y estructurarla.

Contexto temporal del usuario:
- Fecha de hoy: ${today} (${todayLong})
- Zona horaria: ${timeZone}

Instrucciones:
1. "texto": Limpia la transcripción corrigiendo puntuación, mayúsculas y eliminando muletillas (eh, este, o sea, etc.). Mantén el sentido exacto y el vocabulario del usuario.
2. "resumen": Un título breve, profesional y descriptivo para la nota (máximo 4 a 6 palabras).
3. "tareas": Extrae cualquier compromiso, actividad, recordatorio o tarea pendiente que el usuario haya mencionado (por ejemplo: "tengo que llamar a X", "mañana a las 4pm enviar reporte", "comprar café", etc.).
   Para cada tarea detectada:
   - "titulo": Descripción clara de la acción (en infinitivo o imperativo, sin muletillas temporales).
   - "fecha": Si mencionó cuándo hacerla (ej: "mañana", "el viernes", "en 3 días"), calcula la fecha exacta en formato YYYY-MM-DD relativo a hoy (${today}). Si no indicó fecha, usa null.
   - "hora": Si mencionó hora (ej: "a las 3", "16:00", "por la tarde a las 5"), calcula la hora en formato HH:MM (24h). Si no, usa null.
   - "prioridad": "Alta" si indicó urgencia o es crítico, "Baja" si es algo casual o sin prisa, o "Media" por defecto.

Responde ÚNICAMENTE un objeto JSON válido con este esquema, sin texto ni markdown adicional:
{
  "texto": "string",
  "resumen": "string",
  "tareas": [
    {
      "titulo": "string",
      "fecha": "YYYY-MM-DD" | null,
      "hora": "HH:MM" | null,
      "prioridad": "Alta" | "Media" | "Baja"
    }
  ]
}`

      const raw = await callClaude(
        [{ role: 'user', content: transcript }],
        systemPrompt,
        model ?? 'claude-3-5-sonnet-latest',
      )

      // Extraer bloque JSON limpiando posibles etiquetas markdown
      const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed: VoiceResult = JSON.parse(cleanJson)

      return NextResponse.json({ success: true, data: parsed })
    }

    // ── 2. Acciones de AI Assist sobre una nota existente ──
    if (content) {
      if (action === 'tasks') {
        const systemPrompt = `Eres un extractor de tareas para Notion.
Analiza la siguiente nota escrita por el usuario.
Contexto: Hoy es ${today} (${todayLong}).
Detecta cualquier tarea o pendiente (incluyendo viñetas de checklist ☐ o párrafos con compromisos).
Devuelve ÚNICAMENTE un JSON con el array "tareas":
{
  "tareas": [
    {
      "titulo": "string",
      "fecha": "YYYY-MM-DD" | null,
      "hora": "HH:MM" | null,
      "prioridad": "Alta" | "Media" | "Baja"
    }
  ]
}`
        const raw = await callClaude([{ role: 'user', content }], systemPrompt, model ?? 'claude-3-5-sonnet-latest')
        const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanJson)
        return NextResponse.json({ success: true, tareas: parsed.tareas ?? [] })
      }

      if (action === 'summarize') {
        const systemPrompt = `Resume el siguiente texto en viñetas concisas y claras en español. No agregues introducciones ni despedidas, solo las viñetas con viñeta "•".`
        const text = await callClaude([{ role: 'user', content }], systemPrompt, model ?? 'claude-3-5-sonnet-latest')
        return NextResponse.json({ success: true, text: text.trim() })
      }

      if (action === 'rewrite') {
        const systemPrompt = `Reescribe el siguiente texto para máxima claridad y fluidez en español, manteniendo el tono y mensaje original del usuario. No agregues introducciones ni explicaciones.`
        const text = await callClaude([{ role: 'user', content }], systemPrompt, model ?? 'claude-3-5-sonnet-latest')
        return NextResponse.json({ success: true, text: text.trim() })
      }

      if (action === 'bullets') {
        const systemPrompt = `Convierte las ideas principales del siguiente texto en una lista de viñetas claras con "•". Conserva la primera línea si es el título.`
        const text = await callClaude([{ role: 'user', content }], systemPrompt, model ?? 'claude-3-5-sonnet-latest')
        return NextResponse.json({ success: true, text: text.trim() })
      }

      if (action === 'title') {
        const systemPrompt = `Genera un título corto, atractivo y preciso (máximo 4 a 6 palabras) para el siguiente contenido. Responde ÚNICAMENTE el título, sin comillas ni puntos finales.`
        const text = await callClaude([{ role: 'user', content }], systemPrompt, model ?? 'claude-3-5-sonnet-latest')
        return NextResponse.json({ success: true, text: text.trim().replace(/^["']|["']$/g, '') })
      }
    }

    return NextResponse.json({ error: 'Acción no válida o parámetros insuficientes' }, { status: 400 })
  } catch (err: any) {
    console.error('Error en /api/ai:', err)
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}
