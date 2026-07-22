'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissCelebracao } from '@/app/(app)/aluno/actions'
import type { AlunoBasico } from '@/lib/aluno-auth'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFFFFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div
      className="flex items-stretch h-14 rounded-xl overflow-hidden"
      style={{ background: cor, border: '2px solid rgba(255,255,255,0.18)' }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[5px] px-4" style={{ background: rankCor, minWidth: 100 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[5px] h-7 rounded-sm"
            style={{ background: i < grau ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>
      <div style={{ width: 20, background: cor }} />
    </div>
  )
}

export default function CelebracaoScreen({
  aluno,
  totalAulas,
  topTecnicas,
}: {
  aluno: AlunoBasico
  totalAulas: number
  topTecnicas: string[]
}) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  function handleDismiss() {
    startTransition(async () => {
      await dismissCelebracao()
      router.replace('/aluno')
    })
  }

  const cor = FAIXA_HEX[aluno.faixa] ?? '#FFFFFF'
  const dataGrad = aluno.graduado_em
    ? new Date(aluno.graduado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between px-6 py-12"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${cor}22 0%, var(--brand-fundo) 70%)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>

      {/* Topo — emoji + parabéns */}
      <div className="text-center pt-safe">
        <p className="text-5xl mb-4">🎊</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: FAIXA_HEX[aluno.faixa] === '#FFFFFF' ? 'var(--brand-gold)' : cor }}>
          Parabéns, {aluno.nome.split(' ')[0]}
        </p>
        <h1 className="text-2xl font-bold mt-2 leading-tight" style={{ color: 'var(--brand-texto)' }}>
          Você foi graduado!
        </h1>
        {dataGrad && (
          <p className="text-xs mt-1 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            {dataGrad}
          </p>
        )}
      </div>

      {/* Centro — faixa + stats */}
      <div className="w-full space-y-5">

        {/* Belt bar */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: 'var(--brand-surf)',
            border: `1px solid ${cor}55`,
            transform: visible ? 'scale(1)' : 'scale(0.92)',
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
          }}>
          <BeltBar faixa={aluno.faixa} grau={aluno.grau} />
          <p className="text-center text-lg font-bold capitalize" style={{ color: 'var(--brand-texto)' }}>
            Faixa {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl py-4 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-3xl font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>
              {totalAulas}
            </p>
            <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
              aulas na jornada
            </p>
          </div>
          <div className="rounded-2xl py-4 px-3 text-center flex flex-col justify-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            {topTecnicas.length > 0 ? (
              <>
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  Suas técnicas
                </p>
                {topTecnicas.map((t, i) => (
                  <p key={i} className="text-[11px] font-bold leading-snug" style={{ color: 'var(--brand-gold)' }}>
                    {t}
                  </p>
                ))}
              </>
            ) : (
              <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>🥋 Continue evoluindo</p>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {isPending ? '...' : 'Incrível! Vamos treinar 🥋'}
        </button>
      </div>
    </div>
  )
}
