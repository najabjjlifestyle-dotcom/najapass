import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ── helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

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

// ── page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('id, nome, academia_id, academias(nome)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const academia = professor.academias as unknown as { nome: string } | null
  const acadId = professor.academia_id

  const primeiroDiaMes = new Date(
    new Date().getFullYear(), new Date().getMonth(), 1
  ).toISOString().split('T')[0]

  const [
    { count: totalAlunos },
    { count: turmasAtivas },
    { count: aulasMes },
    solicitacoesRes,
    { data: ultimasAulas },
    { data: ultimaAula },
    { data: aulaAberta },
  ] = await Promise.all([
    supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).eq('ativo', true),
    supabase.from('turmas').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).eq('ativa', true),
    supabase.from('aulas').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).gte('data', primeiroDiaMes),
    supabase.from('solicitacoes').select('id', { count: 'exact', head: true }).eq('academia_id', acadId).eq('status', 'pendente').then(r => r.error ? { count: 0 } : r),
    supabase.from('aulas').select('id, data, status, turmas(nome), presencas(id)').eq('academia_id', acadId).order('data', { ascending: false }).order('hora_inicio', { ascending: false }).limit(3),
    supabase.from('aulas').select('data').eq('academia_id', acadId).order('data', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('aulas').select('id, turmas(nome), presencas(id)').eq('academia_id', acadId).eq('status', 'aberta').order('data', { ascending: false }).limit(1).maybeSingle(),
  ])

  const pendentes = solicitacoesRes.count ?? 0
  const nome = professor.nome
  const turmaAulaAberta = aulaAberta?.turmas as unknown as { nome: string } | null
  const presentesAulaAberta = (aulaAberta?.presencas as unknown as { id: string }[] | null)?.length ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <Link
          href="/perfil"
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            border: '1px solid var(--brand-gold)',
            background: 'var(--brand-gold-dim)',
            color: 'var(--brand-gold)',
          }}>
          {iniciais(nome)}
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

      {/* ── Banner: aula aberta agora ── */}
      {aulaAberta && (
        <div className="px-4 mb-3">
          <Link
            href={`/aulas/${aulaAberta.id}`}
            className="flex items-center justify-between rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)' }}>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--brand-gold)' }} />
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--brand-texto)' }}>
                  Aula em andamento
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  {turmaAulaAberta?.nome ?? 'Aula avulsa'} · {presentesAulaAberta} presente{presentesAulaAberta !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
              →
            </div>
          </Link>
        </div>
      )}

      {/* ── CTA Abrir Aula ── */}
      <div className="px-4 mb-3">
        <Link
          href="/aulas/nova"
          className="flex items-center justify-between rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-gold)' }}>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-black">Abrir aula</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,0,0,0.5)' }}>Inicie o treino de hoje</p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'rgba(0,0,0,0.15)', color: 'black' }}>
            →
          </div>
        </Link>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-3 gap-1.5 px-4 mb-3">
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
            icon: '👥',
            label: 'Alunos',
            sub: `${totalAlunos ?? 0} ativos`,
            pendente: false,
          },
          {
            href: '/turmas',
            icon: '📋',
            label: 'Turmas',
            sub: `${turmasAtivas ?? 0} turmas`,
            pendente: false,
          },
          {
            href: '/aulas',
            icon: '📅',
            label: 'Histórico',
            sub: ultimaAulaLabel(ultimaAula?.data ?? null),
            pendente: false,
          },
          {
            href: '/solicitacoes',
            icon: '📨',
            label: 'Solicitações',
            sub: pendentes > 0 ? `${pendentes} pendente${pendentes !== 1 ? 's' : ''}` : 'nenhuma pendente',
            pendente: pendentes > 0,
          },
        ].map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="relative rounded-2xl p-3.5 flex flex-col gap-2.5"
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
              className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
              style={{
                background: card.pendente ? 'var(--brand-gold-dim)' : '#1a1a1a',
                border: `1px solid ${card.pendente ? 'var(--brand-gold-border)' : '#222'}`,
              }}>
              {card.icon}
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
          <span style={{ color: 'var(--brand-gold)', fontSize: '18px' }}>📣</span>
        </Link>
      </div>

      {/* ── Técnicas da Semana ── */}
      <div className="px-4 mb-3">
        <Link href="/semana"
          className="flex items-center justify-between rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--brand-texto)' }}>
              Técnicas da Semana
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              Aulas e posições planejadas
            </p>
          </div>
          <span style={{ color: 'var(--brand-gold)', fontSize: '18px' }}>📋</span>
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
