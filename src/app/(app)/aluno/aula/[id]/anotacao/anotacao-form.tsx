'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarAnotacao, deletarAnotacao } from '@/app/(app)/aluno/actions'

export default function AnotacaoForm({
  aulaId,
  textoAtual,
}: {
  aulaId: string
  textoAtual: string
}) {
  const router = useRouter()
  const [texto, setTexto] = useState(textoAtual)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSalvar() {
    setSaved(false)
    startTransition(async () => {
      const res = await salvarAnotacao(aulaId, texto)
      if (!res?.error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  function handleDeletar() {
    startTransition(async () => {
      await deletarAnotacao(aulaId)
      router.push('/aluno/historico')
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
          Suas anotações (privadas — só você vê)
        </p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder={`O que você aprendeu hoje?\n\nEx: Aprendi o Kimura da guarda. Ainda erro a pegada do pulso. Ombro esquerdo doeu no final — cuidar amanhã.`}
          maxLength={2000}
          rows={10}
          className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
          style={{
            background: 'var(--brand-surf)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-texto)',
          }}
        />
        <p className="text-right text-[10px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
          {texto.length}/2000
        </p>
      </div>

      <button
        onClick={handleSalvar}
        disabled={isPending || !texto.trim()}
        className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-40"
        style={{ background: saved ? '#16A34A' : 'var(--brand-gold)', color: '#000' }}>
        {isPending ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar anotação'}
      </button>

      {textoAtual && (
        <button
          onClick={handleDeletar}
          disabled={isPending}
          className="w-full py-3 rounded-2xl text-xs uppercase tracking-widest"
          style={{ border: '1px solid var(--brand-border)', color: '#555' }}>
          Apagar anotação
        </button>
      )}
    </div>
  )
}
