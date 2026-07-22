# HANDOFF-023 — Professor Surreal

**Data:** 2026-07-22  
**Branch:** `feat/sprint26-professor-surreal`  
**Base:** `main`  
**Épico:** EP-28 — Professor Surreal  
**Cards:** B-089 · B-090 · B-091 · B-092 · B-093 · B-094 · B-095

> Seis features que transformam o professor de operador de presença em coach com inteligência: notas privadas por aluno, alerta de churn precoce, "aluno do mês", gap curricular por faixa, foto da turma pós-aula e card de graduação instagramável.

---

## B-089 — Migration

Arquivo: `supabase/migrations/20260722000002_professor_surreal.sql`

```sql
-- 1. Notas privadas do professor por aluno
CREATE TABLE IF NOT EXISTS notas_professor (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  aluno_id     UUID NOT NULL REFERENCES alunos(id)    ON DELETE CASCADE,
  texto        TEXT NOT NULL CHECK (char_length(texto) <= 1000),
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notas_professor ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "professor_ve_proprias_notas"
ON notas_professor FOR ALL
USING (
  professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid())
);

-- 2. Foto da turma pós-aula
ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 3. RPC — aluno do mês (mais presenças no mês corrente)
CREATE OR REPLACE FUNCTION aluno_do_mes(p_academia_id UUID)
RETURNS TABLE (
  aluno_id     UUID,
  aluno_nome   TEXT,
  foto_url     TEXT,
  presencas_mes INTEGER
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    a.id,
    a.nome,
    a.foto_url,
    COUNT(p.id)::INTEGER AS presencas_mes
  FROM alunos a
  JOIN presencas p ON p.aluno_id = a.id
  JOIN aulas au    ON au.id = p.aula_id
  WHERE a.academia_id  = p_academia_id
    AND a.ativo        = TRUE
    AND au.status      = 'finalizada'
    AND au.data        >= DATE_TRUNC('month', CURRENT_DATE)::DATE
    AND au.data        <= CURRENT_DATE
  GROUP BY a.id, a.nome, a.foto_url
  ORDER BY presencas_mes DESC
  LIMIT 1;
$$;

-- 4. RPC — alunos em risco de churn
-- Alunos que tiveram ≥3 treinos nos 30–90 dias anteriores (eram frequentes)
-- mas tiveram ≤1 treino nos últimos 30 dias (sumiram).
CREATE OR REPLACE FUNCTION alunos_em_risco_churn(p_academia_id UUID)
RETURNS TABLE (
  aluno_id             UUID,
  aluno_nome           TEXT,
  foto_url             TEXT,
  presencas_recentes   INTEGER,
  presencas_anteriores INTEGER
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH recentes AS (
    SELECT
      a.id, a.nome, a.foto_url,
      COUNT(p.id)::INTEGER AS cnt
    FROM alunos a
    LEFT JOIN presencas p ON p.aluno_id = a.id
    LEFT JOIN aulas au    ON au.id = p.aula_id
      AND au.status = 'finalizada'
      AND au.data   >= CURRENT_DATE - 30
    WHERE a.academia_id = p_academia_id
      AND a.ativo = TRUE
    GROUP BY a.id, a.nome, a.foto_url
  ),
  anteriores AS (
    SELECT
      a.id,
      COUNT(p.id)::INTEGER AS cnt
    FROM alunos a
    LEFT JOIN presencas p ON p.aluno_id = a.id
    LEFT JOIN aulas au    ON au.id = p.aula_id
      AND au.status = 'finalizada'
      AND au.data   >= CURRENT_DATE - 90
      AND au.data   <  CURRENT_DATE - 30
    WHERE a.academia_id = p_academia_id
      AND a.ativo = TRUE
    GROUP BY a.id
  )
  SELECT
    r.id, r.nome, r.foto_url,
    r.cnt                       AS presencas_recentes,
    COALESCE(a.cnt, 0)          AS presencas_anteriores
  FROM recentes r
  LEFT JOIN anteriores a ON a.id = r.id
  WHERE r.cnt              <= 1
    AND COALESCE(a.cnt, 0)  >= 3
  ORDER BY a.cnt DESC NULLS LAST
  LIMIT 3;
$$;

-- 5. Bucket de fotos de aulas (criar via SQL não é possível no Supabase — ver nota abaixo)
-- Criar manualmente no Supabase Dashboard: Storage → New bucket → "aulas-fotos" → Public
-- Policy de insert/update: professor da academia da aula
```

