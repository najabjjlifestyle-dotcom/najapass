'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Ad-hoc durante a aula: marca como ensinada (upsert — pode sobrescrever planejada)
export async function adicionarTecnicaAula(aulaId: string, tecnicaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('aula_tecnicas')
    .upsert(
      { aula_id: aulaId, tecnica_id: tecnicaId, tipo: 'ensinada', reforco: false },
      { onConflict: 'aula_id,tecnica_id' }
    )

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

// Confirmação de posição planejada ao fechar aula
export async function confirmarTecnica(
  aulaId: string,
  tecnicaId: string,
  tipo: 'ensinada' | 'nao_ensinada',
  reforco: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('aula_tecnicas')
    .update({ tipo, reforco })
    .eq('aula_id', aulaId)
    .eq('tecnica_id', tecnicaId)

  if (error) return { error: 'Erro ao confirmar posição.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}
