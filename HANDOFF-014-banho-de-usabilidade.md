# HANDOFF-014 — Banho de Usabilidade + Jornada do Aluno

**Sprint:** 18  
**Branch:** `feat/sprint18-jornada-usabilidade`  
**A partir de:** `feat/sprint17-historinhas` (após merge)  
**Cards:** B-064 · B-065 · B-066 · B-067 · B-068  
**Status:** Aguardando implementação

---

## Diagnóstico — O que o código atual revela

Antes das specs, o resultado do audit completo do codebase. Isso evita que Claude Code invente problemas ou ignore os reais.

### ✅ O que está funcionando bem

**Dashboard** — Completo: aulas de hoje (com `AulaHojeCard`), insights dinâmicos (RPC `professor_dashboard_insights`), mini-grid da semana, stats strip, grid de ações (Alunos / Turmas / Histórico / Solicitações), Avisos, feed de últimas 3 aulas. Header com avatar → `/perfil`. Nada quebrado.

**Aula detail** (`/aulas/[id]`) — Header com status badge (Pendente/AO VIVO/Finalizada/Cancelada), data, tema, vídeo, duplicar button. Quando `status='agendada'`: painel de contexto da última aula da turma (chips ✓ verde / ↺ laranja) + `AulaAgendadaActions`. Técnicas separadas em planejadas/ensinadas/não-ensinadas com BuscaTecnicaInline. Presença com toggle. Sólido.

**Feedback** (`/aulas/[id]/feedback`) — Mostra técnicas ensinadas, botões Ótimo/Repetir por técnica, redireciona pra `/dashboard` após. Correto.

**Aluno home** — Avisos, check-in ao vivo, próximas aulas agendadas (com ConfirmarPresencaButton), insights (técnica stale, stats, progress bar por categoria, última aula), técnicas da semana filtradas por faixa. Muito completo.

**CheckinCard** — Toggle com estado visual (gold quando confirmado), nome da turma, planejadas como chips, "ver quem vai". UX ok.

**Aluno técnicas** (`/aluno/tecnicas`) — Coverage por categoria com barra de progresso. Funciona.

---

### 🔴 Gaps críticos encontrados

#### GAP 1 — Jornada técnica do aluno INEXISTENTE no professor

`/alunos/[id]` (visão professor) mostra:
- Avatar + foto de perfil
- Turmas em que está matriculado
- **20 presenças mais recentes com data + `aula.tema` (text column legacy) + nome da turma**

O que NÃO mostra:
- **Quais técnicas o aluno aprendeu** (join `presencas → aulas → aula_tecnicas tipo='ensinada'`)
- Agrupamento por categoria
- Progresso no currículo daquele aluno

Essa é a razão central do produto — "daqui 5 anos ver toda a jornada do aluno" — e ela não aparece na view do professor.

**Efeito:** o professor abre o perfil do João e vê "28 presenças nos últimos 30 dias". Mas não vê "João aprendeu Americana (3x), Kimura (2x), North-South Choke (1x) em Cem Quilos".

#### GAP 2 — Turma mostra `tema` text legacy nas aulas

Em `/turmas/[id]`, o query de aulas é:
```ts
.select('id, data, tema, status, hora_inicio, presencas(id)')
```

`tema` aqui é uma coluna TEXT legacy na tabela `aulas` (não o join com `categorias_tecnicas`). A coluna correta para o tema atual é `tema_id` → `categorias_tecnicas(nome)`, como em `/aulas/[id]/page.tsx` que usa:
```ts
.select('... tema_id, tema:categorias_tecnicas(nome)')
```

**Efeito:** na lista de aulas da turma, o campo `tema` aparece null ou desatualizado. E NUNCA aparecem as técnicas ensinadas em cada aula.

#### GAP 3 — Reforços não são auto-selecionados no form de nova aula

Em `/aulas/nova/form.tsx`:
```ts
const reforcosATurma = turmaId ? (reforcosPorTurma[turmaId] ?? []) : []
const reforcosComNome = reforcosATurma.map(id => tecnicas.find(t => t.id === id)).filter(Boolean)
```

Os reforços são COMPUTADOS e mostrados como contexto, mas **nunca são adicionados ao estado `planejadas`**. O professor vê "estas técnicas foram marcadas para reforço" mas tem que tocar em cada uma manualmente.

