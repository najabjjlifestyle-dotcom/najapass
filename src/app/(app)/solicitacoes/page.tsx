import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SolicitacaoButtons } from './buttons'
import BackButton from '@/components/back-button'

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
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-12 pb-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/dashboard" />
        <div>
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Solicitações
          </h1>
          {(pendentes?.length ?? 0) > 0 && (
            <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: 'var(--brand-gold)' }}>
              {pendentes!.length} pendente{pendentes!.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </header>

      <main className="px-6 pt-6 pb-10 space-y-8">

        {/* Pendentes */}
        <div>
          {!pendentes?.length ? (
            <p className="text-center text-sm py-8 uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma solicitação pendente
            </p>
          ) : (
            <div className="space-y-3">
              {pendentes.map(sol => (
                <div key={sol.id}
                  className="px-5 py-4 rounded-2xl" style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
                  <p className="font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
                    {sol.nome}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>{sol.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
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
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
              Histórico
            </p>
            <div className="space-y-2">
              {historico!.map(sol => (
                <div key={sol.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ border: '1px solid var(--brand-border)' }}>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto-sec)' }}>
                      {sol.nome}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>{sol.email}</p>
                  </div>
                  <span className="text-xs uppercase tracking-widest flex-shrink-0"
                    style={{ color: sol.status === 'aprovado' ? '#4ADE80' : 'rgba(248,113,113,0.6)' }}>
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
