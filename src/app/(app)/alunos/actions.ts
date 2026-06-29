'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cadastrarAluno(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) return { error: 'Academia não encontrada.' }

  const nome = (formData.get('nome') as string).trim()
  const email = (formData.get('email') as string | null)?.trim() || null
  const telefone = (formData.get('telefone') as string | null)?.trim() || null
  const faixa = (formData.get('faixa') as string) || 'branca'
  const grau = parseInt(formData.get('grau') as string) || 0

  if (!nome) return { error: 'Nome é obrigatório.' }

  const { error } = await supabase
    .from('alunos')
    .insert({ academia_id: professor.academia_id, nome, email, telefone, faixa, grau })

  if (error) return { error: 'Erro ao cadastrar aluno.' }

  revalidatePath('/alunos')
  return { success: true }
}
