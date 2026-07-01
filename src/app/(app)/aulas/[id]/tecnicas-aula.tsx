'use client'

import { useState, useTransition } from 'react'
import { adicionarTecnicaAula, removerTecnicaAula } from './tecnicas-actions'

type Tecnica = { id: string; nome: string; categoria: string | null }

export default function TecnicasAula({
  aulaId,
  ensinadas,
  disponiveis,
  aulaAberta,
}: {
  aulaId: string
  ensinadas: Tecnica[]
  disponiveis: Tecnica[]
  aulaAberta: boolean
}) {
  const [selecionada, setSelecionada] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdicionar() {
    if (!selecionada) return
    startTransition(async () => {
      await adicionarTecnicaAula(aulaId, selecionada)
      setSelecionada('')
    })
  }

  function handleRemover(tecnicaId: string) {
    startTransition(async () => {
      await removerTecnicaAula(aulaId, tecnicaId)
    })
  }

  return (
    <div className="px-5 py-4 space-y-3"
      style={{ borderTop: '1px solid var(--brand-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
        Posições ensinadas
      </p>

      {ensinadas.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>Nenhuma posição registrada.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {ensinadas.map(t => (
            <span key={t.id}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{
                background: 'var(--brand-gold-dim)',
                border: '1px solid var(--brand-gold-border)',
                color: 'var(--brand-gold)',
              }}>
              {t.nome}
              {aulaAberta && (
                <button onClick={() => handleRemover(t.id)} disabled={isPending}
                  className="ml-0.5 opacity-60 hover:opacity-100 disabled:opacity-30">
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {aulaAberta && disponiveis.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selecionada}
            onChange={e => setSelecionada(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm"
            style={{
              background: 'var(--brand-surf)',
              border: '1px solid var(--brand-border)',
              color: selecionada ? 'var(--brand-texto)' : 'var(--brand-texto-muted)',
            }}>
            <option value="">Adicionar posição...</option>
            {disponiveis.map(t => (
              <option key={t.id} value={t.id}>
                {t.categoria ? `[${t.categoria}] ` : ''}{t.nome}
              </option>
            ))}
          </select>
          <button onClick={handleAdicionar} disabled={!selecionada || isPending}
            className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40"
            style={{ background: 'var(--brand-gold)', color: 'black' }}>
            +
          </button>
        </div>
      )}
    </div>
  )
}
