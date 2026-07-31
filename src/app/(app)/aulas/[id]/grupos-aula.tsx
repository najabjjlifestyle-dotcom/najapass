'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, X } from 'lucide-react'
import {
  criarGrupoAula, renomearGrupoAula, removerGrupoAula,
  atribuirAlunoAoGrupo, atribuirTecnicaAoGrupo,
} from './grupos-actions'

type Grupo = { id: string; nome: string }
type Presente = { presencaId: string; nome: string; grupoId: string | null }
type TecnicaAtr = { tecnicaId: string; nome: string; grupoId: string | null }

const selectStyle = {
  background: 'var(--brand-fundo)',
  border: '1px solid var(--brand-border-str)',
  color: 'var(--brand-texto)',
}

export default function GruposAula({
  aulaId,
  grupos,
  presentes,
  tecnicas,
}: {
  aulaId: string
  grupos: Grupo[]
  presentes: Presente[]
  tecnicas: TecnicaAtr[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [aberto, setAberto] = useState(grupos.length > 0)
  const [novoNome, setNovoNome] = useState('')
  const [erro, setErro] = useState('')

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    setErro('')
    startTransition(async () => {
      const res = await fn()
      if (res?.error) { setErro(res.error); return }
      router.refresh()
    })
  }

  function adicionarGrupo() {
    const nome = novoNome.trim()
    if (!nome) return
    setNovoNome('')
    run(() => criarGrupoAula(aulaId, nome))
  }

  // Estado recolhido — aula comum, sem divisão.
  if (!aberto && grupos.length === 0) {
    return (
      <div className="mx-5 mt-4 rounded-xl p-4"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Users size={16} style={{ color: 'var(--brand-texto-muted)' }} />
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>Grupos</p>
              <p className="text-[11px]" style={{ color: 'var(--brand-texto-muted)' }}>
                Ensinou coisas diferentes pra grupos diferentes? Divida a aula.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setAberto(true)}
            className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg active:scale-95 transition-transform"
            style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
            Dividir
          </button>
        </div>
      </div>
    )
  }

  const temGrupos = grupos.length > 0

  return (
    <div className="mx-5 mt-4 rounded-xl p-4 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <div className="flex items-center gap-2">
        <Users size={16} style={{ color: 'var(--brand-gold)' }} />
        <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>Grupos da aula</p>
      </div>

      {/* Gerenciar grupos */}
      <div className="space-y-2">
        {grupos.map(g => (
          <div key={g.id} className="flex items-center gap-2">
            <input
              defaultValue={g.nome}
              onBlur={e => { const v = e.target.value.trim(); if (v && v !== g.nome) run(() => renomearGrupoAula(aulaId, g.id, v)) }}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              disabled={isPending}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={selectStyle} />
            <button type="button" onClick={() => run(() => removerGrupoAula(aulaId, g.id))}
              disabled={isPending} className="flex-shrink-0 active:scale-90 transition-transform" aria-label="Remover grupo">
              <X size={16} style={{ color: '#FF6B6B' }} />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <input
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') adicionarGrupo() }}
            placeholder="Nome do grupo (ex: Experimentais)"
            disabled={isPending}
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={selectStyle} />
          <button type="button" onClick={adicionarGrupo} disabled={isPending || !novoNome.trim()}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform"
            style={{ background: 'var(--brand-gold)', color: '#080808' }}>
            <Plus size={13} /> Grupo
          </button>
        </div>
      </div>

      {temGrupos && (
        <>
          {/* Alunos por grupo */}
          {presentes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                Quem ficou em cada grupo
              </p>
              {presentes.map(p => (
                <div key={p.presencaId} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--brand-texto)' }}>{p.nome}</span>
                  <select
                    value={p.grupoId ?? ''}
                    disabled={isPending}
                    onChange={e => run(() => atribuirAlunoAoGrupo(aulaId, p.presencaId, e.target.value || null))}
                    className="flex-shrink-0 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={selectStyle}>
                    <option value="">Sem grupo</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Posições por grupo */}
          {tecnicas.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                Cada posição foi de qual grupo
              </p>
              {tecnicas.map(t => (
                <div key={t.tecnicaId} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--brand-texto)' }}>{t.nome}</span>
                  <select
                    value={t.grupoId ?? ''}
                    disabled={isPending}
                    onChange={e => run(() => atribuirTecnicaAoGrupo(aulaId, t.tecnicaId, e.target.value || null))}
                    className="flex-shrink-0 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={selectStyle}>
                    <option value="">Todos</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
            Posição em <strong style={{ color: 'var(--brand-texto)' }}>Todos</strong> conta pra todo mundo. Cada aluno só recebe as do grupo dele + as de Todos.
          </p>
        </>
      )}

      {erro && <p className="text-[11px]" style={{ color: '#f87171' }}>{erro}</p>}
    </div>
  )
}
