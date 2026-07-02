'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function matricularAluno(turmaId: string, alunoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('alunos_turmas')
    .upsert({ turma_id: turmaId, aluno_id: alunoId, ativo: true }, { onConflict: 'aluno_id,turma_id' })

  if (error) return { error: 'Erro ao matricular aluno.' }

  revalidatePath(`/turmas/${turmaId}`)
  revalidatePath(`/alunos/${alunoId}`)
  return { success: true }
}

export async function updateTurma(turmaId: string, nome: string, diasSemana: string[], horario: string) {
  const nomeTrim = nome.trim()
  if (!nomeTrim) return { error: 'Nome é obrigatório.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('turmas')
    .update({
      nome: nomeTrim,
      dias_semana: diasSemana,
      horario: horario || null,
    })
    .eq('id', turmaId)

  if (error) return { error: 'Erro ao atualizar turma.' }
  revalidatePath(`/turmas/${turmaId}`)
  revalidatePath('/turmas')
  return { success: true }
}

export async function removerDaTurma(turmaId: string, alunoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('alunos_turmas')
    .delete()
    .eq('turma_id', turmaId)
    .eq('aluno_id', alunoId)

  if (error) return { error: 'Erro ao remover aluno.' }

  revalidatePath(`/turmas/${turmaId}`)
  revalidatePath(`/alunos/${alunoId}`)
  return { success: true }
}
