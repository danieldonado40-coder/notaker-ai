'use client'

import { useCallback, useEffect, useState } from 'react'

export type Theme = 'auto' | 'light' | 'dark'
export type Settings = { name: string; model: string; lang: string; theme: Theme }

const KEY = 'notaker.settings'
const DEFAULTS: Settings = { name: 'Daniel', model: 'claude-sonnet-4-5', lang: 'es-ES', theme: 'auto' }

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {
      /* noop */
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = settings.theme
  }, [settings.theme])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return [settings, update] as const
}
