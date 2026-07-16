'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Repeat, ChevronRight } from 'lucide-react'
import { concluirAula } from './actions'

type Tecnica = {
  tecnica_id: string
  nome: string
  tipo: 'planejada' | 'ensinada'
  reforco: boolean
}

export default function FeedbackForm({
  aulaId,
  aulaStatus,
  turmaId,
  tecnicas,
  turmaNome,
  data,
}: {
  aulaId: string
  aulaStatus: string
  turmaId: string | null
  tecnicas: Tecnica[]
  turmaNome: string
  data: string
}) {
  const router = useRouter()
  // Técnicas já marcadas como ensinadas durante a aula ficam pré-selecionadas
  const [ensinadas, setEnsinadas] = useState<Set<string>>(
    new Set(tecnicas.filter(t => t.tipo === 'ensinada').map(t => t.tecnica_id))
  )
  const [reforcos, setReforcos] = useState<Set<string>>(
    new Set(tecnicas.filter(t => t.reforco).map(t => t.tecnica_id))
  )
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const dataFmt = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short',
  })

  function toggleEnsinada(id: string) {
    setEnsinadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setReforcos(r => { const rr = new Set(r); rr.delete(id); return rr })
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleReforco(id: string) {
    if (!ensinadas.has(id)) return
    setReforcos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConcluir() {
    startTransition(async () => {
      await concluirAula(aulaId, [...ensinadas], [...reforcos])
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
        style={{ background: 'var(--brand-fundo)' }}>
        <div className="text-5xl mb-4">🥋</div>
        <h1 className="font-bold text-2xl uppercase tracking-wider mb-1" style={{ color: 'var(--brand-gold)' }}>
          Aula encerrada!
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--brand-texto-muted)' }}>
          {ensinadas.size} técnica{ensinadas.size !== 1 ? 's' : ''} registrada{ensinadas.size !== 1 ? 's' : ''} ·{' '}
          {reforcos.size > 0 ? `${reforcos.size} para reforço` : 'sem reforços'}
        </p>
        {turmaId && (
          <button
            onClick={() => router.replace(`/aulas/nova?turma_id=${turmaId}`)}
            className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-widest transition-transform active:scale-[0.98] mb-3 flex items-center justify-center gap-2"
            style={{ background: 'var(--brand-gold)', color: '#000' }}
          >
            Planejar próxima aula
            <ChevronRight size={18} />
          </button>
        )}
        <button
          onClick={() => router.replace('/dashboard')}
          className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest"
          style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)', background: 'transparent' }}
        >
          Ir para o início
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
          {turmaNome} · {dataFmt}
        </p>
        <h1 className="font-bold text-xl uppercase tracking-wider mt-0.5" style={{ color: 'var(--brand-texto)' }}>
          O que você ensinou?
        </h1>
        <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
          Toque nas técnicas que foram ao tatame. As com reforço entram automaticamente na próxima aula.
        </p>
      </header>

      <main className="px-5 pt-5 pb-48">
        {tecnicas.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--brand-texto-muted)' }}>
            Nenhuma técnica planejada para esta aula.
          </p>
        ) : (
          <div className="space-y-2">
            {tecnicas.map(t => {
              const foiEnsinada = ensinadas.has(t.tecnica_id)
              const foiReforco = reforcos.has(t.tecnica_id)
              return (
                <div key={t.tecnica_id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: `1px solid ${foiEnsinada ? 'rgba(74,222,128,0.3)' : 'var(--brand-border)'}`,
                    background: foiEnsinada ? 'rgba(74,222,128,0.06)' : 'var(--brand-surf)',
                  }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <p className="font-bold text-sm flex-1 min-w-0" style={{ color: 'var(--brand-texto)' }}>
                      {t.nome}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleEnsinada(t.tecnica_id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.96]"
                      style={foiEnsinada
                        ? { background: 'rgba(74,222,128,0.2)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.4)' }
                        : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                      }
                    >
                      <Check size={13} />
                      Ensinei
                    </button>
                  </div>
                  {foiEnsinada && (
                    <div className="px-4 pb-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => toggleReforco(t.tecnica_id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-[0.96]"
                        style={foiReforco
                          ? { background: 'rgba(251,146,60,0.2)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.4)' }
                          : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                        }
                      >
                        <Repeat size={11} />
                        Repetir na próxima
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Ancorada acima da bottom nav — bottom-0 ficava coberta por ela */}
      <div className="fixed left-0 right-0 px-5 pt-3 pb-3 z-40"
        style={{
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--brand-fundo)',
          borderTop: '1px solid var(--brand-border)',
        }}>
        {reforcos.size > 0 && (
          <p className="text-[10px] text-center mb-2 uppercase tracking-widest" style={{ color: '#FB923C' }}>
            {reforcos.size} técnica{reforcos.size !== 1 ? 's' : ''} para reforço na próxima aula
          </p>
        )}
        <button
          onClick={handleConcluir}
          disabled={isPending}
          className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000' }}
        >
          {isPending ? 'Encerrando...' : `Concluir aula · ${ensinadas.size} ensinada${ensinadas.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
