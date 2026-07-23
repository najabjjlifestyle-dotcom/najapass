const MARCOS = [50, 100, 250, 500, 1000, 2500, 5000, 10000]

function proximoMarco(horas: number): { meta: number; anterior: number } {
  const meta = MARCOS.find(m => m > horas) ?? 10000
  const idx = MARCOS.indexOf(meta)
  const anterior = idx > 0 ? MARCOS[idx - 1] : 0
  return { meta, anterior }
}

function formatarHoras(h: number): string {
  if (h >= 1000) return `${(h / 1000).toFixed(1).replace('.', ',')}k`
  return h.toFixed(1).replace('.', ',')
}

export function HorasNoTatame({ horas, totalPresencas }: { horas: number; totalPresencas: number }) {
  const { meta, anterior } = proximoMarco(horas)
  const progresso = Math.min(((horas - anterior) / (meta - anterior)) * 100, 100)
  const horasRestantes = Math.max(meta - horas, 0)
  const atingiuMeta = horas >= 10000

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Horas no Tatame
      </p>

      <div className="flex items-end gap-3">
        <span className="text-5xl font-black tracking-tight leading-none" style={{ color: 'var(--brand-gold)' }}>
          {formatarHoras(horas)}
        </span>
        <div className="pb-1.5">
          <span className="text-lg font-bold" style={{ color: 'var(--brand-texto)' }}>h</span>
          <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
            {totalPresencas} {totalPresencas === 1 ? 'treino' : 'treinos'}
          </p>
        </div>
      </div>

      {!atingiuMeta && (
        <div className="space-y-2">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--brand-border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progresso}%`, background: 'linear-gradient(90deg, var(--brand-gold) 0%, #E8C98E 100%)' }} />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
              Próximo marco: <span style={{ color: 'var(--brand-gold)' }}>{meta.toLocaleString('pt-BR')}h</span>
            </p>
            <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
              Faltam {horasRestantes.toFixed(1).replace('.', ',')}h
            </p>
          </div>
        </div>
      )}

      {atingiuMeta && (
        <div className="text-center py-2">
          <p className="text-2xl mb-1">🏆</p>
          <p className="text-sm font-bold" style={{ color: 'var(--brand-gold)' }}>
            10.000 horas alcançadas. Mestre.
          </p>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {MARCOS.map(m => (
          <span key={m}
            className="text-[9px] px-2 py-0.5 rounded-full font-medium transition-all"
            style={{
              background: horas >= m ? 'var(--brand-gold-dim)' : 'transparent',
              border: `1px solid ${horas >= m ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
              color: horas >= m ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
            }}>
            {m >= 1000 ? `${m / 1000}k` : m}h
          </span>
        ))}
      </div>
    </div>
  )
}
