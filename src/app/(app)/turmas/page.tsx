import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/back-button'
import SectionTabs from '@/components/section-tabs'

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

  const { data: turmasData } = await supabase
    .from('turmas')
    .select('id, nome, dias_semana, horario, ativa, alunos_turmas(id)')
    .eq('academia_id', professor.academia_id)
    .eq('alunos_turmas.ativo', true)
    .order('nome')

  type TurmaRow = {
    id: string
    nome: string
    dias_semana: string[] | null
    horario: string | null
    ativa: boolean
    alunos_turmas: { id: string }[]
  }
  const turmas = (turmasData ?? []) as unknown as TurmaRow[]

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-safe pb-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard" />
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Turmas
          </h1>
        </div>
        <Link href="/turmas/nova"
          className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          + Nova
        </Link>
      </header>

      <SectionTabs tabs={[
        { href: '/planejamento', label: 'Planejamento', active: false },
        { href: '/turmas', label: 'Turmas', active: true },
      ]} />

      <main className="px-6 pt-6 space-y-2 pb-10">
        {!turmas?.length ? (
          <div className="text-center py-16">
            <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma turma cadastrada
            </p>
            <Link href="/turmas/nova"
              className="inline-block mt-4 px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-gold)', color: '#000' }}>
              Criar primeira turma
            </Link>
          </div>
        ) : (
          turmas.map((turma) => (
            <Link key={turma.id} href={`/turmas/${turma.id}`}
              className="block px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
                  {turma.nome}
                </p>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--brand-texto-muted)' }}>
                  {turma.alunos_turmas?.length ?? 0} aluno{(turma.alunos_turmas?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {(turma.dias_semana as string[] | null)?.map((d) => (
                  <span key={d} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--brand-texto-sec)', background: 'var(--brand-surf-2)' }}>
                    {DIAS_ABBR[d] ?? d}
                  </span>
                ))}
                {turma.horario && (
                  <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                    · {(turma.horario as string).substring(0, 5)}
                  </span>
                )}
                {!turma.ativa && (
                  <span className="text-xs ml-auto uppercase tracking-wider" style={{ color: 'var(--brand-texto-muted)' }}>
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
