'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Repeat } from 'lucide-react'
import { salvarFeedbackAula } from './actions'

type Tecnica = { tecnica_id: string; nome: string; reforco: boolean }

export default function FeedbackForm({
  aulaId,
  tecnicas,
  turmaNome,
  data,
}: {
  aulaId: string
  tecnicas: Tecnica[]
  turmaNome: string
  data: string
}) {
  const router = useRouter()
  const [repetir, setRepetir] = useState<Set<string>>(
    new Set(tecnicas.filter(t => t.reforco).map(t => t.tecnica_id))
  )
  const [isPending, startTransition] = useTransition()

  const dataFmt = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short',
  })

  function toggle(id: string) {
    setRepetir(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConcluir() {
    startTransition(async () => {
      await salvarFeedbackAula(aulaId, [...repetir])
      router.replace('/dashboard')
    })
  }

  const nRepetir = repetir.size

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
          {turmaNome} · {dataFmt}
        </p>
        <h1 className="font-bold text-xl uppercase tracking-wider mt-0.5" style={{ color: 'var(--brand-texto)' }}>
          Como foi a aula?
        </h1>
        <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
          Marque as técnicas que a turma não absorveu bem — elas entram automaticamente no plano da próxima aula.
        </p>
      </header>

      <main className="px-5 pt-5 pb-10">
        {tecnicas.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--brand-texto-muted)' }}>
            Nenhuma técnica foi marcada como ensinada nesta aula.
          </p>
        ) : (
          <div className="space-y-2">
            {tecnicas.map(t => {
              const marcado = repetir.has(t.tecnica_id)
              return (
                <div key={t.tecnica_id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <p className="font-bold text-sm flex-1 min-w-0" style={{ color: 'var(--brand-texto)' }}>
                    {t.nome}
                  </p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button type="button" onClick={() => { if (marcado) toggle(t.tecnica_id) }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-[0.98]"
                      style={!marcado
                        ? { background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }
                        : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                      }>
                      <Check size={13} /> Ótimo
                    </button>
                    <button type="button" onClick={() => { if (!marcado) toggle(t.tecnica_id) }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-[0.98]"
                      style={marcado
                        ? { background: 'rgba(251,146,60,0.15)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.3)' }
                        : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                      }>
                      <Repeat size={13} /> Repetir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {nRepetir > 0 && (
          <div className="mt-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Próxima aula desta turma
            </p>
            <p className="text-xs mt-1" style={{ color: '#FB923C' }}>
              {nRepetir} técnica{nRepetir !== 1 ? 's irão' : ' irá'} para reforço
            </p>
          </div>
        )}

        <button onClick={handleConcluir} disabled={isPending}
          className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98] mt-6"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {isPending ? 'Salvando...' : 'Concluir e fechar aula'}
        </button>
      </main>
    </div>
  )
}
