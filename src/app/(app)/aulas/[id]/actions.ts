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

// Academia do professor logado — usada pra garantir que a ação só afeta
// aulas da própria academia (defesa além do RLS).
async function academiaDoProfessor(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: prof } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  return prof?.academia_id ?? null
}

// Edita a observação livre pros alunos e o link de estudo de uma aula já
// criada. `observacoes` reusa a coluna homônima do schema (antes sem uso).
export async function atualizarInfoAula(
  aulaId: string,
  dados: { observacoes: string; video_url: string },
) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }

  const { data: aula } = await supabase
    .from('aulas')
    .select('id')
    .eq('id', aulaId)
    .eq('academia_id', academiaId)
    .maybeSingle()

  if (!aula) return { error: 'Aula não encontrada.' }

  const observacoes = dados.observacoes.trim() || null
  const video_url = dados.video_url.trim() || null

  const { error } = await supabase
    .from('aulas')
    .update({ observacoes, video_url })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao salvar.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}

export async function reabrirAula(aulaId: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }

  const { data: aula } = await supabase
    .from('aulas')
    .select('id, status')
    .eq('id', aulaId)
    .eq('academia_id', academiaId)
    .maybeSingle()

  if (!aula) return { error: 'Aula não encontrada.' }
  if (aula.status !== 'finalizada') return { error: 'Aula não está finalizada.' }

  const { error } = await supabase
    .from('aulas')
    .update({ status: 'aberta' })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao reabrir aula.' }
  revalidatePath(`/aulas/${aulaId}`)
  revalidatePath('/aulas')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function apagarAula(aulaId: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }

  // Confirma que a aula é da academia do professor antes de apagar.
  const { data: aula } = await supabase
    .from('aulas')
    .select('id')
    .eq('id', aulaId)
    .eq('academia_id', academiaId)
    .maybeSingle()

  if (!aula) return { error: 'Aula não encontrada.' }

  // ON DELETE CASCADE cuida de presencas, aula_tecnicas, anotacoes_treino
  // e resenhas_aula (todas as FKs já têm cascade).
  const { error } = await supabase.from('aulas').delete().eq('id', aulaId)
  if (error) return { error: 'Erro ao apagar aula.' }

  revalidatePath('/aulas')
  revalidatePath('/dashboard')
  revalidatePath('/planejamento')
  return { success: true }
}
