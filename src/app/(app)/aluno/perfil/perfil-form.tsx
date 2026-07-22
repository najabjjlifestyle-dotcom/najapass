'use client'

import { useState, useTransition } from 'react'
import { updatePerfilProprio } from '../actions'

export default function PerfilForm({
  dataNascimentoAtual,
  condicoesSaudeAtual,
  diaMensalidadeAtual,
}: {
  dataNascimentoAtual: string | null
  condicoesSaudeAtual: string | null
  diaMensalidadeAtual: number | null
}) {
  const [open, setOpen] = useState(false)
  const [dataNascimento, setDataNascimento] = useState(dataNascimentoAtual ?? '')
  const [condicoesSaude, setCondicoesSaude] = useState(condicoesSaudeAtual ?? '')
  // Mensalidade é definida pelo professor — o aluno vê mas não edita.
  // Reenviamos o valor atual pra não sobrescrever com null no update.
  const [diaMensalidade] = useState(diaMensalidadeAtual?.toString() ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSalvar() {
    setError('')
    startTransition(async () => {
      const res = await updatePerfilProprio(dataNascimento, condicoesSaude, diaMensalidade)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <div className="px-4 py-4 rounded-2xl"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Informações pessoais
          </p>
          <button
            onClick={() => setOpen(true)}
            className="text-[10px] uppercase tracking-widest underline underline-offset-2 active:opacity-60"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Editar
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nascimento
            </p>
            <p className="text-sm mt-0.5" style={{ color: dataNascimentoAtual ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
              {dataNascimentoAtual
                ? new Date(dataNascimentoAtual + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Não informado'}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Saúde
            </p>
            <p className="text-sm mt-0.5" style={{ color: condicoesSaudeAtual !== null ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
              {condicoesSaudeAtual === null
                ? 'Não informado'
                : condicoesSaudeAtual || 'Nenhuma condição'}
            </p>
          </div>
          {diaMensalidadeAtual && (
            <div>
              <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                Mensalidade
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--brand-texto-sec)' }}>
                Dia {diaMensalidadeAtual}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Informações pessoais
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Data de nascimento
          </label>
          <input
            type="date"
            value={dataNascimento}
            onChange={e => setDataNascimento(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
            style={{ border: '1px solid var(--brand-border-str)', colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Condições de saúde
          </label>
          <textarea
            value={condicoesSaude}
            onChange={e => setCondicoesSaude(e.target.value)}
            placeholder="Ex: diabetes, asma, lesão no joelho. Se não tiver nenhuma, deixe em branco."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none resize-none placeholder-white/20"
            style={{ border: '1px solid var(--brand-border-str)' }}
          />
          <p className="text-[9px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Visto pelo seu professor. Ajuda a ter um treino mais seguro.
          </p>
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSalvar} disabled={isPending}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
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
