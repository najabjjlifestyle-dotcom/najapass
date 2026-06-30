'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { solicitarEntrada } from './actions'

type Academia = { id: string; nome: string; cidade: string | null }
type Solicitacao = { status: string; academia_nome: string } | null

type Step = 'role' | 'academia-form' | 'waiting'

export default function RoleSelect({
  academias,
  solicitacao,
}: {
  academias: Academia[]
  solicitacao: Solicitacao
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(
    solicitacao?.status === 'pendente' ? 'waiting' : 'role'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    solicitacao?.status === 'rejeitado'
      ? 'Sua solicitação foi recusada. Você pode tentar novamente.'
      : ''
  )
  const [academiaId, setAcademiaId] = useState('')
  const [nome, setNome] = useState('')
  const [academiaWaiting, setAcademiaWaiting] = useState(solicitacao?.academia_nome ?? '')

  async function handleSubmitSolicitacao(e: React.FormEvent) {
    e.preventDefault()
    if (!academiaId || !nome.trim()) return
    setLoading(true)
    setError('')

    const academia = academias.find(a => a.id === academiaId)
    const result = await solicitarEntrada(academiaId, nome)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setAcademiaWaiting(academia?.nome ?? '')
      setStep('waiting')
      setLoading(false)
    }
  }

  async function handleVerificar() {
    setLoading(true)
    router.refresh()
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">⏳</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-2xl uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Aguardando Aprovação
            </h1>
            {academiaWaiting && (
              <p className="text-white/40 text-sm mt-2">
                Solicitação enviada para{' '}
                <span className="text-white/70">{academiaWaiting}</span>
              </p>
            )}
            <p className="text-white/30 text-xs mt-3">
              Seu professor receberá a solicitação e precisará aprovar seu acesso.
            </p>
          </div>
          <button
            onClick={handleVerificar}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-white/20 text-white font-bold uppercase tracking-widest text-sm disabled:opacity-40 hover:border-white/40 transition-colors"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {loading ? 'Verificando...' : 'Já fui aprovado?'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'academia-form') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <button onClick={() => { setStep('role'); setError('') }}
            className="text-white/40 hover:text-white transition-colors text-xl mb-6">
            ←
          </button>
          <h1 className="text-white font-bold text-2xl uppercase tracking-wider mb-6"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Entrar em uma Academia
          </h1>
          <form onSubmit={handleSubmitSolicitacao} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
                style={{ fontFamily: 'var(--font-oswald)' }}>Seu nome *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome completo"
                required
                className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
                style={{ fontFamily: 'var(--font-oswald)' }}>Academia *</label>
              {academias.length === 0 ? (
                <p className="text-white/30 text-sm py-3">Nenhuma academia cadastrada ainda.</p>
              ) : (
                <select
                  value={academiaId}
                  onChange={e => setAcademiaId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors">
                  <option value="" className="bg-black">Selecionar academia...</option>
                  {academias.map(a => (
                    <option key={a.id} value={a.id} className="bg-black">
                      {a.nome}{a.cidade ? ` — ${a.cidade}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl border border-red-400/30 bg-red-400/10">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !academiaId || !nome.trim()}
              className="w-full py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-base uppercase tracking-widest transition-colors"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              {loading ? 'Enviando...' : 'Solicitar entrada'}
            </button>
          </form>
        </div>
      </div>
    )
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
          <p className="text-white/40 text-sm mt-2">Como você vai usar o NajaPass?</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10">
            <p className="text-yellow-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={() => router.push('/onboarding')}
          className="w-full text-left px-6 py-5 rounded-2xl bg-white hover:bg-white/90 transition-all">
          <p className="text-black font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Sou Professor
          </p>
          <p className="text-black/50 text-sm mt-0.5">
            Criar academia, turmas, gerenciar alunos
          </p>
        </button>

        <button
          onClick={() => setStep('academia-form')}
          className="w-full text-left px-6 py-5 rounded-2xl border border-white/20 hover:border-white/40 transition-all">
          <p className="text-white font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Sou Aluno
          </p>
          <p className="text-white/40 text-sm mt-0.5">
            Solicitar entrada em uma academia
          </p>
        </button>
      </div>
    </div>
  )
}
