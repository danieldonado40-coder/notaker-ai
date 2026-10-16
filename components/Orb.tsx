'use client'

import { useEffect, useRef } from 'react'

type Mode = 'listening' | 'paused' | 'processing' | 'idle'

/**
 * Esfera de partículas "líquida" que respira y reacciona a la voz.
 * `activity` cambia cada vez que llega texto del dictado → la esfera se agita.
 */
export function Orb({ activity = 0, mode = 'idle', color = '#6aa3ff', className = 'orb' }: { activity?: number; mode?: Mode; color?: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const target = useRef(0)
  const modeRef = useRef<Mode>(mode)
  modeRef.current = mode

  useEffect(() => {
    target.current = 1
  }, [activity])

  useEffect(() => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return

    const N = 1500
    const pts: [number, number, number][] = []
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = i * 2.399963
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r])
    }

    let raf = 0
    let t = 0
    let w = 0
    let h = 0
    let energy = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = c.getBoundingClientRect()
      w = rect.width
      h = rect.height
      c.width = w * dpr
      c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)

    const frame = () => {
      const m = modeRef.current
      const speed = (m === 'processing' ? 2.6 : m === 'paused' ? 0.25 : m === 'idle' ? 0.5 : 1) * (reduce ? 0.3 : 1)
      t += 0.012 * speed
      target.current *= 0.94
      energy += (target.current - energy) * 0.08
      const e = (m === 'listening' ? 0.45 : 0.2) + energy * 1.1 + (m === 'processing' ? 0.5 : 0)

      ctx.clearRect(0, 0, w, h)
      const R = Math.min(w, h) * 0.33
      const cx = w / 2
      const cy = h / 2
      const ry = t * 0.6
      const rx = 0.45 + Math.sin(t * 0.3) * 0.2
      const cy1 = Math.cos(ry)
      const sy1 = Math.sin(ry)
      const cx1 = Math.cos(rx)
      const sx1 = Math.sin(rx)
      ctx.fillStyle = color

      for (const [x0, y0, z0] of pts) {
        const n = Math.sin(x0 * 3.1 + t * 1.7) * Math.cos(y0 * 2.7 - t * 1.3) + Math.sin(z0 * 4.2 + t * 2.1) * 0.5
        const k = 1 + n * 0.13 * e
        const x = x0 * k
        const y = y0 * k
        const z = z0 * k
        const x1 = x * cy1 - z * sy1
        const z1 = x * sy1 + z * cy1
        const y2 = y * cx1 - z1 * sx1
        const z2 = y * sx1 + z1 * cx1
        const p = 2.6 / (2.6 - z2)
        ctx.globalAlpha = Math.min(1, 0.18 + (z2 + 1) * 0.4)
        const s = 1.3 * p
        ctx.fillRect(cx + x1 * R * p, cy + y2 * R * p, s, s)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }
    frame()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [color])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
