# HANDOFF-025 — Detalhe da Aula + Cantinho da Resenha

**Data:** 2026-07-22  
**Branch:** `feat/sprint28-aula-social`  
**Base:** `main`  
**Épico:** EP-30 — Aula Social  
**Cards:** B-100 · B-101 · B-102

> O aluno clica numa aula do histórico e entra num espaço completo: foto da turma, técnicas ensinadas, quem estava lá — e um cantinho para comentar, zoar e reviver o treino com a galera.

---

## Contexto visual

A tela de histórico (`/aluno/historico`) já exibe cards de aula com ícone ✏️/📝. Hoje clicar no ícone vai direto para `/aluno/aula/[id]/anotacao` (diário privado). O problema: não existe uma página principal para a aula — o aluno não tem como ver técnicas, foto ou quem foi, a não ser que o professor tenha registrado no app do professor.

Esse HANDOFF cria `/aluno/aula/[id]` como hub completo da aula, e move o link do histórico para essa página principal.

---

## B-100 — Migration

Arquivo: `supabase/migrations/20260722000004_resenhas_aula.sql`

```sql
-- Cantinho da Resenha: comentários dos alunos por aula
CREATE TABLE IF NOT EXISTS resenhas_aula (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id    UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  aluno_id   UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  texto      TEXT NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 280),
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS resenhas_aula_aula_id_idx ON resenhas_aula(aula_id);

ALTER TABLE resenhas_aula ENABLE ROW LEVEL SECURITY;

-- Aluno vê resenhas de aulas da própria academia
CREATE POLICY "aluno_ve_resenhas_academia"
ON resenhas_aula FOR SELECT
USING (
  aula_id IN (
    SELECT a.id FROM aulas a
    JOIN alunos al ON al.academia_id = a.academia_id
    WHERE al.user_id = auth.uid()
  )
);

-- Aluno pode inserir resenha em aulas da sua academia
CREATE POLICY "aluno_insere_resenha"
ON resenhas_aula FOR INSERT
WITH CHECK (
  aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid())
  AND
  aula_id IN (
    SELECT a.id FROM aulas a
    JOIN alunos al ON al.academia_id = a.academia_id
    WHERE al.user_id = auth.uid()
  )
);

-- Aluno deleta apenas as próprias resenhas
CREATE POLICY "aluno_deleta_propria_resenha"
ON resenhas_aula FOR DELETE
USING (
  aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid())
);

-- Professor pode deletar qualquer resenha da sua academia
CREATE POLICY "professor_modera_resenhas"
ON resenhas_aula FOR DELETE
USING (
  aula_id IN (
    SELECT a.id FROM aulas a
    JOIN professores p ON p.academia_id = a.academia_id
    WHERE p.user_id = auth.uid()
  )
);
```

---

## B-101 — Página `/aluno/aula/[id]`

### 1. Server component: `src/app/(app)/aluno/aula/[id]/page.tsx`

```tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import ResenhaSection from './resenha-section'

// Mapa de cores por faixa para chips de categoria
const CATEGORIA_CORES: Record<string, string> = {
  'Guarda Fechada': '#2563EB',
  'Meia Guarda': '#7C3AED',
  'Guarda Aberta': '#0891B2',
  'Montada': '#DC2626',
  'Costas': '#EA580C',
  'Passagem de Guarda': '#16A34A',
  'Raspagem': '#CA8A04',
  'Finalização': '#9333EA',
  'Defesa': '#64748B',
  'Fundamentos': '#374151',
}

export default async function AulaDetalheAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const aluno = await getAlunoOuRedireciona()
  const supabase = await createClient()

  // Buscar dados da aula (valida que pertence à academia do aluno)
  const { data: aula } = await supabase
    .from('aulas')
    .select(`
      id, data, hora_inicio, tema, foto_url, status,
      turmas(nome),
      aula_tecnicas(
        tipo,
        tecnicas(nome, categorias_tecnicas(nome))
      )
    `)
    .eq('id', id)
    .eq('academia_id', aluno.academia_id)
    .maybeSingle()

  if (!aula) return notFound()

  // Buscar presenças (nomes públicos — sem dados sensíveis)
  const { data: presencasData } = await supabase
    .from('presencas')
    .select('aluno_id, nome_visitante, alunos(nome, foto_url)')
    .eq('aula_id', id)
    .order('registrado_em')

  // Buscar anotação própria do aluno (se existir)
  const { data: anotacao } = await supabase
    .from('anotacoes_treino')
    .select('id, texto')
    .eq('aula_id', id)
    .eq('aluno_id', aluno.id)
    .maybeSingle()

  // Buscar resenhas com dados do aluno
  const { data: resenhas } = await supabase
    .from('resenhas_aula')
    .select('id, texto, criado_em, alunos(nome, foto_url)')
    .eq('aula_id', id)
    .order('criado_em', { ascending: true })

  // Formatar técnicas ensinadas agrupadas por categoria
  type TecnicaRaw = {
    tipo: string
    tecnicas: { nome: string; categorias_tecnicas: { nome: string } | null } | null
  }
  const ensinadas = (aula.aula_tecnicas as unknown as TecnicaRaw[])
    .filter(at => at.tipo === 'ensinada' && at.tecnicas)
    .map(at => ({
      nome: at.tecnicas!.nome,
      categoria: at.tecnicas!.categorias_tecnicas?.nome ?? 'Outras',
    }))

  // Agrupar por categoria
  const porCategoria = ensinadas.reduce<Record<string, string[]>>((acc, t) => {
    if (!acc[t.categoria]) acc[t.categoria] = []
    acc[t.categoria].push(t.nome)
    return acc
  }, {})

  const turma = aula.turmas as unknown as { nome: string } | null
  const dataFormatada = new Date(aula.data).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  // Formatar lista de presentes
  type PresencaRaw = {
    aluno_id: string | null
    nome_visitante: string | null
    alunos: { nome: string; foto_url: string | null } | null
  }
  const presentes = (presencasData ?? []).map((p) => {
    const pr = p as unknown as PresencaRaw
    return {
      id: pr.aluno_id ?? pr.nome_visitante ?? '',
      nome: pr.alunos?.nome ?? pr.nome_visitante ?? 'Visitante',
      foto_url: pr.alunos?.foto_url ?? null,
      isVisitante: !pr.aluno_id,
    }
  })

  // Formatar resenhas
  type ResenhaRaw = {
    id: string
    texto: string
    criado_em: string
    alunos: { nome: string; foto_url: string | null } | null
  }
  const resenhasFormatadas = (resenhas ?? []).map((r) => {
    const rr = r as unknown as ResenhaRaw
    return {
      id: rr.id,
      texto: rr.texto,
      criado_em: rr.criado_em,
      aluno_nome: rr.alunos?.nome ?? 'Aluno',
      aluno_foto: rr.alunos?.foto_url ?? null,
      e_minha: false, // será determinado no client via aluno_id
    }
  })

  return (
    <div className="min-h-dvh pb-8" style={{ background: 'var(--brand-fundo)' }}>
      {/* Header */}
      <div className="px-4 pt-safe pt-4 pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/aluno/historico"
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ border: '1px solid var(--brand-border)' }}>
          <span style={{ color: 'var(--brand-texto)' }}>←</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
            {turma?.nome ?? 'Aula'}
          </p>
          <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            {dataFormatada}
            {aula.hora_inicio && ` · ${aula.hora_inicio.substring(0, 5)}`}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-5">

        {/* Foto da turma */}
        {aula.foto_url && (
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--brand-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={aula.foto_url}
              alt="Foto da turma"
              className="w-full object-cover"
              style={{ maxHeight: 260 }}
            />
          </div>
        )}

        {/* Tema */}
        {aula.tema && (
          <div className="rounded-xl px-4 py-3"
            style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-gold)' }}>
              Tema da aula
            </p>
            <p className="font-bold" style={{ color: 'var(--brand-texto)' }}>{aula.tema}</p>
          </div>
        )}

        {/* Técnicas ensinadas */}
        {Object.keys(porCategoria).length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Técnicas ensinadas
            </p>
            {Object.entries(porCategoria).map(([cat, tecnicas]) => (
              <div key={cat} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: CATEGORIA_CORES[cat] ?? 'var(--brand-texto-muted)' }}>
                  {cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tecnicas.map(nome => (
                    <span key={nome}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background: `${CATEGORIA_CORES[cat] ?? '#444'}22`,
                        border: `1px solid ${CATEGORIA_CORES[cat] ?? '#444'}44`,
                        color: 'var(--brand-texto)',
                      }}>
                      {nome}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quem foi */}
        {presentes.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Quem foi · {presentes.length} {presentes.length === 1 ? 'pessoa' : 'pessoas'}
            </p>
            <div className="flex flex-wrap gap-2">
              {presentes.map(p => (
                <div key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  {p.foto_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.foto_url} alt={p.nome}
                      className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
                      {p.nome.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-medium" style={{ color: p.isVisitante ? 'var(--brand-texto-muted)' : 'var(--brand-texto)' }}>
                    {p.nome.split(' ')[0]}{p.isVisitante ? ' (visitante)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minha anotação */}
        <Link href={`/aluno/aula/${id}/anotacao`}
          className="flex items-center justify-between px-4 py-3.5 rounded-xl active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{anotacao ? '📝' : '✏️'}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-texto)' }}>
                {anotacao ? 'Minha anotação' : 'Anotar esse treino'}
              </p>
              {anotacao && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--brand-texto-muted)' }}>
                  {anotacao.texto}
                </p>
              )}
            </div>
          </div>
          <span style={{ color: 'var(--brand-texto-muted)' }}>→</span>
        </Link>

        {/* Cantinho da Resenha */}
        <ResenhaSection
          aulaId={id}
          alunoId={aluno.id}
          alunoNome={aluno.nome}
          alunoFoto={aluno.foto_url}
          resenhasIniciais={resenhasFormatadas}
        />

      </div>
    </div>
  )
}
```

