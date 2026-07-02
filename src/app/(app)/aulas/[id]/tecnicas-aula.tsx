'use client'

import { useState, useTransition } from 'react'
import { adicionarTecnicaAula, removerTecnicaAula, confirmarTecnica } from './tecnicas-actions'

type AulaTecnica = {
  id: string
  nome: string
  categoria: string | null
  tipo: 'planejada' | 'ensinada' | 'nao_ensinada'
  reforco: boolean
}

type Tecnica = { id: string; nome: string; categoria: string | null }

export default function TecnicasAula({
  aulaId,
  tecnicas,
  disponiveis,
  aulaAberta,
  temaNome,
}: {
  aulaId: string
  tecnicas: AulaTecnica[]
  disponiveis: Tecnica[]
  aulaAberta: boolean
  temaNome?: string | null
}) {
  const [selecionada, setSelecionada] = useState('')
  const [isPending, startTransition] = useTransition()

  const planejadas = tecnicas.filter(t => t.tipo === 'planejada')
  const ensinadas = tecnicas.filter(t => t.tipo === 'ensinada')
  const naoEnsinadas = tecnicas.filter(t => t.tipo === 'nao_ensinada')

  function handleAdicionar() {
    if (!selecionada) return
    startTransition(async () => {
      await adicionarTecnicaAula(aulaId, selecionada)
      setSelecionada('')
    })
  }

  function handleRemover(id: string) {
    startTransition(async () => { await removerTecnicaAula(aulaId, id) })
  }

  function handleConfirmar(id: string, tipo: 'ensinada' | 'nao_ensinada', reforco: boolean) {
    startTransition(async () => { await confirmarTecnica(aulaId, id, tipo, reforco) })
  }

  const temAlguma = tecnicas.length > 0 || disponiveis.length > 0

  if (!temAlguma && !aulaAberta) return null

  return (
    <div className="px-5 py-4 space-y-4"
      style={{ borderTop: '1px solid var(--brand-border)' }}>

      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
        Posições{temaNome ? ` — ${temaNome}` : ''}
      </p>

      {/* Planejadas (aguardando confirmação) */}
      {planejadas.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Planejadas {aulaAberta ? '— confirme durante a aula' : ''}
          </p>
          {planejadas.map(t => (
            <div key={t.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="flex-1 text-sm font-bold" style={{ color: 'var(--brand-texto-sec)' }}>
                {t.nome}
              </span>
              {aulaAberta && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* ✓ Ensinada */}
                  <button
                    onClick={() => handleConfirmar(t.id, 'ensinada', false)}
                    disabled={isPending}
                    title="Ensinada"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold disabled:opacity-30 transition-colors hover:opacity-90"
                    style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
                    ✓
                  </button>
                  {/* 🔁 Reforço (ensinou mas precisa repetir) */}
                  <button
                    onClick={() => handleConfirmar(t.id, 'ensinada', true)}
                    disabled={isPending}
                    title="Ensinada — precisa de reforço"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30 transition-colors hover:opacity-90"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
                    🔁
                  </button>
                  {/* ✗ Não ensinada */}
                  <button
                    onClick={() => handleConfirmar(t.id, 'nao_ensinada', false)}
                    disabled={isPending}
                    title="Não ensinada"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold disabled:opacity-30 transition-colors hover:opacity-90"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    ✗
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ensinadas */}
      {ensinadas.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Ensinadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ensinadas.map(t => (
              <span key={t.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: 'var(--brand-gold-dim)',
                  border: '1px solid var(--brand-gold-border)',
                  color: 'var(--brand-gold)',
                }}>
                {t.reforco && <span title="Reforço agendado">🔁</span>}
                {t.nome}
                {aulaAberta && (
                  <button onClick={() => handleRemover(t.id)} disabled={isPending}
                    className="ml-0.5 opacity-60 hover:opacity-100 disabled:opacity-30">
                    ×
                  </button>
                )}
                {!aulaAberta && t.reforco && (
                  <span className="text-[9px] ml-0.5 opacity-70">reforço</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Não ensinadas (apenas após finalizar) */}
      {!aulaAberta && naoEnsinadas.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Não ensinadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {naoEnsinadas.map(t => (
              <span key={t.id}
                className="px-2.5 py-1 rounded-lg text-xs font-bold line-through"
                style={{ color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }}>
                {t.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nenhuma posição planejada e aula aberta */}
      {tecnicas.length === 0 && aulaAberta && (
        <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
          Nenhuma posição planejada.
        </p>
      )}

      {/* Adicionar ad-hoc durante a aula */}
      {aulaAberta && disponiveis.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Adicionar ad-hoc
          </p>
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
              <option value="">Posição não planejada...</option>
              {disponiveis.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            <button onClick={handleAdicionar} disabled={!selecionada || isPending}
              className="px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40"
              style={{ background: 'var(--brand-gold)', color: 'black' }}>
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
