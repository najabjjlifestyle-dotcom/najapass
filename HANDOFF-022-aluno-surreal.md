# HANDOFF-022 — Aluno Surreal

**Data:** 2026-07-22  
**Branch:** `feat/sprint25-aluno-surreal`  
**Base:** `main`  
**Épico:** EP-27 — Aluno Surreal  
**Cards:** B-084 · B-085 · B-086 · B-087 · B-088

> Quatro features que transformam o portal do aluno de ferramenta de check-in em companheiro de jornada: streak semanal de treinos (🔥 Duolingo no tatame), linha do tempo da faixa, diário privado de treino e tela de celebração de graduação.

---

## B-084 — Migration

Arquivo: `supabase/migrations/20260722000001_aluno_surreal.sql`

```sql
-- 1. Tabela de anotações privadas do aluno (diário de treino)
CREATE TABLE IF NOT EXISTS anotacoes_treino (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id   UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aula_id    UUID NOT NULL REFERENCES aulas(id)  ON DELETE CASCADE,
  texto      TEXT NOT NULL CHECK (char_length(texto) <= 2000),
  criado_em  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, aula_id)
);

ALTER TABLE anotacoes_treino ENABLE ROW LEVEL SECURITY;

-- Aluno só vê e edita suas próprias anotações (totalmente privado)
CREATE POLICY IF NOT EXISTS "aluno_anotacoes_proprias"
ON anotacoes_treino FOR ALL
USING (
  aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid())
);

-- 2. Flag de celebração de graduação
ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS celebrar_graduacao BOOLEAN DEFAULT FALSE;

-- 3. RPC — streak semanal do aluno
-- Uma "semana com treino" = ao menos 1 presença em aula finalizada naquela semana ISO (seg–dom).
-- Regra de grace: se a semana atual ainda não tem treino, não quebra o streak — só não conta.
-- Retorna o número de semanas consecutivas com treino (0 = nenhuma).
CREATE OR REPLACE FUNCTION calcular_streak_aluno(p_aluno_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_streak    INTEGER := 0;
  v_week      DATE;
  v_has_train BOOLEAN;
BEGIN
  -- Segunda-feira da semana atual (ISO: semana começa na segunda)
  v_week := DATE_TRUNC('week', CURRENT_DATE)::DATE;

  LOOP
    SELECT EXISTS(
      SELECT 1
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id
      WHERE p.aluno_id = p_aluno_id
        AND a.status   = 'finalizada'
        AND a.data     >= v_week
        AND a.data     <  v_week + 7
    ) INTO v_has_train;

    IF v_has_train THEN
      v_streak := v_streak + 1;
      v_week   := v_week - 7;
    ELSIF v_week = DATE_TRUNC('week', CURRENT_DATE)::DATE THEN
      -- Semana em andamento sem treino: pula sem quebrar
      v_week := v_week - 7;
    ELSE
      EXIT; -- gap encontrado → streak termina
    END IF;

    EXIT WHEN v_streak > 200; -- safety (≈ 4 anos)
  END LOOP;

  RETURN v_streak;
END;
$$;
```

Aplicar manualmente no SQL Editor do Supabase (igual às migrations anteriores).

---

## B-085 — Streak de treinos

### 1. `src/lib/aluno-auth.ts` — adicionar campos ao `AlunoBasico`

```typescript
export type AlunoBasico = {
  id: string
  nome: string
  faixa: string
  grau: number
  academia_id: string
  foto_url: string | null
  matriculado_em: string | null
  data_nascimento: string | null
  condicoes_saude: string | null
  dia_mensalidade: number | null
  graduado_em: string | null
  grau_em: string | null
  celebrar_graduacao: boolean     // ← novo
}

// Na query do select, adicionar 'celebrar_graduacao':
const { data: aluno } = await supabase
  .from('alunos')
  .select('id, nome, faixa, grau, academia_id, foto_url, matriculado_em, data_nascimento, condicoes_saude, dia_mensalidade, graduado_em, grau_em, celebrar_graduacao')
  .eq('user_id', user.id)
  .maybeSingle()
```

### 2. `src/app/(app)/aluno/page.tsx` — buscar streak + redirecionar para celebração

No topo do Server Component, após `getAlunoOuRedireciona()`:

