import { redirect } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import CelebracaoScreen from './celebracao-screen'

export default async function CelebracaoPage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // Se a flag já foi zerada, volta pra home (evita loop se o aluno navegar pra cá diretamente)
  if (!aluno.celebrar_graduacao) redirect('/aluno')

  // Total de aulas na academia
  const { count: totalAulas } = await supabase
    .from('presencas')
    .select('id', { count: 'exact', head: true })
    .eq('aluno_id', aluno.id)

  // Top 3 técnicas (as mais vistas pelo aluno em toda a sua história)
  const { data: presencas } = await supabase
    .from('presencas')
    .select('aula_id')
    .eq('aluno_id', aluno.id)

  const aulaIds = (presencas ?? []).map(p => p.aula_id)
  const { data: tecnicasData } = aulaIds.length > 0
    ? await supabase
        .from('aula_tecnicas')
        .select('tecnicas(nome)')
        .in('aula_id', aulaIds)
        .eq('tipo', 'ensinada')
    : { data: [] }

  type TecRow = { tecnicas: { nome: string } | null }
  const contagemTec = new Map<string, number>()
  for (const row of (tecnicasData ?? []) as unknown as TecRow[]) {
    if (!row.tecnicas?.nome) continue
    contagemTec.set(row.tecnicas.nome, (contagemTec.get(row.tecnicas.nome) ?? 0) + 1)
  }
  const topTecnicas = [...contagemTec.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome]) => nome)

  return (
    <CelebracaoScreen
      aluno={aluno}
      totalAulas={totalAulas ?? 0}
      topTecnicas={topTecnicas}
    />
  )
}
