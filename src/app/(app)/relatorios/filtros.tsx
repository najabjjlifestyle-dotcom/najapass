'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Filtros({ inicio, fim }: { inicio: string; fim: string }) {
  const [start, setStart] = useState(inicio)
  const [end, setEnd] = useState(fim)
  const router = useRouter()

  return (
    <div className="flex gap-2 px-5 py-4 items-end" style={{ borderBottom: '1px solid var(--brand-border)' }}>
      <div className="flex-1">
        <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>De</p>
        <input type="date" value={start} onChange={e => setStart(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)', colorScheme: 'dark' }} />
      </div>
      <div className="flex-1">
        <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Até</p>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)', colorScheme: 'dark' }} />
      </div>
      <button
        onClick={() => router.push(`/relatorios?inicio=${start}&fim=${end}`)}
        className="px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-widest flex-shrink-0"
        style={{ background: 'var(--brand-gold)', color: 'black' }}>
        Filtrar
      </button>
    </div>
  )
}
