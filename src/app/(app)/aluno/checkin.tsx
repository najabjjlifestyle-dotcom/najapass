'use client'

import { useState } from 'react'
import { fazerCheckin, cancelarCheckin } from './actions'

type Confirmado = { nome: string; visitante: boolean }

type Aula = {
  id: string
  turma_nome: string | null
  tema: string | null
  video_url: string | null
  confirmados: Confirmado[]
  planejadas: string[]
}

export default function CheckinCard({
  aula,
  jaFezCheckin,
}: {
  aula: Aula
  jaFezCheckin: boolean
}) {
  const [checked, setChecked] = useState(jaFezCheckin)
  const [loading, setLoading] = useState(false)
  const [showQuemVai, setShowQuemVai] = useState(false)

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
          {aula.video_url && (
            <a href={aula.video_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className={`inline-flex items-center gap-1 text-xs mt-1 underline underline-offset-2 ${checked ? 'text-black/60' : 'text-white/50'}`}>
              ▶ Link de estudo
            </a>
          )}
          {aula.planejadas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {aula.planejadas.map((p, i) => (
                <span key={i}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                    checked ? 'bg-black/10 text-black/70' : 'bg-white/10 text-white/60'
                  }`}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all disabled:opacity-50 flex-shrink-0 ${
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

      <button
        onClick={() => setShowQuemVai(v => !v)}
        className={`text-xs mt-3 uppercase tracking-widest underline underline-offset-2 ${checked ? 'text-black/50' : 'text-white/40'}`}
        style={{ fontFamily: 'var(--font-oswald)' }}>
        {aula.confirmados.length} confirmado{aula.confirmados.length !== 1 ? 's' : ''} · ver quem vai
      </button>

      {showQuemVai && (
        <div className="mt-2 space-y-1">
          {aula.confirmados.length === 0 ? (
            <p className={`text-xs ${checked ? 'text-black/40' : 'text-white/30'}`}>Ninguém confirmou ainda.</p>
          ) : (
            aula.confirmados.map((c, i) => (
              <p key={i} className={`text-xs ${checked ? 'text-black/60' : 'text-white/50'}`}>
                {c.nome}{c.visitante ? ' (visitante)' : ''}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  )
}
