'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function criarTema(nome: string) {
  const nomeTrim = nome.trim()
  if (!nomeTrim) return { error: 'Nome é obrigatório.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores').select('id').eq('user_id', user.id).maybeSingle()
  if (!professor) return { error: 'Apenas professores podem criar temas.' }

  const { data, error } = await supabase
    .from('categorias_tecnicas')
    .insert({ nome: nomeTrim })
    .select('id, nome')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Já existe um tema com esse nome.' }
    return { error: 'Erro ao criar tema.' }
  }

  revalidatePath('/aulas/nova')
  revalidatePath('/tecnicas/nova')
  return { success: true, tema: data }
}

export async function criarTecnica(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) return { error: 'Sem academia.' }

  const nome = (formData.get('nome') as string).trim()
  const categoria_id = (formData.get('categoria_id') as string) || null
  const descricao = (formData.get('descricao') as string | null)?.trim() || null
  const faixas = formData.getAll('faixas[]') as string[]

  if (!nome) return { error: 'Nome é obrigatório.' }

  const { data: nova, error } = await supabase.from('tecnicas').insert({
    academia_id: professor.academia_id, nome, categoria_id, descricao,
    faixas: faixas.length > 0 ? faixas : [],
  }).select('id').single()

  if (error || !nova) return { error: 'Erro ao salvar técnica.' }
  revalidatePath('/tecnicas')
  // Vai direto pro detalhe da técnica recém-criada (antes caía na lista e a
  // técnica ficava inacessível — não dava pra editar/ver).
  redirect(`/tecnicas/${nova.id}`)
}

// Edita uma técnica DA ACADEMIA (globais usam o override via
// tecnicas_academias, não são editadas direto). Valida a posse antes de gravar.
export async function editarTecnica(tecnicaId: string, formData: FormData) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Apenas professores podem editar.' }

  const { data: tecnica } = await supabase
    .from('tecnicas')
    .select('id')
    .eq('id', tecnicaId)
    .eq('academia_id', academiaId)
    .eq('global', false)
    .maybeSingle()

  if (!tecnica) return { error: 'Técnica não encontrada ou não editável.' }

  const nome = (formData.get('nome') as string | null)?.trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const categoria_id = (formData.get('categoria_id') as string | null) || null
  const faixas = formData.getAll('faixas[]') as string[]

  const { error } = await supabase
    .from('tecnicas')
    .update({ nome, categoria_id, faixas })
    .eq('id', tecnicaId)

  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/tecnicas')
  revalidatePath(`/tecnicas/${tecnicaId}`)
  return { success: true }
}

// Academia do professor logado (null se não for professor). Defesa além do RLS.
async function academiaDoProfessor(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: prof } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  return prof?.academia_id ?? null
}

// B-116 — renomeia (override) uma técnica global no contexto da academia.
export async function renomearTecnica(tecnicaId: string, novoNome: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Apenas professores podem renomear.' }

  const nome = novoNome.trim()
  if (!nome) return { error: 'Nome não pode ser vazio.' }

  // Confirma que a técnica existe e é acessível (global ou da própria academia).
  const { data: tecnica } = await supabase
    .from('tecnicas')
    .select('id')
    .eq('id', tecnicaId)
    .or(`academia_id.eq.${academiaId},global.eq.true`)
    .maybeSingle()

  if (!tecnica) return { error: 'Técnica não encontrada.' }

  const { error } = await supabase
    .from('tecnicas_academias')
    .upsert(
      { academia_id: academiaId, tecnica_id: tecnicaId, nome_custom: nome },
      { onConflict: 'academia_id,tecnica_id' },
    )

  if (error) return { error: 'Erro ao salvar nome.' }

  revalidatePath('/tecnicas')
  revalidatePath('/aulas')
  revalidatePath('/planejamento')
  return { success: true }
}

// B-116 — remove o override, voltando ao nome global original.
export async function removerRenomeTecnica(tecnicaId: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Apenas professores podem restaurar.' }

  const { error } = await supabase
    .from('tecnicas_academias')
    .delete()
    .eq('academia_id', academiaId)
    .eq('tecnica_id', tecnicaId)

  if (error) return { error: 'Erro ao restaurar nome.' }

  revalidatePath('/tecnicas')
  revalidatePath('/aulas')
  revalidatePath('/planejamento')
  return { success: true }
}

// B-117 — duplica uma técnica global gerando uma variação própria da academia.
export async function duplicarTecnica(tecnicaOrigemId: string, novoNome: string) {
  const supabase = await createClient()
  const academiaId = await academiaDoProfessor(supabase)
  if (!academiaId) return { error: 'Apenas professores podem duplicar.' }

  const nome = novoNome.trim()
  if (!nome) return { error: 'Nome não pode ser vazio.' }

  const { data: origem } = await supabase
    .from('tecnicas')
    .select('id, categoria_id, faixas, global')
    .eq('id', tecnicaOrigemId)
    .maybeSingle()

  if (!origem) return { error: 'Técnica original não encontrada.' }
  if (!origem.global) return { error: 'Apenas técnicas globais podem ser duplicadas.' }

  const { data: nova, error } = await supabase
    .from('tecnicas')
    .insert({
      nome,
      academia_id: academiaId,
      global: false,
      categoria_id: origem.categoria_id,
      faixas: origem.faixas ?? [],
      tecnica_origem_id: tecnicaOrigemId,
    })
    .select('id')
    .single()

  if (error || !nova) return { error: 'Erro ao duplicar técnica.' }

  revalidatePath('/tecnicas')
  return { success: true, novaId: nova.id }
}
