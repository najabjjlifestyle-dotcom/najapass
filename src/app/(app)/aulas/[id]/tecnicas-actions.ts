'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adicionarTecnicaAula(aulaId: string, tecnicaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('aula_tecnicas')
    .insert({ aula_id: aulaId, tecnica_id: tecnicaId, tipo: 'ensinada' })

  if (error?.code === '23505') return { success: true } // já existe
  if (error) return { error: 'Erro ao adicionar posição.' }

  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}

export async function removerTecnicaAula(aulaId: string, tecnicaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  await supabase
    .from('aula_tecnicas')
    .delete()
    .eq('aula_id', aulaId)
    .eq('tecnica_id', tecnicaId)

  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}
