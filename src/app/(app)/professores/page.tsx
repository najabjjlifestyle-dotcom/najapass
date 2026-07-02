import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfessoresClient from './client'
import BackButton from '@/components/back-button'

export default async function ProfessoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: eu } = await supabase
    .from('professores').select('id, academia_id').eq('user_id', user.id).maybeSingle()
  if (!eu?.academia_id) redirect('/dashboard')

  const { data: professores } = await supabase
    .from('professores')
    .select('id, nome, email, user_id, faixa')
    .eq('academia_id', eu.academia_id)
    .order('nome')

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/dashboard" />
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Professores
        </h1>
      </header>
      <ProfessoresClient professores={professores ?? []} meuId={eu.id} />
    </div>
  )
}