O HANDOFF-011 (B-056) especificou que ao `abrirAulaAgendada()` os reforços seriam inseridos server-side — mas a criação de aula nova via `/aulas/nova` não faz isso.

#### GAP 4 — Relatorios inacessível do fluxo principal

`/relatorios` (técnicas mais ensinadas, alunos por frequência, ranking) está acessível via:
- `/perfil` → Mais → "Relatórios"

Não há link do dashboard, do Histórico, nem do nav. Professor que não explorar o Perfil nunca descobre.

#### GAP 5 — BackButton sempre vai para `/aulas`

`/aulas/[id]/page.tsx` usa `<BackButton href="/aulas" />`. Quando o professor toca numa aula do dashboard (seção "Hoje" ou "Últimas aulas"), ele espera que "voltar" retorne ao dashboard. Mas vai para o Histórico.

---

### ✅ Rotas — Mapa completo

| Rota | Acessível via | Estado |
|---|---|---|
| `/dashboard` | nav (Início) | ✅ |
| `/aulas/nova` | dashboard "Nova aula" btn | ✅ |
| `/aulas` | nav (Histórico) | ✅ |
| `/aulas/[id]` | dashboard "Hoje" + histórico + turma | ✅ |
| `/aulas/[id]/feedback` | redirect de FINALIZAR | ✅ |
| `/alunos` | nav | ✅ |
| `/alunos/[id]` | lista de alunos | ✅ |
| `/alunos/novo` | lista de alunos | ✅ |
| `/planejamento` | nav | ✅ (sprint 16) |
| `/turmas` | dashboard grid | ✅ |
| `/turmas/[id]` | lista de turmas | ✅ |
| `/turmas/nova` | lista de turmas | ✅ |
| `/semana` | dashboard mini-grid | ✅ |
| `/perfil` | header avatar | ✅ |
| `/relatorios` | perfil → Mais | ⚠️ enterrado |
| `/tecnicas` | perfil → Mais | ⚠️ enterrado |
| `/professores` | perfil → Mais | ✅ (uso raro) |
| `/avisos` | dashboard card | ✅ |
| `/solicitacoes` | dashboard card | ✅ |
| `/historinhas` | — | ⏳ sprint 17 |
| `/aluno` | nav aluno | ✅ |
| `/aluno/tecnicas` | nav aluno | ✅ |
| `/aluno/historico` | nav aluno | ✅ |
| `/aluno/perfil` | nav aluno | ✅ |

Nenhuma rota está quebrada. Os problemas são de **visibilidade** e **conteúdo**, não de rotas.

---

## Cards deste sprint

---

## B-064 · Jornada técnica do aluno — visão professor

**O que muda:** `/alunos/[id]/page.tsx` — adiciona seção "Jornada" abaixo das presenças recentes.

### Query nova

```ts
// Técnicas que o aluno efetivamente aprendeu:
// presença na aula → aula tinha aquela técnica ensinada
const { data: jornada } = await supabase
  .from('presencas')
  .select(`
    aulas!inner(
      aula_tecnicas!inner(
        tipo,
        tecnicas(id, nome, categorias_tecnicas(nome))
      )
    )
  `)
  .eq('aluno_id', id)
  .eq('aulas.aula_tecnicas.tipo', 'ensinada')
  .order('aula_id')
```

> **Nota para Claude Code:** o filtro `aulas.aula_tecnicas.tipo` pode não funcionar diretamente em PostgREST — use RPC se necessário.

**Alternativa via RPC (mais segura):**

