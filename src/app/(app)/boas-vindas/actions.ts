'use server'

import { createClient } from '@/lib/supabase/server'

export async function vincularAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Sessão inválida.' }

  // Already linked (trigger may have run on first login)
  const { data: existing } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { success: true }

  // Try to link via SECURITY DEFINER function (bypasses RLS)
  const { data: vinculado, error } = await supabase.rpc('vincular_aluno_por_email', {
    p_email: user.email,
    p_user_id: user.id,
  })

  if (error) return { error: 'Erro ao vincular perfil.' }

  if (!vinculado) {
    return { error: 'Seu e-mail não foi cadastrado por nenhum professor ainda. Peça a ele para te adicionar no sistema.' }
  }

  return { success: true }
}
