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
  revalidatePath('/aluno/perfil')
  return { success: true }
}

export async function dismissCelebracao() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Via RPC SECURITY DEFINER: o aluno não tem UPDATE direto em `alunos`
  // (só SELECT), então um update normal seria bloqueado pelo RLS sem erro
  // e a flag nunca zeraria — prendendo o aluno em loop na celebração.
  await supabase.rpc('dismissar_celebracao_propria')

  revalidatePath('/aluno')
}

export async function salvarAnotacao(aulaId: string, texto: string) {
  const textoCleaned = texto.trim().slice(0, 2000)
  if (!textoCleaned) return { error: 'Anotação vazia.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos').select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return { error: 'Aluno não encontrado.' }

  const { error } = await supabase
    .from('anotacoes_treino')
    .upsert(
      { aluno_id: aluno.id, aula_id: aulaId, texto: textoCleaned },
      { onConflict: 'aluno_id,aula_id' }
    )

  if (error) return { error: 'Erro ao salvar anotação.' }
  revalidatePath(`/aluno/aula/${aulaId}/anotacao`)
  revalidatePath('/aluno/historico')
  return { success: true }
}

export async function deletarAnotacao(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos').select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return { error: 'Aluno não encontrado.' }

  await supabase
    .from('anotacoes_treino')
    .delete()
    .eq('aluno_id', aluno.id)
    .eq('aula_id', aulaId)

  revalidatePath('/aluno/historico')
  return { success: true }
}

export async function updatePerfilProprio(dataNascimento: string, condicoesSaude: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Via RPC SECURITY DEFINER: o aluno não tem UPDATE direto em `alunos`
  // (só SELECT), então um update normal seria bloqueado pelo RLS sem erro.
  const { error } = await supabase.rpc('atualizar_perfil_proprio', {
    p_data_nascimento: dataNascimento.trim() || null,
    p_condicoes_saude: condicoesSaude,   // '' = sem condições (diferente de null = não preenchido)
  })

  if (error) return { error: 'Erro ao salvar informações.' }

  revalidatePath('/aluno/perfil')
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
