import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NovaAulaForm from './form'

export default async function NovaAulaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const [turmasResult, temasResult] = await Promise.all([
    supabase
      .from('turmas')
      .select('id, nome')
      .eq('academia_id', professor.academia_id)
      .eq('ativa', true)
      .order('nome'),
    supabase
      .from('categorias_tecnicas')
      .select('id, nome')
      .order('nome'),
  ])

  return <NovaAulaForm turmas={turmasResult.data ?? []} temas={temasResult.data ?? []} />
}
