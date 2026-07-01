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

  const [turmasResult, tecnicasResult] = await Promise.all([
    supabase
      .from('turmas')
      .select('id, nome')
      .eq('academia_id', professor.academia_id)
      .eq('ativa', true)
      .order('nome'),
    supabase
      .from('tecnicas')
      .select('id, nome, categorias_tecnicas(nome)')
      .eq('academia_id', professor.academia_id)
      .order('nome'),
  ])

  type TecnicaOpt = { id: string; nome: string; categoria: string | null }
  type RawTec = { id: string; nome: string; categorias_tecnicas: { nome: string } | null }
  const tecnicas: TecnicaOpt[] = ((tecnicasResult.data ?? []) as unknown as RawTec[]).map(t => ({
    id: t.id,
    nome: t.nome,
    categoria: t.categorias_tecnicas?.nome ?? null,
  }))

  return <NovaAulaForm turmas={turmasResult.data ?? []} tecnicas={tecnicas} />
}
