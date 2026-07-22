'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarFotoAula(aulaId: string, fotoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('aulas')
    .update({ foto_url: fotoUrl })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao salvar foto.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}