```typescript
// Celebração de graduação pendente — tem prioridade sobre tudo
if (aluno.celebrar_graduacao) redirect('/aluno/celebracao')

// Streak — RPC leve, corre em paralelo com os outros fetches
// Adicionar ao Promise.all existente no topo da página:
const { data: streakData } = await supabase.rpc('calcular_streak_aluno', { p_aluno_id: aluno.id })
const streak = (streakData as number | null) ?? 0
```

### 3. `src/app/(app)/aluno/page.tsx` — exibir streak no header

No `<header>`, dentro da `<div className="min-w-0">` que contém nome e faixa, adicionar abaixo do chip de faixa:

```tsx
{/* Streak — aparece apenas quando ≥ 1 semana */}
{streak > 0 && (
  <div className="flex items-center gap-1 mt-1">
    <span className="text-xs">🔥</span>
    <span className="text-[11px] font-bold" style={{ color: 'var(--brand-gold)' }}>
      {streak} semana{streak > 1 ? 's' : ''} seguida{streak > 1 ? 's' : ''}
    </span>
  </div>
)}
```

**Comportamento completo:**
- `streak === 0`: nada exibido (aluno novo ou sem treinos recentes)
- `streak === 1`: "🔥 1 semana seguida"
- `streak >= 2`: "🔥 X semanas seguidas"
- A semana atual em andamento (sem treino ainda) não quebra o streak — a RPC já trata isso

---

## B-086 — Linha do tempo da faixa

### `src/app/(app)/aluno/perfil/page.tsx`

Adicionar uma query paralela para contar aulas na faixa atual:

```typescript
// Dentro do Promise.all já existente, adicionar:
supabase
  .from('presencas')
  .select('aulas!inner(data)', { count: 'exact', head: true })
  .eq('aluno_id', aluno.id)
  .gte('aulas.data', (aluno.graduado_em ?? aluno.matriculado_em ?? '1970-01-01').substring(0, 10)),
```

Resultado: `aulasNaFaixa` (number | null).

No JSX, dentro do card "hero da graduação" (o `<div>` com `BeltBar`), adicionar logo abaixo do `<div className="grid grid-cols-2 gap-3">` das datas:

```tsx
{/* Aulas nesta faixa */}
{(aulasNaFaixa ?? 0) > 0 && (
  <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--brand-border)' }}>
    <div className="flex items-center justify-between mb-2">
      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Aulas como faixa {aluno.faixa}
      </p>
      <p className="text-xs font-bold" style={{ color: 'var(--brand-gold)' }}>
        {aulasNaFaixa}
      </p>
    </div>
    <p className="text-[11px]" style={{ color: 'var(--brand-texto-sec)' }}>
      {aulasNaFaixa! >= 100
        ? `${aulasNaFaixa} aulas. Uma jornada e tanto. 🥋`
        : aulasNaFaixa! >= 50
        ? `${aulasNaFaixa} aulas sólidas nesta faixa.`
        : aulasNaFaixa! >= 20
        ? `${aulasNaFaixa} aulas. Está construindo a base.`
        : `${aulasNaFaixa} aula${aulasNaFaixa! > 1 ? 's' : ''} nesta faixa. Começando a jornada.`}
    </p>
  </div>
)}
```

**Lógica da data de referência:**
- `aluno.graduado_em` → data exata em que recebeu a faixa atual (mais preciso)
- fallback `aluno.matriculado_em` → matrícula (para quem entrou já com uma faixa ou tem dados antigos)
- fallback `'1970-01-01'` → conta tudo (segurança)

---

## B-087 — Diário do treino

### 1. `src/app/(app)/aluno/actions.ts` — nova action `salvarAnotacao`

```typescript
export async function salvarAnotacao(aulaId: string, texto: string) {
  const textoCleaned = texto.trim().slice(0, 2000)
  if (!textoCleaned) return { error: 'Anotação vazia.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos').select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return { error: 'Aluno não encontrado.' }

  const { error } = await supabase
    .from('anotacoes_treino')
    .upsert(
      { aluno_id: aluno.id, aula_id: aulaId, texto: textoCleaned },
      { onConflict: 'aluno_id,aula_id' }
    )

  if (error) return { error: 'Erro ao salvar anotação.' }
  revalidatePath(`/aluno/aula/${aulaId}/anotacao`)
  revalidatePath('/aluno/historico')
  return { success: true }
}

export async function deletarAnotacao(aulaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos').select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return { error: 'Aluno não encontrado.' }

  await supabase
    .from('anotacoes_treino')
    .delete()
    .eq('aluno_id', aluno.id)
    .eq('aula_id', aulaId)

  revalidatePath('/aluno/historico')
  return { success: true }
}
```

