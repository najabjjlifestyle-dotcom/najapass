'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calcularDatasRecorrentes, type Turma } from '@/lib/gerar-aulas'
import { gerarAulasRecorrentes } from '@/app/(app)/turmas/[id]/actions'

const OPCOES: { valor: 1 | 2 | 4; label: string }[] = [
  { valor: 1, label: '1 semana' },
  { valor: 2, label: '2 semanas' },
  { valor: 4, label: '4 semanas' },
]

export default function GerarAulasForm({ turma, academiaId }: { turma: Turma; academiaId: string }) {
  const router = useRouter()
  const [semanas, setSemanas] = useState<1 | 2 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const preview = useMemo(() => calcularDatasRecorrentes(turma, semanas, academiaId), [turma, semanas, academiaId])

  const semDias = !turma.dias_semana || turma.dias_semana.length === 0

  async function handleGerar() {
    setLoading(true)
    setFeedback(null)
    const result = await gerarAulasRecorrentes(turma.id, semanas)
    setLoading(false)
    if (result?.error) {
      setFeedback({ tipo: 'erro', texto: result.error })
    } else {
      setFeedback({ tipo: 'ok', texto: `${result?.criadas ?? 0} aula${result?.criadas !== 1 ? 's' : ''} criada${result?.criadas !== 1 ? 's' : ''}` })
      router.refresh()
    }
  }

  if (semDias) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--brand-gold)' }}>
          Gerar aulas
        </p>
        <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
          Configure os dias da semana desta turma acima pra poder gerar aulas automaticamente.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--brand-gold)' }}>
        Gerar aulas
      </p>

      <div className="flex gap-2 mb-3">
        {OPCOES.map(op => (
          <button key={op.valor} type="button" onClick={() => setSemanas(op.valor)}
            className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform active:scale-[0.98]"
            style={semanas === op.valor
              ? { background: 'var(--brand-gold)', color: '#000' }
              : { background: 'var(--brand-surf)', border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto-muted)' }
            }>
            {op.label}
          </button>
        ))}
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
        {preview.length === 0
          ? 'Nenhuma data nova nesse período.'
          : `Vai criar ${preview.length} aula${preview.length !== 1 ? 's' : ''} entre ${formatData(preview[0].data)} e ${formatData(preview[preview.length - 1].data)}.`}
      </p>

      <button onClick={handleGerar} disabled={loading || preview.length === 0}
        className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98]"
        style={{ background: 'var(--brand-gold)', color: '#000' }}>
        {loading ? 'Gerando...' : 'Confirmar e gerar'}
      </button>

      {feedback && (
        <p className="text-xs mt-2" style={{ color: feedback.tipo === 'ok' ? '#4ADE80' : '#f87171' }}>
          {feedback.texto}
        </p>
      )}
    </div>
  )
}

function formatData(dataStr: string) {
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
