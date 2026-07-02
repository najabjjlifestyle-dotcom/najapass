'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function abrirAula(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores')
    .select('id, academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) return { error: 'Academia não encontrada.' }

  const turma_id = (formData.get('turma_id') as string | null) || null
  const data_aula = formData.get('data') as string
  const tema_id = (formData.get('tema_id') as string | null) || null
  const hora_inicio = (formData.get('hora_inicio') as string | null) || null
  const video_url = (formData.get('video_url') as string | null)?.trim() || null

  const planejadas = formData.getAll('planejadas[]') as string[]

  const { data: aula, error } = await supabase
    .from('aulas')
    .insert({
      academia_id: professor.academia_id,
      professor_id: professor.id,
      turma_id: turma_id || null,
      data: data_aula,
      hora_inicio: hora_inicio || null,
      tema_id: tema_id || null,
      video_url,
      status: 'aberta',
    })
    .select('id')
    .single()

  if (error || !aula) return { error: 'Erro ao abrir aula.' }

  // Salva as posições planejadas pelo professor
  if (planejadas.length > 0) {
    await supabase.from('aula_tecnicas').insert(
      planejadas.map(tecnica_id => ({
        aula_id: aula.id,
        tecnica_id,
        tipo: 'planejada',
        reforco: false,
      }))
    )
  }

  revalidatePath('/aulas')
  return { success: true, id: aula.id }
}

export async function togglePresenca(aulaId: string, alunoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: existing } = await supabase
    .from('presencas')
    .select('id')
    .eq('aula_id', aulaId)
    .eq('aluno_id', alunoId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('presencas')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: 'Erro ao remover presença.' }
  } else {
    const { error } = await supabase
      .from('presencas')
      .insert({ aula_id: aulaId, aluno_id: alunoId, origem: 'professor' })
    if (error) return { error: 'Erro ao registrar presença.' }
  }

  return { success: true }
}

export async function finalizarAula(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Posições planejadas não confirmadas → marcar como não ensinadas
  await supabase
    .from('aula_tecnicas')
    .update({ tipo: 'nao_ensinada' })
    .eq('aula_id', aulaId)
    .eq('tipo', 'planejada')

  const horaFim = new Date().toTimeString().slice(0, 8)

  const { error } = await supabase
    .from('aulas')
    .update({ status: 'finalizada', hora_fim: horaFim })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao finalizar aula.' }

  revalidatePath(`/aulas/${aulaId}`)
  revalidatePath('/aulas')
  return { success: true }
}
