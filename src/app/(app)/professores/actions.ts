'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adicionarProfessor(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) return { error: 'Sem academia.' }

  const nome = (formData.get('nome') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()

  if (!nome || !email) return { error: 'Nome e e-mail são obrigatórios.' }

  const { error } = await supabase.from('professores').insert({
    academia_id: professor.academia_id,
    nome,
    email,
  })

  if (error?.code === '23505') return { error: 'Este e-mail já é professor cadastrado.' }
  if (error) return { error: 'Erro ao adicionar professor.' }

  revalidatePath('/professores')
  return { success: true }
}

export async function removerProfessor(professorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Não pode remover a si mesmo
  const { data: eu } = await supabase
    .from('professores').select('id').eq('user_id', user.id).maybeSingle()
  if (eu?.id === professorId) return { error: 'Você não pode remover a si mesmo.' }

  await supabase.from('professores').delete().eq('id', professorId)
  revalidatePath('/professores')
  return { success: true }
}
