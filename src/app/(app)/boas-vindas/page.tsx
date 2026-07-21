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

  // Professor e aluno em paralelo (antes eram sequenciais)
  const [professorRes, alunoRes] = await Promise.all([
    supabase.from('professores').select('academia_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('alunos').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  if (professorRes.data?.academia_id) redirect('/dashboard')
  if (professorRes.data) redirect('/onboarding')
  if (alunoRes.data) redirect('/aluno')

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

  // Unificação com a landing: a role já foi escolhida lá. Professor vai
  // direto pro onboarding — sem repetir a pergunta "BEM-VINDO".
  if (role === 'professor') redirect('/onboarding')

  // Solicitação + academias em paralelo (antes eram sequenciais)
  const [solicitacaoRes, academiasRes] = await Promise.all([
    supabase
      .from('solicitacoes')
      .select('status, academias(nome)')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('academias').select('id, nome, cidade').order('nome'),
  ])

  const solicitacaoFormatada = solicitacaoRes.data
    ? {
        status: solicitacaoRes.data.status,
        academia_nome: (solicitacaoRes.data.academias as unknown as { nome: string } | null)?.nome ?? '',
      }
    : null

  return (
    <RoleSelect
      academias={academiasRes.data ?? []}
      solicitacao={solicitacaoFormatada}
      // Aluno vindo da landing pula a tela "BEM-VINDO" e abre direto o
      // formulário de escolher academia.
      initialStep={role === 'aluno' ? 'academia-form' : 'role'}
    />
  )
}
