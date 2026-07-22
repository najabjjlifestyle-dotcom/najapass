'use client'

import { useState, useTransition } from 'react'
import { adicionarNota, deletarNota } from './actions'

type Nota = { id: string; texto: string; criado_em: string }

export default function NotasProfessor({
  alunoId,
  notas: notasIniciais,
}: {
  alunoId: string
  notas: Nota[]
}) {
  const [notas, setNotas] = useState<Nota[]>(notasIniciais)
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdicionar() {
    if (!texto.trim()) return
    const textoTrim = texto.trim()
    startTransition(async () => {
      const res = await adicionarNota(alunoId, textoTrim)
      if (!res?.error) {
        setNotas(prev => [
          { id: crypto.randomUUID(), texto: textoTrim, criado_em: new Date().toISOString() },
          ...prev,
        ])
        setTexto('')
      }
    })
  }

  function handleDeletar(notaId: string) {
    startTransition(async () => {
      await deletarNota(notaId, alunoId)
      setNotas(prev => prev.filter(n => n.id !== notaId))
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Anotar observação... (privado — só professores veem)"
          maxLength={1000}
          rows={2}
          className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--brand-surf)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-texto)',
          }}
        />
        <button
          onClick={handleAdicionar}
          disabled={isPending || !texto.trim()}
          className="px-4 rounded-xl font-bold text-lg disabled:opacity-40 flex-shrink-0"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          +
        </button>
      </div>

      {notas.length === 0 ? (
        <p className="text-xs italic" style={{ color: 'var(--brand-texto-muted)' }}>
          Nenhuma observação registrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {notas.map(nota => {
            const data = new Date(nota.criado_em).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
            return (
              <div key={nota.id} className="rounded-xl px-3 py-2.5"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--brand-texto)' }}>{nota.texto}</p>
                  <button
                    onClick={() => handleDeletar(nota.id)}
                    disabled={isPending}
                    className="text-[10px] flex-shrink-0 mt-0.5 disabled:opacity-40 active:opacity-60"
                    style={{ color: '#666' }}>
                    ✕
                  </button>
                </div>
                <p className="text-[9px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>{data}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