> **Nota bucket:** criar `aulas-fotos` manualmente no Supabase Dashboard (Storage → New bucket → nome: `aulas-fotos`, Public: false). Depois adicionar policy:
> ```sql
> CREATE POLICY "professor_upload_foto_aula"
> ON storage.objects FOR INSERT
> WITH CHECK (
>   bucket_id = 'aulas-fotos'
>   AND auth.uid() IN (
>     SELECT p.user_id FROM professores p
>     JOIN aulas a ON a.academia_id = p.academia_id
>     WHERE a.id::text = (storage.foldername(name))[1]
>   )
> );
> ```

---

## B-090 — Notas privadas por aluno

### 1. `src/app/(app)/alunos/[id]/actions.ts` — actions de notas

```typescript
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
```

### 2. `src/app/(app)/alunos/[id]/notas.tsx` — componente cliente de notas

```tsx
'use client'

import { useState, useTransition } from 'react'
import { adicionarNota, deletarNota } from './actions'

type Nota = { id: string; texto: string; criado_em: string }

export default function NotasProfessor({
  alunoId,
  notas: notasIniciais,
}: {
  alunoId: string
  notas: Nota[]
}) {
  const [notas, setNotas] = useState<Nota[]>(notasIniciais)
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdicionar() {
    if (!texto.trim()) return
    startTransition(async () => {
      const res = await adicionarNota(alunoId, texto)
      if (!res?.error) {
        // Otimista: adiciona na lista local antes do revalidate
        setNotas(prev => [
          { id: crypto.randomUUID(), texto: texto.trim(), criado_em: new Date().toISOString() },
          ...prev,
        ])
        setTexto('')
      }
    })
  }

  function handleDeletar(notaId: string) {
    startTransition(async () => {
      await deletarNota(notaId, alunoId)
      setNotas(prev => prev.filter(n => n.id !== notaId))
    })
  }

  return (
    <div className="space-y-3">
      {/* Input de nova nota */}
      <div className="flex gap-2">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Anotar observação... (privado — só professores veem)"
          maxLength={1000}
          rows={2}
          className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--brand-surf)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-texto)',
          }}
        />
        <button
          onClick={handleAdicionar}
          disabled={isPending || !texto.trim()}
          className="px-4 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40 flex-shrink-0"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          +
        </button>
      </div>

      {/* Lista de notas */}
      {notas.length === 0 ? (
        <p className="text-xs italic" style={{ color: 'var(--brand-texto-muted)' }}>
          Nenhuma observação registrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {notas.map(nota => {
            const data = new Date(nota.criado_em).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
            return (
              <div key={nota.id} className="rounded-xl px-3 py-2.5"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm" style={{ color: 'var(--brand-texto)' }}>{nota.texto}</p>
                  <button
                    onClick={() => handleDeletar(nota.id)}
                    disabled={isPending}
                    className="text-[10px] flex-shrink-0 mt-0.5 disabled:opacity-40"
                    style={{ color: '#444' }}>
                    ✕
                  </button>
                </div>
                <p className="text-[9px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>{data}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

### 3. `src/app/(app)/alunos/[id]/page.tsx` — buscar e exibir notas

**Na query paralela existente**, adicionar:
```typescript
supabase
  .from('notas_professor')
  .select('id, texto, criado_em')
  .eq('aluno_id', id)
  .order('criado_em', { ascending: false })
  .limit(20),
```

**No JSX**, no final de `<main>`, adicionar seção de notas (antes do GraduacaoForm):
```tsx
{/* Notas privadas */}
<div className="space-y-2">
  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
    🔒 Observações do professor
  </p>
  <NotasProfessor
    alunoId={aluno.id}
    notas={(notasData ?? []).map(n => ({ id: n.id, texto: n.texto, criado_em: n.criado_em }))}
  />
