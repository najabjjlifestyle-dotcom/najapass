'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}
type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

export default function MomentoAnual({
  aluno, anosNaAcademia, aulasAno, totalAulas, tecnicaFavorita, acadNome, dataEntrada,
}: {
  aluno: AlunoCard
  anosNaAcademia: number
  aulasAno: number
  totalAulas: number
  tecnicaFavorita: string | null
  acadNome: string
  dataEntrada: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]

  const frase =
    aulasAno >= 150 ? 'Você é uma máquina de treino.' :
    aulasAno >= 80 ? 'Consistência que poucos têm.' :
    aulasAno >= 40 ? 'Um ano sólido no tatame.' :
    aulasAno >= 15 ? 'Cada treino conta.' :
    'A jornada continua.'

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 gap-6 relative overflow-hidden"
      style={{ background: '#080808' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${cor}22 0%, transparent 60%)`,
      }} />

      <div className="flex items-center justify-between relative z-10 pt-safe">
        <Link href="/aluno" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Fechar
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      <div
        className="relative z-10 space-y-1"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.5s ease' }}>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: cor === '#FFFFFF' ? '#C8A96E' : cor }}>
          {anosNaAcademia} {anosNaAcademia === 1 ? 'ano' : 'anos'} no tatame · {acadNome}
        </p>
        <p className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
          Seu ano, {nome}.
        </p>
        <p className="text-sm" style={{ color: '#444' }}>Desde {dataEntrada}</p>
      </div>

      <div
        className="grid grid-cols-2 gap-3 relative z-10"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.15s' }}>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{aulasAno}</p>
          <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            treinos no último ano
          </p>
        </div>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{totalAulas}</p>
          <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            total na academia
          </p>
        </div>
      </div>

      {tecnicaFavorita && (
        <div
          className="relative z-10 rounded-2xl px-5 py-4"
          style={{
            background: `${cor}14`,
            border: `1px solid ${cor}30`,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease 0.25s',
          }}>
          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>
            Técnica mais treinada
          </p>
          <p className="font-bold" style={{ color: '#FFFFFF' }}>{tecnicaFavorita}</p>
        </div>
      )}

      <div
        className="relative z-10 rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.3s',
        }}>
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>Faixa atual</p>
          <p className="font-bold capitalize" style={{ color: '#FFFFFF' }}>{aluno.faixa}</p>
        </div>
        <div className="w-12 h-8 rounded-lg" style={{ background: cor, border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>

      <p
        className="relative z-10 text-center text-sm"
        style={{ color: '#333', opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.4s' }}>
        {frase}
      </p>

      <div className="relative z-10 text-center mt-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <p className="text-[7px] uppercase tracking-[0.5em]" style={{ color: '#161616' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
