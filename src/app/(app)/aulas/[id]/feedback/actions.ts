'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarFeedbackAula(aulaId: string, idsParaRepetir: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Zera todos os reforços da aula, depois marca só os selecionados —
  // mais simples e seguro que tentar diffar o estado anterior.
  await supabase
    .from('aula_tecnicas')
    .update({ reforco: false })
    .eq('aula_id', aulaId)
    .eq('tipo', 'ensinada')

  if (idsParaRepetir.length > 0) {
    await supabase
      .from('aula_tecnicas')
      .update({ reforco: true })
      .eq('aula_id', aulaId)
      .eq('tipo', 'ensinada')
      .in('tecnica_id', idsParaRepetir)
  }

  revalidatePath(`/aulas/${aulaId}`)
  revalidatePath('/dashboard')
  return { success: true }
}
