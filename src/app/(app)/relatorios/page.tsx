import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/back-button'
import Avatar from '@/components/avatar'
import { getPeriodoDatas } from '@/lib/periodo'

const FAIXA_COR_HEX: Record<string, string> = {
  branca: '#fff', cinza: '#9CA3AF', amarela: '#FBBF24', laranja: '#F97316',
  verde: '#16A34A', azul: '#2563EB', roxa: '#7C3AED', marrom: '#92400E', preta: '#374151',
}

const THRESHOLD_GRAU: Record<string, number> = {
  branca: 40, cinza: 40, amarela: 50, laranja: 50,
  verde: 60, azul: 80, roxa: 100, marrom: 120, preta: 0,
}

const PERIODOS = [
  { value: 'mes', label: 'Mês' },
  { value: 'trimestre', label: '3M' },
  { value: 'ano', label: 'Ano' },
]

const TABS = [
  { value: 'tecnicas', label: 'Técnicas' },
  { value: 'alunos', label: 'Alunos' },
  { value: 'frequencia', label: 'Frequência' },
]

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; aba?: string }>
}) {
  const params = await searchParams
  const periodo = params.periodo ?? 'mes'
  const aba = params.aba ?? 'tecnicas'
  const { dataInicio, dataFim, label: labelPeriodo } = getPeriodoDatas(periodo)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')
  const acadId = professor.academia_id

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-3 mb-1">
          <BackButton href="/dashboard" />
          <p className="text-[10px] uppercase tracking-widest capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            {labelPeriodo}
          </p>
        </div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--brand-texto)' }}>
          Insights <span style={{ color: 'var(--brand-gold)' }}>da academia</span>
        </h1>

        <div className="flex gap-1 mt-3">
          {PERIODOS.map(op => (
            <Link
              key={op.value}
              href={`?periodo=${op.value}&aba=${aba}`}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={periodo === op.value
                ? { background: 'var(--brand-gold)', color: '#000' }
                : { background: 'var(--brand-surf)', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
              }>
              {op.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 mt-2">
          {TABS.map(t => (
            <Link
              key={t.value}
              href={`?periodo=${periodo}&aba=${t.value}`}
              className="flex-1 text-center px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={aba === t.value
                ? { background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }
                : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
              }>
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="px-5 pt-5 pb-10">
        {aba === 'tecnicas' && <TecnicasTab acadId={acadId} dataInicio={dataInicio} dataFim={dataFim} />}
        {aba === 'alunos' && <AlunosTab acadId={acadId} dataInicio={dataInicio} dataFim={dataFim} />}
        {aba === 'frequencia' && <FrequenciaTab acadId={acadId} dataInicio={dataInicio} dataFim={dataFim} />}
      </main>
    </div>
  )
}

// ── Aba: Técnicas ──────────────────────────────────────────────────────────

async function TecnicasTab({ acadId, dataInicio, dataFim }: { acadId: string; dataInicio: string; dataFim: string }) {
  const supabase = await createClient()

  const [{ data: ensinadasData }, { data: ultimaAula }, { data: todasTecnicasData }] = await Promise.all([
    supabase
      .from('aula_tecnicas')
      .select('tecnica_id, tecnicas(nome), aulas!inner(data, academia_id)')
      .eq('aulas.academia_id', acadId)
      .eq('tipo', 'ensinada')
      .gte('aulas.data', dataInicio)
      .lte('aulas.data', dataFim),
    supabase
      .from('aulas')
      .select('id')
      .eq('academia_id', acadId)
      .eq('status', 'finalizada')
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tecnicas')
      .select('id, nome, categorias_tecnicas(nome)')
      .or(`academia_id.eq.${acadId},global.eq.true`)
      .order('nome'),
  ])

  type EnsinadaRow = { tecnica_id: string; tecnicas: { nome: string } | null }
  const ensinadas = (ensinadasData ?? []) as unknown as EnsinadaRow[]

  const contagem = new Map<string, { nome: string; count: number }>()
  for (const r of ensinadas) {
    if (!r.tecnicas) continue
    const atual = contagem.get(r.tecnica_id)
    if (atual) atual.count++
    else contagem.set(r.tecnica_id, { nome: r.tecnicas.nome, count: 1 })
  }
  const ranking = Array.from(contagem.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const { data: reforcosData } = ultimaAula
    ? await supabase.from('aula_tecnicas').select('tecnicas(nome)').eq('aula_id', ultimaAula.id).eq('reforco', true)
    : { data: null }
  type ReforcoRow = { tecnicas: { nome: string } | null }
  const reforcos = ((reforcosData ?? []) as unknown as ReforcoRow[])
    .filter(r => r.tecnicas)
    .map(r => ({ nome: r.tecnicas!.nome }))

  type TecnicaRow = { id: string; nome: string; categorias_tecnicas: { nome: string } | null }
  const todasTecnicas = (todasTecnicasData ?? []) as unknown as TecnicaRow[]
  const lacunaTecnicas = todasTecnicas.filter(t => !contagem.has(t.id))

  if (ranking.length === 0 && reforcos.length === 0 && lacunaTecnicas.length === 0) {
    return (
      <p className="text-sm text-center py-16" style={{ color: 'var(--brand-texto-muted)' }}>
        Nenhuma técnica ensinada no período.
      </p>
    )
  }

  return (
    <>
      {ranking.length > 0 && (
        <section className="rounded-2xl p-3.5 mb-2.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
            Mais ensinadas no período
          </p>
          {ranking.map((t, i) => (
            <div key={t.id} className={i < ranking.length - 1 ? 'mb-2.5' : ''}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px]" style={{ color: '#ccc' }}>{t.nome}</span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--brand-gold)' }}>{t.count}x</span>
              </div>
              <div className="rounded" style={{ background: 'var(--brand-border)', height: 5 }}>
                <div className="h-full rounded" style={{ width: `${Math.round(t.count / ranking[0].count * 100)}%`, background: 'var(--brand-gold)' }} />
              </div>
            </div>
          ))}
        </section>
      )}

      {reforcos.length > 0 && (
        <section className="rounded-2xl p-3.5 mb-2.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-gold)' }}>
            Reforço pendente — da última aula
          </p>
          {reforcos.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5"
              style={{ borderBottom: i < reforcos.length - 1 ? '1px solid var(--brand-border)' : 'none' }}>
              <div className="rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: 'var(--brand-gold)' }} />
              <span className="text-xs" style={{ color: 'var(--brand-texto)' }}>{r.nome}</span>
            </div>
          ))}
        </section>
      )}

      {lacunaTecnicas.length > 0 && (
        <section className="rounded-2xl p-3.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>
            ⚠ Não ensinadas no período ({lacunaTecnicas.length})
          </p>
          <p className="text-[10px] mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
            de {todasTecnicas.length} técnicas cadastradas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lacunaTecnicas.slice(0, 20).map(t => (
              <span key={t.id}
                className="px-2 py-0.5 rounded text-[9px]"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {t.nome}
                {t.categorias_tecnicas?.nome && <span className="opacity-50 ml-1">({t.categorias_tecnicas.nome})</span>}
              </span>
            ))}
            {lacunaTecnicas.length > 20 && (
              <span className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
                +{lacunaTecnicas.length - 20} mais
              </span>
            )}
          </div>
        </section>
      )}
    </>
  )
}

// ── Aba: Alunos ────────────────────────────────────────────────────────────

async function AlunosTab({ acadId, dataInicio, dataFim }: { acadId: string; dataInicio: string; dataFim: string }) {
  const supabase = await createClient()

  const { data: alunosAtivos } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, foto_url')
    .eq('academia_id', acadId)
    .eq('ativo', true)

  const alunos = alunosAtivos ?? []
  const alunoIds = alunos.map(a => a.id)

  if (alunos.length === 0) {
    return (
      <p className="text-sm text-center py-16" style={{ color: 'var(--brand-texto-muted)' }}>
        Nenhum aluno ativo cadastrado.
      </p>
    )
  }

  const [{ data: ultimasPresencasData }, { data: presencasPeriodoData }, { data: presencasTotaisData }] = await Promise.all([
    supabase.from('presencas').select('aluno_id, registrado_em').in('aluno_id', alunoIds).order('registrado_em', { ascending: false }),
    supabase.from('presencas').select('aluno_id, aulas!inner(data, academia_id)').eq('aulas.academia_id', acadId).gte('aulas.data', dataInicio).lte('aulas.data', dataFim),
    supabase.from('presencas').select('aluno_id').in('aluno_id', alunoIds),
  ])

  // Alunos sem treinar há +14 dias (ou nunca)
  const ultimaPresencaPorAluno = new Map<string, string>()
  for (const p of ultimasPresencasData ?? []) {
    if (!p.aluno_id || ultimaPresencaPorAluno.has(p.aluno_id)) continue
    ultimaPresencaPorAluno.set(p.aluno_id, p.registrado_em)
  }
  const ausentes = alunos
    .map(a => {
      const ultima = ultimaPresencaPorAluno.get(a.id)
      const diasSemTreinar = ultima ? Math.floor((Date.now() - new Date(ultima).getTime()) / 86400000) : null
      return { ...a, diasSemTreinar }
    })
    .filter(a => a.diasSemTreinar === null || a.diasSemTreinar >= 14)
    .sort((a, b) => (b.diasSemTreinar ?? 9999) - (a.diasSemTreinar ?? 9999))
    .slice(0, 10)

  // Ranking de presença no período
  const contagemPresenca = new Map<string, number>()
  for (const p of presencasPeriodoData ?? []) {
    if (!p.aluno_id) continue
    contagemPresenca.set(p.aluno_id, (contagemPresenca.get(p.aluno_id) ?? 0) + 1)
  }
  const alunosPorId = new Map(alunos.map(a => [a.id, a]))
  const rankingAlunos = Array.from(contagemPresenca.entries())
    .map(([id, presencas]) => {
      const aluno = alunosPorId.get(id)
      return aluno ? { ...aluno, presencas } : null
    })
    .filter((a): a is (typeof alunos)[number] & { presencas: number } => a !== null)
    .sort((a, b) => b.presencas - a.presencas)
    .slice(0, 10)

  // Candidatos a graduação (B-042) — proxy: total de presenças histórico vs. threshold da faixa
  const totalPresencasPorAluno = new Map<string, number>()
  for (const p of presencasTotaisData ?? []) {
    if (!p.aluno_id) continue
    totalPresencasPorAluno.set(p.aluno_id, (totalPresencasPorAluno.get(p.aluno_id) ?? 0) + 1)
  }
  const candidatos = alunos
    .map(a => ({ ...a, totalPresencas: totalPresencasPorAluno.get(a.id) ?? 0, threshold: THRESHOLD_GRAU[a.faixa] ?? 0 }))
    .filter(a => a.faixa !== 'preta' && a.threshold > 0 && a.totalPresencas >= a.threshold)
    .sort((a, b) => (b.totalPresencas - b.threshold) - (a.totalPresencas - a.threshold))
    .slice(0, 10)

  return (
    <>
      {ausentes.length > 0 && (
        <section className="rounded-2xl p-3.5 mb-2.5" style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-gold)' }}>
            Atenção — frequência baixa
          </p>
          {ausentes.map((a, i) => (
            <Link key={a.id} href={`/alunos/${a.id}`}
              className="flex justify-between items-center py-1.5"
              style={{ borderBottom: i < ausentes.length - 1 ? '1px solid var(--brand-gold-border)' : 'none' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--brand-texto)' }}>{a.nome}</span>
              <span className="text-[11px]" style={{ color: 'var(--brand-gold)' }}>
                {a.diasSemTreinar === null ? 'nunca treinou' : `${a.diasSemTreinar}d sem treinar`}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-2xl p-3.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-texto-muted)' }}>
          Ranking de presença
        </p>
        {rankingAlunos.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>Nenhuma presença no período.</p>
        ) : (
          rankingAlunos.map((a, i) => (
            <Link key={a.id} href={`/alunos/${a.id}`}
              className="flex items-center gap-2.5 py-1.5"
              style={{ borderBottom: i < rankingAlunos.length - 1 ? '1px solid #1A1A1A' : 'none' }}>
              <span className="text-[10px] font-bold w-4 text-center flex-shrink-0" style={{ color: 'var(--brand-texto-muted)' }}>{i + 1}</span>
              <Avatar nome={a.nome} fotoUrl={a.foto_url} size={28} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--brand-texto)' }}>{a.nome}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>{a.presencas}</p>
                <p className="text-[9px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>aulas</p>
              </div>
            </Link>
          ))
        )}
      </section>

      {candidatos.length > 0 && (
        <section className="mt-4">
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Candidatos a graduação
          </p>
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            {candidatos.map((c, i) => (
              <Link key={c.id} href={`/alunos/${c.id}`}
                className="flex items-center gap-2.5 py-1.5"
                style={{ borderBottom: i < candidatos.length - 1 ? '1px solid #1A1A1A' : 'none' }}>
                <div className="rounded flex-shrink-0" style={{ width: 6, height: 24, background: FAIXA_COR_HEX[c.faixa] ?? '#fff' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--brand-texto)' }}>{c.nome}</p>
                  <p className="text-[10px] capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
                    {c.faixa} · {c.grau}º grau · {c.totalPresencas} presenças
                  </p>
                </div>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'var(--brand-gold)' }}>graduação →</span>
              </Link>
            ))}
          </div>
          <p className="text-[9px] mt-1.5 px-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Baseado no total de presenças registradas. A decisão de graduar é sempre do professor.
          </p>
        </section>
      )}
    </>
  )
}

// ── Aba: Frequência ────────────────────────────────────────────────────────

async function FrequenciaTab({ acadId, dataInicio, dataFim }: { acadId: string; dataInicio: string; dataFim: string }) {
  const supabase = await createClient()

  const { data: aulasNoPeriodoData } = await supabase
    .from('aulas')
    .select('id, data, presencas(id)')
    .eq('academia_id', acadId)
    .in('status', ['aberta', 'finalizada'])
    .gte('data', dataInicio)
    .lte('data', dataFim)

  type AulaFreq = { id: string; data: string; presencas: { id: string }[] }
  const aulasNoPeriodo = (aulasNoPeriodoData ?? []) as unknown as AulaFreq[]

  const totalAulas = aulasNoPeriodo.length

  if (totalAulas === 0) {
    return (
      <p className="text-sm text-center py-16" style={{ color: 'var(--brand-texto-muted)' }}>
        Nenhuma aula no período.
      </p>
    )
  }

  const totalPresentes = aulasNoPeriodo.reduce((acc, a) => acc + (a.presencas?.length ?? 0), 0)
  const mediaPresentes = totalPresentes / totalAulas

  // Segunda a domingo (mais natural pra rotina de academia do que dom-sáb do getDay())
  const DIAS_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const porDia = [0, 0, 0, 0, 0, 0, 0]
  for (const a of aulasNoPeriodo) {
    const dow = new Date(a.data + 'T12:00:00').getDay()
    porDia[(dow + 6) % 7] += a.presencas?.length ?? 0
  }
  const maxTotal = Math.max(1, ...porDia)
  const diasSemana = DIAS_LABEL.map((label, i) => ({ label, total: porDia[i], isMax: porDia[i] === maxTotal && maxTotal > 0 }))

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div className="rounded-2xl p-3.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-2xl font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>{totalAulas}</p>
          <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>aulas no período</p>
        </div>
        <div className="rounded-2xl p-3.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-2xl font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>{mediaPresentes.toFixed(1)}</p>
          <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>média de presentes</p>
        </div>
      </div>

      <section className="rounded-2xl p-3.5" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
          Presentes por dia da semana
        </p>
        <div className="flex gap-1.5 items-end">
          {diasSemana.map(d => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold" style={{ color: d.isMax ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>{d.total}</span>
              <div className="w-full rounded overflow-hidden flex items-end" style={{ background: 'var(--brand-border)', height: 56 }}>
                <div className="w-full rounded" style={{ height: `${Math.round(d.total / maxTotal * 100)}%`, background: d.isMax ? 'var(--brand-gold)' : '#2A2A2A' }} />
              </div>
              <span className="text-[9px]" style={{ color: d.isMax ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
