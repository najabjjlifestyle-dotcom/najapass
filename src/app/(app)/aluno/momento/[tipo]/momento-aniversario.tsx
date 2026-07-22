'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

export default function MomentoAniversario({
  aluno, totalAulas, idadeAnos, acadNome,
}: {
  aluno: AlunoCard
  totalAulas: number
  idadeAnos: number | null
  acadNome: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between px-6 py-8 relative overflow-hidden"
      style={{ background: '#080808' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 30%, ${cor}28 0%, transparent 65%)`,
      }} />

      <div className="w-full flex items-center justify-between relative z-10 pt-safe">
        <Link href="/aluno" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Fechar
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      <div
        className="flex flex-col items-center text-center gap-6 relative z-10"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.7s ease' }}>

        <div className="text-6xl" style={{ filter: 'drop-shadow(0 0 24px rgba(200,169,110,0.4))' }}>
          🎂
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: cor === '#FFFFFF' ? '#C8A96E' : cor }}>
            Feliz aniversário
          </p>
          <p className="text-4xl font-bold" style={{ color: '#FFFFFF' }}>{nome}</p>
          {idadeAnos !== null && (
            <p className="text-sm" style={{ color: '#555' }}>{idadeAnos} anos de vida</p>
          )}
        </div>

        <div className="rounded-3xl px-10 py-6 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-5xl font-bold" style={{ color: '#C8A96E' }}>{totalAulas}</p>
          <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            aulas no tatame
          </p>
        </div>

        <p className="text-sm max-w-[220px] leading-relaxed" style={{ color: '#444' }}>
          Cada treino foi um presente que você deu a si mesmo.
        </p>
      </div>

      <div className="relative z-10 text-center space-y-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <p className="text-[8px] uppercase tracking-[0.5em]" style={{ color: '#1F1F1F' }}>
          {acadNome}
        </p>
        <p className="text-[7px] uppercase tracking-[0.4em]" style={{ color: '#161616' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
