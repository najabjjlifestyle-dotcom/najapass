// Faixa de BJJ estilizada: barra na cor da faixa + ponteira com os 4 graus.
const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

export function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFFFFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div className="flex items-stretch h-11 rounded-lg overflow-hidden"
      style={{ background: cor, border: '1px solid rgba(255,255,255,0.18)' }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[4px] px-3" style={{ background: rankCor, minWidth: 92 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[4px] h-6 rounded-sm"
            style={{ background: i < grau ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>
      <div style={{ width: 18, background: cor }} />
    </div>
  )
}
