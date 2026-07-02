'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { arquivarAviso } from './actions'

export function ArquivarAvisoButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await arquivarAviso(id); router.refresh() })}
      disabled={pending}
      className="text-xs uppercase tracking-widest underline underline-offset-2 disabled:opacity-40"
      style={{ color: 'var(--brand-texto-muted)' }}>
      {pending ? 'Arquivando...' : 'Arquivar'}
    </button>
  )
}
