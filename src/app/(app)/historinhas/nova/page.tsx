import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HistorinhaForm from '../historinha-form'

export default async function NovaHistorinhaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: tecnicasData } = await supabase
    .from('tecnicas')
    .select('id, nome, categorias_tecnicas(nome)')
    .or(`academia_id.eq.${professor.academia_id},global.eq.true`)
    .order('nome')

  type TecnicaRow = { id: string; nome: string; categorias_tecnicas: { nome: string } | null }
  const tecnicasDisponiveis = ((tecnicasData ?? []) as unknown as TecnicaRow[]).map(t => ({
    id: t.id,
    nome: t.nome,
    categoria: t.categorias_tecnicas?.nome ?? '',
  }))

  return <HistorinhaForm tecnicasDisponiveis={tecnicasDisponiveis} />
}
