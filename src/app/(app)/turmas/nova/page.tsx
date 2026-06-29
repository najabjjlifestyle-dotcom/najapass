'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { criarTurma } from '../actions'

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
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center gap-3">
        <Link href="/turmas" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
        <h1 className="text-white font-bold text-xl uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          Nova Turma
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Nome da Turma *</label>
            <input name="nome" type="text" required placeholder="Ex: Adulto Avançado"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Dias da Semana</label>
            <div className="flex gap-2 flex-wrap">
              {DIAS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => toggleDia(value)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors ${
                    diasSelecionados.includes(value)
                      ? 'bg-white text-black'
                      : 'border border-white/30 text-white/50 hover:border-white/60'
                  }`}
                  style={{ fontFamily: 'var(--font-oswald)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Horário</label>
            <input name="horario" type="time"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base uppercase tracking-widest transition-colors mt-2"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {loading ? 'Criando...' : 'Criar turma'}
          </button>
        </form>
      </main>
    </div>
  )
}
