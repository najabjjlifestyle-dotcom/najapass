import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verifica se tem academia cadastrada
  const { data: professor } = await supabase
    .from('professores')
    .select('id, nome, academia_id, academias(nome)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const academia = professor.academias as unknown as { nome: string } | null

  const { count: pendentes } = await supabase
    .from('solicitacoes')
    .select('id', { count: 'exact', head: true })
    .eq('academia_id', professor.academia_id)
    .eq('status', 'pendente')
    .then(r => r.error ? { count: 0 } : r)

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="" className="w-10 h-10 rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              {academia?.nome ?? 'Minha Academia'}
            </p>
            <h1 className="text-white font-bold text-lg uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Olá, {professor.nome}
            </h1>
          </div>
        </div>
      </header>

      {/* Quick actions */}
      <main className="flex-1 px-6 pt-8 space-y-4">
        <a
          href="/aulas/nova"
          className="flex items-center justify-between w-full px-5 py-4 rounded-2xl bg-white text-black"
        >
          <div>
            <p className="font-bold text-lg uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Abrir Aula
            </p>
            <p className="text-black/50 text-sm">Inicie uma aula agora</p>
          </div>
          <span className="text-2xl">🥋</span>
        </a>

        {/* Banner de solicitações pendentes */}
        {(pendentes ?? 0) > 0 && (
          <a href="/solicitacoes"
            className="flex items-center justify-between w-full px-5 py-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/5">
            <div>
              <p className="text-yellow-400 font-bold text-base uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-oswald)' }}>
                Solicitações de Alunos
              </p>
              <p className="text-yellow-400/60 text-sm">
                {pendentes} nova{pendentes !== 1 ? 's' : ''} aguardando aprovação
              </p>
            </div>
            <span className="text-yellow-400 text-xl">→</span>
          </a>
        )}

        <div className="grid grid-cols-2 gap-3">
          <a href="/alunos"
            className="flex flex-col gap-1 px-4 py-4 rounded-2xl border border-white/20">
            <span className="text-2xl">👥</span>
            <p className="text-white font-bold uppercase tracking-wider text-sm"
              style={{ fontFamily: 'var(--font-oswald)' }}>Alunos</p>
          </a>
          <a href="/turmas"
            className="flex flex-col gap-1 px-4 py-4 rounded-2xl border border-white/20">
            <span className="text-2xl">📋</span>
            <p className="text-white font-bold uppercase tracking-wider text-sm"
              style={{ fontFamily: 'var(--font-oswald)' }}>Turmas</p>
          </a>
          <a href="/aulas"
            className="flex flex-col gap-1 px-4 py-4 rounded-2xl border border-white/20">
            <span className="text-2xl">📅</span>
            <p className="text-white font-bold uppercase tracking-wider text-sm"
              style={{ fontFamily: 'var(--font-oswald)' }}>Histórico</p>
          </a>
          <a href="/solicitacoes"
            className="flex flex-col gap-1 px-4 py-4 rounded-2xl border border-white/20">
            <span className="text-2xl">📨</span>
            <p className="text-white font-bold uppercase tracking-wider text-sm"
              style={{ fontFamily: 'var(--font-oswald)' }}>Solicitações</p>
          </a>
        </div>
      </main>
    </div>
  )
}
