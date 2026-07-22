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
  const updates: {
    faixa: string; grau: number
    graduado_em?: string; grau_em?: string | null
    celebrar_graduacao?: boolean
  } = { faixa, grau }

  // Promoção de verdade = faixa subiu OU (mesma faixa e grau aumentou).
  // Só nesse caso datamos e disparamos a celebração — assim confirmar o
  // form sem mudar nada (ou corrigir pra baixo) não celebra à toa.
  const subiuFaixa = FAIXAS.indexOf(faixa as typeof FAIXAS[number]) > FAIXAS.indexOf((atual?.faixa ?? 'branca') as typeof FAIXAS[number])
  const subiuGrau = atual ? (faixa === atual.faixa && grau > atual.grau) : grau > 0
  const houvePromocao = subiuFaixa || subiuGrau

  if (subiuFaixa) {
    // Trocou pra faixa mais alta: data a nova faixa e zera o marco de grau
    // (grau só data se a promoção já veio com graus).
    updates.graduado_em = hoje
    updates.grau_em = grau > 0 ? hoje : null
  } else if (subiuGrau) {
    // Mesma faixa, ganhou grau: data o último grau.
    updates.grau_em = hoje
  }

  if (houvePromocao) updates.celebrar_graduacao = true

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

export async function adicionarNota(alunoId: string, texto: string) {
  const textoCleaned = texto.trim().slice(0, 1000)
  if (!textoCleaned) return { error: 'Nota vazia.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: prof } = await supabase
    .from('professores').select('id').eq('user_id', user.id).maybeSingle()
  if (!prof) return { error: 'Professor não encontrado.' }

  const { error } = await supabase
    .from('notas_professor')
    .insert({ professor_id: prof.id, aluno_id: alunoId, texto: textoCleaned })

  if (error) return { error: 'Erro ao salvar nota.' }
  revalidatePath(`/alunos/${alunoId}`)
  return { success: true }
}

export async function deletarNota(notaId: string, alunoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  await supabase.from('notas_professor').delete().eq('id', notaId)
  revalidatePath(`/alunos/${alunoId}`)
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
