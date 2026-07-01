'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { abrirAula } from '../actions'

type Turma = { id: string; nome: string }
type TecnicaOpt = { id: string; nome: string; categoria: string | null }

export default function NovaAulaForm({ turmas, tecnicas }: { turmas: Turma[]; tecnicas: TecnicaOpt[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hoje = new Date().toISOString().split('T')[0]
  const horaAtual = new Date().toTimeString().slice(0, 5)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await abrirAula(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.id) {
      router.replace(`/aulas/${result.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center gap-3">
        <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
        <h1 className="text-white font-bold text-xl uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          Abrir Aula
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">

          {turmas.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
                style={{ fontFamily: 'var(--font-oswald)' }}>Turma</label>
              <select name="turma_id"
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors">
                <option value="" className="bg-black">Sem turma específica</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Data</label>
            <input name="data" type="date" defaultValue={hoje} required
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Hora de início</label>
            <input name="hora_inicio" type="time" defaultValue={horaAtual}
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Tema da aula</label>
            <select name="tema"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors">
              <option value="" className="bg-black">Sem tema específico</option>
              {tecnicas.map(t => (
                <option key={t.id} value={t.nome} className="bg-black">
                  {t.categoria ? `[${t.categoria}] ` : ''}{t.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Link de estudo (YouTube, etc)</label>
            <input name="video_url" type="url" placeholder="https://youtube.com/..."
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-lg uppercase tracking-widest transition-colors mt-2"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {loading ? 'Abrindo...' : 'Abrir Aula'}
          </button>
        </form>
      </main>
    </div>
  )
}
