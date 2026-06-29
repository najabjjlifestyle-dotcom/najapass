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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Naja BJJ" className="w-20 mx-auto mb-4 rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1
            className="text-3xl font-bold uppercase tracking-widest text-white"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            Criar Academia
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Configure sua academia para começar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Nome da academia *
            </label>
            <input
              name="nome"
              type="text"
              placeholder="Ex: Naja BJJ Lifestyle"
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors"
            />
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Cidade
            </label>
            <input
              name="cidade"
              type="text"
              placeholder="Ex: São Paulo - SP"
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors"
            />
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Seu nome
            </label>
            <input
              name="professor_nome"
              type="text"
              placeholder="Ex: Professor Naja"
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base uppercase tracking-widest transition-colors mt-2"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            {loading ? 'Criando...' : 'Criar minha academia'}
          </button>
        </form>
      </div>
    </div>
  )
}
