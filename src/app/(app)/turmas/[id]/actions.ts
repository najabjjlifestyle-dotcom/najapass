'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calcularDatasRecorrentes, type Turma } from '@/lib/gerar-aulas'

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

export async function updateTurma(
  turmaId: string,
  nome: string,
  diasSemana: string[],
  horario: string,
  autoAbrirHoras: number | null,
) {
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
      auto_abrir_horas: autoAbrirHoras,
    })
    .eq('id', turmaId)

  if (error) return { error: 'Erro ao atualizar turma.' }
  revalidatePath(`/turmas/${turmaId}`)
  revalidatePath('/turmas')
  return { success: true }
}

export async function gerarAulasRecorrentes(turmaId: string, semanas: 1 | 2 | 4) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores')
    .select('id, academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) return { error: 'Academia não encontrada.' }

  const { data: turma } = await supabase
    .from('turmas')
    .select('id, dias_semana, horario')
    .eq('id', turmaId)
    .eq('academia_id', professor.academia_id)
    .maybeSingle()

  if (!turma) return { error: 'Turma não encontrada.' }
  if (!turma.dias_semana || turma.dias_semana.length === 0) {
    return { error: 'Essa turma não tem dias da semana configurados.' }
  }

  const datas = calcularDatasRecorrentes(turma as Turma, semanas, professor.academia_id)
  if (datas.length === 0) return { error: 'Nenhuma data encontrada para o período.' }

  const { data: existentes } = await supabase
    .from('aulas')
    .select('data')
    .eq('turma_id', turmaId)
    .in('data', datas.map(d => d.data))
    .in('status', ['agendada', 'aberta'])

  const datasExistentes = new Set((existentes ?? []).map(e => e.data))
  const novas = datas
    .filter(d => !datasExistentes.has(d.data))
    .map(d => ({ ...d, professor_id: professor.id }))

  if (novas.length === 0) {
    return { error: 'Todas as datas neste período já têm aula agendada.' }
  }

  const { error } = await supabase.from('aulas').insert(novas)
  if (error) return { error: 'Erro ao gerar aulas.' }

  revalidatePath(`/turmas/${turmaId}`)
  revalidatePath('/aulas')
  revalidatePath('/dashboard')
  return { success: true, criadas: novas.length }
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
