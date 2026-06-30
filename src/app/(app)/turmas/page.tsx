import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

export default async function TurmasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: turmas } = await supabase
    .from('turmas')
    .select('id, nome, dias_semana, horario, ativa')
    .eq('academia_id', professor.academia_id)
    .order('nome')

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
          <h1 className="text-white font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Turmas
          </h1>
        </div>
        <Link href="/turmas/nova"
          className="px-4 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          + Nova
        </Link>
      </header>

      <main className="px-6 pt-6 space-y-2 pb-10">
        {!turmas?.length ? (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Nenhuma turma cadastrada
            </p>
            <Link href="/turmas/nova"
              className="inline-block mt-4 px-6 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Criar primeira turma
            </Link>
          </div>
        ) : (
          turmas.map((turma) => (
            <Link key={turma.id} href={`/turmas/${turma.id}`}
              className="block px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <p className="text-white font-bold uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-oswald)' }}>
                {turma.nome}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {(turma.dias_semana as string[] | null)?.map((d) => (
                  <span key={d} className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
                    {DIAS_ABBR[d] ?? d}
                  </span>
                ))}
                {turma.horario && (
                  <span className="text-xs text-white/40">
                    · {(turma.horario as string).substring(0, 5)}
                  </span>
                )}
                {!turma.ativa && (
                  <span className="text-xs text-white/20 ml-auto uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-oswald)' }}>
                    Inativa
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </main>
    </div>
  )
}