```sql
-- supabase/migrations/XXXX_jornada_tecnica_aluno.sql

CREATE OR REPLACE FUNCTION jornada_tecnica_aluno(p_aluno_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_academia_id UUID;
BEGIN
  -- Valida que o aluno pertence à academia do professor autenticado
  SELECT a.academia_id INTO v_academia_id
  FROM alunos a
  WHERE a.id = p_aluno_id;

  -- Professor autenticado deve ser da mesma academia
  IF NOT EXISTS (
    SELECT 1 FROM professores p
    WHERE p.user_id = auth.uid()
    AND p.academia_id = v_academia_id
  ) THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT json_agg(cat_row ORDER BY cat_row->>'categoria')
    FROM (
      SELECT
        c.nome AS categoria,
        c.id AS categoria_id,
        json_agg(
          json_build_object('id', t.id, 'nome', t.nome, 'vezes', sub.vezes)
          ORDER BY sub.vezes DESC, t.nome
        ) AS tecnicas,
        SUM(sub.vezes) AS total_visto
      FROM (
        SELECT
          at.tecnica_id,
          COUNT(*) AS vezes
        FROM presencas pr
        JOIN aulas au ON au.id = pr.aula_id
        JOIN aula_tecnicas at ON at.aula_id = au.id AND at.tipo = 'ensinada'
        WHERE pr.aluno_id = p_aluno_id
        GROUP BY at.tecnica_id
      ) sub
      JOIN tecnicas t ON t.id = sub.tecnica_id
      JOIN categorias_tecnicas c ON c.id = t.categoria_id
      GROUP BY c.id, c.nome
    ) cat_row
  );
END;
$$;
```

**Chamar na page.tsx:**

```ts
const { data: jornadaRaw } = await supabase.rpc('jornada_tecnica_aluno', { p_aluno_id: id })

type JornadaCat = {
  categoria: string
  categoria_id: string
  tecnicas: { id: string; nome: string; vezes: number }[]
  total_visto: number
}
const jornada = (jornadaRaw ?? []) as JornadaCat[]
```

### Render — seção "Jornada Técnica"

Colocar **antes** da lista de presenças recentes, logo após as turmas:

```tsx
{/* Jornada Técnica */}
{jornada.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-2">
      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
        Jornada Técnica
      </p>
      <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
        {jornada.reduce((s, c) => s + c.tecnicas.length, 0)} técnicas aprendidas
      </p>
    </div>

    <div className="space-y-2">
      {jornada.map(cat => (
        <div key={cat.categoria_id}
          className="px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--brand-texto)' }}>
              {cat.categoria}
            </p>
            <span className="text-[9px] px-2 py-0.5 rounded"
              style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
              {cat.tecnicas.length} téc.
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {cat.tecnicas.map(t => (
              <span key={t.id}
                className="px-2 py-0.5 rounded text-[9px] font-bold"
                style={{
                  background: t.vezes >= 3 ? 'rgba(74,222,128,0.1)' : 'var(--brand-gold-dim)',
                  border: `1px solid ${t.vezes >= 3 ? 'rgba(74,222,128,0.3)' : 'var(--brand-gold-border)'}`,
                  color: t.vezes >= 3 ? '#4ADE80' : 'var(--brand-gold)',
                }}>
                {t.nome}
                {t.vezes >= 2 && <span className="ml-1 opacity-60">×{t.vezes}</span>}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Total summary */}
    <p className="text-[9px] mt-1.5 text-right" style={{ color: 'var(--brand-texto-muted)' }}>
      Verde = vista 3+ vezes · Dourado = vista 1–2 vezes
    </p>
  </div>
)}

{/* Empty state — aluno sem nenhuma presença com técnica registrada */}
{jornada.length === 0 && (
  <div className="px-4 py-5 rounded-xl text-center"
    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
    <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
      Nenhuma técnica registrada ainda
    </p>
    <p className="text-[9px] mt-1" style={{ color: '#333' }}>
      As técnicas aparecem aqui quando o professor finalizá-las nas aulas em que este aluno esteve presente
    </p>
  </div>
)}
```

### Ajuste no header do aluno

Mudar o título do header de "Perfil" para o nome do aluno:

```tsx
// ANTES
<h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
  Perfil
</h1>

// DEPOIS
<h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
  {aluno.nome.split(' ')[0]}
</h1>
```

### Arquivos em B-064

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/alunos/[id]/page.tsx` | + query RPC + seção "Jornada Técnica" + título corrigido |
| `supabase/migrations/XXXX_jornada_tecnica_aluno.sql` | NOVA RPC |

---

## B-065 · Turma — aulas com técnicas ensinadas

**O que muda:** `/turmas/[id]/page.tsx` — a lista de aulas recentes mostra técnicas ao invés de `tema` (texto legado).

### O problema atual

```ts
// BUGADO — seleciona `tema` coluna TEXT legada, não o join correto
.select('id, data, tema, status, hora_inicio, presencas(id)')
```

Resultado: `tema` é null ou stale. Técnicas ensinadas não aparecem.

### Fix

```ts
// CORRETO — inclui join de tema + técnicas ensinadas
const aulasResult = await supabase
  .from('aulas')
  .select('id, data, status, hora_inicio, presencas(id), tema:categorias_tecnicas(nome)')
  .eq('turma_id', id)
  .order('data', { ascending: false })
  .limit(15)

