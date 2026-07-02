import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AttendanceList from './attendance-list'
import TecnicasAula from './tecnicas-aula'

type AlunoRow = { id: string; nome: string; faixa: string; grau: number }

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
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
    .select('id, data, status, hora_inicio, turma_id, video_url, tema_id, turmas(nome), tema:categorias_tecnicas(nome)')
    .eq('id', id)
    .single()

  if (!aula) redirect('/aulas')

  const temaNome = (aula.tema as unknown as { nome: string } | null)?.nome ?? null
  const aulaTemaid = aula.tema_id as string | null

  // Parallel: presencas, todas as aula_tecnicas, posições disponíveis
  const [presencasResult, aulaTecnicasResult, todasTecnicasResult] = await Promise.all([
    supabase.from('presencas').select('id, aluno_id, nome_visitante').eq('aula_id', id),
    supabase
      .from('aula_tecnicas')
      .select('tipo, reforco, tecnicas(id, nome, categoria_id, categorias_tecnicas(nome))')
      .eq('aula_id', id),
    supabase
      .from('tecnicas')
      .select('id, nome, categoria_id, categorias_tecnicas(nome)')
      .eq('academia_id', professor.academia_id)
      .order('nome'),
  ])

  const presencas = (presencasResult.data ?? []) as unknown as
    { id: string; aluno_id: string | null; nome_visitante: string | null }[]
  const presencaAlunoIds = presencas.map(p => p.aluno_id).filter((v): v is string => Boolean(v))
  const visitantesIniciais = presencas
    .filter(p => p.nome_visitante)
    .map(p => ({ id: p.id, nome: p.nome_visitante as string }))

  // Alunos da aula
  let alunos: AlunoRow[] = []
  let outrosAlunos: AlunoRow[] = []
  if (aula.turma_id) {
    const { data: turmaAlunos } = await supabase
      .from('alunos_turmas')
      .select('alunos(id, nome, faixa, grau)')
      .eq('turma_id', aula.turma_id)
      .eq('ativo', true)
    alunos = (turmaAlunos ?? [])
      .map(ta => ta.alunos as unknown as AlunoRow | null)
      .filter(Boolean) as AlunoRow[]

    // Alunos avulsos: presença registrada mas não matriculados nessa turma
    const turmaAlunoIds = new Set(alunos.map(a => a.id))
    const avulsoIds = presencaAlunoIds.filter(alunoId => !turmaAlunoIds.has(alunoId))
    if (avulsoIds.length > 0) {
      const { data: avulsosData } = await supabase
        .from('alunos')
        .select('id, nome, faixa, grau')
        .in('id', avulsoIds)
      alunos = [...alunos, ...((avulsosData as AlunoRow[]) ?? [])]
    }
    alunos.sort((a, b) => a.nome.localeCompare(b.nome))

    const { data: todosDaAcademia } = await supabase
      .from('alunos')
      .select('id, nome, faixa, grau')
      .eq('academia_id', professor.academia_id)
      .eq('ativo', true)
      .order('nome')
    const jaNaLista = new Set(alunos.map(a => a.id))
    outrosAlunos = ((todosDaAcademia as AlunoRow[]) ?? []).filter(a => !jaNaLista.has(a.id))
  } else {
    const { data } = await supabase
      .from('alunos')
      .select('id, nome, faixa, grau')
      .eq('academia_id', professor.academia_id)
      .eq('ativo', true)
      .order('nome')
    alunos = (data as AlunoRow[]) ?? []
  }

  const presencasIniciais = presencaAlunoIds

  type RawAT = {
    tipo: string
    reforco: boolean
    tecnicas: { id: string; nome: string; categoria_id: string | null; categorias_tecnicas: { nome: string } | null } | null
  }
  const aulaTecnicas = ((aulaTecnicasResult.data ?? []) as unknown as RawAT[]).filter(r => r.tecnicas)

  const tecnicasNaAula = aulaTecnicas.map(r => ({
    id: r.tecnicas!.id,
    nome: r.tecnicas!.nome,
    categoria: r.tecnicas!.categorias_tecnicas?.nome ?? null,
    tipo: r.tipo as 'planejada' | 'ensinada' | 'nao_ensinada',
    reforco: r.reforco,
  }))

  const naAulaIds = new Set(tecnicasNaAula.map(t => t.id))

  type RawTec = { id: string; nome: string; categoria_id: string | null; categorias_tecnicas: { nome: string } | null }
  const disponiveis = ((todasTecnicasResult.data ?? []) as unknown as RawTec[])
    .filter(t => !naAulaIds.has(t.id))
    .filter(t => !aulaTemaid || t.categoria_id === aulaTemaid)
    .map(t => ({ id: t.id, nome: t.nome, categoria: t.categorias_tecnicas?.nome ?? null }))

  const turma = aula.turmas as unknown as { nome: string } | null

  const dataFormatada = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-start gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/aulas" className="text-xl mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
              {turma?.nome ?? 'Aula Avulsa'}
            </h1>
            {aula.status === 'finalizada' && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
                Finalizada
              </span>
            )}
            {aula.status === 'aberta' && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                Ao vivo
              </span>
            )}
          </div>
          <p className="text-xs mt-1 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            {dataFormatada}
            {aula.hora_inicio ? ` · ${(aula.hora_inicio as string).substring(0, 5)}` : ''}
          </p>
          {temaNome && (
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--brand-gold)' }}>
              Tema: {temaNome}
            </p>
          )}
          {aula.video_url && (
            <a href={aula.video_url as string} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs mt-1.5 underline underline-offset-2"
              style={{ color: 'var(--brand-gold)' }}>
              ▶ Link de estudo
            </a>
          )}
        </div>
      </header>

      <div className="rounded-xl mx-5 mt-4 overflow-hidden"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <TecnicasAula
          aulaId={id}
          tecnicas={tecnicasNaAula}
          disponiveis={disponiveis}
          aulaAberta={aula.status === 'aberta'}
          temaNome={temaNome}
        />
      </div>

      <AttendanceList
        aulaId={id}
        alunos={alunos}
        presencasIniciais={presencasIniciais}
        visitantesIniciais={visitantesIniciais}
        outrosAlunos={outrosAlunos}
        status={aula.status}
      />
    </div>
  )
}
