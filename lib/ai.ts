/**
 * Servicio de IA de Notaker.
 * Se comunica con /api/ai (Anthropic Claude real).
 * Si ocurre un problema de conexión o red, usa un fallback heurístico local.
 */
import type { AiAction, DetectedTask, Priority, VoiceResult } from './types'

const FILLERS = /\b(eh+|em+|este|o sea|pues nada|bueno pues|digamos|tipo que)\b[,]?\s*/gi
const TRIGGERS =
  /\b(tengo que|tenemos que|debo|debemos|hay que|necesito|necesitamos|recuérdame|recordarme|recordar|no olvidar|no olvides|me toca|pendiente|agendar|llamar|enviar|mandar|comprar|pagar|revisar|terminar|preparar|reservar|escribir|programar|entregar)\b/i
const STRIP_LEAD =
  /^(y\s+)?(también\s+)?(luego\s+)?(tengo que|tenemos que|debo|debemos|hay que|necesito|necesitamos|recuérdame|recordarme|recordar|no olvidar|no olvides|me toca)\s+/i

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

function sentences(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|\s+(?:y luego|después|además)\s+/i)
    .map((s) => s.trim().replace(/[.!?]+$/, ''))
    .filter(Boolean)
}

function localClean(text: string) {
  return sentences(text.replace(FILLERS, ''))
    .map((s) => cap(s) + '.')
    .join(' ')
}

function localExtractTasks(text: string): DetectedTask[] {
  return sentences(text.replace(FILLERS, ''))
    .filter((s) => TRIGGERS.test(s))
    .map((s) => {
      const titulo = cap(
        s
          .replace(STRIP_LEAD, '')
          .replace(/\b(pasado mañana|mañana|hoy|esta tarde|esta noche)\b/gi, '')
          .replace(/\ba las \d{1,2}([:.]\d{2})?\s*(am|pm|de la tarde|de la noche|de la mañana)?/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .replace(/[,;]$/, ''),
      )
      return { titulo, fecha: null, hora: null, prioridad: 'Media' as Priority }
    })
    .filter((t) => t.titulo.length > 2)
}

/**
 * Procesa la voz con Claude real a través de /api/ai.
 */
export async function analyzeVoice(transcript: string, model?: string): Promise<VoiceResult> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'analyze-voice', transcript, model }),
    })

    if (res.ok) {
      const json = await res.json()
      if (json.success && json.data) {
        return json.data as VoiceResult
      }
    }
    console.warn('API /api/ai retornó error, usando fallback local')
  } catch (err) {
    console.warn('Fallo de red llamando a /api/ai, usando fallback local:', err)
  }

  // Fallback local si Claude no responde
  const texto = localClean(transcript)
  const words = texto.replace(/[.,!?]/g, '').split(' ').slice(0, 5).join(' ')
  return { texto, resumen: cap(words) || 'Nota de voz', tareas: localExtractTasks(transcript) }
}

/**
 * Ejecuta acciones de AI Assist (resumen, reescritura, etc.) con Claude real.
 */
export async function runAiAction(
  action: AiAction,
  content: string,
  model?: string,
): Promise<{ text?: string; tareas?: DetectedTask[] }> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, content, model }),
    })

    if (res.ok) {
      const json = await res.json()
      if (json.success) {
        return { text: json.text, tareas: json.tareas }
      }
    }
  } catch (err) {
    console.warn('Error en runAiAction con Claude, usando fallback:', err)
  }

  // Fallback local
  if (action === 'tasks') {
    return { tareas: localExtractTasks(content) }
  }
  if (action === 'summarize') {
    const s = sentences(content).slice(0, 3)
    return { text: s.map((x) => `• ${cap(x)}`).join('\n') }
  }
  if (action === 'title') {
    const words = content.replace(/[.,!?]/g, '').split(/\s+/).slice(0, 4).join(' ')
    return { text: cap(words) || 'Nueva nota' }
  }
  return { text: content }
}
