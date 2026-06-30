'use server'

import { createClient } from '@/lib/supabase/server'

export async function solicitarEntrada(academiaId: string, nome: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Sessão inválida.' }

  const { data: existing } = await supabase
    .from('solicitacoes')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('academia_id', academiaId)
    .maybeSingle()

  if (existing?.status === 'pendente') return { success: true }
  if (existing?.status === 'aprovado') return { success: true }

  const { error } = await supabase
    .from('solicitacoes')
    .insert({
      academia_id: academiaId,
      user_id: user.id,
      email: user.email,
      nome: nome.trim(),
    })

  if (error) return { error: 'Erro ao enviar solicitação.' }

  return { success: true }
}
