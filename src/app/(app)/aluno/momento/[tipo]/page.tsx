import { notFound } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import MomentoAniversario from './momento-aniversario'
import MomentoAnual from './momento-anual'
import MomentoMensal from './momento-mensal'
import MomentoGraduacao from './momento-graduacao'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default async function MomentoPage({
  params,
}: {
  params: Promise<{ tipo: string }>
}) {
  const { tipo } = await params
  const { aluno, supabase } = await getAlunoOuRedireciona()

  const { data: acad } = await supabase
    .from('academias')
    .select('nome')
    .eq('id', aluno.academia_id)
    .maybeSingle()
  const acadNome = acad?.nome ?? 'Naja BJJ'

  const cardAluno = { nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau, foto_url: aluno.foto_url }

  if (tipo === 'aniversario') {
    const { count: totalAulas } = await supabase
      .from('presencas')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id)

    const idadeAnos = aluno.data_nascimento
      ? new Date().getFullYear() - new Date(aluno.data_nascimento).getUTCFullYear()
      : null

    return (
      <MomentoAniversario
        aluno={cardAluno}
        totalAulas={totalAulas ?? 0}
        idadeAnos={idadeAnos}
        acadNome={acadNome}
      />
    )
  }

  if (tipo === 'anual') {
    const dataEntrada = aluno.matriculado_em ? new Date(aluno.matriculado_em) : new Date()
    const anosNaAcademia = new Date().getFullYear() - dataEntrada.getUTCFullYear()

    const umAnoAtras = new Date()
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1)
    const umAnoAtrasStr = umAnoAtras.toISOString().split('T')[0]

    const [{ count: aulasAno }, { count: totalAulas }, { data: tecRaw }] = await Promise.all([
      supabase
        .from('presencas')
        .select('aulas!inner(data)', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .gte('aulas.data', umAnoAtrasStr),
      supabase
        .from('presencas')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id),
      supabase
        .from('presencas')
        .select('aulas!inner(data, status, aula_tecnicas(tecnicas(nome)))')
        .eq('aluno_id', aluno.id)
        .eq('aulas.status', 'finalizada')
        .gte('aulas.data', umAnoAtrasStr)
        .limit(200),
    ])

    const tecCount: Record<string, number> = {}
    for (const p of tecRaw ?? []) {
      const aula = p.aulas as unknown as { aula_tecnicas: { tecnicas: { nome: string } | null }[] }
      for (const at of aula.aula_tecnicas ?? []) {
        const nome = at.tecnicas?.nome
        if (nome) tecCount[nome] = (tecCount[nome] ?? 0) + 1
      }
    }
    const tecTop = Object.entries(tecCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return (
      <MomentoAnual
        aluno={cardAluno}
        anosNaAcademia={anosNaAcademia}
        aulasAno={aulasAno ?? 0}
        totalAulas={totalAulas ?? 0}
        tecnicaFavorita={tecTop}
        acadNome={acadNome}
        dataEntrada={dataEntrada.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      />
    )
  }

  if (tipo === 'mensal') {
    const hoje = new Date()
    const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    const mesNome = MESES[primeiroDiaMesAnterior.getMonth()]

    const [{ count: aulasNoMes }, { count: totalAulas }] = await Promise.all([
      supabase
        .from('presencas')
        .select('aulas!inner(data, status)', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .eq('aulas.status', 'finalizada')
        .gte('aulas.data', primeiroDiaMesAnterior.toISOString().split('T')[0])
        .lte('aulas.data', ultimoDiaMesAnterior.toISOString().split('T')[0]),
      supabase
        .from('presencas')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id),
    ])

    return (
      <MomentoMensal
        aluno={cardAluno}
        aulasNoMes={aulasNoMes ?? 0}
        totalAulas={totalAulas ?? 0}
        mesNome={mesNome}
        acadNome={acadNome}
      />
    )
  }

  if (tipo === 'graduacao') {
    const refDate = aluno.graduado_em ?? aluno.matriculado_em ?? '1970-01-01'

    const [{ count: aulasNaFaixa }, { count: totalAulas }] = await Promise.all([
      supabase
        .from('presencas')
        .select('aulas!inner(data)', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .gte('aulas.data', refDate.substring(0, 10)),
      supabase
        .from('presencas')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id),
    ])

    const dataGradStr = aluno.graduado_em
      ? new Date(aluno.graduado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : null

    return (
      <MomentoGraduacao
        aluno={cardAluno}
        aulasNaFaixa={aulasNaFaixa ?? 0}
        totalAulas={totalAulas ?? 0}
        dataGraduacao={dataGradStr}
        acadNome={acadNome}
      />
    )
  }

  return notFound()
}
