'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--brand-fundo)' }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ border: '2px solid var(--brand-border-str)' }}>
            <span className="text-2xl">⏳</span>
          </div>
          <div>
            <h1 className="font-bold text-2xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
              Aguardando Aprovação
            </h1>
            {academiaWaiting && (
              <p className="text-sm mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
                Solicitação enviada para{' '}
                <span style={{ color: 'var(--brand-texto-sec)' }}>{academiaWaiting}</span>
              </p>
            )}
            <p className="text-xs mt-3" style={{ color: 'var(--brand-texto-muted)' }}>
              Seu professor receberá a solicitação e precisará aprovar seu acesso.
            </p>
          </div>
          <button
            onClick={handleVerificar}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm disabled:opacity-40 transition-transform active:scale-[0.98]"
            style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
            {loading ? 'Verificando...' : 'Já fui aprovado?'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'academia-form') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--brand-fundo)' }}>
        <div className="w-full max-w-sm">
          <button onClick={() => { setStep('role'); setError('') }}
            className="flex items-center justify-center w-10 h-10 rounded-full active:scale-90 transition-transform mb-6"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <ChevronLeft size={18} style={{ color: 'var(--brand-texto-muted)' }} />
          </button>
          <h1 className="font-bold text-2xl uppercase tracking-wider mb-6" style={{ color: 'var(--brand-texto)' }}>
            Entrar em uma Academia
          </h1>
          <form onSubmit={handleSubmitSolicitacao} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Seu nome *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome completo"
                required
                className="w-full px-4 py-3 rounded-xl bg-transparent placeholder-white/30 text-base focus:outline-none transition-colors"
                style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Academia *</label>
              {academias.length === 0 ? (
                <p className="text-sm py-3" style={{ color: 'var(--brand-texto-muted)' }}>Nenhuma academia cadastrada ainda.</p>
              ) : (
                <select
                  value={academiaId}
                  onChange={e => setAcademiaId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
                  style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
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
              <div className="px-4 py-3 rounded-xl" style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.1)' }}>
                <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !academiaId || !nome.trim()}
              className="w-full py-3 rounded-xl font-bold text-base uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
              style={{ background: 'var(--brand-gold)', color: '#000' }}>
              {loading ? 'Enviando...' : 'Solicitar entrada'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--brand-fundo)' }}>
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Naja BJJ" className="w-16 mx-auto mb-4 rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <h1 className="font-bold text-3xl uppercase tracking-widest" style={{ color: 'var(--brand-texto)' }}>
            Bem-vindo
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--brand-texto-muted)' }}>Como você vai usar o NajaPass?</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl" style={{ border: '1px solid var(--brand-gold-border)', background: 'var(--brand-gold-dim)' }}>
            <p className="text-sm" style={{ color: 'var(--brand-gold)' }}>{error}</p>
          </div>
        )}

        <button
          onClick={() => router.push('/onboarding')}
          className="w-full text-left px-6 py-5 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)' }}>
          <p className="font-bold text-xl uppercase tracking-wider" style={{ color: '#000' }}>
            Sou Professor
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(0,0,0,0.5)' }}>
            Criar academia, turmas, gerenciar alunos
          </p>
        </button>

        <button
          onClick={() => setStep('academia-form')}
          className="w-full text-left px-6 py-5 rounded-2xl transition-all active:scale-[0.98]"
          style={{ border: '1px solid var(--brand-border-str)' }}>
          <p className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Sou Aluno
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
            Solicitar entrada em uma academia
          </p>
        </button>
      </div>
    </div>
  )
}
