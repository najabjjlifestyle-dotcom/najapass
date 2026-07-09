import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PerfilForm from './form'
import BackButton from '@/components/back-button'
import AvatarUpload from '@/components/avatar-upload'
import LogoutButton from '@/components/logout-button'
import { updateFotoProfessor } from './actions'
import { Users2, BarChart3, Dumbbell, ChevronRight } from 'lucide-react'

const MAIS_ITEMS = [
  { href: '/professores', Icon: Users2, label: 'Professores', sub: 'Gerenciar equipe da academia' },
  { href: '/relatorios', Icon: BarChart3, label: 'Relatórios', sub: 'Frequência e ranking de alunos' },
  { href: '/tecnicas', Icon: Dumbbell, label: 'Técnicas', sub: 'Biblioteca de posições' },
]

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('id, nome, faixa, email, foto_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/dashboard" />
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Meu Perfil
        </h1>
      </header>

      <main className="px-5 pt-5 pb-10 space-y-4">
        <AvatarUpload
          entityId={professor.id}
          nome={professor.nome}
          fotoUrlAtual={professor.foto_url}
          persist={updateFotoProfessor}
          size={72}
        />
        <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>{professor.email}</p>
        <PerfilForm nomeAtual={professor.nome} faixaAtual={professor.faixa ?? 'branca'} />

        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Mais
          </p>
          <div className="space-y-2">
            {MAIS_ITEMS.map(({ href, Icon, label, sub }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1a1a1a', border: '1px solid #222', color: 'var(--brand-texto-sec)' }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>{sub}</p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--brand-texto-muted)' }} />
              </Link>
            ))}
          </div>
        </div>

        <LogoutButton />
      </main>
    </div>
  )
}