### 2. Atualização em `/aluno/historico/page.tsx`

Hoje o card da aula é um `<div>` com um link de ícone para `/aluno/aula/[id]/anotacao`. Mudar para que **toda a área do card** seja um link para `/aluno/aula/[id]`, e o ícone de diário seja um link secundário para `/aluno/aula/[id]/anotacao`.

Trecho atual (referência):
```tsx
// Antes: card não é clicável, só o ícone vai para /anotacao
<div className="...card...">
  <span>{nome_turma}</span>
  <Link href={`/aluno/aula/${aula.id}/anotacao`}>{icone}</Link>
</div>
```

Após a mudança:
```tsx
// Depois: card inteiro linka para /aluno/aula/[id], ícone mantém link para /anotacao
<Link
  href={`/aluno/aula/${aula.id}`}
  className="flex items-center justify-between px-4 py-3.5 rounded-xl active:scale-[0.98] transition-transform"
  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
  <div className="flex-1 min-w-0">
    <p className="font-semibold text-sm truncate" style={{ color: 'var(--brand-texto)' }}>
      {aula.turmas?.nome ?? 'Aula'}
    </p>
    <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
      {new Date(aula.data).toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short',
      })}
    </p>
    {/* chips de técnicas se existirem */}
  </div>
  {/* Ícone de diário — link separado, impede propagação para o card */}
  <a
    href={`/aluno/aula/${aula.id}/anotacao`}
    onClick={e => e.stopPropagation()}
    className="ml-3 text-xl flex-shrink-0 p-1"
    aria-label="Minha anotação">
    {temAnotacao ? '📝' : '✏️'}
  </a>
</Link>
```

> **Atenção:** `<a>` dentro de `<Link>` é HTML inválido. Usar `<Link>` para o card e um `<button>` ou `onClick` + `router.push` para o ícone secundário. O padrão correto é envolver apenas o texto/área principal no `<Link>` e posicionar o ícone como elemento separado fora do `<Link>`, usando `flex` com `pointer-events-none` no link e `pointer-events-auto` no ícone.

Solução limpa (sem `<a>` dentro de `<Link>`):
```tsx
<div className="relative">
  <Link href={`/aluno/aula/${aula.id}`}
    className="flex items-center px-4 py-3.5 rounded-xl pr-14 active:scale-[0.98] transition-transform"
    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm truncate" style={{ color: 'var(--brand-texto)' }}>
        {aula.turmas?.nome ?? 'Aula'}
      </p>
      <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
        {new Date(aula.data).toLocaleDateString('pt-BR', {
          weekday: 'short', day: '2-digit', month: 'short',
        })}
      </p>
    </div>
  </Link>
  <Link
    href={`/aluno/aula/${aula.id}/anotacao`}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl p-2"
    aria-label="Minha anotação">
    {temAnotacao ? '📝' : '✏️'}
  </Link>
</div>
```

