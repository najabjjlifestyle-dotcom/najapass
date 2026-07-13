# HANDOFF-016 — Planejamento com Dados + Histórico por Data

**Data:** 2026-07-13  
**Branch:** `feat/sprint20-planejamento-dados`  
**Base:** `main` (após merge das sprints anteriores)  
**Épico:** EP-22 — Planejamento orientado por dados  
**Cards:** B-073 · B-074

---

## Contexto

Victor quer uma plataforma mais voltada para **dados**.

> "Em planejamento ter insights para montar as aulas. Em histórico as aulas estarem por ordem de DATA não abertura."

**Sobre o histórico:** o código já ordena por `data DESC` — mas a UX esconde essa informação. O filtro de turma é um `<select>` nativo (péssimo no iOS) e os cards não mostram quantos alunos estiveram presentes. O dado mais importante — quem estava lá — não aparece na lista.

**Sobre o planejamento:** a página atual mostra a última aula e as próximas. Mas não responde a pergunta que o professor tem na cabeça antes de montar uma aula:

- "Quanto tempo faz que não passo Raspagem com essa turma?"
- "Qual técnica eles mais erraram ultimamente?"
- "Quem está sumindo?"

Essas três perguntas devem ter resposta na página de Planejamento.

---

## B-073 — Planejamento com insights por turma

### Visão geral da nova página

```
PLANEJAMENTO
O que cada turma está precisando

─── TURMA DA NOITE  Seg/Qua/Sex · 19:30 ──────────────────
  Última aula — sex, 11 jul
  ✓ Americana  ↺ Kimura  ✓ Passagem  +2

  ⏱ HÁ MAIS TEMPO SEM APARECER
  Chave de Pé · 53d    Raspagem · 41d    Estrangulamento · 28d

  🔁 MAIS ENSINADAS NO MÊS
  Kimura ×4    Americana ×3    Cem Quilos ×2

  👻 ALUNOS SUMINDO
  Carlos · 27 dias sem aparecer
  Marina · 19 dias sem aparecer

  PRÓXIMAS AULAS
  ter, 15 jul · 19:30   3 planejadas    [Ver]
  qui, 17 jul · 19:30   ⚠ Sem plano     [Planejar]
──────────────────────────────────────────────────────────
```

### Nova RPC: `insights_turma`

**Migration SQL** (criar no Supabase):

