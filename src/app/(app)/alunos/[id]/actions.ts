'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const FAIXAS = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'] as const

export async function graduarAluno(alunoId: string, faixa: string, grau: number) {
  if (!FAIXAS.includes(faixa as typeof FAIXAS[number])) return { error: 'Faixa inválida.' }
  if (grau < 0 || grau > 4) return { error: 'Grau inválido.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // Estado atual pra saber o que mudou e datar só o evento certo.
  const { data: atual } = await supabase
    .from('alunos')
    .select('faixa, grau')
    .eq('id', alunoId)
    .single()

  const hoje = new Date().toISOString()
  const updates: { faixa: string; grau: number; graduado_em?: string; grau_em?: string | null } = { faixa, grau }

  if (atual) {
    if (atual.faixa !== faixa) {
      // Trocou de faixa: data a nova faixa e zera o marco de grau
      // (grau só data se a promoção já veio com graus).
      updates.graduado_em = hoje
      updates.grau_em = grau > 0 ? hoje : null
    } else if (grau > atual.grau) {
      // Mesma faixa, ganhou grau: data o último grau.
      updates.grau_em = hoje
    }
  }

  const { error } = await supabase
    .from('alunos')
    .update(updates)
    .eq('id', alunoId)

  if (error) return { error: 'Erro ao graduar aluno.' }
  revalidatePath(`/alunos/${alunoId}`)
  revalidatePath('/aluno/perfil')
  return { success: true }
}

export async function updateAluno(
  alunoId: string,
  nome: string,
  email: string,
  telefone: string,
  dataNascimento: string,
  condicoesSaude: string,
  diaMensalidade: string,
) {
  const nomeTrim = nome.trim()
  if (!nomeTrim) return { error: 'Nome é obrigatório.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('alunos')
    .update({
      nome: nomeTrim,
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      data_nascimento: dataNascimento.trim() || null,   // vazio = não preenchido
      condicoes_saude: condicoesSaude,                   // '' é válido = sem condições
      dia_mensalidade: diaMensalidade ? Number(diaMensalidade) || null : null,
    })
    .eq('id', alunoId)

  if (error) return { error: 'Erro ao atualizar aluno.' }
  revalidatePath(`/alunos/${alunoId}`)
  revalidatePath('/alunos')
  return { success: true }
}

export async function inativarAluno(alunoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase.from('alunos').update({ ativo: false }).eq('id', alunoId)
  if (error) return { error: 'Erro ao inativar aluno.' }

  revalidatePath(`/alunos/${alunoId}`)
  revalidatePath('/alunos')
  return { success: true }
}

export async function updateFotoAluno(alunoId: string, fotoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase.from('alunos').update({ foto_url: fotoUrl }).eq('id', alunoId)
  if (error) return { error: 'Erro ao salvar foto.' }

  revalidatePath(`/alunos/${alunoId}`)
  revalidatePath('/alunos')
  return { success: true }
}

export async function reativarAluno(alunoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase.from('alunos').update({ ativo: true }).eq('id', alunoId)
  if (error) return { error: 'Erro ao reativar aluno.' }

  revalidatePath(`/alunos/${alunoId}`)
  revalidatePath('/alunos')
  return { success: true }
}
