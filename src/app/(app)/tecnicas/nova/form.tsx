'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { criarTecnica, criarTema } from '../actions'

type Categoria = { id: string; nome: string }

const FAIXAS = [
  { id: 'branca', label: 'Branca', bg: '#FFFFFF', text: '#000000' },
  { id: 'cinza', label: 'Cinza', bg: '#9CA3AF', text: '#000000' },
  { id: 'amarela', label: 'Amarela', bg: '#FBBF24', text: '#000000' },
  { id: 'laranja', label: 'Laranja', bg: '#F97316', text: '#000000' },
  { id: 'verde', label: 'Verde', bg: '#16A34A', text: '#FFFFFF' },
  { id: 'azul', label: 'Azul', bg: '#2563EB', text: '#FFFFFF' },
  { id: 'roxa', label: 'Roxa', bg: '#7C3AED', text: '#FFFFFF' },
  { id: 'marrom', label: 'Marrom', bg: '#92400E', text: '#FFFFFF' },
  { id: 'preta', label: 'Preta', bg: '#111111', text: '#FFFFFF' },
]

export default function NovaForm({ categorias }: { categorias: Categoria[] }) {
  const [faixas, setFaixas] = useState<string[]>([])
  const [categoriasList, setCategoriasList] = useState<Categoria[]>(categorias)
  const [categoriaId, setCategoriaId] = useState('')
  const [showNovoTema, setShowNovoTema] = useState(false)
  const [novoTemaNome, setNovoTemaNome] = useState('')
  const [criandoTema, setCriandoTema] = useState(false)
  const [temaError, setTemaError] = useState('')
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      faixas.forEach(f => formData.append('faixas[]', f))
      return criarTecnica(formData)
    },
    null
  )

  function toggleFaixa(id: string) {
    setFaixas(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  async function handleCriarTema() {
    const nome = novoTemaNome.trim()
    if (!nome) return
    setCriandoTema(true)
    setTemaError('')
    const result = await criarTema(nome)
    setCriandoTema(false)

    if (result?.error) { setTemaError(result.error); return }
    if (result?.tema) {
      setCategoriasList(prev => [...prev, result.tema!].sort((a, b) => a.nome.localeCompare(b.nome)))
      setCategoriaId(result.tema.id)
    }
    setNovoTemaNome('')
    setShowNovoTema(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/tecnicas" className="text-xl" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Nova Posição
        </h1>
      </header>

      <main className="px-5 pt-6 pb-10">
        <form action={action} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--brand-texto-muted)' }}>
              Nome *
            </label>
            <input name="nome" required placeholder="Ex: Raspagem da Meia - Faxinha"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--brand-surf)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-texto)',
              }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--brand-texto-muted)' }}>
                Tema
              </label>
              <button type="button" onClick={() => setShowNovoTema(v => !v)}
                className="text-[10px] uppercase tracking-widest underline underline-offset-2"
                style={{ color: 'var(--brand-texto-muted)' }}>
                + Novo tema
              </button>
            </div>
            <select name="categoria_id" value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--brand-surf)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-texto)',
              }}>
              <option value="">Sem tema</option>
              {categoriasList.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            {showNovoTema && (
              <div className="flex gap-2 mt-2">
                <input type="text" value={novoTemaNome} onChange={e => setNovoTemaNome(e.target.value)}
                  placeholder="Nome do tema" autoFocus
                  className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
                <button type="button" onClick={handleCriarTema}
                  disabled={criandoTema || !novoTemaNome.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-40"
                  style={{ background: 'var(--brand-gold)', color: 'black' }}>
                  {criandoTema ? '...' : 'Criar'}
                </button>
              </div>
            )}
            {temaError && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{temaError}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--brand-texto-muted)' }}>
              Para quais faixas? <span className="normal-case font-normal">(deixe vazio = todas)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FAIXAS.map(f => {
                const selecionada = faixas.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFaixa(f.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: selecionada ? f.bg : 'var(--brand-surf)',
                      color: selecionada ? f.text : 'var(--brand-texto-muted)',
                      border: selecionada ? `2px solid ${f.bg}` : '1px solid var(--brand-border)',
                      opacity: selecionada ? 1 : 0.6,
                    }}>
                    {f.label}
                  </button>
                )
              })}
            </div>
            {faixas.length === 0 && (
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                Todas as faixas verão esta posição
              </p>
            )}
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
            {pending ? 'Salvando...' : 'Salvar posição'}
          </button>
        </form>
      </main>
    </div>
  )
}