</div>
```

---

## B-091 — Alerta de rotatividade precoce

### `src/app/(app)/dashboard/page.tsx`

Adicionar ao `Promise.all` existente:
```typescript
supabase.rpc('alunos_em_risco_churn', { p_academia_id: acadId }),
```

No JSX, dentro da seção `{/* ── INSIGHTS ── */}`, adicionar após os insights existentes:

```tsx
{/* Alerta de churn */}
{Array.isArray(churnData) && churnData.length > 0 && churnData.map((c: ChurnAluno) => (
  <InsightCard key={c.aluno_id} cor="orange" href={`/alunos/${c.aluno_id}`}>
    ⚠ <b style={{ color: '#ccc' }}>{c.aluno_nome}</b> era frequente (
    {c.presencas_anteriores} treinos/mês) e sumiu — só {c.presencas_recentes} treinos nos últimos 30 dias →
  </InsightCard>
))}
```

Adicionar tipo:
```typescript
type ChurnAluno = {
  aluno_id: string
  aluno_nome: string
  foto_url: string | null
  presencas_recentes: number
  presencas_anteriores: number
}
```

---

## B-092 — Aluno do mês

### `src/app/(app)/dashboard/page.tsx`

Adicionar ao `Promise.all`:
```typescript
supabase.rpc('aluno_do_mes', { p_academia_id: acadId }),
```

No JSX, dentro de **Stats Strip** (seção dos 3 cards — aulas, alunos, turmas), substituir o grid 3-col por uma estrutura que inclui o aluno do mês abaixo:

```tsx
{/* ── Stats Strip + Aluno do Mês ── */}
<section className="px-4 mb-4">
  <div className="grid grid-cols-3 gap-1.5 mb-1.5">
    {/* 3 cards existentes inalterados */}
  </div>

  {/* Aluno do mês — aparece apenas quando há dados do mês corrente */}
  {alumDoMes && (
    <Link href={`/alunos/${alumDoMes.aluno_id}`}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
      style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
      <Avatar nome={alumDoMes.aluno_nome} fotoUrl={alumDoMes.foto_url} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
          🏅 Aluno do mês
        </p>
        <p className="font-bold text-sm truncate" style={{ color: 'var(--brand-texto)' }}>
          {alumDoMes.aluno_nome.split(' ')[0]}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xl font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>
          {alumDoMes.presencas_mes}
        </p>
        <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>treinos</p>
      </div>
    </Link>
  )}
