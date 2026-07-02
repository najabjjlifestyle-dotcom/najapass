'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cadastrarAluno } from '../actions'
import BackButton from '@/components/back-button'

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
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-12 pb-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/alunos" />
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Novo Aluno
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Nome *</label>
            <input name="nome" type="text" required placeholder="Nome completo"
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base placeholder-white/30 focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>E-mail</label>
            <input name="email" type="email" placeholder="email@exemplo.com"
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base placeholder-white/30 focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Telefone</label>
            <input name="telefone" type="tel" placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base placeholder-white/30 focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Faixa</label>
            <select name="faixa" defaultValue="branca"
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
              {FAIXAS.map(f => (
                <option key={f} value={f} className="bg-black">
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Grau</label>
            <select name="grau" defaultValue="0"
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
              {[0, 1, 2, 3, 4].map(g => (
                <option key={g} value={g} className="bg-black">
                  {g === 0 ? 'Sem grau' : `${g}º grau`}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] mt-2"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar aluno'}
          </button>
        </form>
      </main>
    </div>
  )
}
