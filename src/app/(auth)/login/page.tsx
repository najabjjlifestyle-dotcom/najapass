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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-fundo)' }}>

      {/* Hero — cobra */}
      <div className="flex justify-center pt-14 relative">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cobra.webp"
            alt="Naja"
            className="w-44 object-contain select-none"
          />
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, var(--brand-fundo), rgba(8,8,8,0.8), transparent)' }} />
        </div>
      </div>

      {/* Form panel */}
      <div className="px-6 pb-10 pt-4">

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto)' }}>
            Naja BJJ
          </h1>
          <p className="text-xs uppercase tracking-[0.35em] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
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
              className="w-full px-4 py-3 rounded-xl bg-transparent placeholder-white/30 text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
            />
            {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
              style={{ background: 'var(--brand-gold)', color: '#000' }}
            >
              {loading ? 'Enviando...' : 'Receber código'}
            </button>
            <p className="text-center text-xs pt-1 uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Não tem conta? Fale com seu professor.
            </p>
          </form>

        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <p className="text-center text-sm mb-4" style={{ color: 'var(--brand-texto-sec)' }}>
              Código enviado para{' '}
              <span className="font-medium" style={{ color: 'var(--brand-texto)' }}>{email}</span>
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
              className="w-full px-4 py-4 rounded-xl bg-transparent placeholder-white/20 text-3xl text-center tracking-[0.5em] font-bold focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
            />
            {error && <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
              style={{ background: 'var(--brand-gold)', color: '#000' }}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="w-full text-xs uppercase tracking-widest py-2 active:opacity-60 transition-opacity"
              style={{ color: 'var(--brand-texto-muted)' }}
            >
              ← Usar outro e-mail
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