// Separado: buscar técnicas ensinadas dessas aulas
const aulaIds = (aulasResult.data ?? []).map(a => a.id)
const { data: tecEnsinadasData } = aulaIds.length > 0
  ? await supabase
      .from('aula_tecnicas')
      .select('aula_id, tecnicas(nome)')
      .in('aula_id', aulaIds)
      .eq('tipo', 'ensinada')
  : { data: [] }

// Agrupar por aula
type TecRow = { aula_id: string; tecnicas: { nome: string } | null }
const tecPorAula = ((tecEnsinadasData ?? []) as unknown as TecRow[]).reduce<Record<string, string[]>>((acc, r) => {
  if (!r.tecnicas) return acc
  if (!acc[r.aula_id]) acc[r.aula_id] = []
  acc[r.aula_id].push(r.tecnicas.nome)
  return acc
}, {})
```

### Render das aulas da turma

```tsx
{/* ANTES: mostrava data + tema text + status + X presentes */}
{/* DEPOIS: data + status badge + técnicas chips */}

{aulas.map(aula => {
  const { dia, mes } = formatarDataCurta(aula.data)
  const tecnicas = tecPorAula[aula.id] ?? []
  const temaNome = (aula.tema as unknown as { nome: string } | null)?.nome

  return (
    <Link key={aula.id} href={`/aulas/${aula.id}`}
      className="block px-4 py-3 active:scale-[0.98] transition-transform"
      style={{ borderBottom: '1px solid var(--brand-border)' }}>

      <div className="flex items-start gap-3">
        {/* Data */}
        <div className="text-center w-7 flex-shrink-0 pt-0.5">
          <p className="text-[11px] font-bold" style={{ color: 'var(--brand-texto)' }}>{dia}</p>
          <p className="text-[8px] uppercase" style={{ color: 'var(--brand-texto-muted)' }}>{mes}</p>
        </div>

        <div className="flex-1 min-w-0">
          {/* Status + presenças */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{
                background: aula.status === 'finalizada' ? 'rgba(74,222,128,0.08)'
                  : aula.status === 'aberta' ? 'var(--brand-gold-dim)'
                  : 'transparent',
                color: aula.status === 'finalizada' ? '#4ADE80'
                  : aula.status === 'aberta' ? 'var(--brand-gold)'
                  : 'var(--brand-texto-muted)',
                border: `1px solid ${aula.status === 'finalizada' ? 'rgba(74,222,128,0.2)'
                  : aula.status === 'aberta' ? 'var(--brand-gold-border)'
                  : 'var(--brand-border)'}`,
              }}>
              {aula.status === 'finalizada' ? 'Finalizada'
                : aula.status === 'aberta' ? 'Ao vivo'
                : aula.status === 'agendada' ? 'Pendente'
                : 'Cancelada'}
            </span>
            <span className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
              {(aula.presencas as unknown as { id: string }[])?.length ?? 0} presentes
              {aula.hora_inicio ? ` · ${(aula.hora_inicio as string).substring(0,5)}` : ''}
            </span>
          </div>

          {/* Técnicas ensinadas */}
          {tecnicas.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tecnicas.slice(0, 4).map((t, i) => (
                <span key={i}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                  {t}
                </span>
              ))}
              {tecnicas.length > 4 && (
                <span className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>+{tecnicas.length - 4}</span>
              )}
            </div>
          ) : (
            aula.status === 'finalizada' && (
              <p className="text-[9px]" style={{ color: '#333' }}>Nenhuma técnica registrada</p>
            )
          )}
        </div>
      </div>
    </Link>
  )
})}
```

### Arquivos em B-065

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/turmas/[id]/page.tsx` | Corrigir query (tema_id join + aula_tecnicas) + render técnicas |

---

## B-066 · Relatorios acessível + insight de técnicas no dashboard

### Parte 1 — Link direto no dashboard

**Arquivo:** `src/app/(app)/dashboard/page.tsx`

Adicionar após o stats strip (`grid grid-cols-3`), antes do grid de ações:

