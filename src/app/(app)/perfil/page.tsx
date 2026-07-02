import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PerfilForm from './form'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('nome, faixa, email')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/dashboard" className="text-xl" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Meu Perfil
        </h1>
      </header>

      <main className="px-5 pt-5 pb-10 space-y-4">
        <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>{professor.email}</p>
        <PerfilForm nomeAtual={professor.nome} faixaAtual={professor.faixa ?? 'branca'} />
      </main>
    </div>
  )
}