### 2. `src/app/(app)/aluno/aula/[id]/anotacao/page.tsx` — página de anotação

```tsx
import { notFound } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import BackButton from '@/components/back-button'
import AnotacaoForm from './anotacao-form'

export default async function AnotacaoAulaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: aulaId } = await params
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // Valida que o aluno esteve presente nessa aula
  const { data: presenca } = await supabase
    .from('presencas')
    .select('aulas(data, turmas(nome))')
    .eq('aluno_id', aluno.id)
    .eq('aula_id', aulaId)
    .maybeSingle()

  if (!presenca) notFound()

  const { data: anotacao } = await supabase
    .from('anotacoes_treino')
    .select('texto')
    .eq('aluno_id', aluno.id)
    .eq('aula_id', aulaId)
    .maybeSingle()

  type AulaInfo = { data: string; turmas: { nome: string } | null } | null
  const aulaInfo = presenca.aulas as unknown as AulaInfo
  const dataFmt = aulaInfo?.data
    ? new Date(aulaInfo.data + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long',
      })
    : null

  return (
    <div style={{ background: 'var(--brand-fundo)', minHeight: '100dvh' }}>
      <header className="flex items-center gap-3 px-4 pt-safe pb-4"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/aluno/historico" />
        <div>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Diário do treino
          </p>
          <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--brand-texto)' }}>
            {aulaInfo?.turmas?.nome ?? 'Aula avulsa'}
          </h1>
          {dataFmt && (
            <p className="text-[10px] capitalize mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              {dataFmt}
            </p>
          )}
        </div>
      </header>

      <main className="px-4 pt-5 pb-10">
        <AnotacaoForm aulaId={aulaId} textoAtual={anotacao?.texto ?? ''} />
      </main>
    </div>
  )
}
```

### 3. `src/app/(app)/aluno/aula/[id]/anotacao/anotacao-form.tsx` — formulário cliente

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarAnotacao, deletarAnotacao } from '@/app/(app)/aluno/actions'

