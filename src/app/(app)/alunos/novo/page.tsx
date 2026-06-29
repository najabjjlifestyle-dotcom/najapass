'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cadastrarAluno } from '../actions'

const FAIXAS = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta']

export default function NovoAlunoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await cadastrarAluno(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.replace('/alunos')
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center gap-3">
        <Link href="/alunos" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
        <h1 className="text-white font-bold text-xl uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          Novo Aluno
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Nome *</label>
            <input name="nome" type="text" required placeholder="Nome completo"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>E-mail</label>
            <input name="email" type="email" placeholder="email@exemplo.com"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Telefone</label>
            <input name="telefone" type="tel" placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Faixa</label>
            <select name="faixa" defaultValue="branca"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors">
              {FAIXAS.map(f => (
                <option key={f} value={f} className="bg-black">
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Grau</label>
            <select name="grau" defaultValue="0"
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors">
              {[0, 1, 2, 3, 4].map(g => (
                <option key={g} value={g} className="bg-black">
                  {g === 0 ? 'Sem grau' : `${g}º grau`}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base uppercase tracking-widest transition-colors mt-2"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar aluno'}
          </button>
        </form>
      </main>
    </div>
  )
}
