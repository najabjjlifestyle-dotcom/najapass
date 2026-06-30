'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { criarTecnica } from '../actions'

type Categoria = { id: string; nome: string }

export default function NovaForm({ categorias }: { categorias: Categoria[] }) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => criarTecnica(formData),
    null
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/tecnicas" className="text-xl" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Nova Técnica
        </h1>
      </header>

      <main className="px-5 pt-6 pb-10">
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--brand-texto-muted)' }}>
              Nome *
            </label>
            <input name="nome" required placeholder="Ex: Triângulo pela guarda fechada"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--brand-surf)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-texto)',
              }} />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--brand-texto-muted)' }}>
              Categoria
            </label>
            <select name="categoria_id"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--brand-surf)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-texto)',
              }}>
              <option value="">Sem categoria</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--brand-texto-muted)' }}>
              Descrição
            </label>
            <textarea name="descricao" rows={4} placeholder="Detalhes, pontos de atenção, variações..."
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={{
                background: 'var(--brand-surf)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-texto)',
              }} />
          </div>

          {state?.error && (
            <p className="text-sm px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending}
            className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
            style={{ background: 'var(--brand-gold)', color: 'black' }}>
            {pending ? 'Salvando...' : 'Salvar técnica'}
          </button>
        </form>
      </main>
    </div>
  )
}
