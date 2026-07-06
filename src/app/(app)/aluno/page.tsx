import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import CheckinCard from './checkin'
import AvatarUpload from '@/components/avatar-upload'
import { updateFotoPropria } from './actions'
import PushSubscribeButton from './push-subscribe'
import ConfirmarPresencaButton from './confirmar-button'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

const DIA_MAP: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
}

const DIA_LABEL: Record<string, string> = {
  domingo: 'domingo', segunda: 'segunda-feira', terca: 'terça-feira',
  quarta: 'quarta-feira', quinta: 'quinta-feira', sexta: 'sexta-feira', sabado: 'sábado',
}

function calcularProximoTreino(turmas: { dias_semana: string[] | null }[]): string | null {
  const hoje = new Date().getDay()
  const dias = turmas.flatMap(t => t.dias_semana ?? [])
  if (dias.length === 0) return null
  const diasNums = [...new Set(dias.map(d => DIA_MAP[d] ?? -1).filter(n => n >= 0))].sort((a, b) => a - b)
  if (diasNums.length === 0) return null
  const proximo = diasNums.find(d => d > hoje) ?? diasNums[0]
  const nomeDia = Object.entries(DIA_MAP).find(([, n]) => n === proximo)?.[0]
  return nomeDia ? DIA_LABEL[nomeDia] ?? nomeDia : null
}