```sql
CREATE OR REPLACE FUNCTION insights_turma(
  p_turma_id UUID,
  p_academia_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Valida acesso
  IF NOT EXISTS (
    SELECT 1 FROM professores
    WHERE user_id = auth.uid() AND academia_id = p_academia_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  WITH

  -- Última vez que cada técnica foi ensinada nesta turma
  ultima_vez_tecnica AS (
    SELECT
      t.id   AS tecnica_id,
      t.nome AS tecnica_nome,
      MAX(a.data) AS ultima_data
    FROM tecnicas t
    LEFT JOIN aula_tecnicas at
      ON at.tecnica_id = t.id
     AND at.tipo = 'ensinada'
    LEFT JOIN aulas a
      ON a.id = at.aula_id
     AND a.turma_id = p_turma_id
     AND a.status = 'finalizada'
    WHERE t.global = true
       OR t.academia_id = p_academia_id
    GROUP BY t.id, t.nome
  ),

  -- Top 5 técnicas ausentes há mais tempo (nunca ensinadas primeiro)
  ausentes AS (
    SELECT
      tecnica_nome AS nome,
      ultima_data,
      CASE
        WHEN ultima_data IS NULL THEN NULL
        ELSE (CURRENT_DATE - ultima_data::date)
      END AS dias_ausente
    FROM ultima_vez_tecnica
    ORDER BY
      (ultima_data IS NOT NULL),   -- NULLs (nunca) primeiro
      ultima_data ASC
    LIMIT 5
  ),

  -- Top 3 mais ensinadas nos últimos 30 dias
  recentes AS (
    SELECT
      t.nome,
      COUNT(*) AS vezes
    FROM aula_tecnicas at
    JOIN aulas a  ON a.id = at.aula_id
    JOIN tecnicas t ON t.id = at.tecnica_id
    WHERE a.turma_id    = p_turma_id
      AND a.status      = 'finalizada'
      AND at.tipo       = 'ensinada'
      AND a.data       >= (CURRENT_DATE - 30)
    GROUP BY t.nome
    ORDER BY vezes DESC
    LIMIT 3
  ),

  -- Top 3 alunos ausentes há mais tempo (ativo na turma)
  alunos_ausentes AS (
    SELECT
      al.nome,
      MAX(a.data) AS ultima_presenca,
      CASE
        WHEN MAX(a.data) IS NULL THEN NULL
        ELSE (CURRENT_DATE - MAX(a.data)::date)
      END AS dias_ausente
    FROM alunos al
    JOIN alunos_turmas atu
      ON atu.aluno_id = al.id
     AND atu.turma_id = p_turma_id
     AND atu.ativo    = true
    LEFT JOIN presencas p ON p.aluno_id = al.id
    LEFT JOIN aulas a
      ON a.id = p.aula_id
     AND a.turma_id  = p_turma_id
     AND a.status    = 'finalizada'
    WHERE al.academia_id = p_academia_id
      AND al.ativo       = true
    GROUP BY al.id, al.nome
    HAVING
      MAX(a.data) IS NULL
      OR MAX(a.data) < (CURRENT_DATE - 14)
    ORDER BY MAX(a.data) ASC NULLS FIRST
    LIMIT 3
  )

  SELECT json_build_object(
    'tecnicas_ausentes', (SELECT COALESCE(json_agg(row_to_json(ausentes)), '[]'::json) FROM ausentes),
    'tecnicas_recentes', (SELECT COALESCE(json_agg(row_to_json(recentes)), '[]'::json) FROM recentes),
    'alunos_ausentes',   (SELECT COALESCE(json_agg(row_to_json(alunos_ausentes)), '[]'::json) FROM alunos_ausentes)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant necessário para o usuário autenticado chamar
GRANT EXECUTE ON FUNCTION insights_turma(UUID, UUID) TO authenticated;
```

### Mudanças em `planejamento/page.tsx`

**1. Tipagem dos dados de insights:**

```ts
type InsightsTurma = {
  tecnicas_ausentes: { nome: string; ultima_data: string | null; dias_ausente: number | null }[]
  tecnicas_recentes: { nome: string; vezes: number }[]
  alunos_ausentes: { nome: string; ultima_presenca: string | null; dias_ausente: number | null }[]
}
```

**2. Busca paralela dos insights por turma:**

No `dadosPorTurma`, adicionar a chamada da RPC ao `Promise.all`:

```ts
const dadosPorTurma = await Promise.all(
  turmas.map(async (turma) => {
    const [ultimaAulaRes, proximasRes, insightsRes] = await Promise.all([
      // ...queries existentes...,
      supabase.rpc('insights_turma', {
        p_turma_id: turma.id,
        p_academia_id: professor.academia_id,
      }),
    ])

    return {
      turma,
      ultimaAula: ultimaAulaRes.data as unknown as UltimaAula | null,
      proximasAulas: (proximasRes.data ?? []) as unknown as ProximaAula[],
      insights: (insightsRes.data ?? null) as InsightsTurma | null,
    }
  })
)
```

**3. Novo bloco de UI por turma card:**

Após o bloco "Última aula" e antes do bloco "Próximas aulas", inserir as três seções de insight:

