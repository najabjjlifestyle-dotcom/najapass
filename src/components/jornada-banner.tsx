'use client'

import Link from 'next/link'
import { useState } from 'react'

const COR_POR_TIPO: Record<string, string> = {
  aniversario: '#C8A96E',
  anual:       '#7C3AED',
  mensal:      '#2563EB',
}

export default function JornadaBanner({
  tipo, emoji, titulo, subtitulo, href,
}: {
  tipo: string
  emoji: string
  titulo: string
  subtitulo: string
  href: string
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const cor = COR_POR_TIPO[tipo] ?? 'var(--brand-gold)'

  return (
    <div
      className="relative flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: `${cor}18`,
        border: `1px solid ${cor}44`,
      }}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <Link href={href} className="flex-1 min-w-0 active:opacity-70">
        <p className="font-bold text-sm leading-snug" style={{ color: 'var(--brand-texto)' }}>
          {titulo}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
          {subtitulo}
        </p>
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="text-[11px] flex-shrink-0 px-1 active:opacity-60"
        style={{ color: '#555' }}
        aria-label="Dispensar">
        ✕
      </button>
    </div>
  )
}
