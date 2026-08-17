'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Copy, RotateCcw, Check, X } from 'lucide-react'
import { renomearTecnica, removerRenomeTecnica, duplicarTecnica } from './actions'

// Linha de técnica na lista do professor. Só globais podem ser renomeadas /
// duplicadas (variações da academia já têm nome próprio). Controles sempre
// visíveis (mobile-first — nada de revelar no hover, que não existe no toque).
export default function TecnicaItem({
  id,
  nomeExibido,
  global,
  temCustom,
  ehVariacao,
  descricao,
}: {
  id: string
  nomeExibido: string
  global: boolean
  temCustom: boolean
  ehVariacao: boolean
  descricao: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [renomeando, setRenomeando] = useState(false)
  const [nome, setNome] = useState(nomeExibido)

  const [duplicando, setDuplicando] = useState(false)
  const [nomeVariacao, setNomeVariacao] = useState('')
  const [erro, setErro] = useState('')

  function salvarNome() {
    const v = nome.trim()
    if (!v || v === nomeExibido) { setRenomeando(false); setNome(nomeExibido); return }
    startTransition(async () => {
      const res = await renomearTecnica(id, v)
      if (res?.error) { setErro(res.error); return }
      setRenomeando(false)
      router.refresh()
    })
  }

  function restaurar() {
    startTransition(async () => {
      await removerRenomeTecnica(id)
      router.refresh()
    })
  }

  function criarVariacao() {
    const v = nomeVariacao.trim()
    if (!v) return
    startTransition(async () => {
      const res = await duplicarTecnica(id, v)
      if (res?.error) { setErro(res.error); return }
      setDuplicando(false)
      setNomeVariacao('')
      router.refresh()
    })
  }

  return (
    <div className="px-4 py-3 rounded-xl"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {renomeando ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={nome} onChange={e => setNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') salvarNome(); if (e.key === 'Escape') { setRenomeando(false); setNome(nomeExibido) } }}
                disabled={isPending}
                className="flex-1 bg-transparent text-sm font-bold outline-none border-b pb-0.5"
                style={{ borderColor: 'var(--brand-gold)', color: 'var(--brand-texto)' }} />
              <button onClick={salvarNome} disabled={isPending} className="flex-shrink-0 active:scale-90 transition-transform" aria-label="Salvar">
                <Check size={16} style={{ color: 'var(--brand-gold)' }} />
              </button>
              <button onClick={() => { setRenomeando(false); setNome(nomeExibido) }} className="flex-shrink-0 active:scale-90 transition-transform" aria-label="Cancelar">
                <X size={16} style={{ color: 'var(--brand-texto-muted)' }} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/tecnicas/${id}`} className="font-bold text-sm active:opacity-70 transition-opacity"
                style={{ color: 'var(--brand-texto)' }}>
                {nomeExibido}
              </Link>
              {global && (
                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                  sugestão
                </span>
              )}
              {temCustom && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                  style={{ background: 'rgba(200,169,110,0.12)', color: 'var(--brand-gold)' }}>
                  editada
                </span>
              )}
              {ehVariacao && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                  style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-texto-muted)' }}>
                  variação
                </span>
              )}
            </div>
          )}

          {descricao && !renomeando && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--brand-texto-sec)' }}>
              {descricao}
            </p>
          )}
        </div>

        {/* Ações — só para técnicas globais (renomear / duplicar / restaurar) */}
        {global && !renomeando && (
          <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
            <button onClick={() => { setNome(nomeExibido); setRenomeando(true); setErro('') }}
              className="active:scale-90 transition-transform" aria-label="Renomear">
              <Pencil size={14} style={{ color: 'var(--brand-texto-muted)' }} />
            </button>
            <button onClick={() => { setNomeVariacao(`${nomeExibido} (variação)`); setDuplicando(true); setErro('') }}
              className="active:scale-90 transition-transform" aria-label="Duplicar">
              <Copy size={14} style={{ color: 'var(--brand-texto-muted)' }} />
            </button>
            {temCustom && (
              <button onClick={restaurar} disabled={isPending}
                className="active:scale-90 transition-transform" aria-label="Restaurar nome original">
                <RotateCcw size={14} style={{ color: '#FF6B6B' }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form inline de duplicação */}
      {duplicando && (
        <div className="flex items-center gap-2 mt-2">
          <input autoFocus value={nomeVariacao} onChange={e => setNomeVariacao(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') criarVariacao(); if (e.key === 'Escape') setDuplicando(false) }}
            disabled={isPending} placeholder="Nome da variação"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
            style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-gold)', color: 'var(--brand-texto)' }} />
          <button onClick={criarVariacao} disabled={isPending || !nomeVariacao.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform"
            style={{ background: 'var(--brand-gold)', color: '#080808' }}>
            {isPending ? '...' : 'Criar'}
          </button>
          <button onClick={() => setDuplicando(false)} className="flex-shrink-0 active:scale-90 transition-transform" aria-label="Cancelar">
            <X size={16} style={{ color: 'var(--brand-texto-muted)' }} />
          </button>
        </div>
      )}

      {erro && <p className="text-[11px] mt-1.5" style={{ color: '#f87171' }}>{erro}</p>}
    </div>
  )
}