```tsx
{/* Técnicas há mais tempo sem aparecer */}
{insights && insights.tecnicas_ausentes.length > 0 && (
  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
    <p className="text-[9px] uppercase tracking-widest mb-2 flex items-center gap-1.5"
       style={{ color: 'var(--brand-texto-muted)' }}>
      <span>⏱</span> Há mais tempo sem aparecer
    </p>
    <div className="flex flex-wrap gap-1.5">
      {insights.tecnicas_ausentes.map((t, i) => (
        <span key={i}
          className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#F87171',
          }}>
          {t.nome}
          {t.dias_ausente !== null
            ? ` · ${t.dias_ausente}d`
            : ' · nunca'}
        </span>
      ))}
    </div>
  </div>
)}

{/* Mais ensinadas no último mês */}
{insights && insights.tecnicas_recentes.length > 0 && (
  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
    <p className="text-[9px] uppercase tracking-widest mb-2"
       style={{ color: 'var(--brand-texto-muted)' }}>
      🔁 Mais ensinadas no mês
    </p>
    <div className="flex flex-wrap gap-1.5">
      {insights.tecnicas_recentes.map((t, i) => (
        <span key={i}
          className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
          style={{
            background: 'var(--brand-gold-dim)',
            border: '1px solid var(--brand-gold-border)',
            color: 'var(--brand-gold)',
          }}>
          {t.nome} ×{t.vezes}
        </span>
      ))}
    </div>
  </div>
)}

{/* Alunos sumindo */}
{insights && insights.alunos_ausentes.length > 0 && (
  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
    <p className="text-[9px] uppercase tracking-widest mb-2"
       style={{ color: 'var(--brand-texto-muted)' }}>
      👻 Alunos sumindo
    </p>
    <div className="space-y-1.5">
      {insights.alunos_ausentes.map((a, i) => (
        <div key={i} className="flex items-center justify-between">
          <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
            {a.nome}
          </p>
          <p className="text-[10px]" style={{ color: '#F87171' }}>
            {a.dias_ausente !== null
              ? `${a.dias_ausente} dias sem aparecer`
              : 'nunca apareceu'}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

**4. Atualizar header da página:**

```tsx
<header className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
  <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
    Planejamento
  </h1>
  <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
    Lacunas, repetições e alunos para cada turma
  </p>
</header>
```

---

## B-074 — Histórico: presença por aula + filtro como chips

### 1. Garantir ordenação por data

A query atual já tem `.order('data', { ascending: false })`. Confirmar que o campo `data` no banco é do tipo `DATE` e está sendo corretamente preenchido no cadastro de aulas. **Não mudar a query — ela já está correta.**

### 2. Adicionar contagem de presentes a cada aula

**Em `aulas/page.tsx`, na query de `ConteudoTab`:**

```ts
// Trocar:
.select('id, data, hora_inicio, status, turmas(nome), aula_tecnicas(tipo, reforco, tecnicas(nome))')

// Por:
.select('id, data, hora_inicio, status, turmas(nome), aula_tecnicas(tipo, reforco, tecnicas(nome)), presencas(id)')
```

Atualizar o tipo:

```ts
type AulaRow = {
  id: string; data: string; hora_inicio: string | null; status: string
  turmas: { nome: string } | null
  aula_tecnicas: AulaTecnicaRow[] | null
  presencas: { id: string }[] | null   // ← NOVO
}
```

**No card de cada aula, mostrar contagem:**

```tsx
<div className="flex items-center justify-between mb-2">
  <div>
    <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
      {turma?.nome ?? 'Aula Avulsa'}
    </p>
    <p className="text-[10px] capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
      {formatarDataCurta(aula.data)}
      {aula.hora_inicio ? ` · ${aula.hora_inicio.substring(0, 5)}` : ''}
    </p>
  </div>
  <div className="flex items-center gap-2 flex-shrink-0">
    {/* Presença */}
    {aula.presencas && aula.presencas.length > 0 && (
      <span className="text-[10px] font-bold" style={{ color: 'var(--brand-texto-muted)' }}>
        {aula.presencas.length} 🥋
      </span>
    )}
    {/* Status ao vivo */}
    {aula.status === 'aberta' && (
      <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
        Ao vivo
      </span>
    )}
    {/* Contagem de técnicas */}
    {aula.status !== 'aberta' && ensinadas.length > 0 && (
      <span className="text-[10px]" style={{ color: '#4ADE80' }}>
        {ensinadas.length} téc.
      </span>
    )}
  </div>
