'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPushToAll } from '@/lib/push'

export async function criarAviso(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores')
    .select('id, academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) return { error: 'Academia não encontrada.' }

  const titulo = (formData.get('titulo') as string).trim()
  const corpo = (formData.get('corpo') as string).trim()
  const turma_id = (formData.get('turma_id') as string | null) || null

  if (!titulo || !corpo) return { error: 'Título e texto são obrigatórios.' }

  const { error } = await supabase
    .from('avisos')
    .insert({
      academia_id: professor.academia_id,
      professor_id: professor.id,
      turma_id,
      titulo,
      corpo,
    })

  if (error) return { error: 'Erro ao criar aviso.' }

  // Notifica os alunos impactados (best-effort, não bloqueia o fluxo)
  const { data: subs } = turma_id
    ? await supabase.rpc('subscricoes_da_turma', { p_turma_id: turma_id })
    : await supabase.rpc('subscricoes_da_academia')
  if (subs && subs.length > 0) {
    await sendPushToAll(subs, { title: `📣 ${titulo}`, body: corpo, url: '/aluno' })
  }

  revalidatePath('/avisos')
  revalidatePath('/aluno')
  return { success: true }
}

export async function arquivarAviso(avisoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase.from('avisos').update({ ativo: false }).eq('id', avisoId)
  if (error) return { error: 'Erro ao arquivar aviso.' }

  revalidatePath('/avisos')
  revalidatePath('/aluno')
  return { success: true }
}
