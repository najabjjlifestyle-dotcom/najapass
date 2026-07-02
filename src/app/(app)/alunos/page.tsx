import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/avatar'

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white',
  cinza: 'bg-gray-400',
  amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400',
  verde: 'bg-green-400',
  azul: 'bg-blue-400',
  roxa: 'bg-purple-400',
  marrom: 'bg-amber-700',
  preta: 'bg-gray-800 border border-white/20',
}

export default async function AlunosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: alunos } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, ativo, foto_url')
    .eq('academia_id', professor.academia_id)
    .order('nome')

  return (
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
          <h1 className="text-white font-bold text-xl uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            Alunos
          </h1>
        </div>
        <Link href="/alunos/novo"
          className="px-4 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          + Novo
        </Link>
      </header>

      <main className="px-6 pt-6 space-y-2 pb-10">
        {!alunos?.length ? (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Nenhum aluno cadastrado
            </p>
            <Link href="/alunos/novo"
              className="inline-block mt-4 px-6 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl"
              style={{ fontFamily: 'var(--font-oswald)' }}>
              Cadastrar primeiro aluno
            </Link>
          </div>
        ) : (
          alunos.map((aluno) => (
            <Link key={aluno.id} href={`/alunos/${aluno.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
              <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} size={36} />
              <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold uppercase tracking-wider truncate"
                  style={{ fontFamily: 'var(--font-oswald)' }}>
                  {aluno.nome}
                </p>
                <p className="text-white/40 text-xs capitalize">
                  {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
                </p>
              </div>
              {!aluno.ativo && (
                <span className="text-xs text-white/30 uppercase tracking-wider flex-shrink-0"
                  style={{ fontFamily: 'var(--font-oswald)' }}>
                  Inativo
                </span>
              )}
            </Link>
          ))
        )}
      </main>
    </div>
  )
}
