import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SolicitacaoButtons } from './buttons'

export default async function SolicitacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/dashboard')

  const { data: pendentes } = await supabase
    .from('solicitacoes')
    .select('id, nome, email, criado_em')
    .eq('academia_id', professor.academia_id)
    .eq('status', 'pendente')
    .order('criado_em')

  const { data: historico } = await supabase
    .from('solicitacoes')
    .select('id, nome, email, status, criado_em')
    .eq('academia_id', professor.academia_id)
    .in('status', ['aprovado', 'rejeitado'])
    .order('criado_em', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center gap-3">
        <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
        <div>
          <h1 className="text-white font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Solicitações
          </h1>
          {(pendentes?.length ?? 0) > 0 && (
            <p className="text-yellow-400 text-xs uppercase tracking-widest mt-0.5"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              {pendentes!.length} pendente{pendentes!.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </header>

      <main className="px-6 pt-6 pb-10 space-y-8">

        {/* Pendentes */}
        <div>
          {!pendentes?.length ? (
            <p className="text-center text-white/20 text-sm py-8 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Nenhuma solicitação pendente
            </p>
          ) : (
            <div className="space-y-3">
              {pendentes.map(sol => (
                <div key={sol.id}
                  className="px-5 py-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5">
                  <p className="text-white font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-oswald)' }}>
                    {sol.nome}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">{sol.email}</p>
                  <p className="text-white/20 text-xs mt-0.5">
                    {new Date(sol.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <SolicitacaoButtons id={sol.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico */}
        {(historico?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30 mb-3"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Histórico
            </p>
            <div className="space-y-2">
              {historico!.map(sol => (
                <div key={sol.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/5">
                  <div>
                    <p className="text-white/60 text-sm font-bold uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-oswald)' }}>
                      {sol.nome}
                    </p>
                    <p className="text-white/20 text-xs">{sol.email}</p>
                  </div>
                  <span className={`text-xs uppercase tracking-widest flex-shrink-0 ${
                    sol.status === 'aprovado' ? 'text-green-400' : 'text-red-400/60'
                  }`} style={{ fontFamily: 'var(--font-oswald)' }}>
                    {sol.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
