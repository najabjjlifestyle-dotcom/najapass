'use client'

import { useState } from 'react'
import { Check, Circle } from 'lucide-react'
import { fazerCheckin, cancelarCheckin } from './actions'

export default function ConfirmarPresencaButton({ aulaId, confirmado }: { aulaId: string; confirmado: boolean }) {
  const [confirmed, setConfirmed] = useState(confirmado)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (confirmed) {
      setConfirmed(false)
      const r = await cancelarCheckin(aulaId)
      if (r?.error) setConfirmed(true)
    } else {
      setConfirmed(true)
      const r = await fazerCheckin(aulaId)
      if (r?.error) setConfirmed(false)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all disabled:opacity-50"
      style={confirmed
        ? { background: 'var(--brand-gold)', color: '#000' }
        : { border: '1.5px solid var(--brand-border-str)', color: 'var(--brand-texto-muted)' }
      }
      aria-label={confirmed ? 'Cancelar confirmação' : 'Confirmar presença'}
    >
      {loading
        ? <Circle size={18} style={{ opacity: 0.5 }} />
        : confirmed
          ? <Check size={18} strokeWidth={2.5} />
          : <Circle size={18} strokeWidth={1.5} />
      }
    </button>
  )
}
