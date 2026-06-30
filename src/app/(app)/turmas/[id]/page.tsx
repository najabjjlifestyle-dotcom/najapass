import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EnrollmentManager from './enrollment'

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

type AlunoRow = { id: string; nome: string; faixa: string }

export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: turma } = await supabase
    .from('turmas')
    .select('id, nome, dias_semana, horario, ativa')
    .eq('id', id)
    .single()

  if (!turma) redirect('/turmas')

  const { data: matriculados } = await supabase
    .from('alunos_turmas')
    .select('alunos(id, nome, faixa)')
    .eq('turma_id', id)
    .eq('ativo', true)

  const alunosMatriculados: AlunoRow[] = ((matriculados ?? [])
    .map(m => m.alunos as unknown as AlunoRow | null)
    .filter(Boolean) as AlunoRow[])
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const matriculadosIds = new Set(alunosMatriculados.map(a => a.id))

  const { data: todosAlunos } = await supabase
    .from('alunos')
    .select('id, nome, faixa')
    .eq('academia_id', professor.academia_id)
    .eq('ativo', true)
    .order('nome')

  const disponiveis: AlunoRow[] = (todosAlunos ?? []).filter(a => !matriculadosIds.has(a.id))

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10">
        <div className="flex items-start gap-3">
          <Link href="/turmas" className="text-white/40 hover:text-white transition-colors text-xl mt-1">←</Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-xl uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              {turma.nome}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {(turma.dias_semana as string[] | null)?.map(d => (
                <span key={d} className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
                  {DIAS_ABBR[d] ?? d}
                </span>
              ))}
              {turma.horario && (
                <span className="text-xs text-white/40">
                  · {(turma.horario as string).substring(0, 5)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 pt-6 pb-10">
        <EnrollmentManager
          turmaId={id}
          matriculados={alunosMatriculados}
          disponiveis={disponiveis}
        />
      </main>
    </div>
  )
}
