'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const FAIXAS = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'] as const

export async function graduarAluno(alunoId: string, faixa: string, grau: number) {
  if (!FAIXAS.includes(faixa as typeof FAIXAS[number])) return { error: 'Faixa inválida.' }
  if (grau < 0 || grau > 4) return { error: 'Grau inválido.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('alunos')
    .update({ faixa, grau })
    .eq('id', alunoId)

  if (error) return { error: 'Erro ao graduar aluno.' }
  revalidatePath(`/alunos/${alunoId}`)
  return { success: true }
}
