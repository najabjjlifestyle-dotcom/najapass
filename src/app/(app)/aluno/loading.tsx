// Fallback instantâneo de navegação para o portal do aluno.
// Boundary próprio (em vez de herdar o do (app)) pra AlunoBottomNav,
// que vive no layout deste segmento, continuar visível durante o load.
export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse" style={{ background: 'var(--brand-fundo)' }}>
      {/* header fantasma (avatar + nome) */}
      <div className="flex items-center gap-3 px-4 pt-safe pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="w-[52px] h-[52px] rounded-full flex-shrink-0" style={{ background: 'var(--brand-surf-2)' }} />
        <div className="flex-1">
          <div className="h-5 w-32 rounded-lg" style={{ background: 'var(--brand-surf-2)' }} />
          <div className="h-3 w-24 rounded mt-2" style={{ background: 'var(--brand-surf)' }} />
        </div>
      </div>

      {/* blocos fantasmas de conteúdo */}
      <div className="px-4 pt-5 space-y-3">
        <div className="h-28 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }} />
        <div className="h-20 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }} />
        <div className="h-20 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }} />
      </div>
    </div>
  )
}
