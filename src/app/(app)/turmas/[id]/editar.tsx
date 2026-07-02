'use client'

import { useState, useTransition } from 'react'
import { updateTurma } from './actions'

const DIAS = [
  { value: 'segunda', label: 'Seg' },
  { value: 'terca', label: 'Ter' },
  { value: 'quarta', label: 'Qua' },
  { value: 'quinta', label: 'Qui' },
  { value: 'sexta', label: 'Sex' },
  { value: 'sabado', label: 'Sáb' },
  { value: 'domingo', label: 'Dom' },
]

export default function EditarTurmaForm({
  turmaId, nomeAtual, diasAtuais, horarioAtual,
}: {
  turmaId: string
  nomeAtual: string
  diasAtuais: string[]
  horarioAtual: string | null
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(nomeAtual)
  const [dias, setDias] = useState<string[]>(diasAtuais)
  const [horario, setHorario] = useState(horarioAtual?.substring(0, 5) ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function toggleDia(dia: string) {
    setDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia])
  }

  function handleSalvar() {
    setError('')
    startTransition(async () => {
      const res = await updateTurma(turmaId, nome, dias, horario)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs uppercase tracking-widest underline underline-offset-2"
        style={{ color: 'var(--brand-texto-muted)' }}>
        Editar turma
      </button>
    )
  }

  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
        Editar turma
      </p>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Nome</label>
        <input value={nome} onChange={e => setNome(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
          style={{ border: '1px solid var(--brand-border-str)' }} />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Dias da semana</label>
        <div className="flex gap-2 flex-wrap">
          {DIAS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => toggleDia(value)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                background: dias.includes(value) ? 'var(--brand-gold)' : 'transparent',
                color: dias.includes(value) ? 'black' : 'var(--brand-texto-muted)',
                border: `1px solid ${dias.includes(value) ? 'var(--brand-gold)' : 'var(--brand-border-str)'}`,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Horário</label>
        <input value={horario} onChange={e => setHorario(e.target.value)} type="time"
          className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
          style={{ border: '1px solid var(--brand-border-str)' }} />
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
