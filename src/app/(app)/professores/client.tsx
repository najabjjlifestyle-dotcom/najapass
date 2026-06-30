'use client'

import { useState, useTransition } from 'react'
import { adicionarProfessor, removerProfessor } from './actions'

type Prof = { id: string; nome: string; email: string; user_id: string | null; faixa: string | null }

export default function ProfessoresClient({ professores, meuId }: { professores: Prof[]; meuId: string }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const fd = new FormData()
    fd.set('nome', nome)
    fd.set('email', email)
    startTransition(async () => {
      const res = await adicionarProfessor(fd)
      if (res?.error) { setError(res.error); return }
      setNome(''); setEmail('')
    })
  }

  function handleRemover(id: string) {
    startTransition(async () => {
      const res = await removerProfessor(id)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <main className="px-5 pt-5 pb-10 space-y-6">

      {/* Lista */}
      <div className="space-y-2">
        {professores.map(p => {
          const ativo = !!p.user_id
          const sou = p.id === meuId
          return (
            <div key={p.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
                  {p.nome} {sou && <span style={{ color: 'var(--brand-texto-muted)' }}>(você)</span>}
                </p>
                <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>{p.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                  style={{
                    background: ativo ? 'rgba(34,197,94,0.1)' : 'var(--brand-gold-dim)',
                    color: ativo ? '#4ade80' : 'var(--brand-gold)',
                    border: `1px solid ${ativo ? 'rgba(34,197,94,0.2)' : 'var(--brand-gold-border)'}`,
                  }}>
                  {ativo ? 'Ativo' : 'Pendente'}
                </span>
                {!sou && (
                  <button onClick={() => handleRemover(p.id)} disabled={isPending}
                    className="text-xs px-2 py-1 rounded-lg disabled:opacity-40"
                    style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                    ×
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Adicionar */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
          Adicionar professor
        </p>
        <form onSubmit={handleAdicionar} className="space-y-3">
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome"
            required className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--brand-surf-2)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" type="email"
            required className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--brand-surf-2)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }} />
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
          <button type="submit" disabled={isPending}
            className="w-full py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
            style={{ background: 'var(--brand-gold)', color: 'black' }}>
            {isPending ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
        <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
          O professor receberá acesso quando fizer login com este e-mail.
        </p>
      </div>

    </main>
  )
}
