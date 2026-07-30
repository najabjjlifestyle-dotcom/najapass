import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SectionTabs from '@/components/section-tabs'
import { nomeTecnica } from '@/lib/tecnicas'

function formatarDataCurta(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
}

type AulaTecnicaRow = { tipo: string; reforco: boolean; tecnicas: { nome: string; tecnicas_academias: { nome_custom: string }[] | null } | null }
type UltimaAula = { id: string; data: string; aula_tecnicas: AulaTecnicaRow[] | null }
type ProximaAula = { id: string; data: string; hora_inicio: string | null; aula_tecnicas: { tipo: string }[] | null }
type Turma = { id: string; nome: string; dias_semana: string[] | null; horario: string | null }
type InsightsTurma = {
  tecnicas_ausentes: { nome: string; ultima_data: string | null; dias_ausente: number | null }[]
  tecnicas_recentes: { nome: string; vezes: number }[]
  alunos_ausentes: { nome: string; ultima_presenca: string | null; dias_ausente: number | null }[]
}

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

export default async function PlanejamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: turmasData } = await supabase
    .from('turmas')
    .select('id, nome, dias_semana, horario')
    .eq('academia_id', professor.academia_id)
    .eq('ativa', true)
    .order('nome')

  const turmas = (turmasData ?? []) as Turma[]

  if (turmas.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
        <header className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Planejamento
          </h1>
        </header>

        <SectionTabs tabs={[
          { href: '/planejamento', label: 'Planejamento', active: true },
          { href: '/turmas', label: 'Turmas', active: false },
        ]} />

        <main className="px-5 pt-16 text-center">
          <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
            Nenhuma turma ativa ainda.
          </p>
          <Link href="/turmas/nova"
            className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            + Nova turma
          </Link>
        </main>
      </div>
    )
  }

  const hoje = new Date().toISOString().split('T')[0]

  const dadosPorTurma = await Promise.all(
    turmas.map(async (turma) => {
      const [ultimaAulaRes, proximasRes, insightsRes] = await Promise.all([
        supabase
          .from('aulas')
          .select('id, data, aula_tecnicas(tipo, reforco, tecnicas(nome, tecnicas_academias(nome_custom)))')
          .eq('turma_id', turma.id)
          .eq('status', 'finalizada')
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('aulas')
          .select('id, data, hora_inicio, aula_tecnicas(tipo)')
          .eq('turma_id', turma.id)
          .eq('status', 'agendada')
          .gte('data', hoje)
          .order('data')
          .limit(3),
        supabase.rpc('insights_turma', {
          p_turma_id: turma.id,
          p_academia_id: professor.academia_id,
        }),
      ])

      return {
        turma,
        ultimaAula: ultimaAulaRes.data as unknown as UltimaAula | null,
        proximasAulas: (proximasRes.data ?? []) as unknown as ProximaAula[],
        insights: (insightsRes.data ?? null) as InsightsTurma | null,
      }
    })
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Planejamento
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
          Lacunas, repetições e alunos para cada turma
        </p>
      </header>

      <SectionTabs tabs={[
        { href: '/planejamento', label: 'Planejamento', active: true },
        { href: '/turmas', label: 'Turmas', active: false },
      ]} />

      <main className="px-5 pt-5 pb-24 space-y-4">
        {dadosPorTurma.map(({ turma, ultimaAula, proximasAulas, insights }) => {
          const tecnicas = ultimaAula?.aula_tecnicas ?? []
          const ensinadas = tecnicas.filter(t => t.tipo === 'ensinada' && t.tecnicas)
          const reforcos = ensinadas.filter(t => t.reforco)

          return (
            <div key={turma.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

              {/* Header da turma — toca pra abrir o cockpit da turma */}
              <Link href={`/turmas/${turma.id}`}
                className="flex items-center justify-between px-4 py-3 active:opacity-70 transition-opacity"
                style={{ borderBottom: '1px solid var(--brand-border)' }}>
                <div>
                  <p className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
                    {turma.nome}
                  </p>
                  {(turma.dias_semana?.length || turma.horario) && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                      {turma.dias_semana?.map(d => DIAS_ABBR[d] ?? d).join(' / ')}
                      {turma.horario ? ` · ${turma.horario.substring(0, 5)}` : ''}
                    </p>
                  )}
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--brand-gold)' }}>→</span>
              </Link>

              {/* Última aula */}
              {ultimaAula ? (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
                    Última aula — {formatarDataCurta(ultimaAula.data)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ensinadas.length === 0 ? (
                      <span className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                        Nenhuma técnica registrada
                      </span>
                    ) : ensinadas.map((t, i) => (
                      <span key={i}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{
                          background: t.reforco ? 'rgba(251,146,60,0.1)' : 'rgba(74,222,128,0.08)',
                          border: `1px solid ${t.reforco ? 'rgba(251,146,60,0.25)' : 'rgba(74,222,128,0.2)'}`,
                          color: t.reforco ? '#FB923C' : '#4ADE80',
                        }}>
                        {t.reforco ? '↺' : '✓'} {nomeTecnica(t.tecnicas!)}
                      </span>
                    ))}
                  </div>
                  {reforcos.length > 0 && (
                    <p className="text-[9px] mt-2" style={{ color: '#FB923C' }}>
                      {reforcos.length} técnica{reforcos.length > 1 ? 's' : ''} para reforçar já {reforcos.length > 1 ? 'estão' : 'está'} no plano da próxima aula
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                    Nenhuma aula registrada ainda para esta turma
                  </p>
                </div>
              )}

              {/* Técnicas há mais tempo sem aparecer */}
              {insights && insights.tecnicas_ausentes.length > 0 && (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-2 flex items-center gap-1.5"
                    style={{ color: 'var(--brand-texto-muted)' }}>
                    <span>⏱</span> Há mais tempo sem aparecer
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.tecnicas_ausentes.map((t, i) => (
                      <span key={i}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#F87171',
                        }}>
                        {t.nome}
                        {t.dias_ausente !== null ? ` · ${t.dias_ausente}d` : ' · nunca'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mais ensinadas no último mês */}
              {insights && insights.tecnicas_recentes.length > 0 && (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
                    🔁 Mais ensinadas no mês
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.tecnicas_recentes.map((t, i) => (
                      <span key={i}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{
                          background: 'var(--brand-gold-dim)',
                          border: '1px solid var(--brand-gold-border)',
                          color: 'var(--brand-gold)',
                        }}>
                        {t.nome} ×{t.vezes}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alunos sumindo */}
              {insights && insights.alunos_ausentes.length > 0 && (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
                    👻 Alunos sumindo
                  </p>
                  <div className="space-y-1.5">
                    {insights.alunos_ausentes.map((a, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
                          {a.nome}
                        </p>
                        <p className="text-[10px]" style={{ color: '#F87171' }}>
                          {a.dias_ausente !== null ? `${a.dias_ausente} dias sem aparecer` : 'nunca apareceu'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Próximas aulas */}
              <div className="px-4 py-3">
                <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
                  Próximas aulas
                </p>
                {proximasAulas.length === 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                      Nenhuma aula agendada
                    </p>
                    <Link href={`/turmas/${turma.id}`} className="text-[10px] font-bold" style={{ color: 'var(--brand-gold)' }}>
                      Gerar aulas →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proximasAulas.map(aula => {
                      const temPlano = aula.aula_tecnicas?.some(t => t.tipo === 'planejada') ?? false
                      const qtdPlano = aula.aula_tecnicas?.filter(t => t.tipo === 'planejada').length ?? 0
                      return (
                        <div key={aula.id} className="flex items-center justify-between py-1">
                          <div>
                            <p className="text-xs font-bold capitalize" style={{ color: 'var(--brand-texto)' }}>
                              {formatarDataCurta(aula.data)}
                              {aula.hora_inicio ? ` · ${aula.hora_inicio.substring(0, 5)}` : ''}
                            </p>
                            {temPlano ? (
                              <p className="text-[9px]" style={{ color: '#4ADE80' }}>
                                {qtdPlano} técnica{qtdPlano !== 1 ? 's' : ''} planejada{qtdPlano !== 1 ? 's' : ''}
                              </p>
                            ) : (
                              <p className="text-[9px]" style={{ color: '#FB923C' }}>
                                ⚠ Sem planejamento
                              </p>
                            )}
                          </div>
                          <Link href={`/aulas/${aula.id}`}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex-shrink-0"
                            style={{
                              background: temPlano ? 'transparent' : 'var(--brand-gold)',
                              color: temPlano ? 'var(--brand-gold)' : '#000',
                              border: temPlano ? '1px solid var(--brand-gold-border)' : 'none',
                            }}>
                            {temPlano ? 'Ver plano' : 'Planejar'}
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
