'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type SalvarHistorinhaInput = {
  id?: string
  nome: string
  tecnicas: { tecnica_id: string; ordem: number }[]
}

export async function salvarHistorinha(data: SalvarHistorinhaInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: prof } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!prof?.academia_id) throw new Error('Professor não encontrado')

  if (data.id) {
    await supabase
      .from('historinhas')
      .update({ nome: data.nome })
      .eq('id', data.id)
      .eq('academia_id', prof.academia_id)

    await supabase.from('historinha_tecnicas').delete().eq('historinha_id', data.id)
    if (data.tecnicas.length > 0) {
      await supabase.from('historinha_tecnicas').insert(
        data.tecnicas.map(t => ({ historinha_id: data.id!, ...t }))
      )
    }
  } else {
    const { data: nova } = await supabase
      .from('historinhas')
      .insert({ nome: data.nome, academia_id: prof.academia_id })
      .select('id')
      .single()

    if (nova && data.tecnicas.length > 0) {
      await supabase.from('historinha_tecnicas').insert(
        data.tecnicas.map(t => ({ historinha_id: nova.id, ...t }))
      )
    }
  }

  revalidatePath('/historinhas')
}

export async function deletarHistorinha(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: prof } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!prof?.academia_id) throw new Error('Professor não encontrado')

  await supabase
    .from('historinhas')
    .delete()
    .eq('id', id)
    .eq('academia_id', prof.academia_id)

  revalidatePath('/historinhas')
}
