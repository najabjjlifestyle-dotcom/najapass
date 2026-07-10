import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, LayoutGrid, ClipboardList, Inbox, Megaphone } from 'lucide-react'
import AgendadaCard from '@/components/agendada-card'
import AulaHojeCard from './aula-hoje-card'
import InsightCard from './insight-card'
import Avatar from '@/components/avatar'

// ── helpers ──────────────────────────────────────────────────────────────────

function primeiroNome(nome: string) {
  return nome.split(' ')[0]
}

function formatGreetingDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'short',
  })
}

function formatAulaDate(dataStr: string) {
  const [, month, day] = dataStr.split('-').map(Number)
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return { dia: String(day).padStart(2, '0'), mes: meses[month - 1] }
}

function ultimaAulaLabel(dataStr: string | null) {
  if (!dataStr) return 'nenhuma ainda'
  const hoje = new Date()
  const d = new Date(dataStr + 'T12:00:00')
  const diff = Math.round((hoje.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'última: hoje'
  if (diff === 1) return 'última: ontem'
  return `última: ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
}

type DashboardInsights = {
  turmas_sem_plano: { aula_id: string; turma_nome: string | null; hora: string | null }[] | null
  categoria_esquecida: { categoria_nome: string; dias: number } | null
  aluno_ausente: { aluno_nome: string; aluno_id: string; dias: number } | null
  reforcos_pendentes: number
}

const DIAS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ── page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('id, nome, foto_url, academia_id, academias(nome)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) {
    // Sem linha em professores com academia — não presume que é um
    // professor no meio do onboarding. Pode ser um aluno caindo aqui
    // direto (PWA instalado com start_url antigo, bookmark, etc.).
    if (professor) redirect('/onboarding')
    const { data: aluno } = await supabase.from('alunos').select('id').eq('user_id', user.id).maybeSingle()
    redirect(aluno ? '/aluno' : '/boas-vindas')
  }

  const academia = professor.academias as unknown as { nome: string } | null
  const acadId = professor.academia_id

  const primeiroDiaMes = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString().split('T')[0]
  const hoje = new Date().toISOString().split('T')[0]
  const quatorzeDias = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  const seteDias = new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]

  const [
    { count: totalAlunos },
    { count: turmasAtivas },
    { count: aulasMes },
    solicitacoesRes,
    { data: ultimasAulas },
    { data: ultimaAula },
    { data: aulasHojeData },
    { data: agendadasData },
    { data: semanaData },
    { data: insightsRaw },
  ] = await Promise.all([
    supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).eq('ativo', true),
    supabase.from('turmas').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).eq('ativa', true),
    supabase.from('aulas').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).gte('data', primeiroDiaMes),
    supabase.from('solicitacoes').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).eq('status', 'pendente').then(r => r.error ? { count: 0 } : r),
    supabase.from('aulas').select('id, data, status, turmas(nome), presencas(id)').eq('academia_id', acadId).order('data', { ascending: false }).order('hora_inicio', { ascending: false }).limit(3),
    supabase.from('aulas').select('data').eq('academia_id', acadId).order('data', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('aulas')
      .select('id, status, hora_inicio, turmas(nome), presencas(id)')
      .eq('academia_id', acadId)
      .eq('data', hoje)
      .in('status', ['agendada', 'aberta', 'finalizada'])
      .order('hora_inicio'),
    supabase.from('aulas')
      .select('id, data, hora_inicio, turmas(nome), presencas(id)')
      .eq('academia_id', acadId)
      .eq('status', 'agendada')
      .gt('data', hoje)
      .lte('data', quatorzeDias)
      .order('data')
      .order('hora_inicio')
      .limit(5),
    supabase.from('aulas')
      .select('id, data, status')
      .eq('academia_id', acadId)
      .gte('data', hoje)
      .lte('data', seteDias)
      .in('status', ['agendada', 'aberta', 'finalizada'])
      .order('data'),
    supabase.rpc('professor_dashboard_insights', { p_academia_id: acadId }).then(r => r.error ? { data: null } : r),
  ])

  const pendentes = solicitacoesRes.count ?? 0
  const nome = professor.nome
  const insights = insightsRaw as DashboardInsights | null

  // ── Hoje: técnicas planejadas das aulas ainda agendadas (chips do card) ──
  const aulasHojeIds = (aulasHojeData ?? []).map(a => a.id)
  const aulasHojeAgendadasIds = (aulasHojeData ?? []).filter(a => a.status === 'agendada').map(a => a.id)

  const { data: tecnicasHojeData } = aulasHojeAgendadasIds.length > 0
    ? await supabase
        .from('aula_tecnicas')
        .select('aula_id, reforco, tecnicas(nome)')
        .in('aula_id', aulasHojeAgendadasIds)
        .eq('tipo', 'planejada')
    : { data: [] }

  type TecHojeRow = { aula_id: string; reforco: boolean; tecnicas: { nome: string } | null }
  const tecnicasPorAulaHoje = ((tecnicasHojeData ?? []) as unknown as TecHojeRow[]).reduce<Record<string, { nome: string; reforco: boolean }[]>>((acc, r) => {
    if (!r.tecnicas) return acc
    if (!acc[r.aula_id]) acc[r.aula_id] = []
    acc[r.aula_id].push({ nome: r.tecnicas.nome, reforco: r.reforco })
    return acc
  }, {})

  const aulasHoje = (aulasHojeData ?? []).map(a => ({
    id: a.id,
    status: a.status as 'agendada' | 'aberta' | 'finalizada',
    hora_inicio: a.hora_inicio as string | null,
    turma_nome: (a.turmas as unknown as { nome: string } | null)?.nome ?? null,
    tecnicas: tecnicasPorAulaHoje[a.id] ?? [],
    presentes: (a.presencas as unknown as { id: string }[] | null)?.length ?? 0,
  }))

  const agendadas = (agendadasData ?? []).map(a => ({
    id: a.id,
    data: a.data,
    hora_inicio: a.hora_inicio as string | null,
    turma_nome: (a.turmas as unknown as { nome: string } | null)?.nome ?? null,
    confirmados: (a.presencas as unknown as { id: string }[] | null)?.length ?? 0,
  }))

  // ── Semana: mini-grid dos próximos 7 dias ──
  const semanaAulas = (semanaData ?? []) as unknown as { id: string; data: string; status: string }[]
  const semanaAulaIds = semanaAulas.map(a => a.id)
  const { data: semanaTecData } = semanaAulaIds.length > 0
    ? await supabase.from('aula_tecnicas').select('aula_id').in('aula_id', semanaAulaIds)
    : { data: [] }
  const aulaIdsComTecnica = new Set((semanaTecData ?? []).map(t => t.aula_id))

  const diasDaSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000)
    const dataStr = d.toISOString().split('T')[0]
    const aulasDoDia = semanaAulas.filter(a => a.data === dataStr)
    return {
      dataStr,
      label: DIAS_ABBR[d.getDay()],
      diaNum: d.getDate(),
      isHoje: i === 0,
      aulas: aulasDoDia.map(a => ({
        status: a.status,
        cor: a.status === 'aberta' ? '#4ADE80'
          : a.status === 'finalizada' ? 'rgba(74,222,128,0.4)'
          : aulaIdsComTecnica.has(a.id) ? 'var(--brand-gold)'
          : '#444',
      })),
    }
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <Link href="/perfil" className="flex items-center gap-2 active:opacity-70 transition-opacity">
          <div className="rounded-full" style={{ border: '1px solid var(--brand-gold)' }}>
            <Avatar nome={nome} fotoUrl={professor.foto_url as string | null} size={36} />
          </div>
          <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
            {primeiroNome(nome)}
          </p>
        </Link>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            {academia?.nome?.split(' ')[0] ?? 'Naja BJJ'}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto)' }}>
            {academia?.nome?.split(' ').slice(1).join(' ') ?? 'LIFESTYLE'}
          </p>
        </div>
      </header>

      {/* ── Greeting ── */}
      <div className="px-5 py-4">
        <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
          {formatGreetingDate()}
        </p>
        <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--brand-texto)' }}>
          Olá, <span style={{ color: 'var(--brand-gold)' }}>{primeiroNome(nome)}</span>
        </h1>
      </div>

      {/* ── HOJE ── */}
      <section className="px-4 mb-4">
        <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
          Hoje
        </p>

        {aulasHoje.length > 0 ? (
          <div className="space-y-2">
            {aulasHoje.map(a => (
              <AulaHojeCard key={a.id} aula={a} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-2xl px-5 py-4 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                Nenhuma aula hoje.
              </p>
            </div>

            {agendadas.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-2 mt-3" style={{ color: 'var(--brand-texto-muted)' }}>
                  Próximas aulas
                </p>
                <div className="space-y-2">
                  {agendadas.map(aula => (
                    <AgendadaCard key={aula.id} aula={aula} />
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/aulas/nova"
              className="flex items-center justify-between rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-gold)' }}>
              <p className="text-[13px] font-bold uppercase tracking-wide text-black">+ Nova aula</p>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: 'rgba(0,0,0,0.15)', color: 'black' }}>
                →
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* ── INSIGHTS ── */}
      {insights && (
        insights.turmas_sem_plano?.length || insights.categoria_esquecida || insights.aluno_ausente || insights.reforcos_pendentes > 0
      ) && (
        <section className="px-4 mb-4 space-y-1.5">
          {insights.turmas_sem_plano?.[0] && (
            <InsightCard cor="orange" href={`/aulas/${insights.turmas_sem_plano[0].aula_id}`}>
              ⚠ <b style={{ color: '#ccc' }}>{insights.turmas_sem_plano[0].turma_nome ?? 'Aula avulsa'}</b>
              {insights.turmas_sem_plano[0].hora ? ` (${insights.turmas_sem_plano[0].hora.substring(0, 5)})` : ''} — nenhuma técnica planejada. Toque para planejar →
            </InsightCard>
          )}
          {insights.categoria_esquecida && (
            <InsightCard cor="yellow">
              ⏰ Categoria <b style={{ color: '#ccc' }}>{insights.categoria_esquecida.categoria_nome}</b> não ensinada há {insights.categoria_esquecida.dias} dias
            </InsightCard>
          )}
          {insights.aluno_ausente && (
            <InsightCard cor="yellow" href={`/alunos/${insights.aluno_ausente.aluno_id}`}>
              👤 <b style={{ color: '#ccc' }}>{insights.aluno_ausente.aluno_nome}</b> ausente há {insights.aluno_ausente.dias} dias — ver perfil →
            </InsightCard>
          )}
          {insights.reforcos_pendentes > 0 && (
            <InsightCard cor="blue">
              🔁 {insights.reforcos_pendentes} técnica{insights.reforcos_pendentes > 1 ? 's marcadas' : ' marcada'} para reforço esta semana
            </InsightCard>
          )}
        </section>
      )}

      {/* ── SEMANA (mini-grid) ── */}
      <section className="px-4 mb-4">
        <Link href="/semana" className="block active:opacity-80 transition-opacity">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Semana
            </p>
            <span className="text-[10px]" style={{ color: 'var(--brand-gold)' }}>Ver tudo →</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 rounded-2xl p-3" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            {diasDaSemana.map(dia => (
              <div key={dia.dataStr} className="flex flex-col items-center gap-1.5">
                <p className="text-[8px] uppercase" style={{ color: dia.isHoje ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                  {dia.label}
                </p>
                <p className="text-[10px] font-bold" style={{ color: dia.isHoje ? 'var(--brand-gold)' : 'var(--brand-texto-sec)' }}>
                  {dia.diaNum}
                </p>
                <div className="flex flex-col gap-0.5 items-center min-h-[12px]">
                  {dia.aulas.slice(0, 3).map((a, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: a.cor }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Link>
      </section>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-3 gap-1.5 px-4 mb-4">
        {[
          { valor: String(aulasMes ?? 0), label: 'aulas no mês' },
          { valor: String(totalAlunos ?? 0), label: 'alunos ativos' },
          { valor: String(turmasAtivas ?? 0), label: 'turmas ativas' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl px-3 py-2.5"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-[18px] font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>
              {s.valor}
            </p>
            <p className="text-[9px] uppercase tracking-wide mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Grid de Ações ── */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-4">
        {[
          {
            href: '/alunos',
            Icon: Users,
            label: 'Alunos',
            sub: `${totalAlunos ?? 0} ativos`,
            pendente: false,
          },
          {
            href: '/turmas',
            Icon: LayoutGrid,
            label: 'Turmas',
            sub: `${turmasAtivas ?? 0} turmas`,
            pendente: false,
          },
          {
            href: '/aulas',
            Icon: ClipboardList,
            label: 'Histórico',
            sub: ultimaAulaLabel(ultimaAula?.data ?? null),
            pendente: false,
          },
          {
            href: '/solicitacoes',
            Icon: Inbox,
            label: 'Solicitações',
            sub: pendentes > 0 ? `${pendentes} pendente${pendentes !== 1 ? 's' : ''}` : 'nenhuma pendente',
            pendente: pendentes > 0,
          },
        ].map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="relative rounded-2xl p-3.5 flex flex-col gap-2.5 active:scale-[0.98] transition-transform"
            style={{
              background: card.pendente ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
              border: `1px solid ${card.pendente ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
            }}>
            {card.pendente && (
              <span
                className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--brand-gold)' }}
              />
            )}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: card.pendente ? 'var(--brand-gold-dim)' : '#1a1a1a',
                border: `1px solid ${card.pendente ? 'var(--brand-gold-border)' : '#222'}`,
                color: card.pendente ? 'var(--brand-gold)' : 'var(--brand-texto-sec)',
              }}>
              <card.Icon size={15} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
                {card.label}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: card.pendente ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                {card.sub}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Avisos ── */}
      <div className="px-4 mb-3">
        <Link href="/avisos"
          className="flex items-center justify-between rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--brand-texto)' }}>
              Avisos
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              Comunicados para os alunos
            </p>
          </div>
          <Megaphone size={18} style={{ color: 'var(--brand-gold)' }} />
        </Link>
      </div>

      {/* ── Feed: Últimas Aulas ── */}
      {(ultimasAulas?.length ?? 0) > 0 && (
        <section className="px-4 pt-1 pb-8">
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Últimas aulas
          </p>
          {ultimasAulas!.map(aula => {
            const { dia, mes } = formatAulaDate(aula.data)
            const turma = aula.turmas as unknown as { nome: string } | null
            const presentes = (aula.presencas as unknown as { id: string }[])?.length ?? 0
            return (
              <Link
                key={aula.id}
                href={`/aulas/${aula.id}`}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: '1px solid #141414' }}>
                <div className="text-center w-7 flex-shrink-0">
                  <p className="text-[11px] font-bold" style={{ color: 'var(--brand-texto)' }}>{dia}</p>
                  <p className="text-[8px] uppercase" style={{ color: 'var(--brand-texto-muted)' }}>{mes}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate" style={{ color: '#ccc' }}>
                    {turma?.nome ?? 'Aula avulsa'}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                    {aula.status === 'aberta' ? 'ao vivo' : 'finalizada'}
                  </p>
                </div>
                <span
                  className="text-[8px] px-2 py-0.5 rounded-md whitespace-nowrap"
                  style={{
                    background: 'var(--brand-gold-dim)',
                    color: 'var(--brand-gold)',
                    border: '1px solid var(--brand-gold-border)',
                  }}>
                  {presentes} presentes
                </span>
              </Link>
            )
          })}
        </section>
      )}

    </div>
  )
}
