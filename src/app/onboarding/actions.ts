'use server'

import { createClient } from '@/lib/supabase/server'

export async function criarAcademia(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  const nome = (formData.get('nome') as string).trim()
  const cidade = (formData.get('cidade') as string | null)?.trim() || null
  const professorNome = (formData.get('professor_nome') as string).trim()

  if (!nome) return { error: 'Nome da academia é obrigatório.' }

  // Gera slug único
  const slug = nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  const { data: academia, error: acadError } = await supabase
    .from('academias')
    .insert({ nome, slug, cidade })
    .select('id')
    .single()

  if (acadError || !academia) {
    if (acadError?.code === '23505') return { error: 'Já existe uma academia com esse nome.' }
    return { error: 'Erro ao criar academia. Tente novamente.' }
  }

  const { error: profError } = await supabase
    .from('professores')
    .insert({
      academia_id: academia.id,
      user_id: user.id,
      nome: professorNome,
      email: user.email!,
    })

  if (profError) return { error: 'Erro ao criar perfil do professor.' }

  return { success: true }
}
