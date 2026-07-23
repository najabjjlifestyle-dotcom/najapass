'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function postarResenha(aulaId: string, texto: string) {
  const textoCleaned = texto.trim().slice(0, 280)
  if (!textoCleaned) return { error: 'Resenha vazia.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!aluno) return { error: 'Aluno não encontrado.' }

  const { error } = await supabase
    .from('resenhas_aula')
    .insert({ aula_id: aulaId, aluno_id: aluno.id, texto: textoCleaned })

  if (error) return { error: 'Erro ao postar.' }
  revalidatePath(`/aluno/aula/${aulaId}`)
  return { success: true }
}

export async function deletarResenha(resenhaId: string, aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // O RLS garante que só o dono da resenha (ou professor da academia) deleta.
  await supabase.from('resenhas_aula').delete().eq('id', resenhaId)
  revalidatePath(`/aluno/aula/${aulaId}`)
  return { success: true }
}
