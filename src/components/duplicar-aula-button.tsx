'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy } from 'lucide-react'
import { duplicarAula } from '@/app/(app)/aulas/actions'

export default function DuplicarAulaButton({
  aulaId,
  turmas,
}: {
  aulaId: string
  turmas: { id: string; nome: string }[]
}) {
  const [aberto, setAberto] = useState(false)
  const [turmaId, setTurmaId] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDuplicar() {
    setError('')
    const fd = new FormData()
    fd.set('aula_origem_id', aulaId)
    fd.set('turma_id', turmaId)
    fd.set('data', data)
    fd.set('hora_inicio', hora)

    startTransition(async () => {
      const result = await duplicarAula(fd)
      if (result?.error) {
        setError(result.error)
      } else if (result?.id) {
        setAberto(false)
        router.push(`/aulas/${result.id}`)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Duplicar aula"
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-[0.95] transition-transform"
        style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
        <Copy size={16} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setAberto(false) }}>
          <div className="rounded-t-2xl p-5 pb-safe space-y-4"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <h2 className="font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--brand-texto)' }}>
              Duplicar aula
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                Turma
              </label>
              <select value={turmaId} onChange={e => setTurmaId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}>
                <option value="" className="bg-black">Mesma turma (ou avulsa)</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  Data
                </label>
                <input type="date" value={data} onChange={e => setData(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  Hora
                </label>
                <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }} />
              </div>
            </div>

            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

            <button
              onClick={handleDuplicar}
              disabled={!data || isPending}
              className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-gold)', color: '#000' }}>
              {isPending ? 'Duplicando...' : 'Duplicar aula'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
