'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPushToAll } from '@/lib/push'

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

  // Toda aula nasce agendada — o professor abre explicitamente quando
  // for começar, mesmo se for hoje. Isso garante uma fase de planejamento
  // real em vez de pular direto pro modo "ao vivo".
  const status = 'agendada'

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
      status,
    })
    .select('id')
    .single()

  if (error || !aula) return { error: 'Erro ao salvar aula.' }

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

  // Toda aula nasce agendada agora — push só dispara quando o professor
  // abre de fato, em abrirAulaAgendada().

  revalidatePath('/aulas')
  revalidatePath('/dashboard')
  return { success: true, id: aula.id, status }
}

export async function abrirAulaAgendada(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aula } = await supabase
    .from('aulas')
    .update({ status: 'aberta' })
    .eq('id', aulaId)
    .eq('status', 'agendada')
    .select('id, turma_id')
    .maybeSingle()

  if (!aula) return { error: 'Aula não encontrada ou já aberta.' }

  if (aula.turma_id) {
    const { data: turma } = await supabase.from('turmas').select('nome').eq('id', aula.turma_id).maybeSingle()
    const { data: subs } = await supabase.rpc('subscricoes_da_turma', { p_turma_id: aula.turma_id })
    if (subs && subs.length > 0) {
      await sendPushToAll(subs, {
        title: '🥋 Aula aberta!',
        body: `${turma?.nome ?? 'Sua turma'} — confirme sua presença`,
        url: '/aluno',
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/aulas')
  return { success: true }
}

export async function cancelarAulaAgendada(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('aulas')
    .update({ status: 'cancelada' })
    .eq('id', aulaId)
    .eq('status', 'agendada')

  if (error) return { error: 'Erro ao cancelar aula.' }

  revalidatePath('/dashboard')
  revalidatePath('/aulas')
  return { success: true }
}

export async function duplicarAula(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores').select('id, academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) return { error: 'Professor não encontrado.' }

  const aulaOrigemId = formData.get('aula_origem_id') as string
  const turmaId = (formData.get('turma_id') as string | null) || null
  const data_aula = formData.get('data') as string
  const hora_inicio = (formData.get('hora_inicio') as string | null) || null

  const { data: aulaOrigem } = await supabase
    .from('aulas')
    .select('tema_id, video_url')
    .eq('id', aulaOrigemId)
    .eq('academia_id', professor.academia_id)
    .single()

  if (!aulaOrigem) return { error: 'Aula não encontrada.' }

  // Só copia as PLANEJADAS — ensinada/nao_ensinada são resultado da
  // execução da aula original, não fazem sentido numa aula ainda não dada.
  const { data: tecnicasOrigem } = await supabase
    .from('aula_tecnicas')
    .select('tecnica_id, reforco')
    .eq('aula_id', aulaOrigemId)
    .eq('tipo', 'planejada')

  const { data: novaAula, error } = await supabase
    .from('aulas')
    .insert({
      academia_id: professor.academia_id,
      professor_id: professor.id,
      turma_id: turmaId,
      data: data_aula,
      hora_inicio: hora_inicio || null,
      tema_id: aulaOrigem.tema_id,
      video_url: aulaOrigem.video_url,
      status: 'agendada',
    })
    .select('id')
    .single()

  if (error || !novaAula) return { error: 'Erro ao criar aula duplicada.' }

  if (tecnicasOrigem && tecnicasOrigem.length > 0) {
    await supabase.from('aula_tecnicas').insert(
      tecnicasOrigem.map(t => ({
        aula_id: novaAula.id,
        tecnica_id: t.tecnica_id,
        tipo: 'planejada',
        reforco: t.reforco,
      }))
    )
  }

  revalidatePath('/aulas')
  revalidatePath('/semana')
  revalidatePath('/dashboard')
  return { success: true, id: novaAula.id }
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

export async function adicionarVisitante(aulaId: string, nome: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const nomeTrim = nome.trim()
  if (!nomeTrim) return { error: 'Nome é obrigatório.' }

  const { data, error } = await supabase
    .from('presencas')
    .insert({ aula_id: aulaId, nome_visitante: nomeTrim, origem: 'professor' })
    .select('id')
    .single()

  if (error || !data) return { error: 'Erro ao adicionar visitante.' }

  revalidatePath(`/aulas/${aulaId}`)
  return { success: true, id: data.id }
}

export async function removerVisitante(presencaId: string, aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase.from('presencas').delete().eq('id', presencaId)
  if (error) return { error: 'Erro ao remover visitante.' }

  revalidatePath(`/aulas/${aulaId}`)
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
