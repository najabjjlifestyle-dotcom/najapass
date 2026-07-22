'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}
type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div className="flex items-stretch h-14 rounded-2xl overflow-hidden w-full"
      style={{ background: cor }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[5px] px-5"
        style={{ background: rankCor, minWidth: 96 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[5px] h-7 rounded-sm"
            style={{ background: i < grau ? '#FFF' : 'rgba(255,255,255,0.15)' }} />
        ))}
      </div>
      <div style={{ width: 18, background: cor }} />
    </div>
  )
}

export default function MomentoGraduacao({
  aluno, aulasNaFaixa, totalAulas, dataGraduacao, acadNome,
}: {
  aluno: AlunoCard
  aulasNaFaixa: number
  totalAulas: number
  dataGraduacao: string | null
  acadNome: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]
  const textoCor = cor === '#FFFFFF' ? '#C8A96E' : cor

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 gap-8 relative overflow-hidden"
      style={{ background: '#080808' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 20%, ${cor}2A 0%, transparent 65%)`,
      }} />

      <div className="flex items-center justify-between relative z-10 pt-safe">
        <Link href="/aluno/perfil" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Perfil
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      <div
        className="relative z-10 space-y-1"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: 'all 0.5s ease' }}>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: textoCor }}>
          {acadNome}
        </p>
        <p className="text-3xl font-bold" style={{ color: '#FFF' }}>{nome}</p>
        {dataGraduacao && (
          <p className="text-xs" style={{ color: '#444' }}>Graduado em {dataGraduacao}</p>
        )}
      </div>

      <div
        className="relative z-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.15s',
        }}>
        <BeltBar faixa={aluno.faixa} grau={aluno.grau} />
      </div>

      <p
        className="relative z-10 text-4xl font-bold capitalize text-center"
        style={{ color: '#FFF', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.3s' }}>
        Faixa {aluno.faixa}
        {aluno.grau > 0 && (
          <span className="text-2xl ml-3" style={{ color: '#444' }}>· {aluno.grau}º grau</span>
        )}
      </p>

      <div
        className="relative z-10 grid grid-cols-2 gap-3"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.35s' }}>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{aulasNaFaixa}</p>
          <p className="text-[7px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            aulas nesta faixa
          </p>
        </div>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{totalAulas}</p>
          <p className="text-[7px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            total de treinos
          </p>
        </div>
      </div>

      <div className="relative z-10 text-center mt-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <p className="text-[7px] uppercase tracking-[0.5em]" style={{ color: '#161616' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
