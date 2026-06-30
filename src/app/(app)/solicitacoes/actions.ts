'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function aprovarSolicitacao(solicitacaoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: sol } = await supabase
    .from('solicitacoes')
    .select('academia_id, user_id, email, nome')
    .eq('id', solicitacaoId)
    .single()

  if (!sol) return { error: 'Solicitação não encontrada.' }

  const { error: alunoError } = await supabase
    .from('alunos')
    .insert({
      academia_id: sol.academia_id,
      user_id: sol.user_id,
      email: sol.email,
      nome: sol.nome,
    })

  if (alunoError && alunoError.code !== '23505') {
    return { error: 'Erro ao criar perfil do aluno.' }
  }

  await supabase
    .from('solicitacoes')
    .update({ status: 'aprovado' })
    .eq('id', solicitacaoId)

  revalidatePath('/solicitacoes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function rejeitarSolicitacao(solicitacaoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  await supabase
    .from('solicitacoes')
    .update({ status: 'rejeitado' })
    .eq('id', solicitacaoId)

  revalidatePath('/solicitacoes')
  revalidatePath('/dashboard')
  return { success: true }
}