```tsx
{/* Link rápido para Insights */}
<div className="px-4 mb-2">
  <Link href="/relatorios"
    className="flex items-center justify-between px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
        Insights da academia
      </p>
      <p className="text-[9px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
        Técnicas mais ensinadas · Frequência · Ranking
      </p>
    </div>
    <span style={{ color: 'var(--brand-gold)', fontSize: 18 }}>→</span>
  </Link>
</div>
```

### Parte 2 — `/relatorios` adiciona "técnicas nunca ensinadas"

**Arquivo:** `src/app/(app)/relatorios/page.tsx` — na aba "Técnicas", adicionar subseção com técnicas do currículo que a academia NUNCA ensinou (ou não ensinou nos últimos 90 dias).

Query a adicionar na aba `tecnicas`:

```ts
// Técnicas globais/academia que não foram ensinadas nos últimos 90 dias
const noventa_dias = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

const { data: tecnicasEnsinadasRecente } = await supabase
  .from('aula_tecnicas')
  .select('tecnica_id')
  .eq('tipo', 'ensinada')
  .gte('created_at', noventa_dias) // ou join com aulas.data
  // filtrar por academia_id via join com aulas
const idsEnsinadas = new Set((tecnicasEnsinadasRecente ?? []).map(t => t.tecnica_id))

// Todas as técnicas disponíveis (global + academia)
const { data: todasTecnicas } = await supabase
  .from('tecnicas')
  .select('id, nome, categorias_tecnicas(nome)')
  .or(`academia_id.eq.${acadId},global.eq.true`)
  .order('nome')

const lacunas = (todasTecnicas ?? []).filter(t => !idsEnsinadas.has(t.id))
```

**Render (nova subseção na aba Técnicas):**

```tsx
{lacunas.length > 0 && (
  <div className="mt-4">
    <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#ef4444' }}>
      ⚠ Não ensinadas nos últimos 90 dias ({lacunas.length})
    </p>
    <div className="flex flex-wrap gap-1.5">
      {lacunas.slice(0, 20).map(t => {
        const cat = (t.categorias_tecnicas as unknown as { nome: string } | null)?.nome
        return (
          <span key={t.id}
            className="px-2 py-0.5 rounded text-[9px]"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
            {t.nome}
            {cat && <span className="opacity-50 ml-1">({cat})</span>}
          </span>
        )
      })}
      {lacunas.length > 20 && (
        <span className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
          +{lacunas.length - 20} mais
        </span>
      )}
    </div>
  </div>
)}
```

> **Nota:** a query de técnicas ensinadas recentes precisa filtrar por `academia_id` via join com `aulas`. Ajustar conforme o schema: `aulas.academia_id = acadId`.

### Arquivos em B-066

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | + card link "Insights da academia" após stats strip |
| `src/app/(app)/relatorios/page.tsx` | + subseção "Não ensinadas nos últimos 90 dias" na aba Técnicas |

---

## B-067 · BackButton inteligente + reforços auto-selecionados

### Parte 1 — BackButton dinâmico em `/aulas/[id]`

**Problema:** `<BackButton href="/aulas" />` sempre vai para Histórico, mesmo quando o professor veio do Dashboard.

**Solução:** usar `router.back()` no cliente, com fallback para `/aulas`.

Verificar se `BackButton` já aceita `href` opcional:

```tsx
// src/components/back-button.tsx — provável estado atual
'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({ href }: { href: string }) {
  const router = useRouter()
  return (
    <button onClick={() => router.push(href)} ...>←</button>
  )
}
```

**Mudar para:**

```tsx
'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({ href, useBack = false }: { href: string; useBack?: boolean }) {
  const router = useRouter()
  return (
    <button
      onClick={() => useBack ? router.back() : router.push(href)}
      className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 active:scale-90 transition-transform"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}>
      ←
    </button>
  )
}
```

**Em `/aulas/[id]/page.tsx`:**

```tsx
// ANTES
<BackButton href="/aulas" />

// DEPOIS — usa router.back() para voltar para onde veio (dashboard ou histórico)
<BackButton href="/aulas" useBack />
```

Aplicar o mesmo em `/aulas/[id]/feedback/page.tsx` → `FeedbackForm` usa router internamente, ok.

### Parte 2 — Reforços auto-selecionados ao trocar turma no form nova aula

