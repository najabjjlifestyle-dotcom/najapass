'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarTurma(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores')
    .select('id, academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) return { error: 'Academia não encontrada.' }

  const nome = (formData.get('nome') as string).trim()
  const horario = (formData.get('horario') as string | null) || null
  const diasStr = formData.get('dias_semana') as string
  const dias_semana: string[] = diasStr ? JSON.parse(diasStr) : []

  if (!nome) return { error: 'Nome é obrigatório.' }

  const { error } = await supabase
    .from('turmas')
    .insert({
      academia_id: professor.academia_id,
      professor_id: professor.id,
      nome,
      dias_semana: dias_semana.length > 0 ? dias_semana : null,
      horario: horario || null,
    })

  if (error) return { error: 'Erro ao criar turma.' }

  revalidatePath('/turmas')
  return { success: true }
}
