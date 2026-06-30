import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoleSelect from './role-select'

export default async function BoasVindasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (professor?.academia_id) redirect('/dashboard')
  if (professor) redirect('/onboarding')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (aluno) redirect('/aluno')

  // Professor pré-cadastrado por outro professor → vincular automaticamente
  const { data: profPreReg } = await supabase
    .from('professores')
    .select('id')
    .eq('email', user.email!)
    .is('user_id', null)
    .maybeSingle()

  if (profPreReg) {
    await supabase.rpc('vincular_professor_por_email', { p_email: user.email!, p_user_id: user.id })
    redirect('/dashboard')
  }

  const { data: solicitacao } = await supabase
    .from('solicitacoes')
    .select('status, academias(nome)')
    .eq('user_id', user.id)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: academias } = await supabase
    .from('academias')
    .select('id, nome, cidade')
    .order('nome')

  const solicitacaoFormatada = solicitacao
    ? {
        status: solicitacao.status,
        academia_nome: (solicitacao.academias as unknown as { nome: string } | null)?.nome ?? '',
      }
    : null

  return (
    <RoleSelect
      academias={academias ?? []}
      solicitacao={solicitacaoFormatada}
    />
  )
}
