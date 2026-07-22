'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAluno, inativarAluno, reativarAluno } from './actions'

export default function EditarAlunoForm({
  alunoId, nomeAtual, emailAtual, telefoneAtual, ativo,
  dataNascimentoAtual, condicoesSaudeAtual, diaMensalidadeAtual,
}: {
  alunoId: string
  nomeAtual: string
  emailAtual: string | null
  telefoneAtual: string | null
  ativo: boolean
  dataNascimentoAtual: string | null
  condicoesSaudeAtual: string | null
  diaMensalidadeAtual: number | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(nomeAtual)
  const [email, setEmail] = useState(emailAtual ?? '')
  const [telefone, setTelefone] = useState(telefoneAtual ?? '')
  const [dataNascimento, setDataNascimento] = useState(dataNascimentoAtual ?? '')
  const [condicoesSaude, setCondicoesSaude] = useState(condicoesSaudeAtual ?? '')
  const [diaMensalidade, setDiaMensalidade] = useState(diaMensalidadeAtual?.toString() ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [togglingAtivo, setTogglingAtivo] = useState(false)

  function handleSalvar() {
    setError('')
    startTransition(async () => {
      const res = await updateAluno(alunoId, nome, email, telefone, dataNascimento, condicoesSaude, diaMensalidade)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  async function handleToggleAtivo() {
    if (ativo && !confirm('Inativar este aluno? Ele some das listas e turmas, mas o histórico é preservado.')) return
    setTogglingAtivo(true)
    const res = ativo ? await inativarAluno(alunoId) : await reativarAluno(alunoId)
    setTogglingAtivo(false)
    if (!res?.error) router.refresh()
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-widest"
          style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto)', background: 'var(--brand-surf)' }}>
          Editar dados
        </button>
        <button
          onClick={handleToggleAtivo}
          disabled={togglingAtivo}
          className="px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
          style={{
            border: `1px solid ${ativo ? 'rgba(248,113,113,0.35)' : 'var(--brand-gold-border)'}`,
            color: ativo ? '#f87171' : 'var(--brand-gold)',
            background: 'transparent',
          }}>
          {ativo ? 'Inativar' : 'Reativar'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Editar dados
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
            style={{ border: '1px solid var(--brand-border-str)' }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>E-mail</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email"
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
            style={{ border: '1px solid var(--brand-border-str)' }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Telefone</label>
          <input value={telefone} onChange={e => setTelefone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
            style={{ border: '1px solid var(--brand-border-str)' }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Data de nascimento</label>
          <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
            style={{ border: '1px solid var(--brand-border-str)', colorScheme: 'dark' }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Condições de saúde</label>
          <textarea value={condicoesSaude} onChange={e => setCondicoesSaude(e.target.value)}
            placeholder="Ex: diabetes tipo 1, lesão no joelho. Sem condições, deixe em branco."
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none resize-none placeholder-white/20"
            style={{ border: '1px solid var(--brand-border-str)' }} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Dia da mensalidade</label>
          <input type="number" min={1} max={31} value={diaMensalidade} onChange={e => setDiaMensalidade(e.target.value)}
            placeholder="Ex: 10"
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
            style={{ border: '1px solid var(--brand-border-str)' }} />
          <p className="text-[9px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Dia do mês em que a mensalidade vence. Visual only.
          </p>
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSalvar} disabled={isPending}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
          style={{ background: 'var(--brand-gold)', color: 'black' }}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
