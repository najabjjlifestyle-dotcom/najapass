import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing-page'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Não logado: mostra a landing em vez de mandar direto pro login
  if (!user) return <LandingPage />

  // Logado: professor e aluno em paralelo (antes eram sequenciais)
  const [professorRes, alunoRes] = await Promise.all([
    supabase.from('professores').select('id, academia_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('alunos').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  if (professorRes.data?.academia_id) redirect('/dashboard')
  if (professorRes.data) redirect('/onboarding')
  redirect(alunoRes.data ? '/aluno' : '/boas-vindas')
}
