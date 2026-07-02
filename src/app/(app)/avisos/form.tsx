'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { criarAviso } from './actions'

type Turma = { id: string; nome: string }

export default function NovoAvisoForm({ turmas }: { turmas: Turma[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await criarAviso(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      formRef.current?.reset()
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 rounded-2xl p-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <input name="titulo" type="text" required placeholder="Título"
        className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
        style={{ border: '1px solid var(--brand-border-str)' }} />
      <textarea name="corpo" required placeholder="Texto do aviso" rows={3}
        className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white placeholder-white/30 focus:outline-none resize-none"
        style={{ border: '1px solid var(--brand-border-str)' }} />
      <select name="turma_id" defaultValue=""
        className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
        style={{ border: '1px solid var(--brand-border-str)' }}>
        <option value="" className="bg-black">Toda a academia</option>
        {turmas.map(t => (
          <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
        ))}
      </select>

      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
        style={{ background: 'var(--brand-gold)', color: 'black' }}>
        {loading ? 'Publicando...' : 'Publicar aviso'}
      </button>
    </form>
  )
}
