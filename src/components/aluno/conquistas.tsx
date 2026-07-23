import { computarConquistas, type DadosConquistas } from '@/lib/conquistas'

export function Conquistas({ dados }: { dados: DadosConquistas }) {
  const todas = computarConquistas(dados)
  const desbloqueadas = todas.filter(c => c.desbloqueada)
  const bloqueadas = todas.filter(c => !c.desbloqueada)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          Conquistas
        </p>
        <span className="text-[10px] font-bold" style={{ color: 'var(--brand-gold)' }}>
          {desbloqueadas.length}/{todas.length}
        </span>
      </div>

      {desbloqueadas.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {desbloqueadas.map(c => (
            <div key={c.id}
              className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
              style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
              <span className="text-xl flex-shrink-0">{c.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate" style={{ color: 'var(--brand-texto)' }}>
                  {c.nome}
                </p>
                <p className="text-[9px] leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--brand-texto-muted)' }}>
                  {c.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {bloqueadas.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Bloqueadas · {bloqueadas.length} restantes
          </p>
          <div className="grid grid-cols-2 gap-2">
            {bloqueadas.map(c => (
              <div key={c.id}
                className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                style={{ background: 'transparent', border: '1px solid var(--brand-border)', opacity: 0.45 }}>
                <span className="text-xl flex-shrink-0 grayscale">{c.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight truncate" style={{ color: 'var(--brand-texto-muted)' }}>
                    {c.nome}
                  </p>
                  <p className="text-[9px] leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--brand-texto-muted)' }}>
                    {c.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {bloqueadas.length === 0 && (
        <div className="text-center py-4">
          <p className="text-2xl mb-1">🏆</p>
          <p className="text-sm font-bold" style={{ color: 'var(--brand-gold)' }}>
            Todas as conquistas desbloqueadas.
          </p>
        </div>
      )}
    </div>
  )
}
