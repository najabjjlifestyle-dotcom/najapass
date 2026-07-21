// Fallback instantâneo das rotas de auth (/login) — só o fundo escuro,
// pra não piscar branco na navegação pra essas telas.
export default function AuthLoading() {
  return <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }} />
}
