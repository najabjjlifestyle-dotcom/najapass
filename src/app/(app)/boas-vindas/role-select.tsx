'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { vincularAluno } from './actions'

export default function RoleSelect() {
  const router = useRouter()
  const [loading, setLoading] = useState<'professor' | 'aluno' | null>(null)
  const [error, setError] = useState('')

  async function handleAluno() {
    setLoading('aluno')
    setError('')
    const result = await vincularAluno()
    if (result?.error) {
      setError(result.error)
      setLoading(null)
    } else {
      router.replace('/aluno')
    }
  }

  function handleProfessor() {
    setLoading('professor')
    router.replace('/onboarding')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">

        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Naja BJJ" className="w-16 mx-auto mb-4 rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 className="text-white font-bold text-3xl uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Bem-vindo
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Como você vai usar o NajaPass?
          </p>
        </div>

        {/* Professor */}
        <button
          onClick={handleProfessor}
          disabled={loading !== null}
          className="w-full text-left px-6 py-5 rounded-2xl bg-white disabled:opacity-60 transition-all hover:bg-white/90 active:scale-98"
        >
          <p className="text-black font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {loading === 'professor' ? 'Aguarde...' : 'Sou Professor'}
          </p>
          <p className="text-black/50 text-sm mt-0.5">
            Criar academia, turmas, gerenciar alunos
          </p>
        </button>

        {/* Aluno */}
        <button
          onClick={handleAluno}
          disabled={loading !== null}
          className="w-full text-left px-6 py-5 rounded-2xl border border-white/20 disabled:opacity-60 transition-all hover:border-white/40 active:scale-98"
        >
          <p className="text-white font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {loading === 'aluno' ? 'Verificando...' : 'Sou Aluno'}
          </p>
          <p className="text-white/40 text-sm mt-0.5">
            Check-in, histórico de presenças
          </p>
        </button>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-red-400/30 bg-red-400/10">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