---

## B-102 — Cantinho da Resenha

### 1. `src/app/(app)/aluno/aula/[id]/actions.ts` — actions de resenha

Adicionar ao arquivo existente (que já tem `salvarAnotacao` e `deletarAnotacao`):

```typescript
export async function postarResenha(aulaId: string, texto: string) {
  const textoCleaned = texto.trim().slice(0, 280)
  if (!textoCleaned) return { error: 'Resenha vazia.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!aluno) return { error: 'Aluno não encontrado.' }

  const { error } = await supabase
    .from('resenhas_aula')
    .insert({ aula_id: aulaId, aluno_id: aluno.id, texto: textoCleaned })

  if (error) return { error: 'Erro ao postar.' }
  revalidatePath(`/aluno/aula/${aulaId}`)
  return { success: true }
}

export async function deletarResenha(resenhaId: string, aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  await supabase.from('resenhas_aula').delete().eq('id', resenhaId)
  revalidatePath(`/aluno/aula/${aulaId}`)
  return { success: true }
}
```

### 2. `src/app/(app)/aluno/aula/[id]/resenha-section.tsx` — client component

```tsx
'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { postarResenha, deletarResenha } from './actions'

type Resenha = {
  id: string
  texto: string
  criado_em: string
  aluno_nome: string
  aluno_foto: string | null
}

function Avatar({ nome, foto, size = 32 }: { nome: string; foto: string | null; size?: number }) {
  if (foto) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={foto} alt={nome}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    )
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'var(--brand-gold-dim)',
        border: '1px solid var(--brand-gold-border)',
        color: 'var(--brand-gold)',
        fontSize: size * 0.38,
      }}>
      {nome.charAt(0)}
    </div>
  )
}

function tempoRelativo(dataStr: string): string {
  const diff = Date.now() - new Date(dataStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function ResenhaSection({
  aulaId,
  alunoId,
  alunoNome,
  alunoFoto,
  resenhasIniciais,
}: {
  aulaId: string
  alunoId: string
  alunoNome: string
  alunoFoto: string | null
  resenhasIniciais: Resenha[]
}) {
  const [resenhas, setResenhas] = useState<Resenha[]>(resenhasIniciais)
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const maxChars = 280

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [texto])

  function handlePostar() {
    if (!texto.trim() || isPending) return
    const textoLocal = texto.trim()
    const novaResenha: Resenha = {
      id: crypto.randomUUID(),
      texto: textoLocal,
      criado_em: new Date().toISOString(),
      aluno_nome: alunoNome,
      aluno_foto: alunoFoto,
    }
    // Otimista
    setResenhas(prev => [...prev, novaResenha])
    setTexto('')

    startTransition(async () => {
      const res = await postarResenha(aulaId, textoLocal)
      if (res?.error) {
        // Reverter se der erro
        setResenhas(prev => prev.filter(r => r.id !== novaResenha.id))
        setTexto(textoLocal)
      }
    })
  }

  function handleDeletar(resenhaId: string) {
    setResenhas(prev => prev.filter(r => r.id !== resenhaId))
    startTransition(async () => {
      await deletarResenha(resenhaId, aulaId)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handlePostar()
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
        <p className="text-[10px] font-bold uppercase tracking-widest px-3"
          style={{ color: 'var(--brand-texto-muted)' }}>
          🗣 Cantinho da Resenha
        </p>
        <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
      </div>

      {/* Lista de resenhas */}
      {resenhas.length === 0 ? (
        <div className="rounded-2xl py-8 text-center"
          style={{ background: 'var(--brand-surf)', border: '1px dashed var(--brand-border)' }}>
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm font-medium" style={{ color: 'var(--brand-texto)' }}>
            Ninguém falou nada ainda.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Seja o primeiro a comentar esse treino!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resenhas.map(r => {
            const eMinha = r.aluno_nome === alunoNome // simplificação para update otimista
            return (
              <div key={r.id}
                className="flex gap-3 items-start group"
                style={{ opacity: isPending && eMinha && r.id.length === 36 && !resenhasIniciais.find(ri => ri.id === r.id) ? 0.7 : 1 }}>
                <Avatar nome={r.aluno_nome} foto={r.aluno_foto} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
                        {r.aluno_nome.split(' ')[0]}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
                          {tempoRelativo(r.criado_em)}
                        </p>
                        {eMinha && (
                          <button
                            onClick={() => handleDeletar(r.id)}
                            disabled={isPending}
                            className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-20"
                            style={{ color: '#444' }}
                            aria-label="Deletar">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-texto)' }}>
                      {r.texto}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Input de nova resenha */}
      <div className="flex gap-2 items-end">
        <Avatar nome={alunoNome} foto={alunoFoto} size={34} />
        <div className="flex-1 rounded-2xl px-3 py-2 flex items-end gap-2"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value.slice(0, maxChars))}
            onKeyDown={handleKeyDown}
            placeholder="O que achou do treino? 🥋"
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
            style={{ color: 'var(--brand-texto)', minHeight: 24 }}
          />
          {texto.length > 240 && (
            <span className="text-[9px] flex-shrink-0 mb-0.5"
              style={{ color: texto.length >= maxChars ? '#DC2626' : 'var(--brand-texto-muted)' }}>
              {maxChars - texto.length}
            </span>
          )}
        </div>
        <button
          onClick={handlePostar}
          disabled={isPending || !texto.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm disabled:opacity-30 transition-opacity active:scale-95"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          ↑
        </button>
      </div>
      <p className="text-[9px] text-center" style={{ color: '#222' }}>
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </div>
  )
}
```

