import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white', cinza: 'bg-gray-400', amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400', verde: 'bg-green-400', azul: 'bg-blue-400',
  roxa: 'bg-purple-400', marrom: 'bg-amber-700', preta: 'bg-gray-800 border border-white/20',
}

type PresencaRow = {
  aula_id: string
  aulas: { data: string; tema: string | null; turmas: { nome: string } | null } | null
}

export default async function AlunoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, email, telefone, ativo, matriculado_em')
    .eq('id', id)
    .single()

  if (!aluno) redirect('/alunos')

  const { data: turmasData } = await supabase
    .from('alunos_turmas')
    .select('turmas(id, nome, dias_semana, horario)')
    .eq('aluno_id', id)
    .eq('ativo', true)

  const turmas = (turmasData ?? [])
    .map(t => t.turmas as unknown as { id: string; nome: string; dias_semana: string[] | null; horario: string | null } | null)
    .filter(Boolean) as { id: string; nome: string; dias_semana: string[] | null; horario: string | null }[]

  const { data: presencasData } = await supabase
    .from('presencas')
    .select('aula_id, aulas(data, tema, turmas(nome))')
    .eq('aluno_id', id)
    .order('registrado_em', { ascending: false })
    .limit(20)

  const presencas = (presencasData ?? []) as unknown as PresencaRow[]

  const trinta_dias = new Date()
  trinta_dias.setDate(trinta_dias.getDate() - 30)

  const presencasRecentes = presencas.filter(p =>
    p.aulas?.data && new Date(p.aulas.data) >= trinta_dias
  ).length

  const matriculadoEm = aluno.matriculado_em
    ? new Date(aluno.matriculado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center gap-3">
        <Link href="/alunos" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
        <h1 className="text-white font-bold text-xl uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          Perfil
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10 space-y-6">

        {/* Student card */}
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5">
          <div className={`w-4 h-16 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
          <div>
            <h2 className="text-white font-bold text-2xl uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              {aluno.nome}
            </h2>
            <p className="text-white/50 text-sm capitalize mt-0.5">
              Faixa {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
            </p>
            {matriculadoEm && (
              <p className="text-white/30 text-xs mt-1">Desde {matriculadoEm}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-center">
            <p className="text-white font-bold text-3xl" style={{ fontFamily: 'var(--font-oswald)' }}>
              {presencas.length}
            </p>
            <p className="text-white/40 text-xs uppercase tracking-widest mt-1"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Presenças total
            </p>
          </div>
          <div className="px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-center">
            <p className="text-white font-bold text-3xl" style={{ fontFamily: 'var(--font-oswald)' }}>
              {presencasRecentes}
            </p>
            <p className="text-white/40 text-xs uppercase tracking-widest mt-1"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Últimos 30 dias
            </p>
          </div>
        </div>

        {/* Contact */}
        {(aluno.email || aluno.telefone) && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-white/40"
              style={{ fontFamily: 'var(--font-oswald)' }}>Contato</p>
            {aluno.email && (
              <p className="text-white/60 text-sm">{aluno.email}</p>
            )}
            {aluno.telefone && (
              <p className="text-white/60 text-sm">{aluno.telefone}</p>
            )}
          </div>
        )}

        {/* Turmas */}
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2"
            style={{ fontFamily: 'var(--font-oswald)' }}>Turmas</p>
          {turmas.length === 0 ? (
            <p className="text-white/20 text-sm">Não matriculado em nenhuma turma.</p>
          ) : (
            <div className="space-y-2">
              {turmas.map(t => (
                <Link key={t.id} href={`/turmas/${t.id}`}
                  className="block px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                  <p className="text-white text-sm font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-oswald)' }}>
                    {t.nome}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Attendance history */}
        {presencas.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Histórico de presenças</p>
            <div className="space-y-1">
              {presencas.map((p, i) => {
                const aula = p.aulas
                if (!aula) return null
                const turma = aula.turmas as { nome: string } | null
                const data = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short',
                })
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/5">
                    <p className="text-white/60 text-xs">
                      {turma?.nome ?? 'Aula avulsa'}
                      {aula.tema ? ` · ${aula.tema}` : ''}
                    </p>
                    <p className="text-white/30 text-xs flex-shrink-0 ml-2">{data}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
