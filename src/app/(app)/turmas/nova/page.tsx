'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarTurma } from '../actions'
import BackButton from '@/components/back-button'

const DIAS = [
  { value: 'segunda', label: 'Seg' },
  { value: 'terca', label: 'Ter' },
  { value: 'quarta', label: 'Qua' },
  { value: 'quinta', label: 'Qui' },
  { value: 'sexta', label: 'Sex' },
  { value: 'sabado', label: 'Sáb' },
  { value: 'domingo', label: 'Dom' },
]

export default function NovaTurmaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([])

  function toggleDia(dia: string) {
    setDiasSelecionados(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.set('dias_semana', JSON.stringify(diasSelecionados))
    const result = await criarTurma(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.replace('/turmas')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-12 pb-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/turmas" />
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Nova Turma
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Nome da Turma *</label>
            <input name="nome" type="text" required placeholder="Ex: Adulto Avançado"
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base placeholder-white/30 focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Dias da Semana</label>
            <div className="flex gap-2 flex-wrap">
              {DIAS.map(({ value, label }) => {
                const selecionado = diasSelecionados.includes(value)
                return (
                  <button key={value} type="button" onClick={() => toggleDia(value)}
                    className="px-3 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-transform active:scale-[0.98]"
                    style={{
                      background: selecionado ? 'var(--brand-gold)' : 'transparent',
                      color: selecionado ? '#000' : 'var(--brand-texto-muted)',
                      border: `1px solid ${selecionado ? 'var(--brand-gold)' : 'var(--brand-border-str)'}`,
                    }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Horário</label>
            <input name="horario" type="time"
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] mt-2"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            {loading ? 'Criando...' : 'Criar turma'}
          </button>
        </form>
      </main>
    </div>
  )
}
