// Fallback instantâneo de navegação para todas as rotas do professor.
// Sem isso, tocar num link congela a tela atual até o servidor terminar
// as queries da próxima página — parece que o toque não registrou.
// A BottomNav vive no layout, então continua visível durante o load.
export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ background: 'var(--brand-fundo)' }}>
      {/* header fantasma */}
      <div className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="h-6 w-40 rounded-lg" style={{ background: 'var(--brand-surf-2)' }} />
        <div className="h-3 w-56 rounded mt-2" style={{ background: 'var(--brand-surf)' }} />
      </div>

      {/* blocos fantasmas de conteúdo */}
      <div className="px-5 pt-5 space-y-3">
        <div className="h-24 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }} />
        <div className="h-24 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }} />
        <div className="h-16 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }} />
        <div className="h-16 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }} />
      </div>
    </div>
  )
}
