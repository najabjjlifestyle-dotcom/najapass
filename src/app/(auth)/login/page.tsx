'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError('Não foi possível enviar o link. Tente novamente.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* Hero — cobra */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cobra.png"
          alt="Naja"
          className="w-72 object-contain opacity-90 select-none"
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Form panel */}
      <div className="px-6 pb-10 pt-2">

        {/* Brand */}
        <div className="text-center mb-6">
          <h1
            className="text-4xl font-bold uppercase tracking-widest text-white"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            Naja BJJ
          </h1>
          <p
            className="text-xs uppercase tracking-[0.35em] text-white/40 mt-1"
            style={{ fontFamily: 'var(--font-oswald)' }}
          >
            Lifestyle
          </p>
        </div>

        {sent ? (
          <div className="border border-white/20 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">📬</div>
            <h2
              className="text-white font-bold text-lg mb-2 uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Link enviado!
            </h2>
            <p className="text-white/60 text-sm">
              Verifique{' '}
              <span className="text-white font-medium">{email}</span>{' '}
              e clique no link para entrar.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-4 text-xs text-white/40 underline uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors"
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base uppercase tracking-widest transition-colors"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              {loading ? 'Enviando...' : 'Entrar'}
            </button>

            <p
              className="text-center text-white/30 text-xs pt-1 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              Não tem conta? Fale com seu professor.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
