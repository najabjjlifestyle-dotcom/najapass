'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { abrirAulaAgendada, cancelarAulaAgendada } from '../actions'

export default function AulaAgendadaActions({ aulaId }: { aulaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'abrir' | 'cancelar' | null>(null)
  const [error, setError] = useState('')

  async function handleAbrir() {
    setLoading('abrir')
    setError('')
    const result = await abrirAulaAgendada(aulaId)
    if (result?.error) {
      setError(result.error)
      setLoading(null)
    } else {
      router.refresh()
    }
  }

  async function handleCancelar() {
    if (!confirm('Cancelar esta aula agendada?')) return
    setLoading('cancelar')
    setError('')
    const result = await cancelarAulaAgendada(aulaId)
    if (result?.error) {
      setError(result.error)
      setLoading(null)
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={handleAbrir} disabled={loading !== null}
          className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {loading === 'abrir' ? 'Abrindo...' : 'Abrir Aula'}
        </button>
        <button onClick={handleCancelar} disabled={loading !== null}
          className="px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98]"
          style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto-muted)' }}>
          {loading === 'cancelar' ? '...' : 'Cancelar'}
        </button>
      </div>
      {error && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
