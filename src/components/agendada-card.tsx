'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { abrirAulaAgendada, cancelarAulaAgendada } from '@/app/(app)/aulas/actions'

type Aula = {
  id: string
  data: string
  hora_inicio: string | null
  turma_nome: string | null
  confirmados: number
}

export default function AgendadaCard({ aula }: { aula: Aula }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'abrir' | 'cancelar' | null>(null)

  const d = new Date(aula.data + 'T12:00:00')
  const dataFmt = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

  async function handleAbrir(e: React.MouseEvent) {
    e.preventDefault()
    setLoading('abrir')
    await abrirAulaAgendada(aula.id)
    router.refresh()
  }

  async function handleCancelar(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('Cancelar esta aula agendada?')) return
    setLoading('cancelar')
    await cancelarAulaAgendada(aula.id)
    router.refresh()
  }

  return (
    <Link href={`/aulas/${aula.id}`}
      className="flex items-center justify-between rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
          {aula.turma_nome ?? 'Aula avulsa'}
        </p>
        <p className="text-[10px] mt-0.5 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
          {dataFmt}{aula.hora_inicio ? ` · ${aula.hora_inicio.substring(0, 5)}` : ''} · {aula.confirmados} confirmado{aula.confirmados !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0 ml-2">
        <button onClick={handleAbrir} disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {loading === 'abrir' ? '...' : 'Abrir'}
        </button>
        <button onClick={handleCancelar} disabled={loading !== null}
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 transition-transform active:scale-[0.98]"
          style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto-muted)' }}>
          {loading === 'cancelar' ? '...' : '✕'}
        </button>
      </div>
    </Link>
  )
}
