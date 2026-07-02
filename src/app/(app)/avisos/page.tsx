import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NovoAvisoForm from './form'
import { ArquivarAvisoButton } from './buttons'

export default async function AvisosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const [{ data: turmas }, { data: avisos }] = await Promise.all([
    supabase.from('turmas').select('id, nome').eq('academia_id', professor.academia_id).eq('ativa', true).order('nome'),
    supabase.from('avisos').select('id, titulo, corpo, criado_em, turmas(nome)')
      .eq('academia_id', professor.academia_id).eq('ativo', true)
      .order('criado_em', { ascending: false }),
  ])

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/dashboard" className="text-xl" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Avisos
        </h1>
      </header>

      <main className="px-5 pt-5 pb-10 space-y-6">
        <NovoAvisoForm turmas={turmas ?? []} />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-gold)' }}>
            Ativos
          </p>
          {(avisos ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>Nenhum aviso ativo.</p>
          ) : (
            <div className="space-y-2">
              {(avisos ?? []).map(a => {
                const turma = a.turmas as unknown as { nome: string } | null
                return (
                  <div key={a.id} className="rounded-xl p-4"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{a.titulo}</p>
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded whitespace-nowrap"
                        style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                        {turma?.nome ?? 'Toda a academia'}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--brand-texto-sec)' }}>{a.corpo}</p>
                    <div className="mt-3">
                      <ArquivarAvisoButton id={a.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
