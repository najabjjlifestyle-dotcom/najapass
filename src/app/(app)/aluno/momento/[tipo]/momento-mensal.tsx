'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}
type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

export default function MomentoMensal({
  aluno, aulasNoMes, totalAulas, mesNome, acadNome,
}: {
  aluno: AlunoCard
  aulasNoMes: number
  totalAulas: number
  mesNome: string
  acadNome: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]

  const frase =
    aulasNoMes === 0 ? 'O tatame está esperando por você.' :
    aulasNoMes === 1 ? 'Um começo. Continue.' :
    aulasNoMes <= 4 ? 'Construindo o hábito, treino a treino.' :
    aulasNoMes <= 8 ? 'Mês consistente. Isso que conta.' :
    aulasNoMes <= 12 ? 'Frequência de elite.' :
    'Você é imparável.'

  const pct = Math.min(100, Math.round((aulasNoMes / 12) * 100))

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-6 py-8 relative overflow-hidden"
      style={{ background: '#080808' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 50%, ${cor}16 0%, transparent 65%)`,
      }} />

      <div className="w-full flex items-center justify-between relative z-10 pt-safe">
        <Link href="/aluno" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Fechar
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      <div
        className="flex flex-col items-center text-center gap-8 relative z-10 w-full"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease' }}>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#444' }}>
            {mesNome} · {nome}
          </p>
          <p className="text-5xl font-bold" style={{ color: '#C8A96E' }}>{aulasNoMes}</p>
          <p className="text-sm" style={{ color: '#555' }}>
            {aulasNoMes === 1 ? 'treino' : 'treinos'} no mês
          </p>
        </div>

        <div className="w-full space-y-2">
          <div className="flex justify-between text-[9px] uppercase tracking-widest"
            style={{ color: '#333' }}>
            <span>0</span>
            <span>meta: 12 treinos</span>
            <span>12+</span>
          </div>
          <div style={{ height: 4, background: '#1A1A1A', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: visible ? `${pct}%` : '0%', height: '100%',
              background: pct >= 100 ? '#4ADE80' : '#C8A96E',
              borderRadius: 4,
              transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1) 0.2s',
            }} />
          </div>
        </div>

        <div className="rounded-2xl px-8 py-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-3xl font-bold" style={{ color: '#555' }}>{totalAulas}</p>
          <p className="text-[8px] uppercase tracking-widest mt-1.5" style={{ color: '#333' }}>
            total de treinos na academia
          </p>
        </div>

        <p className="text-sm max-w-[220px]" style={{ color: '#444' }}>{frase}</p>
      </div>

      <div className="relative z-10 text-center space-y-1" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <p className="text-[8px] uppercase tracking-[0.5em]" style={{ color: '#1F1F1F' }}>{acadNome}</p>
        <p className="text-[7px] uppercase tracking-[0.4em]" style={{ color: '#161616' }}>najapass.com.br</p>
      </div>
    </div>
  )
}
