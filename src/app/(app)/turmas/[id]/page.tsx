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

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white', cinza: 'bg-gray-400', amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400', verde: 'bg-green-400', azul: 'bg-blue-400',
  roxa: 'bg-purple-400', marrom: 'bg-amber-700', preta: 'bg-gray-800 border border-white/20',
}

type AlunoRow = { id: string; nome: string; faixa: string }
type InsightsTurma = {
  tecnicas_ausentes: { nome: string; ultima_data: string | null; dias_ausente: number | null }[]
  tecnicas_recentes: { nome: string; vezes: number }[]
  alunos_ausentes: { nome: string; ultima_presenca: string | null; dias_ausente: number | null }[]
}
type AulaHist = {
  id: string; data: string; status: string; hora_inicio: string | null
  presencas: { id: string }[] | null
  aula_tecnicas: { tipo: string }[] | null
}

export default async function TurmaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string }>
}) {
  const { id } = await params
  const { aba: abaParam } = await searchParams
  const aba = ['dados', 'alunos', 'config'].includes(abaParam ?? '')
    ? (abaParam as 'dados' | 'alunos' | 'config')
    : 'dados'

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

  const primeiroDiaMes = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString().split('T')[0]
  const ha30Dias = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [
    matriculadosRes,
    todosAlunosRes,
    aulasRes,
    aulasMesCountRes,
    aulasUlt30Res,
    insightsRes,
  ] = await Promise.all([
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
    // Histórico compacto — só o suficiente pra linha do tempo
    supabase
      .from('aulas')
      .select('id, data, status, hora_inicio, presencas(id), aula_tecnicas(tipo)')
      .eq('turma_id', id)
      .in('status', ['finalizada', 'aberta'])
      .order('data', { ascending: false })
      .limit(10),
    supabase
      .from('aulas')
      .select('id', { count: 'exact', head: true })
      .eq('turma_id', id)
      .eq('status', 'finalizada')
      .gte('data', primeiroDiaMes),
    // Todas as finalizadas dos últimos 30 dias (sem limit) — base do % de
    // presença por aluno. Não dá pra derivar da lista de cima: o limit(10)
    // cortaria aulas de turmas 3x/semana (~13 no mês) e distorceria o %.
    supabase
      .from('aulas')
      .select('id')
      .eq('turma_id', id)
      .eq('status', 'finalizada')
      .gte('data', ha30Dias),
    supabase.rpc('insights_turma', {
      p_turma_id: id,
      p_academia_id: professor.academia_id,
    }),
  ])

  const alunosMatriculados: AlunoRow[] = ((matriculadosRes.data ?? [])
    .map(m => m.alunos as unknown as AlunoRow | null)
    .filter(Boolean) as AlunoRow[])
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const matriculadosIds = new Set(alunosMatriculados.map(a => a.id))
  const disponiveis: AlunoRow[] = (todosAlunosRes.data ?? []).filter(a => !matriculadosIds.has(a.id))

  const aulas = (aulasRes.data ?? []) as unknown as AulaHist[]
  const aulasMes = aulasMesCountRes.count ?? 0
  const insights = (insightsRes.data ?? null) as InsightsTurma | null

  // Presença por aluno nas aulas finalizadas dos últimos 30 dias
  const aulasMesIds = (aulasUlt30Res.data ?? []).map(a => a.id)
  const totalAulasMes = aulasMesIds.length
  const { data: presencasMesData } = aulasMesIds.length > 0
    ? await supabase.from('presencas').select('aluno_id').in('aula_id', aulasMesIds)
    : { data: [] }
  const presencasPorAluno = ((presencasMesData ?? []) as { aluno_id: string | null }[])
    .reduce<Record<string, number>>((acc, p) => {
      if (p.aluno_id) acc[p.aluno_id] = (acc[p.aluno_id] ?? 0) + 1
      return acc
    }, {})

  // Média de presentes nas aulas finalizadas do histórico recente
  const aulasFinalizadas = aulas.filter(a => a.status === 'finalizada')
  const mediaPresenca = aulasFinalizadas.length > 0
    ? Math.round(
        aulasFinalizadas.reduce((s, a) => s + (a.presencas?.length ?? 0), 0) / aulasFinalizadas.length
      )
    : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>

      {/* Header */}
      <header className="px-5 pt-safe pb-4 flex items-start gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/turmas" useBack />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
              {turma.nome}
            </h1>
            {!turma.ativa && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }}>
                Inativa
              </span>
            )}
          </div>
          <p className="text-[11px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            {(turma.dias_semana as string[] | null)?.map(d => DIAS_ABBR[d] ?? d).join(' / ')}
            {turma.horario ? ` · ${(turma.horario as string).substring(0, 5)}` : ''}
            {` · ${alunosMatriculados.length} aluno${alunosMatriculados.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </header>

      {/* Abas */}
      <div className="flex px-5 pt-3 pb-3 gap-2" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        {([
          { key: 'dados', label: 'Dados' },
          { key: 'alunos', label: 'Alunos' },
          { key: 'config', label: 'Config' },
        ] as const).map(t => (
          <Link key={t.key} href={`/turmas/${id}?aba=${t.key}`}
            className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            style={aba === t.key
              ? { background: 'var(--brand-gold)', color: '#000' }
              : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
            }>
            {t.label}
          </Link>
        ))}
      </div>

      <main className={`px-5 pt-5 ${aba === 'dados' ? 'pb-40' : 'pb-10'}`}>

        {/* ─── ABA: DADOS ─────────────────────────────────────────── */}
        {aba === 'dados' && (
          <div className="space-y-5">

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { valor: String(aulasMes), label: 'aulas/mês' },
                { valor: String(alunosMatriculados.length), label: 'alunos' },
                { valor: mediaPresenca !== null ? String(mediaPresenca) : '—', label: 'pres. média' },
              ].map(s => (
                <div key={s.label} className="px-3 py-3 rounded-xl text-center"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <p className="text-xl font-bold" style={{ color: 'var(--brand-gold)' }}>{s.valor}</p>
                  <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Insights */}
            {insights && insights.tecnicas_ausentes.length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  ⏱ Há mais tempo sem aparecer
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.tecnicas_ausentes.map((t, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                      {t.nome}
                      <span className="font-normal opacity-70">
                        {t.dias_ausente !== null ? ` · ${t.dias_ausente}d` : ' · nunca'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insights && insights.tecnicas_recentes.length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  🔁 Mais ensinadas este mês
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.tecnicas_recentes.map((t, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)', color: 'var(--brand-gold)' }}>
                      {t.nome} <span className="opacity-70">×{t.vezes}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {insights && insights.alunos_ausentes.length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  👻 Alunos sumindo
                </p>
                <div className="space-y-2">
                  {insights.alunos_ausentes.map((a, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{a.nome}</p>
                      <p className="text-xs" style={{ color: '#F87171' }}>
                        {a.dias_ausente !== null ? `${a.dias_ausente}d sem aparecer` : 'nunca veio'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico compacto */}
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
                Últimas aulas
              </p>
              {aulas.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--brand-texto-muted)' }}>
                  Nenhuma aula registrada
                </p>
              ) : (
                <div className="space-y-1">
                  {aulas.map(a => {
                    const dataFmt = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: 'short',
                    })
                    const presentes = a.presencas?.length ?? 0
                    const ensinadas = (a.aula_tecnicas ?? []).filter(t => t.tipo === 'ensinada').length
                    return (
                      <Link key={a.id} href={`/aulas/${a.id}`}
                        className="flex items-center justify-between px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
                        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                        <div className="flex items-center gap-2 min-w-0">
                          {a.status === 'aberta' && (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#4ADE80' }} />
                          )}
                          <p className="text-xs capitalize font-medium" style={{ color: 'var(--brand-texto)' }}>
                            {dataFmt}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                            {presentes} 🥋
                          </span>
                          {ensinadas > 0 && (
                            <span className="text-xs" style={{ color: '#4ADE80' }}>
                              {ensinadas} téc.
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: 'var(--brand-gold)' }}>→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ─── ABA: ALUNOS ────────────────────────────────────────── */}
        {aba === 'alunos' && (
          <div className="space-y-2">
            {alunosMatriculados.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--brand-texto-muted)' }}>
                Nenhum aluno matriculado
              </p>
            ) : alunosMatriculados.map(aluno => {
              const presencasMesAluno = presencasPorAluno[aluno.id] ?? 0
              const pct = totalAulasMes > 0
                ? Math.round((presencasMesAluno / totalAulasMes) * 100)
                : null
              return (
                <Link key={aluno.id} href={`/alunos/${aluno.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--brand-texto)' }}>
                      {aluno.nome}
                    </p>
                    <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
                      {aluno.faixa}
                    </p>
                  </div>
                  {pct !== null && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold"
                        style={{ color: pct >= 70 ? '#4ADE80' : pct >= 40 ? '#FBBF24' : '#F87171' }}>
                        {pct}%
                      </p>
                      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                        presença
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}

            {/* Gerenciar matrículas — disponível, mas não é o foco da aba */}
            <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--brand-border)' }}>
              <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
                Gerenciar matrículas
              </p>
              <EnrollmentManager
                turmaId={id}
                matriculados={alunosMatriculados}
                disponiveis={disponiveis}
              />
            </div>
          </div>
        )}

        {/* ─── ABA: CONFIG ────────────────────────────────────────── */}
        {aba === 'config' && (
          <div className="space-y-8">
            <EditarTurmaForm
              turmaId={id}
              nomeAtual={turma.nome}
              diasAtuais={(turma.dias_semana as string[] | null) ?? []}
              horarioAtual={turma.horario as string | null}
              autoAbrirHorasAtual={turma.auto_abrir_horas as number | null}
            />
            <GerarAulasForm
              turma={{ id: turma.id, dias_semana: turma.dias_semana as string[] | null, horario: turma.horario as string | null }}
              academiaId={professor.academia_id}
            />
          </div>
        )}

      </main>

      {/* CTA fixo acima da bottom nav (só na aba Dados) */}
      {aba === 'dados' && (
        <div className="fixed left-0 right-0 px-5 pt-3 pb-3 z-40"
          style={{
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            background: 'var(--brand-fundo)',
            borderTop: '1px solid var(--brand-border)',
          }}>
          <Link href={`/aulas/nova?turma_id=${id}`}
            className="block w-full py-3.5 rounded-xl font-bold text-base uppercase tracking-widest text-center active:scale-[0.98] transition-transform"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            Abrir Nova Aula
          </Link>
        </div>
      )}

    </div>
  )
}
