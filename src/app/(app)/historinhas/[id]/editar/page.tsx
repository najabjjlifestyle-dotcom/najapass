import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HistorinhaForm from '../../historinha-form'

type HistorinhaTecnicaRow = {
  ordem: number
  tecnica_id: string
  tecnicas: { id: string; nome: string; categorias_tecnicas: { nome: string } | null } | null
}

export default async function EditarHistorinhaPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [{ data: historinha }, { data: tecnicasData }] = await Promise.all([
    supabase
      .from('historinhas')
      .select('id, nome, historinha_tecnicas(ordem, tecnica_id, tecnicas(id, nome, categorias_tecnicas(nome)))')
      .eq('id', id)
      .eq('academia_id', professor.academia_id)
      .maybeSingle(),
    supabase
      .from('tecnicas')
      .select('id, nome, categorias_tecnicas(nome)')
      .or(`academia_id.eq.${professor.academia_id},global.eq.true`)
      .order('nome'),
  ])

  if (!historinha) redirect('/historinhas')

  const tecnicasOrdenadas = [...((historinha.historinha_tecnicas ?? []) as unknown as HistorinhaTecnicaRow[])]
    .sort((a, b) => a.ordem - b.ordem)

  type TecnicaRow = { id: string; nome: string; categorias_tecnicas: { nome: string } | null }
  const tecnicasDisponiveis = ((tecnicasData ?? []) as unknown as TecnicaRow[]).map(t => ({
    id: t.id,
    nome: t.nome,
    categoria: t.categorias_tecnicas?.nome ?? '',
  }))

  return (
    <HistorinhaForm
      id={historinha.id}
      nomeInicial={historinha.nome}
      tecnicasIniciais={tecnicasOrdenadas.map(ht => ({
        id: ht.tecnica_id,
        nome: ht.tecnicas?.nome ?? '',
        categoria: ht.tecnicas?.categorias_tecnicas?.nome ?? '',
      }))}
      tecnicasDisponiveis={tecnicasDisponiveis}
    />
  )
}
