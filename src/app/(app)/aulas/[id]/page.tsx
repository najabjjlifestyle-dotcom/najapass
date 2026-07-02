import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AttendanceList from './attendance-list'
import TecnicasAula from './tecnicas-aula'

type AlunoRow = { id: string; nome: string; faixa: string; grau: number }
type TecnicaRow = { id: string; nome: string; categoria: string | null }

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

  // Parallel: presencas, posições da aula, todas posições da academia
  const [presencasResult, tecnicasAulaResult, todasTecnicasResult] = await Promise.all([
    supabase.from('presencas').select('aluno_id').eq('aula_id', id),
    supabase
      .from('aula_tecnicas')
      .select('tecnicas(id, nome, categoria_id, categorias_tecnicas(nome))')
      .eq('aula_id', id)
      .eq('tipo', 'ensinada'),
    supabase
      .from('tecnicas')
      .select('id, nome, categoria_id, categorias_tecnicas(nome)')
      .eq('academia_id', professor.academia_id)
      .order('nome'),
  ])

  // Alunos — sequential to avoid TS union confusion with the ternary
  let alunos: AlunoRow[] = []
  if (aula.turma_id) {
    const { data: turmaAlunos } = await supabase
      .from('alunos_turmas')
      .select('alunos(id, nome, faixa, grau)')
      .eq('turma_id', aula.turma_id)
      .eq('ativo', true)
    alunos = ((turmaAlunos ?? [])
      .map(ta => ta.alunos as unknown as AlunoRow | null)
      .filter(Boolean) as AlunoRow[])
      .sort((a, b) => a.nome.localeCompare(b.nome))
  } else {
    const { data } = await supabase
      .from('alunos')
      .select('id, nome, faixa, grau')
      .eq('academia_id', professor.academia_id)
      .eq('ativo', true)
      .order('nome')
    alunos = (data as AlunoRow[]) ?? []
  }

  const presencasIniciais = ((presencasResult.data ?? [])
    .map(p => p.aluno_id)
    .filter(Boolean)) as string[]

  type RawTecnicaAula = {
    tecnicas: { id: string; nome: string; categoria_id: string | null; categorias_tecnicas: { nome: string } | null } | null
  }
  const ensinadas: TecnicaRow[] = ((tecnicasAulaResult.data ?? []) as unknown as RawTecnicaAula[])
    .filter(t => t.tecnicas)
    .map(t => ({
      id: t.tecnicas!.id,
      nome: t.tecnicas!.nome,
      categoria: t.tecnicas!.categorias_tecnicas?.nome ?? null,
    }))

  const ensinadasIds = new Set(ensinadas.map(t => t.id))
  const aulaTemaid = aula.tema_id as string | null

  type RawTecnica = { id: string; nome: string; categoria_id: string | null; categorias_tecnicas: { nome: string } | null }
  const disponiveis: TecnicaRow[] = ((todasTecnicasResult.data ?? []) as unknown as RawTecnica[])
    .filter(t => !ensinadasIds.has(t.id))
    // filter to the aula's tema when set — show only posições of that tema
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
          ensinadas={ensinadas}
          disponiveis={disponiveis}
          aulaAberta={aula.status === 'aberta'}
          temaNome={temaNome}
        />
      </div>

      <AttendanceList
        aulaId={id}
        alunos={alunos}
        presencasIniciais={presencasIniciais}
        status={aula.status}
      />
    </div>
  )
}