**Problema:** em `/aulas/nova/form.tsx`, `reforcosATurma` é computado mas nunca adicionado a `planejadas`.

```tsx
// ESTADO ATUAL — reforços computados mas não aplicados
const reforcosATurma = turmaId ? (reforcosPorTurma[turmaId] ?? []) : []
const reforcosComNome = reforcosATurma.map(id => tecnicas.find(t => t.id === id)).filter(Boolean) as TecnicaOpt[]
// ...mas `planejadas` começa como new Set() e nunca recebe os reforços automaticamente
```

**FIX — useEffect que sincroniza reforços quando turma muda:**

```tsx
// Adicionar após as declarações de estado:
useEffect(() => {
  if (!turmaId) return
  const reforcos = reforcosPorTurma[turmaId] ?? []
  if (reforcos.length === 0) return
  setPlanejadas(prev => {
    const next = new Set(prev)
    reforcos.forEach(id => next.add(id))
    return next
  })
}, [turmaId]) // eslint-disable-line react-hooks/exhaustive-deps
```

Isso garante que ao selecionar uma turma, os reforços da última aula dessa turma sejam pré-marcados automaticamente — igual ao que já acontece no server-side quando a aula é aberta via `abrirAulaAgendada()`, mas agora também no planejamento inicial.

### Arquivos em B-067

| Arquivo | Mudança |
|---|---|
| `src/components/back-button.tsx` | + prop `useBack?: boolean` |
| `src/app/(app)/aulas/[id]/page.tsx` | BackButton com `useBack` |
| `src/app/(app)/aulas/nova/form.tsx` | `useEffect` auto-seleciona reforços ao trocar turma |

---

## B-068 · CheckinCard — técnicas ensinadas após check-in

**Problema:** o aluno faz check-in e vê apenas as técnicas **planejadas** (o que ia ser ensinado). Mas após o professor registrar as técnicas como "ensinadas", o aluno nunca vê isso na hora — só descobre na próxima vez que abrir o app (via insight "última aula" no `aluno_home_insights`).

**Solução:** em `/aluno/page.tsx`, para cada aula ativa (`status='aberta'`), buscar também as técnicas ensinadas (além das planejadas).

### Mudança em `/aluno/page.tsx`

```ts
// ANTES — busca só planejadas
const aulasAtivas = await Promise.all(aulasAtivasRows.map(async (aula) => {
  const [{ data: quemVaiData }, { data: planejadasData }] = await Promise.all([
    supabase.rpc('quem_vai', { p_aula_id: aula.id }),
    supabase.from('aula_tecnicas').select('tecnicas(nome)').eq('aula_id', aula.id).eq('tipo', 'planejada'),
  ])
  ...
}))

// DEPOIS — busca planejadas E ensinadas
const aulasAtivas = await Promise.all(aulasAtivasRows.map(async (aula) => {
  const [{ data: quemVaiData }, { data: tecnicasData }] = await Promise.all([
    supabase.rpc('quem_vai', { p_aula_id: aula.id }),
    supabase.from('aula_tecnicas')
      .select('tipo, tecnicas(nome)')
      .eq('aula_id', aula.id)
      .in('tipo', ['planejada', 'ensinada']),
  ])

  type TecRow = { tipo: string; tecnicas: { nome: string } | null }
  const tecs = (tecnicasData ?? []) as unknown as TecRow[]
  const planejadas = tecs.filter(t => t.tipo === 'planejada').map(t => t.tecnicas?.nome).filter(Boolean) as string[]
  const ensinadas = tecs.filter(t => t.tipo === 'ensinada').map(t => t.tecnicas?.nome).filter(Boolean) as string[]

  return {
    id: aula.id,
    video_url: aula.video_url,
    turma_nome: aula.turmas?.nome ?? null,
    tema: aula.tema?.nome ?? null,
    confirmados,
    planejadas,
    ensinadas, // NOVO
  }
}))
```

### Mudança em `CheckinCard`