---

## Resumo dos arquivos

| Arquivo | Card | O que muda |
|---|---|---|
| `supabase/migrations/20260722000004_resenhas_aula.sql` | B-100 | **Novo.** Tabela `resenhas_aula` + RLS |
| `src/app/(app)/aluno/aula/[id]/page.tsx` | B-101 | **Novo.** Detalhe da aula: foto, técnicas, quem foi, link para anotação, ResenhaSection |
| `src/app/(app)/aluno/historico/page.tsx` | B-101 | Cards de aula viram links para `/aluno/aula/[id]`; ícone de diário permanece link separado |
| `src/app/(app)/aluno/aula/[id]/actions.ts` | B-102 | Adicionar `postarResenha` e `deletarResenha` |
| `src/app/(app)/aluno/aula/[id]/resenha-section.tsx` | B-102 | **Novo.** Client component do Cantinho da Resenha |

> **Nota:** `/aluno/aula/[id]` já tem `page.tsx` para a anotação em `/aluno/aula/[id]/anotacao/page.tsx`. A nova `page.tsx` vai para `/aluno/aula/[id]/page.tsx` (índice da rota), sem conflito.

---

## Critérios de aceite (Sprint 28)

**B-100 — Migration:**
- [ ] Tabela `resenhas_aula` criada com RLS
- [ ] Aluno só vê resenhas de aulas da própria academia
- [ ] Aluno só deleta as próprias resenhas
- [ ] Professor pode deletar qualquer resenha da academia (moderação)

**B-101 — Detalhe da aula:**
- [ ] Clicar no card da aula em `/aluno/historico` abre `/aluno/aula/[id]`
- [ ] Ícone ✏️/📝 permanece com link direto para `/aluno/aula/[id]/anotacao` (sem propagação)
- [ ] Foto da turma exibida quando `aulas.foto_url` existe
- [ ] Técnicas agrupadas por categoria com cor da categoria
- [ ] Lista "Quem foi" com avatares/iniciais e contagem
- [ ] Card "Anotar esse treino / Minha anotação" com preview da nota existente
- [ ] Bottom nav oculto (já coberto pela regra `/aluno/aula/*`)
- [ ] Aula de academia diferente retorna 404

**B-102 — Cantinho da Resenha:**
- [ ] Empty state: "Ninguém falou nada ainda. Seja o primeiro!"
- [ ] Input com placeholder "O que achou do treino? 🥋"
- [ ] Enter envia, Shift+Enter nova linha
- [ ] Post otimista: mensagem aparece antes da resposta do servidor
- [ ] Contador de caracteres aparece abaixo de 240/280 restantes
- [ ] Botão ✕ visível (hover) apenas nas próprias resenhas
- [ ] Delete otimista: mensagem some antes da resposta do servidor
- [ ] Tempo relativo: "agora", "5min", "2h", "3d", data após 7 dias
