// Fallback instantâneo da raiz (/ e outras rotas sem loading próprio).
// Só o fundo escuro — mata o flash branco enquanto o servidor decide
// entre landing e redirect. As rotas do professor têm seu próprio
// skeleton em (app)/loading.tsx.
export default function RootLoading() {
  return <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }} />
}
