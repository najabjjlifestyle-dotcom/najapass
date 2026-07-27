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
  celebrar_graduacao: boolean
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

  // Os 3 campos sensíveis vivem em alunos_dados_sensiveis (RLS estrita) —
  // trazidos por embed pra manter o formato do AlunoBasico intacto.
  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, academia_id, foto_url, matriculado_em, graduado_em, grau_em, celebrar_graduacao, alunos_dados_sensiveis(data_nascimento, condicoes_saude, dia_mensalidade)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) redirect('/aluno/sem-conta')

  type Sens = { data_nascimento: string | null; condicoes_saude: string | null; dia_mensalidade: number | null }
  const sensRaw = (aluno as { alunos_dados_sensiveis: Sens | Sens[] | null }).alunos_dados_sensiveis
  const sens = (Array.isArray(sensRaw) ? sensRaw[0] : sensRaw) ?? null

  const alunoBasico: AlunoBasico = {
    id: aluno.id,
    nome: aluno.nome,
    faixa: aluno.faixa,
    grau: aluno.grau,
    academia_id: aluno.academia_id,
    foto_url: aluno.foto_url,
    matriculado_em: aluno.matriculado_em,
    data_nascimento: sens?.data_nascimento ?? null,
    condicoes_saude: sens?.condicoes_saude ?? null,
    dia_mensalidade: sens?.dia_mensalidade ?? null,
    graduado_em: aluno.graduado_em,
    grau_em: aluno.grau_em,
    celebrar_graduacao: aluno.celebrar_graduacao,
  }

  return { aluno: alunoBasico, supabase }
}
