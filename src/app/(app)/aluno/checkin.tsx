'use client'

import { useState } from 'react'
import { fazerCheckin, cancelarCheckin } from './actions'

type Aula = { id: string; turma_nome: string | null; tema: string | null }

export default function CheckinCard({
  aula,
  jaFezCheckin,
}: {
  aula: Aula
  jaFezCheckin: boolean
}) {
  const [checked, setChecked] = useState(jaFezCheckin)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (checked) {
      setChecked(false)
      const result = await cancelarCheckin(aula.id)
      if (result?.error) setChecked(true)
    } else {
      setChecked(true)
      const result = await fazerCheckin(aula.id)
      if (result?.error) setChecked(false)
    }
    setLoading(false)
  }

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      checked ? 'bg-white border-white' : 'bg-white/5 border-white/20'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs uppercase tracking-widest mb-1 ${checked ? 'text-black/50' : 'text-white/40'}`}
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Aula ao vivo
          </p>
          <p className={`font-bold uppercase tracking-wider text-lg ${checked ? 'text-black' : 'text-white'}`}
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {aula.turma_nome ?? 'Aula Avulsa'}
          </p>
          {aula.tema && (
            <p className={`text-sm italic mt-0.5 ${checked ? 'text-black/60' : 'text-white/50'}`}>
              "{aula.tema}"
            </p>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all disabled:opacity-50 ${
            checked
              ? 'bg-black text-white'
              : 'border-2 border-white/30 text-white/30 hover:border-white hover:text-white'
          }`}>
          {loading ? '⟳' : checked ? '✓' : '○'}
        </button>
      </div>
      {checked && (
        <p className="text-black/50 text-xs mt-3 uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          Check-in confirmado · toque para cancelar
        </p>
      )}
    </div>
  )
}
