'use client'

import { useState, useTransition } from 'react'
import { graduarAluno } from './actions'

const FAIXAS = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'] as const
const FAIXA_BG: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24', laranja: '#F97316',
  verde: '#16A34A', azul: '#2563EB', roxa: '#7C3AED', marrom: '#92400E', preta: '#1a1a1a',
}

export default function GraduacaoForm({
  alunoId, faixaAtual, grauAtual,
}: {
  alunoId: string
  faixaAtual: string
  grauAtual: number
}) {
  const [open, setOpen] = useState(false)
  const [faixa, setFaixa] = useState(faixaAtual)
  const [grau, setGrau] = useState(grauAtual)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSalvar() {
    setError('')
    startTransition(async () => {
      const res = await graduarAluno(alunoId, faixa, grau)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest"
        style={{ border: '1px solid var(--brand-gold-border)', color: 'var(--brand-gold)', background: 'var(--brand-gold-dim)' }}>
        Graduar aluno
      </button>
    )
  }

  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
        Graduação
      </p>

      {/* Faixa selector */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Faixa</p>
        <div className="flex flex-wrap gap-2">
          {FAIXAS.map(f => (
            <button key={f} onClick={() => setFaixa(f)}
              className="px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all"
              style={{
                background: FAIXA_BG[f],
                color: ['branca','cinza','amarela','laranja'].includes(f) ? '#000' : '#fff',
                outline: faixa === f ? `2px solid var(--brand-gold)` : '2px solid transparent',
                outlineOffset: '2px',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grau selector */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Grau</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(g => (
            <button key={g} onClick={() => setGrau(g)}
              className="w-9 h-9 rounded-lg text-sm font-bold transition-all"
              style={{
                background: grau === g ? 'var(--brand-gold)' : 'var(--brand-surf-2)',
                color: grau === g ? 'black' : 'var(--brand-texto-muted)',
                border: `1px solid ${grau === g ? 'var(--brand-gold)' : 'var(--brand-border)'}`,
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
      )}

      <div className="flex gap-2">
        <button onClick={handleSalvar} disabled={isPending}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
          style={{ background: 'var(--brand-gold)', color: 'black' }}>
          {isPending ? 'Salvando...' : 'Confirmar'}
        </button>
        <button onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