export default async function AlunoHomePage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // Aulas ativas na academia
  const { data: aulasAtivasData } = await supabase
    .from('aulas')
    .select('id, video_url, turmas(nome), tema:categorias_tecnicas(nome)')
    .eq('academia_id', aluno.academia_id)
    .eq('status', 'aberta')

  type AulaAtivaRow = {
    id: string
    video_url: string | null
    turmas: { nome: string } | null
    tema: { nome: string } | null
  }
  const aulasAtivasRows = (aulasAtivasData ?? []) as unknown as AulaAtivaRow[]

  const aulasAtivas = await Promise.all(aulasAtivasRows.map(async (aula) => {
    const [{ data: quemVaiData }, { data: planejadasData }] = await Promise.all([
      supabase.rpc('quem_vai', { p_aula_id: aula.id }),
      supabase.from('aula_tecnicas').select('tecnicas(nome)').eq('aula_id', aula.id).eq('tipo', 'planejada'),
    ])
    const confirmados = (quemVaiData ?? []) as { nome: string; visitante: boolean }[]
    const planejadas = ((planejadasData ?? []) as unknown as { tecnicas: { nome: string } | null }[])
      .map(p => p.tecnicas?.nome)
      .filter((n): n is string => Boolean(n))
    return {
      id: aula.id,
      video_url: aula.video_url,
      turma_nome: aula.turmas?.nome ?? null,
      tema: aula.tema?.nome ?? null,
      confirmados,
      planejadas,
    }
  }))

  const aulaIds = aulasAtivas.map(a => a.id)
  const { data: checkins } = aulaIds.length > 0
    ? await supabase.from('presencas').select('aula_id').eq('aluno_id', aluno.id).in('aula_id', aulaIds)
    : { data: [] }
  const checkinSet = new Set((checkins ?? []).map(c => c.aula_id))

  // Turmas do aluno (usadas só para "técnicas da semana" e "próximo treino")
  const { data: turmasData } = await supabase
    .from('alunos_turmas')
    .select('turmas(id, nome, dias_semana)')
    .eq('aluno_id', aluno.id)
    .eq('ativo', true)

  const turmas = (turmasData ?? [])
    .map(t => t.turmas as unknown as { id: string; nome: string; dias_semana: string[] | null } | null)
    .filter(Boolean) as { id: string; nome: string; dias_semana: string[] | null }[]

  // Avisos ativos: da academia toda ou das turmas do aluno
  const turmaIdsDoAluno = turmas.map(t => t.id)
  const avisosFiltro = turmaIdsDoAluno.length > 0
    ? `turma_id.is.null,turma_id.in.(${turmaIdsDoAluno.join(',')})`
    : 'turma_id.is.null'
  const { data: avisosData } = await supabase
    .from('avisos')
    .select('id, titulo, corpo, criado_em, turmas(nome)')
    .eq('academia_id', aluno.academia_id)
    .eq('ativo', true)
    .or(avisosFiltro)
    .order('criado_em', { ascending: false })

  // Técnicas da Semana — posições desta semana filtradas pela faixa do aluno
  type PosicaoSemana = { data: string; turma_nome: string | null; posicoes: string[] }
  let tecnicasDaSemana: PosicaoSemana[] = []
  const turmaIds = turmas.map(t => t.id)
  if (turmaIds.length > 0) {
    const today = new Date()
    const dow = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const weekStart = monday.toISOString().split('T')[0]
    const weekEnd = sunday.toISOString().split('T')[0]

    const { data: aulasSemanaisData } = await supabase
      .from('aulas')
      .select('id, data, turma_id, turmas(nome)')
      .in('turma_id', turmaIds)
      .gte('data', weekStart)
      .lte('data', weekEnd)
      .order('data')

    const aulasSemanais = (aulasSemanaisData ?? []) as unknown as {
      id: string; data: string; turma_id: string; turmas: { nome: string } | null
    }[]

    if (aulasSemanais.length > 0) {
      const aulaSemanaisIds = aulasSemanais.map(a => a.id)
      const { data: atData } = await supabase
        .from('aula_tecnicas')
        .select('aula_id, tecnicas(nome, faixas)')
        .in('aula_id', aulaSemanaisIds)
        .in('tipo', ['planejada', 'ensinada'])

      const faixaAluno = aluno.faixa
      tecnicasDaSemana = aulasSemanais.map(a => {
        const turmaObj = a.turmas as unknown as { nome: string } | null
        const ats = (atData ?? []).filter(at => at.aula_id === a.id)
        const posicoes = ats
          .map(at => at.tecnicas as unknown as { nome: string; faixas: string[] } | null)
          .filter((t): t is { nome: string; faixas: string[] } => Boolean(t))
          .filter(t => t.faixas.length === 0 || t.faixas.includes(faixaAluno))
          .map(t => t.nome)
        return { data: a.data, turma_nome: turmaObj?.nome ?? null, posicoes }
      }).filter(a => a.posicoes.length > 0)
    }
  }

  // Próximas aulas agendadas das turmas do aluno (só quando não há aula ao vivo)
  type ProximaAula = {
    id: string
    data: string
    horario: string | null
    turma_nome: string | null
    confirmados: number
    euVou: boolean
    tecnicas: string[]
  }
  let proximas: ProximaAula[] = []
  const hoje = new Date().toISOString().split('T')[0]

  if (aulasAtivas.length === 0 && turmaIds.length > 0) {
    const { data: proximasData } = await supabase
      .from('aulas')
      .select('id, data, hora_inicio, turma_id, turmas(nome), aula_tecnicas(tipo, tecnicas(nome))')
      .eq('academia_id', aluno.academia_id)
      .eq('status', 'agendada')
      .in('turma_id', turmaIds)
      .gte('data', hoje)
      .order('data')
      .order('hora_inicio')
      .limit(5)

    type ProximaRow = {
      id: string; data: string; hora_inicio: string | null
      turmas: { nome: string } | null
      aula_tecnicas: { tipo: string; tecnicas: { nome: string } | null }[] | null
    }
    const proximasRows = (proximasData ?? []) as unknown as ProximaRow[]
    const proximasIds = proximasRows.map(a => a.id)

    const { data: confirmacoesData } = proximasIds.length > 0
      ? await supabase.from('presencas').select('aula_id, aluno_id').in('aula_id', proximasIds)
      : { data: [] }

    const confirmacoes = (confirmacoesData ?? []) as { aula_id: string; aluno_id: string | null }[]
    const confirmacoesCount = new Map<string, number>()
    const meusIds = new Set<string>()
    for (const c of confirmacoes) {
      confirmacoesCount.set(c.aula_id, (confirmacoesCount.get(c.aula_id) ?? 0) + 1)
      if (c.aluno_id === aluno.id) meusIds.add(c.aula_id)
    }

    proximas = proximasRows.map(a => ({
      id: a.id,
      data: a.data,
      horario: a.hora_inicio,
      turma_nome: a.turmas?.nome ?? null,
      confirmados: confirmacoesCount.get(a.id) ?? 0,
      euVou: meusIds.has(a.id),
      tecnicas: (a.aula_tecnicas ?? [])
        .filter(at => at.tipo === 'planejada')
        .map(at => at.tecnicas?.nome)
        .filter((n): n is string => Boolean(n)),
    }))
  }

  // Empty state: próximo treino + treinos no mês (só quando nem ao vivo nem agendada)
  const semNadaAgora = aulasAtivas.length === 0 && proximas.length === 0
  const proximoTreino = semNadaAgora ? calcularProximoTreino(turmas) : null
  const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const { count: treinosMes } = semNadaAgora
    ? await supabase.from('presencas').select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id).gte('registrado_em', primeiroDiaMes.toISOString())
    : { count: null }

  return (
    <div>
      <div style={{ height: 3, background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF' }} />
      <header
        className="flex items-center gap-3 px-5 pt-safe pb-4"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <AvatarUpload
          entityId={aluno.id}
          nome={aluno.nome}
          fotoUrlAtual={aluno.foto_url}
          persist={updateFotoPropria}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold leading-tight truncate" style={{ color: 'var(--brand-texto)' }}>
            {aluno.nome.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF' }} />
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand-texto-muted)' }}>
              {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
            </p>
          </div>
        </div>
        <PushSubscribeButton />
      </header>

      <main className="px-5 pt-5 space-y-5">

        {/* Avisos */}
        {(avisosData ?? []).length > 0 && (
          <div className="space-y-2">
            {(avisosData ?? []).map(a => {
              const turma = a.turmas as unknown as { nome: string } | null
              return (
                <div key={a.id} className="rounded-2xl p-4"
                  style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{a.titulo}</p>
                    <span className="text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--brand-gold)' }}>
                      {turma?.nome ?? 'Geral'}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-sec)' }}>{a.corpo}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Check-in ao vivo */}
        {aulasAtivas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--brand-gold)' }} />
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--brand-gold)' }}>
                Aula ao vivo agora
              </p>
            </div>
            {aulasAtivas.map(aula => (
              <CheckinCard key={aula.id} aula={aula} jaFezCheckin={checkinSet.has(aula.id)} />
            ))}
          </div>
        )}

        {/* Próximas aulas agendadas — só quando não há aula ao vivo */}
        {aulasAtivas.length === 0 && proximas.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Próximas aulas
            </p>
            <div className="space-y-2">
              {proximas.map(p => {
                const d = new Date(p.data + 'T12:00:00')
                const dataFmt = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
                return (
                  <div key={p.id} className="rounded-2xl p-4"
                    style={{
                      background: p.euVou ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
                      border: `1px solid ${p.euVou ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
                    }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
                          {p.turma_nome ?? 'Aula'}
                        </p>
                        <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
                          {dataFmt}{p.horario ? ` · ${p.horario.substring(0, 5)}` : ''} · {p.confirmados} vão
                        </p>
                        {p.tecnicas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.tecnicas.map((t, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded"
                                style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ConfirmarPresencaButton aulaId={p.id} confirmado={p.euVou} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state — próximo treino + contagem do mês */}
        {semNadaAgora && (
          <div className="rounded-2xl px-5 py-6 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma aula ao vivo agora
            </p>
            {proximoTreino && (
              <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--brand-texto)' }}>
                Próximo treino: <span style={{ color: 'var(--brand-gold)' }}>{proximoTreino}</span>
              </p>
            )}
            {(treinosMes ?? 0) > 0 && (
              <p className="text-[11px] mt-3" style={{ color: 'var(--brand-texto-muted)' }}>
                <span style={{ color: 'var(--brand-gold)', fontWeight: 700, fontSize: 18 }}>{treinosMes}</span>
                {' '}treinos este mês
              </p>
            )}
          </div>
        )}

        {/* Técnicas da Semana */}
        {tecnicasDaSemana.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Técnicas da semana
            </p>
            <div className="space-y-2">
              {tecnicasDaSemana.map((item, i) => {
                const d = new Date(item.data + 'T12:00:00')
                const dataFmt = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
                return (
                  <div key={i} className="px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium capitalize" style={{ color: 'var(--brand-texto-sec)' }}>{dataFmt}</p>
                      {item.turma_nome && (
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--brand-gold)' }}>
                          {item.turma_nome}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.posicoes.map((pos, j) => (
                        <span key={j}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                          {pos}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
