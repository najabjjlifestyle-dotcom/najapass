'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function concluirAula(
  aulaId: string,
  ensinadasIds: string[],
  reforcosIds: string[],
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Zera reforços anteriores — mais simples e seguro que diffar o estado.
  await supabase
    .from('aula_tecnicas')
    .update({ reforco: false })
    .eq('aula_id', aulaId)

  // Marca as confirmadas como ensinadas
  if (ensinadasIds.length > 0) {
    await supabase
      .from('aula_tecnicas')
      .update({ tipo: 'ensinada' })
      .eq('aula_id', aulaId)
      .in('tecnica_id', ensinadasIds)
  }

  // Marca reforços
  if (reforcosIds.length > 0) {
    await supabase
      .from('aula_tecnicas')
      .update({ reforco: true })
      .eq('aula_id', aulaId)
      .in('tecnica_id', reforcosIds)
  }

  // Planejadas não confirmadas → não ensinadas
  await supabase
    .from('aula_tecnicas')
    .update({ tipo: 'nao_ensinada' })
    .eq('aula_id', aulaId)
    .eq('tipo', 'planejada')

  const horaFim = new Date().toTimeString().slice(0, 8)
  const { error } = await supabase
    .from('aulas')
    .update({ status: 'finalizada', hora_fim: horaFim })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao finalizar aula.' }

  revalidatePath(`/aulas/${aulaId}`)
  revalidatePath('/aulas')
  revalidatePath('/dashboard')
  return { success: true }
}
