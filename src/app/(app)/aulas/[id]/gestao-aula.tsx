'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reabrirAula, apagarAula } from './actions'

export default function ZonaDePerigo({
  aulaId,
  status,
  turmaLabel,
  dataLabel,
  totalPresencas,
}: {
  aulaId: string
  status: string
  turmaLabel: string
  dataLabel: string
  totalPresencas: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmando, setConfirmando] = useState(false)

  function handleReabrir() {
    startTransition(async () => {
      const res = await reabrirAula(aulaId)
      if (!res?.error) router.refresh()
    })
  }

  function handleApagar() {
    startTransition(async () => {
      const res = await apagarAula(aulaId)
      if (!res?.error) {
        router.push('/aulas')
        router.refresh()
      }
    })
  }

  return (
    <div className="mt-8 pt-6" style={{ borderTop: '1px solid #1A0000' }}>
      <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: '#555' }}>
        Zona de perigo
      </p>
      <div className="space-y-2">
        {status === 'finalizada' && (
          <button
            onClick={handleReabrir}
            disabled={isPending}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}>
            <span className="text-base">🔓</span>
            {isPending ? 'Reabrindo...' : 'Reabrir aula'}
            <span className="ml-auto text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
              volta para em andamento
            </span>
          </button>
        )}

        {confirmando ? (
          <div className="rounded-xl p-4 space-y-3" style={{ background: '#1A0000', border: '1px solid #4A0000' }}>
            <p className="text-sm font-bold" style={{ color: '#FF4444' }}>
              ⚠️ Apagar aula permanentemente?
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#AA6666' }}>
              <strong style={{ color: '#FF8888' }}>{turmaLabel} · {dataLabel}</strong>
              {totalPresencas > 0
                ? <> — esta aula tem <strong style={{ color: '#FF8888' }}>{totalPresencas} {totalPresencas === 1 ? 'presença' : 'presenças'}</strong> registradas. Todos os dados serão apagados.</>
                : <> — nenhuma presença registrada.</>}
              {' '}Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmando(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}>
                Cancelar
              </button>
              <button
                onClick={handleApagar}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: '#7A0000', color: '#FF8888' }}>
                {isPending ? 'Apagando...' : 'Sim, apagar'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left active:scale-[0.98] transition-all"
            style={{ background: 'transparent', border: '1px solid #2A0000', color: '#FF4444' }}>
            <span className="text-base">🗑️</span>
            Apagar aula
          </button>
        )}
      </div>
    </div>
  )
}
