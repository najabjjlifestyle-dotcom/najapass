import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EnrollmentManager from './enrollment'
import EditarTurmaForm from './editar'
import BackButton from '@/components/back-button'
import GerarAulasForm from '@/components/gerar-aulas-form'

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
    .select('id, nome, dias_semana, horario, ativa, auto_abrir_horas')
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
      .select('id, data, status, hora_inicio, presencas(id), tema:categorias_tecnicas(nome)')
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
    id: string; data: string; status: string
    hora_inicio: string | null; presencas: { id: string }[]
    tema: { nome: string } | null
  }
  const aulas = (aulasResult.data ?? []) as unknown as AulaHist[]

  const aulaIds = aulas.map(a => a.id)
  const { data: tecEnsinadasData } = aulaIds.length > 0
    ? await supabase
        .from('aula_tecnicas')
        .select('aula_id, tecnicas(nome)')
        .in('aula_id', aulaIds)
        .eq('tipo', 'ensinada')
    : { data: [] }

  type TecRow = { aula_id: string; tecnicas: { nome: string } | null }
  const tecPorAula = ((tecEnsinadasData ?? []) as unknown as TecRow[]).reduce<Record<string, string[]>>((acc, r) => {
    if (!r.tecnicas) return acc
    if (!acc[r.aula_id]) acc[r.aula_id] = []
    acc[r.aula_id].push(r.tecnicas.nome)
    return acc
  }, {})

  const STATUS_LABEL: Record<string, string> = {
    finalizada: 'Finalizada', aberta: 'Ao vivo', agendada: 'Pendente', cancelada: 'Cancelada',
  }
  const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    finalizada: { bg: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: 'rgba(74,222,128,0.2)' },
    aberta: { bg: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: 'var(--brand-gold-border)' },
    agendada: { bg: 'transparent', color: 'var(--brand-texto-muted)', border: 'var(--brand-border)' },
    cancelada: { bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5 flex items-start gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/turmas" />
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
          autoAbrirHorasAtual={turma.auto_abrir_horas as number | null}
        />

        <EnrollmentManager
          turmaId={id}
          matriculados={alunosMatriculados}
          disponiveis={disponiveis}
        />

        <GerarAulasForm
          turma={{ id: turma.id, dias_semana: turma.dias_semana as string[] | null, horario: turma.horario as string | null }}
          academiaId={professor.academia_id}
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
                const tecnicas = tecPorAula[a.id] ?? []
                const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.agendada
                return (
                  <Link key={a.id} href={`/aulas/${a.id}`}
                    className="block px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
                        {a.tema?.nome ?? 'Sem tema'}
                      </p>
                      <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold flex-shrink-0"
                        style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                        {presentes} pres.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                        {dataFmt}
                        {a.hora_inicio ? ` · ${(a.hora_inicio as string).substring(0, 5)}` : ''}
                      </span>
                    </div>
                    {tecnicas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tecnicas.slice(0, 4).map((t, i) => (
                          <span key={i}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                            {t}
                          </span>
                        ))}
                        {tecnicas.length > 4 && (
                          <span className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>+{tecnicas.length - 4}</span>
                        )}
                      </div>
                    ) : a.status === 'finalizada' ? (
                      <p className="text-[9px]" style={{ color: '#333' }}>Nenhuma técnica registrada</p>
                    ) : null}
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