export default function AnotacaoForm({
  aulaId,
  textoAtual,
}: {
  aulaId: string
  textoAtual: string
}) {
  const router = useRouter()
  const [texto, setTexto] = useState(textoAtual)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSalvar() {
    setSaved(false)
    startTransition(async () => {
      const res = await salvarAnotacao(aulaId, texto)
      if (!res?.error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  function handleDeletar() {
    startTransition(async () => {
      await deletarAnotacao(aulaId)
      router.push('/aluno/historico')
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
          Suas anotações (privadas — só você vê)
        </p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder={`O que você aprendeu hoje?\n\nEx: Aprendi o Kimura da guarda. Ainda erro a pegada do pulso. Ombro esquerdo doeu no final — cuidar amanhã.`}
          maxLength={2000}
          rows={10}
          className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
          style={{
            background: 'var(--brand-surf)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-texto)',
          }}
        />
        <p className="text-right text-[10px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
          {texto.length}/2000
        </p>
      </div>

      <button
        onClick={handleSalvar}
        disabled={isPending || !texto.trim()}
        className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-40"
        style={{ background: saved ? '#16A34A' : 'var(--brand-gold)', color: '#000' }}>
        {isPending ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar anotação'}
      </button>

      {textoAtual && (
        <button
          onClick={handleDeletar}
          disabled={isPending}
          className="w-full py-3 rounded-2xl text-xs uppercase tracking-widest"
          style={{ border: '1px solid var(--brand-border)', color: '#555' }}>
          Apagar anotação
        </button>
      )}
    </div>
  )
}
```

### 4. `src/app/(app)/aluno/historico/page.tsx` — link de anotação em cada aula

**No fetch:** adicionar `id` à query de presencas e buscar quais aulas já têm anotação:

```typescript
// Substituir o select de presencasData:
supabase.from('presencas')
  .select('aula_id, registrado_em, aulas(id, data, turmas(nome), aula_tecnicas(tipo, tecnicas(nome)))')
  .eq('aluno_id', aluno.id)
  .order('registrado_em', { ascending: false })
  .limit(50),

// Adicionar query de anotações existentes:
supabase.from('anotacoes_treino')
  .select('aula_id')
  .eq('aluno_id', aluno.id),
```

Construir `Set<string>` com os `aula_id` que têm anotação:

```typescript
const anotacoesSet = new Set((anotacoesData ?? []).map(a => a.aula_id))
```

**No map de `presencas`**, adicionar `aulaId` ao objeto:

```typescript
return {
  aulaId: p.aulas?.id ?? null,   // ← novo
  data: p.aulas?.data ?? null,
  turma: p.aulas?.turmas?.nome ?? 'Aula avulsa',
  tecnicas,
  registrado_em: p.registrado_em,
}
```

**No JSX de cada aula**, adicionar link de anotação ao lado do dataFmt:

```tsx
<div key={i} className="px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
  <div className="flex items-center justify-between">
    <p className="text-xs font-medium" style={{ color: 'var(--brand-texto-sec)' }}>{p.turma}</p>
    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
      <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>{dataFmt}</p>
      {p.aulaId && (
        <a
          href={`/aluno/aula/${p.aulaId}/anotacao`}
          className="text-sm"
          title={anotacoesSet.has(p.aulaId) ? 'Ver anotação' : 'Anotar treino'}>
          {anotacoesSet.has(p.aulaId) ? '📝' : '✏️'}
        </a>
      )}
    </div>
  </div>
  {/* chips de técnicas inalterados */}
</div>
```

> `📝` = já tem anotação. `✏️` = ainda não tem. Ambos linkam para a página de anotação.

### 5. `src/app/(app)/aluno/checkin.tsx` — prompt pós check-in

Dentro do bloco `{checked && ...}` existente, adicionar um link discreto abaixo do "Check-in confirmado":

```tsx
{checked && (
  <>
    <p className="text-xs mt-3 uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.5)' }}>
      Check-in confirmado · toque para cancelar
    </p>
    <a
      href={`/aluno/aula/${aula.id}/anotacao`}
      onClick={e => e.stopPropagation()}
      className="inline-block text-xs mt-1.5 uppercase tracking-widest underline underline-offset-2"
      style={{ color: 'rgba(0,0,0,0.45)' }}>
      ✏️ Anotar treino →
    </a>
  </>
)}
```

### 6. `src/components/aluno-bottom-nav.tsx` — ocultar nav na página de anotação

```tsx
// Adicionar à condição de null:
if (pathname === '/aluno/sem-conta' || pathname.startsWith('/aluno/aula/')) return null
```

---

## B-088 — Celebração de graduação

### 1. `src/app/(app)/alunos/[id]/actions.ts` — `graduarAluno` seta a flag

Dentro de `graduarAluno`, no update final, adicionar `celebrar_graduacao: true`:

```typescript
const { error } = await supabase
  .from('alunos')
  .update({ ...updates, celebrar_graduacao: true })   // ← adicionar aqui
  .eq('id', alunoId)
```

### 2. `src/app/(app)/aluno/actions.ts` — nova action `dismissCelebracao`

```typescript
export async function dismissCelebracao() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('alunos')
    .update({ celebrar_graduacao: false })
    .eq('user_id', user.id)

  revalidatePath('/aluno')
}
```

### 3. `src/app/(app)/aluno/page.tsx` — redirect para celebração

Logo após `getAlunoOuRedireciona()` e antes de qualquer outra lógica:

```typescript
if (aluno.celebrar_graduacao) redirect('/aluno/celebracao')
```

### 4. `src/app/(app)/aluno/celebracao/page.tsx` — tela de celebração

```tsx
import { redirect } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import CelebracaoScreen from './celebracao-screen'

export default async function CelebracaoPage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // Se a flag já foi zerada, volta pra home (evita loop se o aluno navegar pra cá diretamente)
  if (!aluno.celebrar_graduacao) redirect('/aluno')

  // Total de aulas na academia
  const { count: totalAulas } = await supabase
    .from('presencas')
    .select('id', { count: 'exact', head: true })
    .eq('aluno_id', aluno.id)

  // Top 3 técnicas (as mais vistas pelo aluno em toda a sua história)
  const { data: presencas } = await supabase
    .from('presencas')
    .select('aula_id')
    .eq('aluno_id', aluno.id)

  const aulaIds = (presencas ?? []).map(p => p.aula_id)
  const { data: tecnicasData } = aulaIds.length > 0
    ? await supabase
        .from('aula_tecnicas')
        .select('tecnicas(nome)')
        .in('aula_id', aulaIds)
        .eq('tipo', 'ensinada')
    : { data: [] }

  type TecRow = { tecnicas: { nome: string } | null }
  const contagemTec = new Map<string, number>()
  for (const row of (tecnicasData ?? []) as unknown as TecRow[]) {
    if (!row.tecnicas?.nome) continue
    contagemTec.set(row.tecnicas.nome, (contagemTec.get(row.tecnicas.nome) ?? 0) + 1)
  }
  const topTecnicas = [...contagemTec.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome]) => nome)

  return (
    <CelebracaoScreen
      aluno={aluno}
      totalAulas={totalAulas ?? 0}
      topTecnicas={topTecnicas}
    />
  )
}
```

### 5. `src/app/(app)/aluno/celebracao/celebracao-screen.tsx` — tela client com animação

```tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissCelebracao } from '@/app/(app)/aluno/actions'
import type { AlunoBasico } from '@/lib/aluno-auth'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFFFFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div
      className="flex items-stretch h-14 rounded-xl overflow-hidden"
      style={{ background: cor, border: '2px solid rgba(255,255,255,0.18)' }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[5px] px-4" style={{ background: rankCor, minWidth: 100 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[5px] h-7 rounded-sm"
            style={{ background: i < grau ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>
      <div style={{ width: 20, background: cor }} />
    </div>
  )
}

export default function CelebracaoScreen({
  aluno,
  totalAulas,
  topTecnicas,
}: {
  aluno: AlunoBasico
  totalAulas: number
  topTecnicas: string[]
}) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Fade-in com 150ms de delay para o CSS entrar suave
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  function handleDismiss() {
    startTransition(async () => {
      await dismissCelebracao()
      router.replace('/aluno')
    })
  }

  const cor = FAIXA_HEX[aluno.faixa] ?? '#FFFFFF'
  const dataGrad = aluno.graduado_em
    ? new Date(aluno.graduado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between px-6 py-12"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${cor}22 0%, var(--brand-fundo) 70%)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>

      {/* Topo — emoji + parabéns */}
      <div className="text-center pt-safe">
        <p className="text-5xl mb-4">🎊</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: FAIXA_HEX[aluno.faixa] === '#FFFFFF' ? 'var(--brand-gold)' : cor }}>
          Parabéns, {aluno.nome.split(' ')[0]}
        </p>
        <h1 className="text-2xl font-bold mt-2 leading-tight" style={{ color: 'var(--brand-texto)' }}>
          Você foi graduado!
        </h1>
        {dataGrad && (
          <p className="text-xs mt-1 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            {dataGrad}
          </p>
        )}
      </div>

      {/* Centro — faixa + stats */}
      <div className="w-full space-y-5">

        {/* Belt bar */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: 'var(--brand-surf)',
            border: `1px solid ${cor}55`,
            transform: visible ? 'scale(1)' : 'scale(0.92)',
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
          }}>
          <BeltBar faixa={aluno.faixa} grau={aluno.grau} />
          <p className="text-center text-lg font-bold capitalize" style={{ color: 'var(--brand-texto)' }}>
            Faixa {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl py-4 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-3xl font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>
              {totalAulas}
            </p>
            <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
              aulas na jornada
            </p>
          </div>
          <div className="rounded-2xl py-4 px-3 text-center flex flex-col justify-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            {topTecnicas.length > 0 ? (
              <>
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  Suas técnicas
                </p>
                {topTecnicas.map((t, i) => (
                  <p key={i} className="text-[11px] font-bold leading-snug" style={{ color: 'var(--brand-gold)' }}>
                    {t}
                  </p>
                ))}
              </>
            ) : (
              <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>🥋 Continue evoluindo</p>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {isPending ? '...' : 'Incrível! Vamos treinar 🥋'}
        </button>
      </div>
    </div>
  )
}
```

### 6. `src/components/aluno-bottom-nav.tsx` — ocultar nav na celebração

```tsx
if (
  pathname === '/aluno/sem-conta' ||
  pathname === '/aluno/celebracao' ||          // ← novo
  pathname.startsWith('/aluno/aula/')
) return null
```

---

## Resumo dos arquivos

| Arquivo | Card | O que muda |
|---|---|---|
| `supabase/migrations/20260722000001_aluno_surreal.sql` | B-084 | **Novo.** `anotacoes_treino` + `alunos.celebrar_graduacao` + RPC `calcular_streak_aluno` |
| `src/lib/aluno-auth.ts` | B-085 | Adiciona `celebrar_graduacao` ao `AlunoBasico` e ao select |
| `src/app/(app)/aluno/page.tsx` | B-085 | RPC streak + exibição no header + redirect para celebração |
| `src/app/(app)/aluno/perfil/page.tsx` | B-086 | Query aulas na faixa + bloco "Aulas como faixa X" no hero da graduação |
| `src/app/(app)/aluno/actions.ts` | B-087/B-088 | Novos: `salvarAnotacao`, `deletarAnotacao`, `dismissCelebracao` |
| `src/app/(app)/aluno/aula/[id]/anotacao/page.tsx` | B-087 | **Novo.** Server component da página de anotação |
| `src/app/(app)/aluno/aula/[id]/anotacao/anotacao-form.tsx` | B-087 | **Novo.** Client component do formulário de anotação |
| `src/app/(app)/aluno/historico/page.tsx` | B-087 | Fetch `aula.id` + `anotacoes_treino` + ícone ✏️/📝 por aula |
| `src/app/(app)/aluno/checkin.tsx` | B-087 | Link "✏️ Anotar treino →" após check-in confirmado |
| `src/app/(app)/alunos/[id]/actions.ts` | B-088 | `graduarAluno` seta `celebrar_graduacao: true` |
| `src/app/(app)/aluno/celebracao/page.tsx` | B-088 | **Novo.** Server component da tela de celebração |
| `src/app/(app)/aluno/celebracao/celebracao-screen.tsx` | B-088 | **Novo.** Client component com animação + dismiss |
| `src/components/aluno-bottom-nav.tsx` | B-087/B-088 | Ocultar nav em `/aluno/aula/*` e `/aluno/celebracao` |

---

## Critérios de aceite (Sprint 25)

**B-085 — Streak:**
- [ ] Aluno com treinos consecutivos vê "🔥 X semanas seguidas" no header da home
- [ ] Streak = 0: nada exibido (não aparece "🔥 0 semanas")
- [ ] Semana atual sem treino ainda não quebra a sequência das semanas anteriores
- [ ] RPC `calcular_streak_aluno` aplicada no Supabase

**B-086 — Faixa:**
- [ ] Tela `/aluno/perfil` mostra "X aulas como faixa [faixa]" dentro do hero da graduação
- [ ] Contagem usa `graduado_em` como referência quando disponível (senão `matriculado_em`)
- [ ] Frase contextual muda conforme volume de aulas (≥100, ≥50, ≥20, menos)
- [ ] Bloco não aparece quando count = 0 (aluno sem presenças)

**B-087 — Diário:**
- [ ] Aluno acessa `/aluno/historico` e vê ✏️ em cada aula para anotar
- [ ] Aulas já anotadas mostram 📝 em vez de ✏️
- [ ] Página de anotação mostra turma + data da aula no header
- [ ] Salvar com textarea vazio não funciona (botão disabled)
- [ ] "Anotar treino →" aparece no card de check-in após confirmar presença
- [ ] Anotação é salva com `upsert` — editar salva por cima (não duplica)
- [ ] Bottom nav oculta em `/aluno/aula/*`

**B-088 — Celebração:**
- [ ] Quando professor gradua aluno, `celebrar_graduacao` = true no banco
- [ ] Próxima vez que o aluno abre `/aluno`, é redirecionado para `/aluno/celebracao`
- [ ] Tela de celebração mostra: faixa nova (belt bar), data, total de aulas, top técnicas
- [ ] Gradiente de fundo usa a cor da faixa nova
- [ ] Botão "Incrível! Vamos treinar 🥋" zera a flag e volta para `/aluno`
- [ ] Após dismiss, o aluno não vê a tela novamente (flag = false)
- [ ] Bottom nav oculta em `/aluno/celebracao`
- [ ] Acessar `/aluno/celebracao` diretamente sem a flag ativa redireciona para `/aluno`