</div>
```

### 3. Substituir `<select>` nativo por chips de turma

**Remover** o `<form method="get">` com o `<select>` e o botão "Filtrar".

**Substituir por** uma strip horizontal de chips acima das abas:

```tsx
{/* Strip de filtro por turma — chips horizontais */}
<div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-3 scrollbar-hide"
     style={{ borderBottom: '1px solid var(--brand-border)' }}>
  <Link
    href={`/aulas?aba=${aba}`}
    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
    style={!turmaFiltro
      ? { background: 'var(--brand-gold)', color: '#000' }
      : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
    }>
    Todas
  </Link>
  {(turmasData ?? []).map(t => (
    <Link
      key={t.id}
      href={`/aulas?aba=${aba}&turma=${t.id}`}
      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
      style={turmaFiltro === t.id
        ? { background: 'var(--brand-gold)', color: '#000' }
        : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
      }>
      {t.nome}
    </Link>
  ))}
</div>
```

> Mover esse bloco para **antes** das abas Conteúdo/Frequência, ajustando a ordem:
> 1. Header (Histórico + botão + Nova Aula)
> 2. Chips de turma (filtro visual)
> 3. Abas (Conteúdo / Frequência)
> 4. Conteúdo da aba ativa

**Atualizar as abas** para preservar o `turma` no href:

```tsx
// Já existe no código — manter como está:
const turmaQS = turmaFiltro ? `&turma=${turmaFiltro}` : ''
// ...
<Link href={`/aulas?aba=conteudo${turmaQS}`}>Conteúdo</Link>
<Link href={`/aulas?aba=frequencia${turmaQS}`}>Frequência</Link>
```

### 4. Header com stat total

Após o header atual, antes do filtro, adicionar uma linha com total:

```tsx
{/* A ser calculado dentro de ConteudoTab e passado como prop,
    ou simplesmente mostrar o count do array: */}
```

Alternativa mais simples: mostrar o total de aulas no header da aba Conteúdo:

```tsx
// No topo de ConteudoTab, após verificar aulas.length:
<p className="text-[10px] px-5 pt-3 pb-1 uppercase tracking-widest"
   style={{ color: 'var(--brand-texto-muted)' }}>
  {aulas.length} aula{aulas.length !== 1 ? 's' : ''} registrada{aulas.length !== 1 ? 's' : ''}
  {turmaFiltro ? '' : ' · todas as turmas'}
</p>
```

---

## Resumo das mudanças

| Arquivo | Card | O que muda |
|---|---|---|
| `supabase/migrations/` | B-073 | Nova RPC `insights_turma(p_turma_id, p_academia_id)` |
| `planejamento/page.tsx` | B-073 | Adiciona chamada RPC + 3 seções de insight por turma card |
| `aulas/page.tsx` | B-074 | Query com `presencas(id)`; chips de turma substituem `<select>`; stat header; presença no card |

---

## Critérios de aceite (Sprint 20)

**Planejamento:**
- [ ] Cada turma card mostra "Há mais tempo sem aparecer" com técnicas e dias de ausência
- [ ] Cada turma card mostra "Mais ensinadas no mês" com contagem
- [ ] Cada turma card mostra "Alunos sumindo" quando há aluno ausente há +14 dias
- [ ] Se a turma não tem nenhum dado ainda, as seções de insight não aparecem (não mostrar vazio)
- [ ] RPC respeita RLS — professor só vê dados de sua academia

**Histórico:**
- [ ] Aulas listadas por `data DESC` — verificar visualmente que a ordem está correta
- [ ] Filtro de turma como chips horizontais scroll (sem `<select>` nativo)
- [ ] Cada aula exibe contagem de presentes (ex: "12 🥋")
- [ ] Chip "Todas" ativo quando nenhuma turma está selecionada
- [ ] Turma selecionada mantém o filtro ao trocar de aba (Conteúdo ↔ Frequência)

---

*Planejamento deixa de ser "ver o que passou" e passa a responder "o que precisa passar".*