```tsx
// Props: adicionar `ensinadas: string[]`
type Aula = {
  id: string
  turma_nome: string | null
  tema: string | null
  video_url: string | null
  confirmados: Confirmado[]
  planejadas: string[]
  ensinadas: string[]  // NOVO
}

// No render, depois das planejadas:
{aula.ensinadas.length > 0 && (
  <div className="mt-2">
    <p className="text-[9px] uppercase tracking-widest mb-1"
      style={{ color: checked ? 'rgba(0,0,0,0.4)' : '#4ADE80', opacity: 0.7 }}>
      ✓ Ensinadas nesta aula
    </p>
    <div className="flex flex-wrap gap-1">
      {aula.ensinadas.map((t, i) => (
        <span key={i}
          className="px-2 py-0.5 rounded text-[9px] font-bold"
          style={{
            background: checked ? 'rgba(0,0,0,0.1)' : 'rgba(74,222,128,0.08)',
            color: checked ? 'rgba(0,0,0,0.6)' : '#4ADE80',
            border: `1px solid ${checked ? 'rgba(0,0,0,0.1)' : 'rgba(74,222,128,0.2)'}`,
          }}>
          {t}
        </span>
      ))}
    </div>
  </div>
)}
```

Quando o professor vai adicionando técnicas ensinadas durante a aula, o aluno atualizando a home passa a vê-las em verde no card.

### Arquivos em B-068

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/aluno/page.tsx` | + busca ensinadas + passa ao CheckinCard |
| `src/app/(app)/aluno/checkin.tsx` | + prop `ensinadas` + render chips verdes |

---

## Ordem de implementação

```
B-067 primeiro  — BackButton + reforços auto-selecionados. Zero risk, máximo impacto no fluxo diário
B-065 segundo   — Turma tech history. 1 arquivo, corrige um bug real (tema column)
B-064 terceiro  — Jornada do aluno. 1 migration + 1 arquivo. O item mais impactante para a visão do produto
B-066 quarto    — Relatorios acessível + lacunas. 2 arquivos, 0 migrations
B-068 por fim   — Checkin com ensinadas. 2 arquivos, melhoria nice-to-have
```

---

## Resumo de migrations

| Migration | Conteúdo |
|---|---|
| `XXXX_jornada_tecnica_aluno.sql` | RPC `jornada_tecnica_aluno(p_aluno_id UUID)` |

1 migration nova. Zero breaking changes.

---

## Critérios de aceite

**B-064 — Jornada do aluno:**
- [ ] `/alunos/[id]` tem seção "Jornada Técnica" com cards por categoria
- [ ] Cada card mostra técnicas como chips: dourado (1–2x) / verde (3+ vezes)
- [ ] Técnica com 2+ vezes mostra "×N" ao lado do nome
- [ ] Total de técnicas aprendidas no header da seção
- [ ] Empty state quando aluno sem nenhuma técnica registrada
- [ ] RLS correto: só professores da mesma academia acessam
- [ ] Título do header mostra nome do aluno (não "Perfil")

**B-065 — Turma tech history:**
- [ ] Lista de aulas na turma mostra técnicas ensinadas como chips dourados
- [ ] Status badge correto (Finalizada verde / Ao vivo dourado / Pendente muted / Cancelada vermelho)
- [ ] `tema` vem do join `categorias_tecnicas(nome)` (não coluna texto legada)
- [ ] Aulas sem técnicas mostram "Nenhuma técnica registrada" (só para finalizadas)
- [ ] Mais de 4 técnicas: mostra 4 + "+N"

**B-066 — Relatorios acessível:**
- [ ] Dashboard tem card "Insights da academia" → `/relatorios` logo após stats strip
- [ ] `/relatorios` aba Técnicas tem subseção "Não ensinadas nos últimos 90 dias"
- [ ] Chips vermelho/laranja para técnicas em lacuna

**B-067 — BackButton + reforços:**
- [ ] BackButton aceita `useBack?: boolean`
- [ ] Em `/aulas/[id]`: voltar vai para a página anterior (dashboard ou histórico, conforme o fluxo)
- [ ] Em `/aulas/nova`: ao trocar turma, técnicas de reforço são auto-marcadas em "planejadas"
- [ ] Auto-marcação não duplica chips (deduplicação via Set)

**B-068 — Checkin com ensinadas:**
- [ ] CheckinCard mostra técnicas ensinadas em chips verdes quando o professor já as registrou
- [ ] Só aparece quando há pelo menos 1 ensinada
- [ ] Label "✓ Ensinadas nesta aula" acima dos chips
- [ ] Cor adaptada ao estado (checked = preto bg, unchecked = fundo verde sutil)

---

**feito com 🥋 por Vitim e Claude**
