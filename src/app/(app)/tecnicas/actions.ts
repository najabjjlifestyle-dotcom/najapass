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

  const { error } = await supabase.from('tecnicas').insert({
    academia_id: professor.academia_id, nome, categoria_id, descricao,
    faixas: faixas.length > 0 ? faixas : [],
  })

  if (error) return { error: 'Erro ao salvar técnica.' }
  revalidatePath('/tecnicas')
  redirect('/tecnicas')
}
