'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePresenca, finalizarAula, adicionarVisitante, removerVisitante } from '../actions'
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
  const [finalizando, setFinalizando] = useState(false)

  const [visitantes, setVisitantes] = useState<Visitante[]>(visitantesIniciais)
  const [showVisitanteForm, setShowVisitanteForm] = useState(false)
  const [novoVisitante, setNovoVisitante] = useState('')
  const [addingVisitante, setAddingVisitante] = useState(false)

  const [showAvulsoForm, setShowAvulsoForm] = useState(false)
  const [avulsoId, setAvulsoId] = useState('')
  const [addingAvulso, setAddingAvulso] = useState(false)

  const isFinished = status === 'finalizada'

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
    if (isFinished) return

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

  async function handleFinalizar() {
    setFinalizando(true)
    const result = await finalizarAula(aulaId)
    if (result?.error) {
      setFinalizando(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="px-6 pt-6 pb-10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/40 text-xs uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          {presentes.size} presente{presentes.size !== 1 ? 's' : ''} de {alunos.length}
        </p>
        {!isFinished && (
          <button onClick={handleFinalizar} disabled={finalizando}
            className="px-4 py-2 border border-white/30 text-white text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 transition-colors hover:bg-white hover:text-black"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {finalizando ? 'Finalizando...' : 'Finalizar Aula'}
          </button>
        )}
        {isFinished && (
          <span className="text-xs text-green-400 uppercase tracking-widest border border-green-400/30 px-2 py-1 rounded"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Finalizada ✓
          </span>
        )}
      </div>

      {!isFinished && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setShowVisitanteForm(v => !v)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-white/20 text-white/70 hover:border-white/40"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            + Visitante
          </button>
          {outrosAlunos.length > 0 && (
            <button onClick={() => setShowAvulsoForm(v => !v)}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-white/20 text-white/70 hover:border-white/40"
              style={{ fontFamily: 'var(--font-oswald)' }}>
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
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/40"
          />
          <button onClick={handleAddVisitante} disabled={addingVisitante || !novoVisitante.trim()}
            className="px-4 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {addingVisitante ? '...' : 'Add'}
          </button>
        </div>
      )}

      {showAvulsoForm && (
        <div className="flex gap-2 mb-4">
          <select
            value={avulsoId}
            onChange={e => setAvulsoId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-sm focus:outline-none focus:border-white/40">
            <option value="" className="bg-black">Selecione o aluno</option>
            {outrosAlunos.map(a => (
              <option key={a.id} value={a.id} className="bg-black">{a.nome}</option>
            ))}
          </select>
          <button onClick={handleAddAvulso} disabled={addingAvulso || !avulsoId}
            className="px-4 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {addingAvulso ? '...' : 'Add'}
          </button>
        </div>
      )}

      {visitantes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {visitantes.map(v => (
            <span key={v.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--brand-gold, #C8A96E)', border: '1px solid rgba(200,169,110,0.3)', background: 'rgba(200,169,110,0.1)' }}>
              {v.nome} <span className="opacity-60">(visitante)</span>
              {!isFinished && (
                <button onClick={() => handleRemoveVisitante(v.id)} className="ml-1 opacity-60 hover:opacity-100">×</button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {alunos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/30 text-sm uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Nenhum aluno cadastrado
            </p>
            <a href="/alunos/novo"
              className="inline-block mt-3 text-xs text-white/40 underline">
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
                disabled={isFinished}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all text-left ${
                  presente
                    ? 'bg-white border-white'
                    : 'bg-transparent border-white/10 hover:border-white/30'
                } ${isFinished ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} size={36} />
                <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'} ${presente ? 'opacity-100' : 'opacity-30'}`} />
                <div className="flex-1">
                  <p className={`font-bold uppercase tracking-wider text-sm ${presente ? 'text-black' : 'text-white'}`}
                    style={{ fontFamily: 'var(--font-oswald)' }}>
                    {aluno.nome}
                  </p>
                  <p className={`text-xs capitalize ${presente ? 'text-black/50' : 'text-white/30'}`}>
                    {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º` : ''}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  presente ? 'border-black bg-black' : 'border-white/20'
                }`}>
                  {presente && <span className="text-white text-xs font-bold">✓</span>}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
