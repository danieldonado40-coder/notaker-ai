'use client'

import { useEffect, type ReactNode } from 'react'

export function LiquidBg() {
  return (
    <div className="liquid-bg" aria-hidden>
      <span className="b1" />
      <span className="b2" />
      <span className="b3" />
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  action,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        {(title || action) && (
          <div className="sheet-head">
            <div>
              {title && <h3>{title}</h3>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export type ToastData = { id: number; text: string; action?: { label: string; run: () => void } }

export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  if (!toast) return null
  return (
    <div key={toast.id} className={`toast glass-dark ${toast.action ? '' : 'plain'}`} role="status">
      <span>{toast.text}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.run()
            onClose()
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
