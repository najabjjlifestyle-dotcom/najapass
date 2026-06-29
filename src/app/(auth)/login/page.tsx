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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600 mb-4">
            <span className="text-3xl">🥋</span>
          </div>
          <h1 className="text-2xl font-bold text-white">NajaPass</h1>
          <p className="text-gray-400 text-sm mt-1">A memória técnica da sua academia</p>
        </div>

        {sent ? (
          <div className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-800">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-white font-semibold text-lg mb-2">Link enviado!</h2>
            <p className="text-gray-400 text-sm">
              Verifique seu e-mail <span className="text-purple-400 font-medium">{email}</span> e
              clique no link para entrar.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-5 text-sm text-gray-500 underline"
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors"
            >
              {loading ? 'Enviando...' : 'Entrar com Magic Link'}
            </button>

            <p className="text-center text-gray-500 text-xs pt-2">
              Não tem conta? Fale com seu professor para ser cadastrado.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
