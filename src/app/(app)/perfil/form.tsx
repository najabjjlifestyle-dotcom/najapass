'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePerfilProfessor } from './actions'

const FAIXAS = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'] as const
const FAIXA_BG: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24', laranja: '#F97316',
  verde: '#16A34A', azul: '#2563EB', roxa: '#7C3AED', marrom: '#92400E', preta: '#1a1a1a',
}

export default function PerfilForm({ nomeAtual, faixaAtual }: { nomeAtual: string; faixaAtual: string }) {
  const router = useRouter()
  const [nome, setNome] = useState(nomeAtual)
  const [faixa, setFaixa] = useState(faixaAtual)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSalvar() {
    setError('')
    startTransition(async () => {
      const res = await updatePerfilProfessor(nome, faixa)
      if (res?.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Nome</label>
        <input value={nome} onChange={e => setNome(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
          style={{ border: '1px solid var(--brand-border-str)' }} />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Faixa</p>
        <div className="flex flex-wrap gap-2">
          {FAIXAS.map(f => (
            <button key={f} onClick={() => setFaixa(f)}
              className="px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all"
              style={{
                background: FAIXA_BG[f],
                color: ['branca', 'cinza', 'amarela', 'laranja'].includes(f) ? '#000' : '#fff',
                outline: faixa === f ? '2px solid var(--brand-gold)' : '2px solid transparent',
                outlineOffset: '2px',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

      <button onClick={handleSalvar} disabled={isPending}
        className="w-full py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
        style={{ background: 'var(--brand-gold)', color: 'black' }}>
        {isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
