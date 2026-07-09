import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedbackForm from './form'

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: aula } = await supabase
    .from('aulas')
    .select('id, status, data, turmas(nome)')
    .eq('id', id)
    .single()

  if (!aula) redirect('/aulas')
  if (aula.status !== 'finalizada') redirect(`/aulas/${id}`)

  const { data: tecnicasData } = await supabase
    .from('aula_tecnicas')
    .select('tecnica_id, reforco, tecnicas(nome)')
    .eq('aula_id', id)
    .eq('tipo', 'ensinada')

  type TecRow = { tecnica_id: string; reforco: boolean; tecnicas: { nome: string } | null }
  const tecnicas = ((tecnicasData ?? []) as unknown as TecRow[])
    .filter(t => t.tecnicas)
    .map(t => ({ tecnica_id: t.tecnica_id, reforco: t.reforco, nome: t.tecnicas!.nome }))

  const turma = aula.turmas as unknown as { nome: string } | null

  return (
    <FeedbackForm
      aulaId={id}
      tecnicas={tecnicas}
      turmaNome={turma?.nome ?? 'Aula avulsa'}
      data={aula.data}
    />
  )
}
