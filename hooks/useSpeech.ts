'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Rec = any

const ERRORS: Record<string, string> = {
  'not-allowed': 'Permiso de micrófono denegado. Actívalo en los ajustes del navegador.',
  'service-not-allowed': 'El dictado no está disponible en este navegador.',
  'audio-capture': 'No se detectó ningún micrófono.',
  network: 'Error de red en el reconocimiento de voz.',
  'language-not-supported': 'Idioma de dictado no soportado.',
}

const getSR = (): any =>
  typeof window === 'undefined' ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

const join = (a: string, b: string) => `${a} ${b.trim()}`.trim()

/**
 * Dictado en vivo con la Web Speech API (Safari iOS, Chrome, Edge).
 * `start()` debe llamarse dentro de un gesto del usuario (click/tap).
 */
export function useSpeech(lang: string) {
  const recRef = useRef<Rec>(null)
  const wantRef = useRef(false)
  const finalRef = useRef('')
  const interimRef = useRef('')
  const langRef = useRef(lang)
  langRef.current = lang

  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activity, setActivity] = useState(0)
  const [supported, setSupported] = useState(true)

  useEffect(() => setSupported(!!getSR()), [])

  const commitInterim = () => {
    if (interimRef.current.trim()) {
      finalRef.current = join(finalRef.current, interimRef.current)
      setFinalText(finalRef.current)
    }
    interimRef.current = ''
    setInterim('')
  }

  const detach = (rec: Rec) => {
    if (!rec) return
    rec.onresult = rec.onend = rec.onerror = null
  }

  const spawn = () => {
    const SR = getSR()
    if (!SR) {
      setError('Tu navegador no soporta dictado. Usa Safari o Chrome.')
      return
    }
    const rec: Rec = new SR()
    rec.lang = langRef.current
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      let inter = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalRef.current = join(finalRef.current, r[0].transcript)
        else inter += r[0].transcript
      }
      interimRef.current = inter
      setFinalText(finalRef.current)
      setInterim(inter)
      setActivity((a) => a + 1)
    }
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      setError(ERRORS[e.error] ?? `Error de dictado: ${e.error}`)
      wantRef.current = false
    }
    rec.onend = () => {
      if (recRef.current !== rec) return
      commitInterim()
      if (wantRef.current) {
        try {
          rec.start() // iOS corta tras silencios: reanudamos
          return
        } catch {
          /* cae a detener */
        }
      }
      setListening(false)
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setError('No se pudo iniciar el dictado.')
    }
  }

  const halt = useCallback(() => {
    wantRef.current = false
    const rec = recRef.current
    recRef.current = null
    detach(rec)
    try {
      rec?.stop()
    } catch {
      /* noop */
    }
    commitInterim()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    halt()
    setError(null)
    finalRef.current = ''
    interimRef.current = ''
    setFinalText('')
    setInterim('')
    wantRef.current = true
    spawn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halt])

  const resume = useCallback(() => {
    setError(null)
    wantRef.current = true
    spawn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stop = useCallback(() => {
    halt()
    return finalRef.current.trim()
  }, [halt])

  const abort = useCallback(() => {
    wantRef.current = false
    const rec = recRef.current
    recRef.current = null
    detach(rec)
    try {
      rec?.abort()
    } catch {
      /* noop */
    }
    finalRef.current = interimRef.current = ''
    setFinalText('')
    setInterim('')
    setListening(false)
  }, [])

  useEffect(() => () => abort(), [abort])

  return { supported, listening, finalText, interim, error, activity, start, pause: halt, resume, stop, abort }
}

export type Speech = ReturnType<typeof useSpeech>
