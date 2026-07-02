import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
          <h1 className="text-white font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Histórico
          </h1>
        </div>
        <Link href="/aulas/nova"
          className="px-4 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          + Aula
        </Link>
      </header>

      <form method="get" className="flex gap-2 px-6 pt-4">
        <select name="turma" defaultValue={turmaFiltro ?? ''}
          className="flex-1 px-3 py-2 rounded-xl bg-transparent border border-white/20 text-white text-sm focus:outline-none">
          <option value="" className="bg-black">Todas as turmas</option>
          {(turmasData ?? []).map(t => (
            <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
          ))}
        </select>
        <input type="month" name="mes" defaultValue={mesFiltro ?? ''}
          className="px-3 py-2 rounded-xl bg-transparent border border-white/20 text-white text-sm focus:outline-none" />
        <button type="submit"
          className="px-4 py-2 rounded-xl border border-white/20 text-white text-sm font-bold uppercase tracking-wider">
          Filtrar
        </button>
      </form>

      <main className="px-6 pt-4 space-y-2 pb-10">
        {!aulas?.length ? (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
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
                className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-white font-bold uppercase tracking-wider text-sm"
                    style={{ fontFamily: 'var(--font-oswald)' }}>
                    {turma?.nome ?? 'Aula Avulsa'}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {dataFormatada}
                    {aula.tema ? ` · ${aula.tema}` : ''}
                  </p>
                </div>
                <span className={`text-xs uppercase tracking-widest flex-shrink-0 ${
                  aula.status === 'finalizada' ? 'text-green-400' :
                  aula.status === 'aberta' ? 'text-yellow-400' : 'text-white/30'
                }`} style={{ fontFamily: 'var(--font-oswald)' }}>
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
