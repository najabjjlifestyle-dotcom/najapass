'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Academia do professor logado — defesa além do RLS (mesmo padrão de actions.ts).
async function academiaDoProfessor(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: prof } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  return prof?.academia_id ?? null
}

// Confirma que a aula é da academia do professor.
async function aulaDaAcademia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  aulaId: string,
  academiaId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('aulas').select('id').eq('id', aulaId).eq('academia_id', academiaId).maybeSingle()
  return Boolean(data)
}

export async function criarGrupoAula(aulaId: string, nome: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }
  if (!(await aulaDaAcademia(supabase, aulaId, academiaId))) return { error: 'Aula não encontrada.' }

  const nomeT = nome.trim()
  if (!nomeT) return { error: 'Dê um nome ao grupo.' }

  const { data, error } = await supabase
    .from('aula_grupos')
    .insert({ aula_id: aulaId, nome: nomeT })
    .select('id')
    .single()

  if (error || !data) return { error: 'Erro ao criar grupo.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true, grupoId: data.id }
}

export async function renomearGrupoAula(aulaId: string, grupoId: string, nome: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }

  const nomeT = nome.trim()
  if (!nomeT) return { error: 'Nome não pode ser vazio.' }

  // RLS já garante que o grupo é de uma aula da academia do professor.
  const { error } = await supabase
    .from('aula_grupos').update({ nome: nomeT }).eq('id', grupoId)

  if (error) return { error: 'Erro ao renomear grupo.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}

// Remove o grupo. Via FK, as técnicas do grupo somem (ON DELETE CASCADE em
// aula_tecnicas.grupo_id) — cuidado: isso APAGA as técnicas daquele grupo.
// Por isso, antes de deletar o grupo, desatrela as técnicas (grupo_id = NULL)
// pra não perder o registro do que foi ensinado; só as presenças voltam a
// grupo_id NULL (ON DELETE SET NULL).
export async function removerGrupoAula(aulaId: string, grupoId: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }

  await supabase.from('aula_tecnicas').update({ grupo_id: null }).eq('grupo_id', grupoId)
  const { error } = await supabase.from('aula_grupos').delete().eq('id', grupoId)

  if (error) return { error: 'Erro ao remover grupo.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}

export async function atribuirAlunoAoGrupo(aulaId: string, presencaId: string, grupoId: string | null) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }
  if (!(await aulaDaAcademia(supabase, aulaId, academiaId))) return { error: 'Aula não encontrada.' }

  const { error } = await supabase
    .from('presencas').update({ grupo_id: grupoId }).eq('id', presencaId).eq('aula_id', aulaId)

  if (error) return { error: 'Erro ao atribuir aluno.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}

export async function atribuirTecnicaAoGrupo(aulaId: string, tecnicaId: string, grupoId: string | null) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Sessão expirada.' }
  if (!(await aulaDaAcademia(supabase, aulaId, academiaId))) return { error: 'Aula não encontrada.' }

  const { error } = await supabase
    .from('aula_tecnicas').update({ grupo_id: grupoId }).eq('aula_id', aulaId).eq('tecnica_id', tecnicaId)

  if (error) return { error: 'Erro ao atribuir posição.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}
