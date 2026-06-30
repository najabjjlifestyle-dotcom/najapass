'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fazerCheckin(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) return { error: 'Perfil de aluno não encontrado.' }

  const { error } = await supabase
    .from('presencas')
    .insert({ aula_id: aulaId, aluno_id: aluno.id, origem: 'aluno' })

  if (error) {
    if (error.code === '23505') return { error: 'Você já fez check-in nesta aula.' }
    return { error: 'Erro ao fazer check-in.' }
  }

  revalidatePath('/aluno')
  return { success: true }
}

export async function cancelarCheckin(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) return { error: 'Perfil não encontrado.' }

  await supabase
    .from('presencas')
    .delete()
    .eq('aula_id', aulaId)
    .eq('aluno_id', aluno.id)
    .eq('origem', 'aluno')

  revalidatePath('/aluno')
  return { success: true }
}
