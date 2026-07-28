import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import CheckinCard from './checkin'
import AvatarUpload from '@/components/avatar-upload'
import { updateFotoPropria } from './actions'
import PushSubscribeButton from './push-subscribe'
import ConfirmarPresencaButton from './confirmar-button'
import { graduacaoInsight } from '@/lib/graduacao-insight'
import JornadaBanner from '@/components/jornada-banner'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type HomeInsights = {
  tecnica_reforcar: { nome: string; categoria_nome: string; categoria_id: string; ultima_vez: string } | null
  presencas_30d: number
  tecnicas_aprendidas: number
  melhor_categoria: { nome: string; id: string; vistas: number; total: number } | null
  ultima_aula: { data: string; turma_nome: string | null; tecnicas: string[] } | null
}

export default async function AlunoHomePage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // Celebração de graduação pendente — tem prioridade sobre tudo
  if (aluno.celebrar_graduacao) redirect('/aluno/celebracao')

  const [{ data: insightsRaw }, { data: streakData }, { data: ultimaFotoData }, { count: totalPresencas }] = await Promise.all([
    supabase.rpc('aluno_home_insights', { p_aluno_id: aluno.id }),
    supabase.rpc('calcular_streak_aluno', { p_aluno_id: aluno.id }),
    // Foto da última aula finalizada que o aluno participou (pra "última aula")
    supabase.from('presencas')
      .select('registrado_em, aulas!inner(foto_url, status)')
      .eq('aluno_id', aluno.id)
      .eq('aulas.status', 'finalizada')
      .order('registrado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Presenças de todos os tempos (qualquer status) — pra saber se é aluno
    // realmente novo. Inclui check-in em aula ao vivo (aberta).
    supabase.from('presencas')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id),
  ])
  const insights = insightsRaw as HomeInsights | null
  const streak = (streakData as number | null) ?? 0
  const fotoUltimaAula = (ultimaFotoData?.aulas as unknown as { foto_url: string | null } | null)?.foto_url ?? null
  const alunoNuncaTreinou = (totalPresencas ?? 0) === 0

  // Perfil incompleto: falta nascimento OU saúde nunca foi preenchida (null).
  // condicoes_saude === '' conta como preenchido ("sem condições").
  const perfilIncompleto = !aluno.data_nascimento || aluno.condicoes_saude === null

  // Análise de graduação — na home só quando notável (conquista recente
  // ou próxima faixa perto), pra não repetir mensagem ambiente todo dia.
  const gradInsight = graduacaoInsight(aluno.faixa, aluno.grau, aluno.graduado_em, aluno.grau_em)

  // ── Momentos da Jornada (banners instagramáveis) ──
  const hojeDate = new Date()
  const mesHoje = hojeDate.getMonth() + 1
  const diaHoje = hojeDate.getDate()

  // Datas do banco vêm como 'YYYY-MM-DD' → comparar em UTC evita drift de fuso.
  const dataNasc = aluno.data_nascimento ? new Date(aluno.data_nascimento) : null
  const isAniversario = dataNasc !== null
    && (dataNasc.getUTCMonth() + 1) === mesHoje
    && dataNasc.getUTCDate() === diaHoje

  let isAnual = false
  let anosNaAcademia = 0
  if (aluno.matriculado_em) {
    const dataMatricula = new Date(aluno.matriculado_em)
    anosNaAcademia = hojeDate.getFullYear() - dataMatricula.getUTCFullYear()
    const anivAcad = new Date(hojeDate.getFullYear(), dataMatricula.getUTCMonth(), dataMatricula.getUTCDate())
    const diffAniv = Math.abs(hojeDate.getTime() - anivAcad.getTime()) / 86400000
    isAnual = anosNaAcademia >= 1 && diffAniv <= 7
  }

  const isMensal = diaHoje <= 7
  const momentoPrimario = isAniversario ? 'aniversario' : isAnual ? 'anual' : null

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
    const [{ data: quemVaiData }, { data: tecnicasData }] = await Promise.all([
      supabase.rpc('quem_vai', { p_aula_id: aula.id }),
      supabase.from('aula_tecnicas')
        .select('tipo, tecnicas(nome, categorias_tecnicas(nome))')
        .eq('aula_id', aula.id)
        .in('tipo', ['planejada', 'ensinada']),
    ])
    const confirmados = (quemVaiData ?? []) as { nome: string; visitante: boolean }[]
    type TecRow = { tipo: string; tecnicas: { nome: string; categorias_tecnicas: { nome: string } | null } | null }
    const tecs = (tecnicasData ?? []) as unknown as TecRow[]
    const planejadas = tecs.filter(t => t.tipo === 'planejada').map(t => t.tecnicas?.nome).filter((n): n is string => Boolean(n))
    const ensinadas = tecs.filter(t => t.tipo === 'ensinada').map(t => t.tecnicas?.nome).filter((n): n is string => Boolean(n))
    // Tema derivado das categorias das posições (fallback pro tema_id antigo)
    const temasDerivados = [...new Set(tecs.map(t => t.tecnicas?.categorias_tecnicas?.nome).filter(Boolean))] as string[]
    return {
      id: aula.id,
      video_url: aula.video_url,
      turma_nome: aula.turmas?.nome ?? null,
      tema: temasDerivados.length > 0 ? temasDerivados.join(' · ') : (aula.tema?.nome ?? null),
      confirmados,
      planejadas,
      ensinadas,
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

  return (
    <div>
      <div style={{ height: 3, background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF' }} />
      <header
        className="flex items-center justify-between gap-3 px-4 pt-safe pb-4"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <AvatarUpload
            entityId={aluno.id}
            nome={aluno.nome}
            fotoUrlAtual={aluno.foto_url}
            persist={updateFotoPropria}
            size={52}
          />
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold truncate" style={{ color: 'var(--brand-texto)', lineHeight: 1.1 }}>
              {aluno.nome.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF', flexShrink: 0 }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: '#888' }}>
                {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
              </span>
            </div>
            {/* Streak — só aparece com ≥ 1 semana seguida */}
            {streak > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">🔥</span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--brand-gold)' }}>
                  {streak} semana{streak > 1 ? 's' : ''} seguida{streak > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
        <PushSubscribeButton />
      </header>

      <main className="px-4 pt-5 space-y-5">

        {/* ── Momentos da Jornada — banners instagramáveis dismissíveis ── */}
        {(momentoPrimario || isMensal) && (
          <div className="space-y-2">
            {momentoPrimario === 'aniversario' && (
              <JornadaBanner
                tipo="aniversario"
                emoji="🎂"
                titulo={`Feliz aniversário, ${aluno.nome.split(' ')[0]}!`}
                subtitulo="Toque para ver seu card e compartilhar →"
                href="/aluno/momento/aniversario"
              />
            )}
            {momentoPrimario === 'anual' && (
              <JornadaBanner
                tipo="anual"
                emoji="🏆"
                titulo={`${anosNaAcademia} ${anosNaAcademia === 1 ? 'ano' : 'anos'} no tatame!`}
                subtitulo="Veja seu ano em treinos →"
                href="/aluno/momento/anual"
              />
            )}
            {isMensal && (
              <JornadaBanner
                tipo="mensal"
                emoji="📅"
                titulo={`Seu ${MESES[mesHoje - 1]} no tatame`}
                subtitulo="Veja o resumo do mês →"
                href="/aluno/momento/mensal"
              />
            )}
          </div>
        )}

        {/* Complete seu perfil — some sozinho quando nascimento + saúde preenchidos */}
        {perfilIncompleto && (
          <Link href="/aluno/perfil"
            className="flex items-center justify-between px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--brand-gold)' }}>
                Complete seu perfil
              </p>
              <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                Adicione data de nascimento e informações de saúde
              </p>
            </div>
            <span className="text-sm flex-shrink-0 ml-3" style={{ color: 'var(--brand-gold)' }}>→</span>
          </Link>
        )}

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
                  <div key={p.id} className="relative rounded-2xl p-4 active:opacity-80 transition-opacity"
                    style={{
                      background: p.euVou ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
                      border: `1px solid ${p.euVou ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
                    }}>
                    {/* Link cobre o card inteiro (z-0) — navega pro detalhe */}
                    <Link href={`/aluno/aula/${p.id}`}
                      className="absolute inset-0 z-0 rounded-2xl"
                      aria-label={`Ver detalhes da aula ${p.turma_nome ?? ''}`} />
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
                      {/* Botão de confirmar fica acima do Link (z-10) */}
                      <div className="relative z-10 flex-shrink-0">
                        <ConfirmarPresencaButton aulaId={p.id} confirmado={p.euVou} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-3">
          {/* Análise de graduação — celebra conquista / avisa próxima faixa */}
          {gradInsight.notavel && (
            <Link href="/aluno/perfil"
              className="block rounded-2xl p-4 active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
              <div className="flex gap-3 items-start">
                <span className="text-2xl leading-none flex-shrink-0">{gradInsight.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--brand-gold)' }}>{gradInsight.titulo}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--brand-texto-sec)' }}>{gradInsight.texto}</p>
                </div>
              </div>
            </Link>
          )}

          {/* Hora de revisar — só aparece se há técnica stale (>21d) */}
          {insights?.tecnica_reforcar && (() => {
            const dias = Math.floor(
              (Date.now() - new Date(insights.tecnica_reforcar.ultima_vez + 'T12:00:00').getTime()) / 86400000
            )
            return (
              <Link href={`/aluno/tecnicas/${insights.tecnica_reforcar.categoria_id}`}
                className="block rounded-2xl p-4 active:scale-[0.98] transition-transform"
                style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-gold)' }}>
                  ⟳ Hora de revisar
                </p>
                <p className="font-bold text-[15px]" style={{ color: 'var(--brand-texto)' }}>
                  {insights.tecnica_reforcar.nome}
                </p>
                <p className="text-xs mt-1" style={{ color: '#888' }}>
                  Você viu essa técnica <strong style={{ color: 'var(--brand-texto)' }}>{dias} dias atrás</strong>. Já está esquecendo?
                </p>
                <p className="text-[10px] mt-2 underline underline-offset-2" style={{ color: 'var(--brand-gold)' }}>
                  Ver em {insights.tecnica_reforcar.categoria_nome} →
                </p>
              </Link>
            )
          })()}

          {/* Stats strip */}
          {((insights?.presencas_30d ?? 0) > 0 || (insights?.tecnicas_aprendidas ?? 0) > 0) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="font-bold text-[28px] leading-none" style={{ color: 'var(--brand-texto)' }}>
                  {insights?.presencas_30d ?? 0}
                </p>
                <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  aulas este mês
                </p>
              </div>
              <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="font-bold text-[28px] leading-none" style={{ color: 'var(--brand-texto)' }}>
                  {insights?.tecnicas_aprendidas ?? 0}
                </p>
                <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  técnicas aprendidas
                </p>
              </div>
            </div>
          )}

          {/* Progresso na melhor categoria */}
          {insights?.melhor_categoria && (() => {
            const cat = insights.melhor_categoria
            const pct = cat.total > 0 ? Math.round((cat.vistas / cat.total) * 100) : 0
            return (
              <Link href={`/aluno/tecnicas/${cat.id}`}
                className="block rounded-2xl p-4 active:scale-[0.98] transition-transform"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                    Progresso — {cat.nome}
                  </p>
                  <p className="text-xs font-bold" style={{ color: 'var(--brand-gold)' }}>{pct}%</p>
                </div>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--brand-texto)' }}>
                  {cat.vistas} de {cat.total} técnicas
                </p>
                <div style={{ height: 4, background: 'var(--brand-border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-gold)', borderRadius: 4 }} />
                </div>
                {cat.total - cat.vistas > 0 && (
                  <p className="text-[10px] mt-2" style={{ color: '#555' }}>
                    Aprenda mais <strong style={{ color: 'var(--brand-texto)' }}>{cat.total - cat.vistas} técnicas</strong> para completar
                  </p>
                )}
              </Link>
            )
          })()}

          {/* Última aula */}
          {insights?.ultima_aula && (() => {
            const ua = insights.ultima_aula
            const d = new Date(ua.data + 'T12:00:00')
            const dataFmt = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
            return (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                {fotoUltimaAula && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fotoUltimaAula}
                    alt="Foto do último treino"
                    className="w-full object-cover"
                    style={{ maxHeight: 200 }}
                  />
                )}
                <div className="p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
                    Última aula
                  </p>
                  <p className="text-sm font-bold capitalize" style={{ color: 'var(--brand-texto)' }}>
                    {dataFmt}{ua.turma_nome ? ` · ${ua.turma_nome}` : ''}
                  </p>
                  {ua.tecnicas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ua.tecnicas.map((t, i) => (
                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Empty state — só pra aluno que NUNCA teve presença nenhuma
              (inclui check-in ao vivo). Antes usava a janela de 30d, então
              aparecia até pra aluno graduado só por estar sem treino recente. */}
          {alunoNuncaTreinou && (
            <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
                Bem-vindo ao NajaPass!
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
                Sua jornada começa quando o professor registrar sua primeira presença.
              </p>
              <p className="text-xs mt-1" style={{ color: '#333' }}>
                Explore as técnicas do currículo enquanto isso.
              </p>
              <Link href="/aluno/tecnicas" className="inline-block mt-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
                Ver currículo →
              </Link>
            </div>
          )}
        </div>

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
