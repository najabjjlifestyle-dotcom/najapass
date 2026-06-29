import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AttendanceList from './attendance-list'

type AlunoRow = { id: string; nome: string; faixa: string; grau: number }

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: aula } = await supabase
    .from('aulas')
    .select('id, data, tema, status, hora_inicio, turma_id, turmas(nome)')
    .eq('id', id)
    .single()

  if (!aula) redirect('/aulas')

  let alunos: AlunoRow[] = []

  if (aula.turma_id) {
    const { data: turmaAlunos } = await supabase
      .from('alunos_turmas')
      .select('alunos(id, nome, faixa, grau)')
      .eq('turma_id', aula.turma_id)
      .eq('ativo', true)

    alunos = ((turmaAlunos ?? [])
      .map(ta => ta.alunos as unknown as AlunoRow | null)
      .filter(Boolean) as AlunoRow[])
      .sort((a, b) => a.nome.localeCompare(b.nome))
  } else {
    const { data } = await supabase
      .from('alunos')
      .select('id, nome, faixa, grau')
      .eq('academia_id', professor.academia_id)
      .eq('ativo', true)
      .order('nome')
    alunos = (data as AlunoRow[]) ?? []
  }

  const { data: presencas } = await supabase
    .from('presencas')
    .select('aluno_id')
    .eq('aula_id', id)

  const presencasIniciais = ((presencas ?? [])
    .map(p => p.aluno_id)
    .filter(Boolean)) as string[]

  const turma = aula.turmas as unknown as { nome: string } | null

  const dataFormatada = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10">
        <div className="flex items-start gap-3">
          <Link href="/aulas" className="text-white/40 hover:text-white transition-colors text-xl mt-1">←</Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-white font-bold text-xl uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-oswald)' }}>
                {turma?.nome ?? 'Aula Avulsa'}
              </h1>
              {aula.status === 'finalizada' && (
                <span className="text-xs text-green-400 uppercase tracking-widest border border-green-400/30 px-2 py-0.5 rounded"
                  style={{ fontFamily: 'var(--font-oswald)' }}>
                  Finalizada
                </span>
              )}
              {aula.status === 'aberta' && (
                <span className="text-xs text-yellow-400 uppercase tracking-widest border border-yellow-400/30 px-2 py-0.5 rounded"
                  style={{ fontFamily: 'var(--font-oswald)' }}>
                  Ao vivo
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs mt-1 capitalize">
              {dataFormatada}
              {aula.hora_inicio ? ` · ${(aula.hora_inicio as string).substring(0, 5)}` : ''}
            </p>
            {aula.tema && (
              <p className="text-white/60 text-sm mt-1 italic">"{aula.tema}"</p>
            )}
          </div>
        </div>
      </header>

      <AttendanceList
        aulaId={id}
        alunos={alunos}
        presencasIniciais={presencasIniciais}
        status={aula.status}
      />
    </div>
  )
}
