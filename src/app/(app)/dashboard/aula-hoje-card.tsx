'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { abrirAulaAgendada } from '@/app/(app)/aulas/actions'

type AulaHoje = {
  id: string
  status: 'agendada' | 'aberta' | 'finalizada'
  hora_inicio: string | null
  turma_nome: string | null
  tecnicas: { nome: string; reforco: boolean }[]
  presentes: number
}

export default function AulaHojeCard({ aula }: { aula: AulaHoje }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const hora = aula.hora_inicio?.substring(0, 5) ?? ''

  async function handleIniciar() {
    setLoading(true)
    await abrirAulaAgendada(aula.id)
    router.refresh()
  }

  if (aula.status === 'finalizada') {
    return (
      <Link href={`/aulas/${aula.id}`}
        className="flex items-center justify-between rounded-2xl px-4 py-3 opacity-60 active:scale-[0.98] transition-transform"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0"
            style={{ color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
            Finalizada
          </span>
          <p className="text-xs truncate" style={{ color: 'var(--brand-texto-muted)' }}>
            {aula.turma_nome ?? 'Aula avulsa'} · {hora} · {aula.presentes} presente{aula.presentes !== 1 ? 's' : ''}
          </p>
        </div>
      </Link>
    )
  }

  if (aula.status === 'aberta') {
    return (
      <Link href={`/aulas/${aula.id}`}
        className="block rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform"
        style={{ background: 'var(--brand-surf)', border: '1px solid rgba(74,222,128,0.35)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#4ADE80' }} />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: 'var(--brand-texto)' }}>
                {aula.turma_nome ?? 'Aula avulsa'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                Ao vivo · {hora} · {aula.presentes} presente{aula.presentes !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0" style={{ color: '#4ADE80' }}>
            Acessar →
          </span>
        </div>
      </Link>
    )
  }

  // agendada (pendente ou futura)
  const semTecnica = aula.tecnicas.length === 0

  return (
    <div className="rounded-2xl px-4 py-3.5"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
            {aula.turma_nome ?? 'Aula avulsa'}
          </p>
          <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>{hora}</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0"
          style={{ color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
          Pendente
        </span>
      </div>

      {semTecnica ? (
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg"
          style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.25)' }}>
          ⚠ Sem técnica planejada
        </span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {aula.tecnicas.map((t, i) => (
            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={t.reforco
                ? { background: 'rgba(251,146,60,0.1)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.25)' }
                : { background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }
              }>
              {t.reforco ? '↺ ' : ''}{t.nome}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={handleIniciar} disabled={loading}
          className="flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {loading ? 'Iniciando...' : 'Iniciar aula'}
        </button>
        <Link href={`/aulas/${aula.id}`}
          className="flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-center transition-transform active:scale-[0.98]"
          style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto-muted)' }}>
          Editar plano
        </Link>
      </div>
    </div>
  )
}
