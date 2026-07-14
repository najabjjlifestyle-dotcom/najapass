'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { togglePresenca, adicionarVisitante, removerVisitante } from '../actions'
import Avatar from '@/components/avatar'

type Aluno = { id: string; nome: string; faixa: string; grau: number; foto_url?: string | null }

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white',
  cinza: 'bg-gray-400',
  amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400',
  verde: 'bg-green-400',
  azul: 'bg-blue-400',
  roxa: 'bg-purple-400',
  marrom: 'bg-amber-700',
  preta: 'bg-gray-800 border border-white/20',
}

type Visitante = { id: string; nome: string }

export default function AttendanceList({
  aulaId,
  alunos,
  presencasIniciais,
  visitantesIniciais,
  outrosAlunos,
  status,
}: {
  aulaId: string
  alunos: Aluno[]
  presencasIniciais: string[]
  visitantesIniciais: Visitante[]
  outrosAlunos: Aluno[]
  status: string
}) {
  const router = useRouter()
  const [presentes, setPresentes] = useState<Set<string>>(new Set(presencasIniciais))
  const [, startTransition] = useTransition()

  const [visitantes, setVisitantes] = useState<Visitante[]>(visitantesIniciais)
  const [showVisitanteForm, setShowVisitanteForm] = useState(false)
  const [novoVisitante, setNovoVisitante] = useState('')
  const [addingVisitante, setAddingVisitante] = useState(false)

  const [showAvulsoForm, setShowAvulsoForm] = useState(false)
  const [avulsoId, setAvulsoId] = useState('')
  const [addingAvulso, setAddingAvulso] = useState(false)

  const isFinished = status === 'finalizada'
  const isScheduled = status === 'agendada'
  const isLocked = isFinished || isScheduled

  async function handleAddVisitante() {
    const nome = novoVisitante.trim()
    if (!nome) return
    setAddingVisitante(true)
    const result = await adicionarVisitante(aulaId, nome)
    if (result?.success && result.id) {
      setVisitantes(prev => [...prev, { id: result.id!, nome }])
      setNovoVisitante('')
      setShowVisitanteForm(false)
    }
    setAddingVisitante(false)
  }

  async function handleRemoveVisitante(visitanteId: string) {
    setVisitantes(prev => prev.filter(v => v.id !== visitanteId))
    await removerVisitante(visitanteId, aulaId)
  }

  async function handleAddAvulso() {
    if (!avulsoId) return
    setAddingAvulso(true)
    const result = await togglePresenca(aulaId, avulsoId)
    setAddingAvulso(false)
    if (result?.success) {
      setAvulsoId('')
      setShowAvulsoForm(false)
      router.refresh()
    }
  }

  function toggle(alunoId: string) {
    if (isLocked) return

    const wasPresent = presentes.has(alunoId)

    setPresentes(prev => {
      const next = new Set(prev)
      if (wasPresent) next.delete(alunoId)
      else next.add(alunoId)
      return next
    })

    startTransition(async () => {
      const result = await togglePresenca(aulaId, alunoId)
      if (result?.error) {
        setPresentes(prev => {
          const next = new Set(prev)
          if (wasPresent) next.add(alunoId)
          else next.delete(alunoId)
          return next
        })
      }
    })
  }

  return (
    <div className="px-6 pt-6" style={{ paddingBottom: isLocked ? '2.5rem' : '7rem' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          {presentes.size} presente{presentes.size !== 1 ? 's' : ''} de {alunos.length}
        </p>
        {isFinished && (
          <Link href={`/aulas/${aulaId}/feedback`}
            className="text-xs uppercase tracking-widest px-2 py-1 rounded active:scale-[0.98] transition-transform"
            style={{ color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
            Ver feedback →
          </Link>
        )}
        {isScheduled && (
          <span className="text-xs uppercase tracking-widest px-2 py-1 rounded" style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
            Agendada — abra no dashboard
          </span>
        )}
      </div>

      {!isLocked && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setShowVisitanteForm(v => !v)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg active:scale-[0.98] transition-transform"
            style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto-sec)' }}>
            + Visitante
          </button>
          {outrosAlunos.length > 0 && (
            <button onClick={() => setShowAvulsoForm(v => !v)}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg active:scale-[0.98] transition-transform"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto-sec)' }}>
              + Aluno de outra turma
            </button>
          )}
        </div>
      )}

      {showVisitanteForm && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={novoVisitante}
            onChange={e => setNovoVisitante(e.target.value)}
            placeholder="Nome do visitante"
            autoFocus
            className="flex-1 px-3 py-2 rounded-xl text-sm placeholder-white/30 focus:outline-none"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
          />
          <button onClick={handleAddVisitante} disabled={addingVisitante || !novoVisitante.trim()}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 transition-transform active:scale-[0.98]"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            {addingVisitante ? '...' : 'Add'}
          </button>
        </div>
      )}

      {showAvulsoForm && (
        <div className="flex gap-2 mb-4">
          <select
            value={avulsoId}
            onChange={e => setAvulsoId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
            <option value="" className="bg-black">Selecione o aluno</option>
            {outrosAlunos.map(a => (
              <option key={a.id} value={a.id} className="bg-black">{a.nome}</option>
            ))}
          </select>
          <button onClick={handleAddAvulso} disabled={addingAvulso || !avulsoId}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 transition-transform active:scale-[0.98]"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            {addingAvulso ? '...' : 'Add'}
          </button>
        </div>
      )}

      {visitantes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {visitantes.map(v => (
            <span key={v.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)', background: 'var(--brand-gold-dim)' }}>
              {v.nome} <span className="opacity-60">(visitante)</span>
              {!isLocked && (
                <button onClick={() => handleRemoveVisitante(v.id)} className="ml-1 opacity-60 active:opacity-100 transition-opacity">×</button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {alunos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhum aluno cadastrado
            </p>
            <a href="/alunos/novo"
              className="inline-block mt-3 text-xs underline" style={{ color: 'var(--brand-texto-muted)' }}>
              Cadastrar aluno
            </a>
          </div>
        ) : (
          alunos.map(aluno => {
            const presente = presentes.has(aluno.id)
            return (
              <button
                key={aluno.id}
                onClick={() => toggle(aluno.id)}
                disabled={isLocked}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left ${isLocked ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                style={{
                  background: presente ? 'var(--brand-gold)' : 'var(--brand-surf)',
                  border: `1px solid ${presente ? 'var(--brand-gold)' : 'var(--brand-border)'}`,
                }}
              >
                <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} size={36} />
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'} ${presente ? 'opacity-100' : 'opacity-30'}`} />
                <div className="flex-1">
                  <p className="font-bold uppercase tracking-wider text-sm" style={{ color: presente ? '#000' : 'var(--brand-texto)' }}>
                    {aluno.nome}
                  </p>
                  <p className="text-xs capitalize" style={{ color: presente ? 'rgba(0,0,0,0.5)' : 'var(--brand-texto-muted)' }}>
                    {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º` : ''}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor: presente ? '#000' : 'var(--brand-border-str)', background: presente ? '#000' : 'transparent' }}>
                  {presente && <span className="text-xs font-bold" style={{ color: 'var(--brand-gold)' }}>✓</span>}
                </div>
              </button>
            )
          })
        )}
      </div>

      {!isLocked && (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-safe z-50"
          style={{ background: 'var(--brand-fundo)', borderTop: '1px solid var(--brand-border)' }}
        >
          <button
            onClick={() => router.push(`/aulas/${aulaId}/feedback`)}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest transition-transform active:scale-[0.98]"
            style={{ background: 'var(--brand-gold)', color: '#000' }}
          >
            {presentes.size} {presentes.size === 1 ? 'presente' : 'presentes'} · Finalizar Aula
          </button>
        </div>
      )}
    </div>
  )
}
