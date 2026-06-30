import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckinCard from './checkin'

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white', cinza: 'bg-gray-400', amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400', verde: 'bg-green-400', azul: 'bg-blue-400',
  roxa: 'bg-purple-400', marrom: 'bg-amber-700', preta: 'bg-gray-800 border border-white/20',
}

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

export default async function AlunoPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if professor — redirect to dashboard
  const { data: professor } = await supabase
    .from('professores')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (professor) redirect('/dashboard')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white font-bold text-xl uppercase tracking-wider mb-2"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Conta não vinculada
          </p>
          <p className="text-white/40 text-sm">
            Peça ao seu professor para cadastrar seu e-mail no sistema.
          </p>
        </div>
      </div>
    )
  }

  // Active classes in this academia
  const { data: aulasAtivas } = await supabase
    .from('aulas')
    .select('id, tema, turmas(nome)')
    .eq('academia_id', aluno.academia_id)
    .eq('status', 'aberta')

  // Check existing check-ins
  const aulaIds = (aulasAtivas ?? []).map(a => a.id)
  const { data: checkins } = aulaIds.length > 0
    ? await supabase
        .from('presencas')
        .select('aula_id')
        .eq('aluno_id', aluno.id)
        .in('aula_id', aulaIds)
    : { data: [] }

  const checkinSet = new Set((checkins ?? []).map(c => c.aula_id))

  // Turmas
  const { data: turmasData } = await supabase
    .from('alunos_turmas')
    .select('turmas(id, nome, dias_semana, horario)')
    .eq('aluno_id', aluno.id)
    .eq('ativo', true)

  const turmas = (turmasData ?? [])
    .map(t => t.turmas as unknown as { id: string; nome: string; dias_semana: string[] | null; horario: string | null } | null)
    .filter(Boolean) as { id: string; nome: string; dias_semana: string[] | null; horario: string | null }[]

  // Recent presences
  const { data: presencasData } = await supabase
    .from('presencas')
    .select('aulas(data, tema, turmas(nome))')
    .eq('aluno_id', aluno.id)
    .order('registrado_em', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-14 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Faixa {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
            </p>
            <h1 className="text-white font-bold text-2xl uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              {aluno.nome.split(' ')[0]}
            </h1>
          </div>
        </div>
      </header>

      <main className="px-6 pt-6 pb-10 space-y-6">

        {/* Active classes — check-in */}
        {(aulasAtivas ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-white/40"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Fazer check-in
            </p>
            {(aulasAtivas ?? []).map(aula => {
              const turma = aula.turmas as unknown as { nome: string } | null
              return (
                <CheckinCard
                  key={aula.id}
                  aula={{ id: aula.id, turma_nome: turma?.nome ?? null, tema: aula.tema }}
                  jaFezCheckin={checkinSet.has(aula.id)}
                />
              )
            })}
          </div>
        )}

        {/* Turmas */}
        {turmas.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Minhas turmas
            </p>
            <div className="space-y-2">
              {turmas.map(t => (
                <div key={t.id} className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-white font-bold uppercase tracking-wider text-sm"
                    style={{ fontFamily: 'var(--font-oswald)' }}>
                    {t.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {t.dias_semana?.map(d => (
                      <span key={d} className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                        {DIAS_ABBR[d] ?? d}
                      </span>
                    ))}
                    {t.horario && (
                      <span className="text-xs text-white/30">· {t.horario.substring(0, 5)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent presences */}
        {(presencasData ?? []).length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Presenças recentes
            </p>
            <div className="space-y-1">
              {(presencasData ?? []).map((p, i) => {
                const aula = p.aulas as unknown as { data: string; tema: string | null; turmas: { nome: string } | null } | null
                if (!aula) return null
                const turma = aula.turmas
                const data = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: 'short',
                })
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/5">
                    <p className="text-white/60 text-xs">
                      {turma?.nome ?? 'Aula avulsa'}
                      {aula.tema ? ` · ${aula.tema}` : ''}
                    </p>
                    <p className="text-white/30 text-xs flex-shrink-0 ml-2 capitalize">{data}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(aulasAtivas ?? []).length === 0 && turmas.length === 0 && (presencasData ?? []).length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Nenhuma aula ativa no momento
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
