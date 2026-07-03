import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/back-button'

export default async function AulasPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string; mes?: string }>
}) {
  const { turma: turmaFiltro, mes: mesFiltro } = await searchParams
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
    .select('id, nome')
    .eq('academia_id', professor.academia_id)
    .order('nome')

  let query = supabase
    .from('aulas')
    .select('id, data, tema, status, turmas(nome)')
    .eq('academia_id', professor.academia_id)
    .order('data', { ascending: false })
    .limit(50)

  if (turmaFiltro) query = query.eq('turma_id', turmaFiltro)
  if (mesFiltro) {
    const [ano, mes] = mesFiltro.split('-').map(Number)
    const inicio = `${mesFiltro}-01`
    const fim = new Date(ano, mes, 0).toISOString().split('T')[0]
    query = query.gte('data', inicio).lte('data', fim)
  }

  const { data: aulas } = await query

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-safe pb-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--brand-border)' }}>
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

      <form method="get" className="flex gap-2 px-6 pt-4">
        <select name="turma" defaultValue={turmaFiltro ?? ''}
          className="flex-1 px-3 py-2 rounded-xl bg-transparent text-sm focus:outline-none"
          style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
          <option value="" className="bg-black">Todas as turmas</option>
          {(turmasData ?? []).map(t => (
            <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
          ))}
        </select>
        <input type="month" name="mes" defaultValue={mesFiltro ?? ''}
          className="px-3 py-2 rounded-xl bg-transparent text-sm focus:outline-none"
          style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
        <button type="submit"
          className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
          style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
          Filtrar
        </button>
      </form>

      <main className="px-6 pt-4 space-y-2 pb-10">
        {!aulas?.length ? (
          <div className="text-center py-16">
            <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma aula registrada
            </p>
          </div>
        ) : (
          aulas.map(aula => {
            const turma = aula.turmas as unknown as { nome: string } | null
            const dataFormatada = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
            return (
              <Link key={aula.id} href={`/aulas/${aula.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <div>
                  <p className="font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--brand-texto)' }}>
                    {turma?.nome ?? 'Aula Avulsa'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                    {dataFormatada}
                    {aula.tema ? ` · ${aula.tema}` : ''}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-widest flex-shrink-0"
                  style={{ color: aula.status === 'finalizada' ? '#4ADE80' : aula.status === 'aberta' ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                  {aula.status === 'finalizada' ? 'Finalizada' :
                   aula.status === 'aberta' ? 'Ao vivo' : 'Agendada'}
                </span>
              </Link>
            )
          })
        )}
      </main>
    </div>
  )
}
