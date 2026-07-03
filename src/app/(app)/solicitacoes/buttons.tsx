'use client'

import { useTransition } from 'react'
import { aprovarSolicitacao, rejeitarSolicitacao } from './actions'

export function SolicitacaoButtons({ id }: { id: string }) {
  const [aprovando, startAprovar] = useTransition()
  const [rejeitando, startRejeitar] = useTransition()

  return (
    <div className="flex gap-3 mt-4">
      <button
        onClick={() => startAprovar(async () => { await aprovarSolicitacao(id) })}
        disabled={aprovando || rejeitando}
        className="px-5 py-2 font-bold text-sm uppercase tracking-wider rounded-xl disabled:opacity-40 active:scale-[0.98] transition-transform"
        style={{ background: 'var(--brand-gold)', color: '#000' }}>
        {aprovando ? 'Aprovando...' : 'Aprovar'}
      </button>
      <button
        onClick={() => startRejeitar(async () => { await rejeitarSolicitacao(id) })}
        disabled={aprovando || rejeitando}
        className="px-5 py-2 font-bold text-sm uppercase tracking-wider rounded-xl disabled:opacity-40 active:scale-[0.98] transition-transform"
        style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto-muted)' }}>
        {rejeitando ? 'Rejeitando...' : 'Rejeitar'}
      </button>
    </div>
  )
}