</section>
```

Adicionar tipo:
```typescript
type AlumDoMes = {
  aluno_id: string
  aluno_nome: string
  foto_url: string | null
  presencas_mes: number
}
// ...
const alumDoMes = (alumDoMesRaw as AlumDoMes[] | null)?.[0] ?? null
```

---

## B-093 — Gap curricular por faixa

### `src/app/(app)/relatorios/page.tsx`

Adicionar uma nova aba "Currículo" ao array `TABS`:

```typescript
const TABS = [
  { value: 'tecnicas', label: 'Técnicas' },
  { value: 'alunos', label: 'Alunos' },
  { value: 'frequencia', label: 'Frequência' },
  { value: 'curriculo', label: 'Currículo' },   // ← novo
]
```

Criar nova async function `CurriculoTab`:

```typescript
async function CurriculoTab({ acadId }: { acadId: string }) {
  const supabase = await createClient()

  // Distribuição de faixas dos alunos ativos
  const { data: alunosData } = await supabase
    .from('alunos')
    .select('faixa')
    .eq('academia_id', acadId)
    .eq('ativo', true)

  const faixasPresentes = [...new Set((alunosData ?? []).map(a => a.faixa))].filter(Boolean)

  // Para cada faixa: técnicas com essa faixa que não foram ensinadas nos últimos 90 dias
  const noventa = new Date()
  noventa.setDate(noventa.getDate() - 90)
  const noventaStr = noventa.toISOString().split('T')[0]

  const { data: ensinadasData } = await supabase
    .from('aula_tecnicas')
    .select('tecnica_id, aulas!inner(academia_id, data, status)')
    .eq('aulas.academia_id', acadId)
    .eq('aulas.status', 'finalizada')
    .gte('aulas.data', noventaStr)
    .eq('tipo', 'ensinada')

  const ensinadasIds = new Set((ensinadasData ?? []).map(r => r.tecnica_id))

  const { data: curriculoData } = await supabase
    .from('tecnicas')
    .select('id, nome, faixas, categorias_tecnicas(nome)')
    .or(`academia_id.eq.${acadId},global.eq.true`)

  type TecCurr = {
    id: string
    nome: string
    faixas: string[]
    categorias_tecnicas: { nome: string } | null
  }
  const curriculo = (curriculoData ?? []) as unknown as TecCurr[]

  // Gap por faixa: técnicas da faixa que não foram ensinadas recentemente
  const FAIXA_ORDER = ['branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta']
  const faixasOrdenadas = FAIXA_ORDER.filter(f => faixasPresentes.includes(f))

  const gapPorFaixa = faixasOrdenadas.map(faixa => {
    const tecsDaFaixa = curriculo.filter(t =>
      t.faixas?.length === 0 ? false : t.faixas?.includes(faixa)
    )
    const gap = tecsDaFaixa.filter(t => !ensinadasIds.has(t.id))
    return { faixa, total: tecsDaFaixa.length, gap, ensinadas: tecsDaFaixa.length - gap.length }
  }).filter(f => f.total > 0)

  if (gapPorFaixa.length === 0) {
    return (
      <p className="text-sm text-center py-16" style={{ color: 'var(--brand-texto-muted)' }}>
        Nenhum aluno ativo ou sem técnicas associadas por faixa no currículo.
      </p>
    )
  }

  const FAIXA_HEX: Record<string, string> = {
    branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24', laranja: '#F97316',
    verde: '#16A34A', azul: '#2563EB', roxa: '#7C3AED', marrom: '#92400E', preta: '#374151',
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] px-1" style={{ color: 'var(--brand-texto-muted)' }}>
        Técnicas por faixa não ensinadas nos últimos 90 dias
      </p>
      {gapPorFaixa.map(({ faixa, total, gap, ensinadas }) => {
        const pct = total > 0 ? Math.round((ensinadas / total) * 100) : 0
        return (
          <div key={faixa} className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-8 rounded-sm flex-shrink-0"
                  style={{ background: FAIXA_HEX[faixa] ?? '#fff' }} />
                <p className="font-bold capitalize" style={{ color: 'var(--brand-texto)' }}>{faixa}</p>
              </div>
              <p className="text-xs font-bold" style={{ color: pct === 100 ? '#4ADE80' : 'var(--brand-gold)' }}>
                {pct}% coberto
              </p>
            </div>
            <div style={{ height: 3, background: 'var(--brand-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-gold)', borderRadius: 3 }} />
            </div>
            {gap.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  Não ensinadas recentemente
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {gap.slice(0, 8).map(t => (
                    <span key={t.id}
                      className="text-[10px] px-2 py-0.5 rounded-lg"
                      style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
                      {t.nome}
                    </span>
                  ))}
                  {gap.length > 8 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ color: '#333', border: '1px solid #1A1A1A' }}>
                      +{gap.length - 8}
                    </span>
                  )}
                </div>
              </div>
            )}
            {gap.length === 0 && (
              <p className="text-xs" style={{ color: '#4ADE80' }}>
                ✓ Todas as técnicas desta faixa ensinadas recentemente
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

Adicionar ao switch de abas do `RelatoriosPage`:
```typescript
{aba === 'curriculo' && <CurriculoTab acadId={acadId} />}
```

---

## B-094 — Foto da turma pós-aula

### 1. `src/app/(app)/aulas/[id]/actions.ts` — action `salvarFotoAula`

```typescript
export async function salvarFotoAula(aulaId: string, fotoUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('aulas')
    .update({ foto_url: fotoUrl })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao salvar foto.' }
  revalidatePath(`/aulas/${aulaId}`)
  return { success: true }
}
```

### 2. `src/app/(app)/aulas/[id]/page.tsx` — seção de foto quando aula finalizada

Ao final do `<main>` (após os componentes de attendance e técnicas), quando `aula.status === 'finalizada'`:

```tsx
{aula.status === 'finalizada' && (
  <div className="mt-4 px-4 pb-6">
    <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
      📸 Foto da turma
    </p>
    {aula.foto_url ? (
      <div className="relative rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--brand-border)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={aula.foto_url}
          alt="Foto da turma"
          className="w-full object-cover"
          style={{ maxHeight: 300 }}
        />
        <AulaFotoUpload
          aulaId={aula.id}
          fotoUrlAtual={aula.foto_url}
          persist={salvarFotoAula.bind(null, aula.id)}
        />
      </div>
    ) : (
      <AulaFotoUpload
        aulaId={aula.id}
        fotoUrlAtual={null}
        persist={salvarFotoAula.bind(null, aula.id)}
      />
    )}
  </div>
)}
```

### 3. `src/components/aula-foto-upload.tsx` — componente de upload

Reutilizar a lógica do `AvatarUpload` existente, adaptado para fotos de aula. O bucket é `aulas-fotos`, o path é `aulas/${aulaId}.jpg`.

```tsx
'use client'
// Mesmo padrão do AvatarUpload, mas:
// - bucket: 'aulas-fotos'
// - path: `aulas/${aulaId}.jpg`
// - label: "Adicionar foto da turma" / "Trocar foto"
// - Sem círculo — retângulo arredondado
// Reutilizar o código do AvatarUpload como base, ajustando os campos acima
```

> **Instrução ao Claude Code:** criar `aula-foto-upload.tsx` com base em `avatar-upload.tsx`. Diferenciais: bucket `aulas-fotos`, path `aulas/${props.aulaId}.jpg`, UI retangular (não circular), label contextual.

---

## B-095 — Card de graduação instagramável

### `src/app/(app)/alunos/[id]/card-graduacao/page.tsx`

Página somente para professores. Acessada após a graduação. Otimizada para screenshot → Instagram.

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFFFFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div className="flex items-stretch h-12 rounded-xl overflow-hidden w-full"
      style={{ background: cor }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[4px] px-4" style={{ background: rankCor, minWidth: 88 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[4px] h-6 rounded-sm"
            style={{ background: i < grau ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>
      <div style={{ width: 16, background: cor }} />
    </div>
  )
}

export default async function CardGraduacaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id, academias(nome)')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, foto_url, matriculado_em, graduado_em')
    .eq('id', id)
    .single()
  if (!aluno) redirect('/alunos')

  const { count: totalAulas } = await supabase
    .from('presencas')
    .select('id', { count: 'exact', head: true })
    .eq('aluno_id', id)

  // Aulas nesta faixa (desde graduado_em)
  const refDate = aluno.graduado_em ?? aluno.matriculado_em ?? '1970-01-01'
  const { count: aulasNaFaixa } = await supabase
    .from('presencas')
    .select('aulas!inner(data)', { count: 'exact', head: true })
    .eq('aluno_id', id)
    .gte('aulas.data', refDate.substring(0, 10))

  const dataGrad = aluno.graduado_em
    ? new Date(aluno.graduado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const academia = professor.academias as unknown as { nome: string } | null
  const cor = FAIXA_HEX[aluno.faixa] ?? '#FFFFFF'
  const nomeFirst = aluno.nome.split(' ')[0]

  return (
    // Tela formatada para screenshot 1:1 (400×400) — safe-area intencionalmente ignorada
    <div
      className="min-h-dvh flex items-center justify-center p-6"
      style={{ background: '#080808' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-8 space-y-6 relative overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% -10%, ${cor}33 0%, #111111 65%)`,
          border: `1px solid ${cor}44`,
        }}>

        {/* Marca d'água: cobra + academia */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em]" style={{ color: '#444' }}>
              NajaPass
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#666' }}>
              {academia?.nome ?? 'Naja BJJ'}
            </p>
          </div>
          <p className="text-2xl opacity-30">🐍</p>
        </div>

        {/* Foto + nome */}
        <div className="text-center space-y-3">
          {aluno.foto_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={aluno.foto_url}
              alt={aluno.nome}
              className="w-20 h-20 rounded-full object-cover mx-auto"
              style={{ border: `3px solid ${cor}` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto"
              style={{ background: `${cor}22`, border: `3px solid ${cor}`, color: cor }}>
              {nomeFirst.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{aluno.nome}</p>
            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: cor === '#FFFFFF' ? 'var(--brand-gold)' : cor }}>
              Graduado em {dataGrad}
            </p>
          </div>
        </div>

        {/* Belt bar */}
        <BeltBar faixa={aluno.faixa} grau={aluno.grau} />

        {/* Faixa label */}
        <p className="text-center text-3xl font-bold capitalize tracking-widest" style={{ color: '#FFFFFF' }}>
          Faixa {aluno.faixa}
          {aluno.grau > 0 && (
            <span className="text-xl ml-2" style={{ color: '#888' }}>· {aluno.grau}º grau</span>
          )}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-3xl font-bold leading-none" style={{ color: '#C8A96E' }}>
              {aulasNaFaixa ?? 0}
            </p>
            <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#555' }}>
              aulas nesta faixa
            </p>
          </div>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-3xl font-bold leading-none" style={{ color: '#C8A96E' }}>
              {totalAulas ?? 0}
            </p>
            <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#555' }}>
              total de aulas
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[8px] uppercase tracking-[0.4em]" style={{ color: '#222' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
```

### Link de acesso no perfil do aluno

Em `src/app/(app)/alunos/[id]/page.tsx`, logo abaixo do `GraduacaoForm`, adicionar:

```tsx
<a
  href={`/alunos/${aluno.id}/card-graduacao`}
  target="_blank"
  rel="noopener noreferrer"
  className="block w-full text-center py-2.5 rounded-xl text-xs uppercase tracking-widest"
  style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
  📸 Card de graduação →
</a>
```

---

## Resumo dos arquivos

| Arquivo | Card | O que muda |
|---|---|---|
| `supabase/migrations/20260722000002_professor_surreal.sql` | B-089 | **Novo.** `notas_professor` + `aulas.foto_url` + RPCs `aluno_do_mes` e `alunos_em_risco_churn` |
| `src/app/(app)/alunos/[id]/actions.ts` | B-090 | Novos: `adicionarNota`, `deletarNota`, `salvarFotoAula` |
| `src/app/(app)/alunos/[id]/notas.tsx` | B-090 | **Novo.** Client component de notas privadas |
| `src/app/(app)/alunos/[id]/page.tsx` | B-090/B-094/B-095 | Fetch notas + `NotasProfessor` + foto da aula + link card-graduacao |
| `src/app/(app)/dashboard/page.tsx` | B-091/B-092 | RPCs churn + aluno do mês + InsightCards de churn + card "Aluno do Mês" |
| `src/app/(app)/relatorios/page.tsx` | B-093 | Nova aba "Currículo" + `CurriculoTab` com gap por faixa |
| `src/app/(app)/aulas/[id]/page.tsx` | B-094 | Seção foto quando `status=finalizada` |
| `src/components/aula-foto-upload.tsx` | B-094 | **Novo.** Upload de foto de aula (base: `avatar-upload.tsx`) |
| `src/app/(app)/alunos/[id]/card-graduacao/page.tsx` | B-095 | **Novo.** Página instagramável de graduação |

---

## Critérios de aceite (Sprint 26)

**B-090 — Notas:**
- [ ] Professor vê seção "🔒 Observações do professor" no perfil do aluno
- [ ] Campo textarea + botão "+" adiciona nota instantaneamente (otimista)
- [ ] Notas têm data de criação; botão ✕ deleta
- [ ] Aluno NÃO vê as notas (RLS garante)

**B-091 — Churn:**
- [ ] Dashboard exibe alerta laranja para alunos frequentes que sumiram (≥3 treinos/mês anterior, ≤1 recente)
- [ ] Toca no alerta → vai para perfil do aluno

**B-092 — Aluno do mês:**
- [ ] Card dourado com foto, nome e contagem de treinos do mês
- [ ] Aparece apenas quando há presenças registradas no mês corrente
- [ ] Toca → vai para perfil do aluno

**B-093 — Gap curricular:**
- [ ] Nova aba "Currículo" em /relatorios
- [ ] Mostra apenas as faixas de alunos ativos na academia
- [ ] Barra de cobertura por faixa (técnicas ensinadas nos últimos 90d / total da faixa)
- [ ] Chips das técnicas não ensinadas recentemente

**B-094 — Foto da turma:**
- [ ] Seção "📸 Foto da turma" aparece somente em aulas finalizadas
- [ ] Upload funciona para bucket `aulas-fotos`
- [ ] Foto salva exibida na tela da aula após upload

**B-095 — Card de graduação:**
- [ ] Página `/alunos/[id]/card-graduacao` abre em nova aba
- [ ] Exibe foto do aluno (ou inicial), belt bar, nome, data de graduação, stats
- [ ] Fundo com gradiente na cor da faixa
- [ ] Link "📸 Card de graduação →" visível no perfil do aluno (abaixo do GraduacaoForm)
