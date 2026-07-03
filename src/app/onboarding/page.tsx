'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarAcademia } from './actions'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await criarAcademia(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--brand-fundo)' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Naja BJJ" className="w-20 mx-auto mb-4 rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 className="text-3xl font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto)' }}>
            Criar Academia
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Configure sua academia para começar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Nome da academia *
            </label>
            <input
              name="nome"
              type="text"
              placeholder="Ex: Naja BJJ Lifestyle"
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent placeholder-white/30 text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Cidade
            </label>
            <input
              name="cidade"
              type="text"
              placeholder="Ex: São Paulo - SP"
              className="w-full px-4 py-3 rounded-xl bg-transparent placeholder-white/30 text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Seu nome
            </label>
            <input
              name="professor_nome"
              type="text"
              placeholder="Ex: Professor Naja"
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent placeholder-white/30 text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] mt-2"
            style={{ background: 'var(--brand-gold)', color: '#000' }}
          >
            {loading ? 'Criando...' : 'Criar minha academia'}
          </button>
        </form>
      </div>
    </div>
  )
}
