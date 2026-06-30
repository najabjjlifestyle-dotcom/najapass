import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NovaForm from './form'

export default async function NovaTecnicaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')

  const { data: categorias } = await supabase
    .from('categorias_tecnicas').select('id, nome').order('nome')

  return <NovaForm categorias={categorias ?? []} />
}
