import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AlunoBasico = {
  id: string
  nome: string
  faixa: string
  grau: number
  academia_id: string
  foto_url: string | null
  matriculado_em: string | null
  data_nascimento: string | null
  condicoes_saude: string | null
  dia_mensalidade: number | null
  graduado_em: string | null
  grau_em: string | null
}

export async function getAlunoOuRedireciona(): Promise<{
  aluno: AlunoBasico
  supabase: Awaited<ReturnType<typeof createClient>>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('id').eq('user_id', user.id).maybeSingle()
  if (professor) redirect('/dashboard')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, academia_id, foto_url, matriculado_em, data_nascimento, condicoes_saude, dia_mensalidade, graduado_em, grau_em')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) redirect('/aluno/sem-conta')

  return { aluno: aluno as AlunoBasico, supabase }
}
