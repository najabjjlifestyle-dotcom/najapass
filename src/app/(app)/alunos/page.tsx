import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/avatar'
import BackButton from '@/components/back-button'

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
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-safe pb-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard" />
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Alunos
          </h1>
        </div>
        <Link href="/alunos/novo"
          className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          + Novo
        </Link>
      </header>

      <main className="px-6 pt-6 space-y-2 pb-10">
        {!alunos?.length ? (
          <div className="text-center py-16">
            <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhum aluno cadastrado
            </p>
            <Link href="/alunos/novo"
              className="inline-block mt-4 px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-gold)', color: '#000' }}>
              Cadastrar primeiro aluno
            </Link>
          </div>
        ) : (
          alunos.map((aluno) => (
            <Link key={aluno.id} href={`/alunos/${aluno.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} size={36} />
              <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-bold uppercase tracking-wider truncate" style={{ color: 'var(--brand-texto)' }}>
                  {aluno.nome}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
                  {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
                </p>
              </div>
              {!aluno.ativo && (
                <span className="text-xs uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--brand-texto-muted)' }}>
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
