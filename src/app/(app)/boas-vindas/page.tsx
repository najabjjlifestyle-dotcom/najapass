import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoleSelect from './role-select'

export default async function BoasVindasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (professor?.academia_id) redirect('/dashboard')
  if (professor) redirect('/onboarding')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (aluno) redirect('/aluno')

  return <RoleSelect />
}
