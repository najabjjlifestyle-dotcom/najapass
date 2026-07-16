import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/back-button'

type AulaRow = {
  id: string; data: string; hora_inicio: string | null; status: string
  turmas: { nome: string } | null
  presencas: { id: string }[] | null
}
type FrequenciaStats = {
  total_aulas: number
  media_presentes: number | null
  top_alunos: { nome: string; total: number }[] | null
}

export default async function AulasPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; turma?: string }>
}) {
  const { aba: abaParam, turma: turmaFiltro } = await searchParams
  const aba = abaParam === 'frequencia' ? 'frequencia' : 'conteudo'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')
  const acadId = professor.academia_id

  const { data: turmasData } = await supabase
    .from('turmas')
    .select('id, nome')
    .eq('academia_id', acadId)
    .order('nome')

  const turmaQS = turmaFiltro ? `&turma=${turmaFiltro}` : ''

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard" />
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Histórico
          </h1>
        </div>
        <Link href="/aulas/nova"
          className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          + Aula
        </Link>
      </header>

      {/* Filtro de turma — chips horizontais */}
      <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link
          href={`/aulas?aba=${aba}`}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
          style={!turmaFiltro
            ? { background: 'var(--brand-gold)', color: '#000' }
            : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
          }>
          Todas
        </Link>
        {(turmasData ?? []).map(t => (
          <Link
            key={t.id}
            href={`/aulas?aba=${aba}&turma=${t.id}`}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            style={turmaFiltro === t.id
              ? { background: 'var(--brand-gold)', color: '#000' }
              : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
            }>
            {t.nome}
          </Link>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-2 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href={`/aulas?aba=conteudo${turmaQS}`}
          className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
          style={{
            background: aba === 'frequencia' ? 'transparent' : 'var(--brand-gold)',
            color: aba === 'frequencia' ? 'var(--brand-texto-muted)' : '#000',
          }}>
          Conteúdo
        </Link>
        <Link href={`/aulas?aba=frequencia${turmaQS}`}
          className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
          style={{
            background: aba === 'frequencia' ? 'var(--brand-gold)' : 'transparent',
            color: aba === 'frequencia' ? '#000' : 'var(--brand-texto-muted)',
          }}>
          Frequência
        </Link>
      </div>

      {aba === 'conteudo' && <ConteudoTab acadId={acadId} turmaFiltro={turmaFiltro} />}
      {aba === 'frequencia' && <FrequenciaTab acadId={acadId} turmaFiltro={turmaFiltro} />}
    </div>
  )
}

// ── Aba: Conteúdo ────────────────────────────────────────────────────────────

async function ConteudoTab({ acadId, turmaFiltro }: { acadId: string; turmaFiltro?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('aulas')
    .select('id, data, hora_inicio, status, turmas(nome), presencas(id)')
    .eq('academia_id', acadId)
    .in('status', ['finalizada', 'aberta'])
    .order('data', { ascending: false })
    .limit(60)

  if (turmaFiltro) query = query.eq('turma_id', turmaFiltro)

  const { data: aulasData } = await query
  const aulas = (aulasData ?? []) as unknown as AulaRow[]

  if (aulas.length === 0) {
    return (
      <main className="px-5 pt-10 pb-10">
        <p className="text-sm text-center" style={{ color: 'var(--brand-texto-muted)' }}>
          Nenhuma aula registrada no período.
        </p>
      </main>
    )
  }

  type MesGroup = { label: string; aulas: AulaRow[] }
  const grupos = aulas.reduce<MesGroup[]>((acc, aula) => {
    const mesLabel = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
      month: 'long', year: 'numeric',
    })
    const grupo = acc.find(g => g.label === mesLabel)
    if (grupo) grupo.aulas.push(aula)
    else acc.push({ label: mesLabel, aulas: [aula] })
    return acc
  }, [])

  return (
    <main className="pt-2 pb-10">
      <p className="text-[10px] px-5 pb-1 uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        {aulas.length} aula{aulas.length !== 1 ? 's' : ''} registrada{aulas.length !== 1 ? 's' : ''}
        {turmaFiltro ? '' : ' · todas as turmas'}
      </p>
      {grupos.map(grupo => (
        <div key={grupo.label}>
          <p className="text-[9px] uppercase tracking-widest px-5 py-2 capitalize" style={{ color: 'var(--brand-gold)' }}>
            {grupo.label}
          </p>
          <div className="px-5 space-y-1.5 mb-2">
            {grupo.aulas.map(aula => {
              const turma = aula.turmas
              const presentes = (aula.presencas ?? []).length
              const d = new Date(aula.data + 'T12:00:00')
              return (
                <Link key={aula.id} href={`/aulas/${aula.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

                  {/* Data */}
                  <div className="text-center w-8 flex-shrink-0">
                    <p className="text-sm font-bold leading-none" style={{ color: 'var(--brand-texto)' }}>
                      {d.getDate().toString().padStart(2, '0')}
                    </p>
                    <p className="text-[8px] uppercase mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                      {d.toLocaleDateString('pt-BR', { month: 'short' })}
                    </p>
                  </div>

                  {/* Turma + status */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
                      {turma?.nome ?? 'Aula avulsa'}
                    </p>
                    <p className="text-[10px]" style={{ color: aula.status === 'aberta' ? '#4ADE80' : 'var(--brand-texto-muted)' }}>
                      {aula.hora_inicio ? `${aula.hora_inicio.substring(0, 5)} · ` : ''}
                      {aula.status === 'aberta' ? 'ao vivo' : 'finalizada'}
                    </p>
                  </div>

                  {/* Presença */}
                  {presentes > 0 && (
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--brand-texto-muted)' }}>
                      {presentes} 🥋
                    </span>
                  )}

                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--brand-gold)' }}>→</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </main>
  )
}

// ── Aba: Frequência ──────────────────────────────────────────────────────────

async function FrequenciaTab({ acadId, turmaFiltro }: { acadId: string; turmaFiltro?: string }) {
  const supabase = await createClient()

  const { data: statsRaw } = await supabase.rpc('frequencia_resumo', {
    p_academia_id: acadId,
    p_turma_id: turmaFiltro || null,
    p_dias: 90,
  })
  const stats = statsRaw as FrequenciaStats | null

  if (!stats || stats.total_aulas === 0) {
    return (
      <main className="px-5 pt-10 pb-10">
        <p className="text-sm text-center" style={{ color: 'var(--brand-texto-muted)' }}>
          Nenhuma aula finalizada nos últimos 90 dias.
        </p>
      </main>
    )
  }

  return (
    <main className="px-5 pt-4 pb-10 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Aulas (90d)</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--brand-texto)' }}>{stats.total_aulas}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>Média/aula</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--brand-texto)' }}>{stats.media_presentes ?? '—'}</p>
        </div>
      </div>

      {(stats.top_alunos ?? []).length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
            Mais assíduos — últimos 90 dias
          </p>
          {(stats.top_alunos ?? []).map((aluno, i) => (
            <div key={aluno.nome} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: '1px solid var(--brand-border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold w-4 text-center"
                  style={{ color: i === 0 ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                  {i + 1}
                </span>
                <p className="text-sm" style={{ color: 'var(--brand-texto)' }}>{aluno.nome}</p>
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--brand-texto-muted)' }}>
                {aluno.total} aulas
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
