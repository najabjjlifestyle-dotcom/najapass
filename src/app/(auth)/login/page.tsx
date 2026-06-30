'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'email' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setError('Não foi possível enviar o código. Tente novamente.')
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error || !data.user) {
      setError('Código inválido ou expirado. Tente novamente.')
      setLoading(false)
      return
    }

    // Detecta perfil e redireciona
    const { data: professor } = await supabase
      .from('professores')
      .select('id, academia_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (professor?.academia_id) {
      router.replace('/dashboard')
    } else if (professor) {
      router.replace('/onboarding')
    } else {
      const { data: aluno } = await supabase
        .from('alunos')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      router.replace(aluno ? '/aluno' : '/boas-vindas')
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* Hero — cobra */}
      <div className="flex justify-center pt-14 relative">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cobra.webp"
            alt="Naja"
            className="w-44 object-contain select-none"
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
      </div>

      {/* Form panel */}
      <div className="px-6 pb-10 pt-4">

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

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base uppercase tracking-widest transition-colors"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              {loading ? 'Enviando...' : 'Receber código'}
            </button>
            <p className="text-center text-white/30 text-xs pt-1 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Não tem conta? Fale com seu professor.
            </p>
          </form>

        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <p className="text-center text-white/50 text-sm mb-4">
              Código enviado para{' '}
              <span className="text-white font-medium">{email}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="_ _ _ _ _ _"
              required
              autoFocus
              className="w-full px-4 py-4 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/20 focus:outline-none focus:border-white text-3xl text-center tracking-[0.5em] font-bold transition-colors"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base uppercase tracking-widest transition-colors"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="w-full text-xs text-white/30 uppercase tracking-widest pt-1"
              style={{ fontFamily: 'var(--font-oswald)' }}
            >
              ← Usar outro e-mail
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
