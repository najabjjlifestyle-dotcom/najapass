import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { nomeTecnica } from '@/lib/tecnicas'
import NovaAulaForm from './form'

export default async function NovaAulaPage({
  searchParams,
}: {
  searchParams: Promise<{ turma_id?: string }>
}) {
  const { turma_id: turmaIdParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const [turmasResult, temasResult, tecnicasResult, historinhasResult] = await Promise.all([
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
    supabase
      .from('tecnicas')
      .select('id, nome, categoria_id, faixas, tecnicas_academias(nome_custom)')
      .or(`academia_id.eq.${professor.academia_id},global.eq.true`)
      .order('nome'),
    supabase
      .from('historinhas')
      .select('id, nome, historinha_tecnicas(ordem, tecnica_id, tecnicas(nome))')
      .eq('academia_id', professor.academia_id)
      .order('nome'),
  ])

  const turmas = turmasResult.data ?? []
  const turmaIds = turmas.map(t => t.id)

  // Para cada turma: quais posições precisam de reforço da última aula?
  let reforcosPorTurma: Record<string, string[]> = {}

  if (turmaIds.length > 0) {
    const { data: ultimasAulas } = await supabase
      .from('aulas')
      .select('id, turma_id')
      .in('turma_id', turmaIds)
      .eq('status', 'finalizada')
      .order('data', { ascending: false })

    // Pega a última aula de cada turma
    const ultimaAulaPorTurma: Record<string, string> = {}
    for (const a of ultimasAulas ?? []) {
      if (a.turma_id && !ultimaAulaPorTurma[a.turma_id]) {
        ultimaAulaPorTurma[a.turma_id] = a.id
      }
    }

    const aulaIds = Object.values(ultimaAulaPorTurma)
    if (aulaIds.length > 0) {
      const { data: reforcosRows } = await supabase
        .from('aula_tecnicas')
        .select('aula_id, tecnica_id')
        .in('aula_id', aulaIds)
        .eq('reforco', true)

      for (const r of reforcosRows ?? []) {
        const turmaId = Object.entries(ultimaAulaPorTurma).find(([, id]) => id === r.aula_id)?.[0]
        if (turmaId) {
          if (!reforcosPorTurma[turmaId]) reforcosPorTurma[turmaId] = []
          reforcosPorTurma[turmaId].push(r.tecnica_id)
        }
      }
    }
  }

  type TecnicaOpt = { id: string; nome: string; categoria_id: string | null; faixas: string[] }
  type TecnicaRow = TecnicaOpt & { tecnicas_academias: { nome_custom: string }[] | null }
  const tecnicas = ((tecnicasResult.data ?? []) as unknown as TecnicaRow[])
    .map(t => ({ id: t.id, nome: nomeTecnica(t), categoria_id: t.categoria_id, faixas: t.faixas })) as TecnicaOpt[]

  type HistorinhaTecnica = { ordem: number; tecnica_id: string; tecnicas: { nome: string } | null }
  type Historinha = { id: string; nome: string; historinha_tecnicas: HistorinhaTecnica[] | null }
  const historinhas = (historinhasResult.data ?? []) as unknown as Historinha[]

  return (
    <NovaAulaForm
      turmas={turmas}
      temas={temasResult.data ?? []}
      tecnicas={tecnicas}
      reforcosPorTurma={reforcosPorTurma}
      historinhas={historinhas}
      defaultTurmaId={turmaIdParam ?? null}
    />
  )
}
