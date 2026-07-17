import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing-page'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Não logado: mostra a landing em vez de mandar direto pro login
  if (!user) return <LandingPage />

  const { data: professor } = await supabase
    .from('professores')
    .select('id, academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (professor?.academia_id) redirect('/dashboard')
  if (professor) redirect('/onboarding')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  redirect(aluno ? '/aluno' : '/boas-vindas')
}
