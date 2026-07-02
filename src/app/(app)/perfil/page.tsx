import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PerfilForm from './form'
import BackButton from '@/components/back-button'
import AvatarUpload from '@/components/avatar-upload'
import { updateFotoProfessor } from './actions'

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
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
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
      </main>
    </div>
  )
}
