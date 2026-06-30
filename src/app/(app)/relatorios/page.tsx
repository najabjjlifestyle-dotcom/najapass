import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Filtros from './filtros'

const FAIXA_COR: Record<string, string> = {
  branca: '#fff', cinza: '#9CA3AF', amarela: '#FBBF24', laranja: '#F97316',
  verde: '#16A34A', azul: '#2563EB', roxa: '#7C3AED', marrom: '#92400E', preta: '#374151',
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')
  const acadId = professor.academia_id

  const hoje = new Date()
  const defaultInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const defaultFim = hoje.toISOString().split('T')[0]
  const dateInicio = params.inicio || defaultInicio
  const dateFim = params.fim || defaultFim

  // Aulas no período com contagem de presentes
  const { data: aulas } = await supabase
    .from('aulas')
    .select('id, data, hora_inicio, status, turmas(nome), presencas(id)')
    .eq('academia_id', acadId)
    .gte('data', dateInicio)
    .lte('data', dateFim)
    .order('data', { ascending: false })

  type AulaRow = {
    id: string; data: string; hora_inicio: string | null; status: string
    turmas: { nome: string } | null
    presencas: { id: string }[]
  }
  const rows = (aulas ?? []) as unknown as AulaRow[]
  const aulaIds = rows.map(a => a.id)

  // Presencas para ranking
  const { data: presencas } = aulaIds.length > 0
    ? await supabase
        .from('presencas')
        .select('aluno_id, alunos(nome, faixa)')
        .in('aula_id', aulaIds)
        .not('aluno_id', 'is', null)
    : { data: [] }

  type PRow = { aluno_id: string; alunos: { nome: string; faixa: string } | null }
  const pRows = (presencas ?? []) as unknown as PRow[]

  // Count by aluno
  const ranking = Object.values(
    pRows.reduce<Record<string, { nome: string; faixa: string; total: number }>>((acc, p) => {
      if (!p.aluno_id || !p.alunos) return acc
      if (!acc[p.aluno_id]) acc[p.aluno_id] = { nome: p.alunos.nome, faixa: p.alunos.faixa, total: 0 }
      acc[p.aluno_id].total++
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 10)

  const totalPresencas = pRows.length
  const totalAulas = rows.length

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/dashboard" className="text-xl" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Relatórios
        </h1>
      </header>

      <Filtros inicio={dateInicio} fim={dateFim} />

      <main className="px-5 pt-5 pb-10 space-y-8">

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { valor: totalAulas, label: 'aulas no período' },
            { valor: totalPresencas, label: 'presenças totais' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-3xl font-bold" style={{ color: 'var(--brand-gold)' }}>{s.valor}</p>
              <p className="text-[9px] uppercase tracking-wide mt-1" style={{ color: 'var(--brand-texto-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Frequência por aula */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-gold)' }}>
            Frequência por aula
          </p>
          {rows.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>Nenhuma aula no período.</p>
          ) : (
            <div className="space-y-1.5">
              {rows.map(a => {
                const turma = a.turmas as unknown as { nome: string } | null
                const presentes = (a.presencas as unknown as { id: string }[])?.length ?? 0
                const data = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                return (
                  <Link key={a.id} href={`/aulas/${a.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>
                        {turma?.nome ?? 'Aula avulsa'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>{data}</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold"
                      style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                      {presentes} presentes
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Top alunos */}
        {ranking.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-gold)' }}>
              Alunos mais frequentes
            </p>
            <div className="space-y-1.5">
              {ranking.map((a, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <span className="text-sm font-bold w-5 flex-shrink-0 text-center"
                    style={{ color: i < 3 ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                    {i + 1}
                  </span>
                  <div
                    className="w-2 h-6 rounded-full flex-shrink-0"
                    style={{ background: FAIXA_COR[a.faixa] ?? '#fff', border: a.faixa === 'branca' ? '1px solid #333' : undefined }} />
                  <p className="flex-1 text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{a.nome}</p>
                  <span className="text-sm font-bold" style={{ color: 'var(--brand-gold)' }}>
                    {a.total}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
