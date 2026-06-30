'use client'

import { useState, useTransition } from 'react'
import { matricularAluno, removerDaTurma } from './actions'

type Aluno = { id: string; nome: string; faixa: string }

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white', cinza: 'bg-gray-400', amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400', verde: 'bg-green-400', azul: 'bg-blue-400',
  roxa: 'bg-purple-400', marrom: 'bg-amber-700', preta: 'bg-gray-800 border border-white/20',
}

export default function EnrollmentManager({
  turmaId,
  matriculados,
  disponiveis,
}: {
  turmaId: string
  matriculados: Aluno[]
  disponiveis: Aluno[]
}) {
  const [lista, setLista] = useState<Aluno[]>(matriculados)
  const [pool, setPool] = useState<Aluno[]>(disponiveis)
  const [selecionado, setSelecionado] = useState('')
  const [, startTransition] = useTransition()

  function handleMatricular() {
    const aluno = pool.find(a => a.id === selecionado)
    if (!aluno) return

    setLista(prev => [...prev, aluno].sort((a, b) => a.nome.localeCompare(b.nome)))
    setPool(prev => prev.filter(a => a.id !== selecionado))
    setSelecionado('')

    startTransition(async () => {
      const result = await matricularAluno(turmaId, aluno.id)
      if (result?.error) {
        setLista(prev => prev.filter(a => a.id !== aluno.id))
        setPool(prev => [...prev, aluno].sort((a, b) => a.nome.localeCompare(b.nome)))
      }
    })
  }

  function handleRemover(aluno: Aluno) {
    setLista(prev => prev.filter(a => a.id !== aluno.id))
    setPool(prev => [...prev, aluno].sort((a, b) => a.nome.localeCompare(b.nome)))

    startTransition(async () => {
      const result = await removerDaTurma(turmaId, aluno.id)
      if (result?.error) {
        setLista(prev => [...prev, aluno].sort((a, b) => a.nome.localeCompare(b.nome)))
        setPool(prev => prev.filter(a => a.id !== aluno.id))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Add student */}
      {pool.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50 mb-2"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Matricular aluno
          </p>
          <div className="flex gap-2">
            <select
              value={selecionado}
              onChange={e => setSelecionado(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-sm transition-colors">
              <option value="" className="bg-black">Selecionar aluno...</option>
              {pool.map(a => (
                <option key={a.id} value={a.id} className="bg-black">{a.nome}</option>
              ))}
            </select>
            <button
              onClick={handleMatricular}
              disabled={!selecionado}
              className="px-4 py-3 bg-white text-black font-bold text-sm uppercase tracking-wider rounded-xl disabled:opacity-30 transition-colors"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              + Add
            </button>
          </div>
        </div>
      )}

      {/* Enrolled list */}
      <div>
        <p className="text-xs uppercase tracking-widest text-white/50 mb-2"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          {lista.length} aluno{lista.length !== 1 ? 's' : ''} matriculado{lista.length !== 1 ? 's' : ''}
        </p>
        <div className="space-y-2">
          {lista.length === 0 ? (
            <p className="text-center text-white/20 text-sm py-6 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Nenhum aluno matriculado
            </p>
          ) : (
            lista.map(aluno => (
              <div key={aluno.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
                <div className={`w-3 h-8 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
                <p className="flex-1 text-white font-bold uppercase tracking-wider text-sm truncate"
                  style={{ fontFamily: 'var(--font-oswald)' }}>
                  {aluno.nome}
                </p>
                <button
                  onClick={() => handleRemover(aluno)}
                  className="text-white/30 hover:text-red-400 transition-colors text-xs uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-oswald)' }}>
                  Remover
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
