'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Adiciona posição à aula (upsert). Durante a aula ao vivo entra como
// 'ensinada'; no planejamento (aula agendada) entra como 'planejada'.
export async function adicionarTecnicaAula(
  aulaId: string,
  tecnicaId: string,
  tipo: 'planejada' | 'ensinada' = 'ensinada',
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('aula_tecnicas')
    .upsert(
      { aula_id: aulaId, tecnica_id: tecnicaId, tipo, reforco: false },
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
