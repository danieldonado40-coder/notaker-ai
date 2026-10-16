'use client'

import {
  Check,
  ChevronLeft,
  Loader2,
  Mic,
  MicOff,
  Power,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSpeech } from '@/hooks/useSpeech'
import { analyzeVoice } from '@/lib/ai'
import type { DetectedTask, VoiceResult } from '@/lib/types'
import { Orb } from './Orb'

type Props = {
  open: boolean
  lang: string
  model: string
  onClose: () => void
  onComplete: (data: {
    noteContent: string
    tasks: DetectedTask[]
    transcript: string
  }) => void
}

export function VoiceScreen({
  open,
  lang,
  model,
  onClose,
  onComplete,
}: Props) {
  const speech = useSpeech(lang)
  const [seconds, setSeconds] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [manualText, setManualText] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Iniciar reconocimiento al abrir
  useEffect(() => {
    if (open) {
      setSeconds(0)
      setProcessing(false)
      setManualText('')
      speech.start()
    } else {
      speech.abort()
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Temporizador mientras escucha
  useEffect(() => {
    if (speech.listening) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [speech.listening])

  if (!open) return null

  const formatTime = (total: number) => {
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const fullTranscript =
    (speech.finalText + ' ' + speech.interim).trim() || manualText

  const handleFinish = async () => {
    const captured = speech.stop() || fullTranscript
    if (!captured || captured.trim().length === 0) {
      onClose()
      return
    }

    setProcessing(true)
    try {
      const res: VoiceResult = await analyzeVoice(captured, model)
      const noteTitle = res.resumen || 'Nota de voz'
      const formattedNote = `${noteTitle}\n\n${res.texto}`

      onComplete({
        noteContent: formattedNote,
        tasks: res.tareas,
        transcript: captured,
      })
    } catch (err) {
      console.error('Error procesando voz:', err)
      // Fallback creando la nota cruda
      onComplete({
        noteContent: `Nota de voz\n\n${captured}`,
        tasks: [],
        transcript: captured,
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    speech.abort()
    onClose()
  }

  const toggleRecording = () => {
    if (speech.listening) {
      speech.pause()
    } else {
      speech.resume()
    }
  }

  return (
    <div className="voice" role="dialog" aria-modal="true" aria-label="Audio">
      {/* Cabecera estilo iOS Glass */}
      <header className="voice-head">
        <button
          className="icon-btn"
          onClick={handleCancel}
          aria-label="Regresar"
          disabled={processing}
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h2>Audio · IA Assistant</h2>
        <button
          className="icon-btn dark"
          onClick={handleCancel}
          aria-label="Cerrar"
          disabled={processing}
        >
          <Power size={18} />
        </button>
      </header>

      {/* Contenedor central responsivo */}
      <div className="voice-body">
        {/* Indicador de estado */}
        <div className="voice-status">
          {processing ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Claude analizando y detectando tareas…</span>
            </>
          ) : speech.listening ? (
            <>
              <span className="rec" />
              <span>Escuchando en vivo…</span>
            </>
          ) : (
            <span>Toca el micrófono azul para hablar</span>
          )}
        </div>

        {/* Esfera de partículas 3D interactiva estilo Liquid Blue */}
        <div className="orb-wrap">
          <Orb
            activity={speech.activity}
            mode={
              processing
                ? 'processing'
                : speech.listening
                ? 'listening'
                : 'paused'
            }
            color="#7fb0ff"
          />
        </div>

        {/* Transcripción en vivo con scroll limpio */}
        <div className="transcript">
          {fullTranscript ? (
            <p>
              <span>{speech.finalText} </span>
              <span className="interim">{speech.interim}</span>
            </p>
          ) : (
            <p className="placeholder">
              {speech.supported
                ? 'Habla ahora: “Mañana a las 3 tengo reunión y debo enviar el informe”…'
                : 'Escribe tu nota aquí:'}
            </p>
          )}
        </div>

        {!speech.supported && (
          <textarea
            className="field"
            style={{
              maxHeight: 70,
              marginTop: 6,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
            }}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Escribe lo que deseas anotar…"
          />
        )}

        {speech.error && <div className="voice-error">{speech.error}</div>}
      </div>

      {/* Contenedor inferior firme y visible */}
      <div className="voice-bottom">
        {/* Barras de onda acústica */}
        <div className={`bars ${speech.listening ? '' : 'idle'}`} aria-hidden>
          {[20, 45, 80, 50, 95, 65, 30, 85, 40, 100, 70, 45, 90, 35, 60].map(
            (h, i) => (
              <i
                key={i}
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i % 5) * 0.15}s`,
                }}
              />
            ),
          )}
        </div>

        {/* Temporizador */}
        <div className="timer">{formatTime(seconds)}</div>

        {/* Controles de audio inferiores */}
        <div className="voice-controls">
          {/* Descartar / Cancelar */}
          <button
            className="icon-btn side"
            onClick={handleCancel}
            disabled={processing}
            aria-label="Cancelar grabación"
          >
            <X size={22} strokeWidth={2.4} />
          </button>

          {/* Botón principal de Micrófono con Liquid Glow */}
          <button
            className={`voice-main ${speech.listening ? 'listening' : ''}`}
            onClick={toggleRecording}
            disabled={processing}
            aria-label={speech.listening ? 'Pausar' : 'Grabar'}
          >
            {processing ? (
              <Sparkles size={34} className="spin" />
            ) : speech.listening ? (
              <Mic size={34} strokeWidth={2.2} />
            ) : (
              <MicOff size={34} strokeWidth={2.2} />
            )}
          </button>

          {/* Finalizar y procesar */}
          <button
            className="icon-btn side"
            onClick={handleFinish}
            disabled={processing || (!fullTranscript.trim() && seconds === 0)}
            aria-label="Finalizar y procesar nota"
            style={{
              background: 'linear-gradient(180deg, #6aa3ff, #3d7bf7)',
              color: '#fff',
            }}
          >
            <Check size={24} strokeWidth={2.6} />
          </button>
        </div>

        <div className="voice-hint">
          Toca el micrófono para hablar y ✓ para que Claude extraiga tus tareas
        </div>
      </div>
    </div>
  )
}
