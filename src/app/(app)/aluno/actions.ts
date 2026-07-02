'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fazerCheckin(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) return { error: 'Perfil de aluno não encontrado.' }

  const { error } = await supabase
    .from('presencas')
    .insert({ aula_id: aulaId, aluno_id: aluno.id, origem: 'aluno' })

  if (error) {
    if (error.code === '23505') return { error: 'Você já fez check-in nesta aula.' }
    return { error: 'Erro ao fazer check-in.' }
  }

  revalidatePath('/aluno')
  return { success: true }
}

export async function salvarPushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      { onConflict: 'endpoint' }
    )

  if (error) return { error: 'Erro ao ativar notificações.' }
  return { success: true }
}

export async function removerPushSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id)
  return { success: true }
}

export async function updateFotoPropria(fotoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase.rpc('atualizar_foto_propria', { p_foto_url: fotoUrl })
  if (error) return { error: 'Erro ao salvar foto.' }

  revalidatePath('/aluno')
  return { success: true }
}

export async function cancelarCheckin(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) return { error: 'Perfil não encontrado.' }

  await supabase
    .from('presencas')
    .delete()
    .eq('aula_id', aulaId)
    .eq('aluno_id', aluno.id)
    .eq('origem', 'aluno')

  revalidatePath('/aluno')
  return { success: true }
}
