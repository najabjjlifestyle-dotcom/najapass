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

function agruparPorCategoria<T extends { categoria: string | null }>(itens: T[]): [string, T[]][] {
  const mapa: Record<string, T[]> = {}
  for (const t of itens) {
    const cat = t.categoria ?? 'Outras'
    if (!mapa[cat]) mapa[cat] = []
    mapa[cat].push(t)
  }
  return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b))
}

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
  const [isPending, startTransition] = useTransition()

  const planejadas = tecnicas.filter(t => t.tipo === 'planejada')
  const ensinadas = tecnicas.filter(t => t.tipo === 'ensinada')
  const naoEnsinadas = tecnicas.filter(t => t.tipo === 'nao_ensinada')

  const categoriasEnvolvidas = [...new Set(tecnicas.map(t => t.categoria).filter(Boolean))]
  const tituloHeader = categoriasEnvolvidas.length === 1
    ? `Posições — ${categoriasEnvolvidas[0]}`
    : categoriasEnvolvidas.length > 1
      ? 'Posições'
      : `Posições${temaNome ? ` — ${temaNome}` : ''}`

  function handleRemover(id: string) {
    startTransition(async () => { await removerTecnicaAula(aulaId, id) })
  }

  function handleConfirmar(id: string, tipo: 'ensinada' | 'nao_ensinada', reforco: boolean) {
    startTransition(async () => { await confirmarTecnica(aulaId, id, tipo, reforco) })
  }

  const temAlguma = tecnicas.length > 0 || disponiveis.length > 0

  if (!temAlguma && !aulaAberta) return null

  const planejadasPorCategoria = agruparPorCategoria(planejadas)
  const ensinadasPorCategoria = agruparPorCategoria(ensinadas)

  return (
    <div className="px-5 py-4 space-y-4"
      style={{ borderTop: '1px solid var(--brand-border)' }}>

      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
        {tituloHeader}
      </p>

      {/* Planejadas (aguardando confirmação) */}
      {planejadas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Planejadas {aulaAberta ? '— confirme durante a aula' : ''}
          </p>
          {planejadasPorCategoria.map(([cat, tecs]) => (
            <div key={cat} className="space-y-2">
              {planejadasPorCategoria.length > 1 && (
                <p className="text-[8px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                  {cat}
                </p>
              )}
              {tecs.map(t => (
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
          ))}
        </div>
      )}

      {/* Ensinadas */}
      {ensinadas.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Ensinadas
          </p>
          {ensinadasPorCategoria.map(([cat, tecs]) => (
            <div key={cat}>
              {ensinadasPorCategoria.length > 1 && (
                <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
                  {cat}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {tecs.map(t => (
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
          ))}
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
            Adicionar posição
          </p>
          <BuscaTecnicaInline
            disponiveis={disponiveis}
            aulaId={aulaId}
            isPending={isPending}
            startTransition={startTransition}
          />
        </div>
      )}
    </div>
  )
}

function BuscaTecnicaInline({
  disponiveis, aulaId, isPending, startTransition,
}: {
  disponiveis: Tecnica[]
  aulaId: string
  isPending: boolean
  startTransition: (fn: () => Promise<void>) => void
}) {
  const [busca, setBusca] = useState('')
  const resultados = busca.trim().length >= 2
    ? disponiveis
        .filter(t => t.nome.toLowerCase().includes(busca.toLowerCase()))
        .slice(0, 6)
    : []

  function handleAdicionar(id: string) {
    startTransition(async () => {
      await adicionarTecnicaAula(aulaId, id)
      setBusca('')
    })
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar posição..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        disabled={isPending}
        className="w-full px-3 py-2.5 rounded-xl text-sm"
        style={{
          background: 'var(--brand-surf)',
          border: '1px solid var(--brand-border)',
          color: 'var(--brand-texto)',
        }}
      />
      {resultados.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {resultados.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleAdicionar(t.id)}
              disabled={isPending}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border disabled:opacity-40"
              style={{
                background: 'var(--brand-surf)',
                borderColor: 'var(--brand-border)',
                color: 'var(--brand-texto-sec)',
              }}>
              {t.nome}
              {t.categoria && (
                <span className="ml-1 opacity-50 font-normal">· {t.categoria}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {busca.trim().length >= 2 && resultados.length === 0 && (
        <p className="mt-2 text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
          Nenhuma posição encontrada
        </p>
      )}
    </div>
  )
}
