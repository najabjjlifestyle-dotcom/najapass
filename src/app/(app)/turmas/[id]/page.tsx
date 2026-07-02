import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EnrollmentManager from './enrollment'
import EditarTurmaForm from './editar'

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

type AlunoRow = { id: string; nome: string; faixa: string }

export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: turma } = await supabase
    .from('turmas')
    .select('id, nome, dias_semana, horario, ativa')
    .eq('id', id)
    .single()

  if (!turma) redirect('/turmas')

  const [matriculadosResult, todosAlunosResult, aulasResult] = await Promise.all([
    supabase
      .from('alunos_turmas')
      .select('alunos(id, nome, faixa)')
      .eq('turma_id', id)
      .eq('ativo', true),
    supabase
      .from('alunos')
      .select('id, nome, faixa')
      .eq('academia_id', professor.academia_id)
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('aulas')
      .select('id, data, tema, status, hora_inicio, presencas(id)')
      .eq('turma_id', id)
      .order('data', { ascending: false })
      .limit(15),
  ])

  const alunosMatriculados: AlunoRow[] = ((matriculadosResult.data ?? [])
    .map(m => m.alunos as unknown as AlunoRow | null)
    .filter(Boolean) as AlunoRow[])
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const matriculadosIds = new Set(alunosMatriculados.map(a => a.id))
  const disponiveis: AlunoRow[] = (todosAlunosResult.data ?? []).filter(a => !matriculadosIds.has(a.id))

  type AulaHist = {
    id: string; data: string; tema: string | null; status: string
    hora_inicio: string | null; presencas: { id: string }[]
  }
  const aulas = (aulasResult.data ?? []) as unknown as AulaHist[]

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-start gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/turmas" className="text-xl mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <div className="flex-1">
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            {turma.nome}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {(turma.dias_semana as string[] | null)?.map(d => (
              <span key={d} className="text-xs px-2 py-0.5 rounded"
                style={{ color: 'var(--brand-texto-sec)', background: 'var(--brand-surf-2)' }}>
                {DIAS_ABBR[d] ?? d}
              </span>
            ))}
            {turma.horario && (
              <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                · {(turma.horario as string).substring(0, 5)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 pt-5 pb-10 space-y-8">
        <EditarTurmaForm
          turmaId={id}
          nomeAtual={turma.nome}
          diasAtuais={(turma.dias_semana as string[] | null) ?? []}
          horarioAtual={turma.horario as string | null}
        />

        <EnrollmentManager
          turmaId={id}
          matriculados={alunosMatriculados}
          disponiveis={disponiveis}
        />

        {/* Histórico de aulas */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--brand-gold)' }}>
            Histórico de aulas
          </p>
          {aulas.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>Nenhuma aula registrada.</p>
          ) : (
            <div className="space-y-1.5">
              {aulas.map(a => {
                const dataFmt = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short',
                })
                const presentes = a.presencas?.length ?? 0
                return (
                  <Link key={a.id} href={`/aulas/${a.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>
                        {a.tema ?? 'Sem tema'}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                        {dataFmt}
                        {a.hora_inicio ? ` · ${(a.hora_inicio as string).substring(0, 5)}` : ''}
                        {a.status === 'aberta' ? ' · ao vivo' : ''}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold"
                      style={{
                        background: 'var(--brand-gold-dim)',
                        color: 'var(--brand-gold)',
                        border: '1px solid var(--brand-gold-border)',
                      }}>
                      {presentes} pres.
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
