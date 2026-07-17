import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoleSelect from './role-select'

export default async function BoasVindasPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
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

  // Role vinda da landing (?role=). Só honra quando não há solicitação
  // pendente (aí a tela de "aguardando aprovação" tem prioridade).
  const pendente = solicitacaoFormatada?.status === 'pendente'
  if (role === 'professor' && !pendente) redirect('/onboarding')
  const initialStep = role === 'aluno' && !pendente ? 'academia-form' : undefined

  return (
    <RoleSelect
      academias={academias ?? []}
      solicitacao={solicitacaoFormatada}
      initialStep={initialStep}
    />
  )
}
