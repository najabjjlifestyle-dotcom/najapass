'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const FAIXAS = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'] as const

export async function updatePerfilProfessor(nome: string, faixa: string) {
  const nomeTrim = nome.trim()
  if (!nomeTrim) return { error: 'Nome é obrigatório.' }
  if (!FAIXAS.includes(faixa as typeof FAIXAS[number])) return { error: 'Faixa inválida.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('professores')
    .update({ nome: nomeTrim, faixa })
    .eq('user_id', user.id)

  if (error) return { error: 'Erro ao atualizar perfil.' }
  revalidatePath('/perfil')
  revalidatePath('/dashboard')
  return { success: true }
}
