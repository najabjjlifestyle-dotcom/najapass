'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { editarTecnica, renomearTecnica, removerRenomeTecnica, duplicarTecnica } from '../actions'

type Categoria = { id: string; nome: string }

const FAIXAS = [
  { id: 'branca', label: 'Branca' },
  { id: 'azul', label: 'Azul' },
  { id: 'roxa', label: 'Roxa' },
  { id: 'marrom', label: 'Marrom' },
  { id: 'preta', label: 'Preta' },
]

const inputStyle = {
  background: 'var(--brand-fundo)',
  border: '1px solid var(--brand-border-str)',
  color: 'var(--brand-texto)',
}

export default function TecnicaEditor({
  tecnicaId,
  global,
  nomeExibido,
  temCustom,
  categoriaIdAtual,
  faixasAtuais,
  categorias,
}: {
  tecnicaId: string
  global: boolean
  nomeExibido: string
  temCustom: boolean
  categoriaIdAtual: string | null
  faixasAtuais: string[]
  categorias: Categoria[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)

  // ── Técnica da academia: form de edição ──
  const [nome, setNome] = useState(nomeExibido)
  const [categoriaId, setCategoriaId] = useState(categoriaIdAtual ?? '')
  const [faixas, setFaixas] = useState<string[]>(faixasAtuais)

  function toggleFaixa(id: string) {
    setFaixas(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  function salvarEdicao() {
    setErro(''); setOk(false)
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return }
    const fd = new FormData()
    fd.set('nome', nome.trim())
    if (categoriaId) fd.set('categoria_id', categoriaId)
    faixas.forEach(f => fd.append('faixas[]', f))
    startTransition(async () => {
      const res = await editarTecnica(tecnicaId, fd)
      if (res?.error) { setErro(res.error); return }
      setOk(true)
      router.refresh()
    })
  }

  // ── Técnica global: renomear + duplicar (override da academia) ──
  const [renomeando, setRenomeando] = useState(false)
  const [nomeCustom, setNomeCustom] = useState(nomeExibido)
  const [duplicando, setDuplicando] = useState(false)
  const [nomeVariacao, setNomeVariacao] = useState('')

  function run(fn: () => Promise<{ error?: string } | undefined>, onOk?: () => void) {
    setErro('')
    startTransition(async () => {
      const res = await fn()
      if (res?.error) { setErro(res.error); return }
      onOk?.()
      router.refresh()
    })
  }

  if (global) {
    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          Posição do currículo
        </p>
        <p className="text-[11px]" style={{ color: 'var(--brand-texto-muted)' }}>
          É uma sugestão global. Você não edita direto, mas pode renomear pra sua academia ou criar uma variação própria.
        </p>

        {renomeando ? (
          <div className="flex items-center gap-2">
            <input autoFocus value={nomeCustom} onChange={e => setNomeCustom(e.target.value)}
              disabled={isPending} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            <button onClick={() => run(() => renomearTecnica(tecnicaId, nomeCustom.trim()), () => setRenomeando(false))}
              disabled={isPending || !nomeCustom.trim()} className="active:scale-90 transition-transform" aria-label="Salvar">
              <Check size={18} style={{ color: 'var(--brand-gold)' }} />
            </button>
            <button onClick={() => setRenomeando(false)} className="active:scale-90 transition-transform" aria-label="Cancelar">
              <X size={18} style={{ color: 'var(--brand-texto-muted)' }} />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setNomeCustom(nomeExibido); setRenomeando(true) }}
              className="px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
              style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
              Renomear para esta academia
            </button>
            {temCustom && (
              <button onClick={() => run(() => removerRenomeTecnica(tecnicaId))} disabled={isPending}
                className="px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                style={{ border: '1px solid var(--brand-border)', color: '#FF6B6B' }}>
                Restaurar nome original
              </button>
            )}
            <button onClick={() => { setNomeVariacao(`${nomeExibido} (variação)`); setDuplicando(true) }}
              className="px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform"
              style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}>
              Criar variação
            </button>
          </div>
        )}

        {duplicando && (
          <div className="flex items-center gap-2">
            <input autoFocus value={nomeVariacao} onChange={e => setNomeVariacao(e.target.value)}
              placeholder="Nome da variação" disabled={isPending}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            <button onClick={() => run(() => duplicarTecnica(tecnicaId, nomeVariacao.trim()), () => setDuplicando(false))}
              disabled={isPending || !nomeVariacao.trim()}
              className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform"
              style={{ background: 'var(--brand-gold)', color: '#080808' }}>
              Criar
            </button>
            <button onClick={() => setDuplicando(false)} className="active:scale-90 transition-transform" aria-label="Cancelar">
              <X size={18} style={{ color: 'var(--brand-texto-muted)' }} />
            </button>
          </div>
        )}

        {erro && <p className="text-[11px]" style={{ color: '#f87171' }}>{erro}</p>}
      </div>
    )
  }

  // Técnica da academia — form de edição
  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Editar posição
      </p>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>Nome</label>
        <input value={nome} onChange={e => setNome(e.target.value)} disabled={isPending}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>Categoria</label>
        <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} disabled={isPending}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle}>
          <option value="">Sem categoria</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
          Faixas <span className="normal-case">(vazio = todas)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FAIXAS.map(f => {
            const sel = faixas.includes(f.id)
            return (
              <button key={f.id} type="button" onClick={() => toggleFaixa(f.id)} disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                style={sel
                  ? { background: 'var(--brand-gold)', color: '#080808' }
                  : { border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {erro && <p className="text-[11px]" style={{ color: '#f87171' }}>{erro}</p>}
      {ok && <p className="text-[11px]" style={{ color: '#4ADE80' }}>Salvo.</p>}

      <button onClick={salvarEdicao} disabled={isPending}
        className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-transform"
        style={{ background: 'var(--brand-gold)', color: '#080808' }}>
        {isPending ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </div>
  )
}
