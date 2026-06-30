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
        className="px-5 py-2 bg-white text-black font-bold text-sm uppercase tracking-wider rounded-xl disabled:opacity-40"
        style={{ fontFamily: 'var(--font-oswald)' }}>
        {aprovando ? 'Aprovando...' : 'Aprovar'}
      </button>
      <button
        onClick={() => startRejeitar(async () => { await rejeitarSolicitacao(id) })}
        disabled={aprovando || rejeitando}
        className="px-5 py-2 border border-white/20 text-white/50 font-bold text-sm uppercase tracking-wider rounded-xl hover:border-red-400/50 hover:text-red-400 transition-colors disabled:opacity-40"
        style={{ fontFamily: 'var(--font-oswald)' }}>
        {rejeitando ? 'Rejeitando...' : 'Rejeitar'}
      </button>
    </div>
  )
}
