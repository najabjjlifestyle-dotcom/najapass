# HANDOFF-011 — Cockpit do Professor: Dashboard + Loop de Aprendizado

**Sprint:** 15  
**Branch:** `feat/sprint15-cockpit-professor`  
**A partir de:** `feat/sprint14-fluxo-pendente` (após merge)  
**Cards:** B-055 · B-056 · B-057 · B-058  
**Status:** Aguardando implementação

---

## O Problema Central

O NajaPass atual pede ao professor para **operar um sistema**: criar aula → abrir → registrar presença → finalizar. Isso exige esforço cognitivo toda vez.

O que ele precisa é de um **cockpit de treinamento**: app abre → vê o que tem hoje → planeja em 30s com contexto pronto → executa a aula → fecha com feedback rápido → sistema já prepara a próxima.

O loop que precisa existir:

```
[Última aula] → [Próxima aula: reforços pré-selecionados] → [Execução] → [Feedback pós-aula] → [Próxima aula: ...]
```

Hoje esse loop não existe. O professor perde contexto entre aulas.

---

## B-055 · Dashboard "Cockpit" — redesign completo

### O que muda

**Hierarquia da informação no dashboard:**

```
HOJE (aulas do dia, com ação rápida)
INSIGHTS (3-5 cards acionáveis — turma sem plano, técnica esquecida, aluno sumido)
SEMANA (mini-grid dos próximos 7 dias com status de cada aula)
```

O grid atual de atalhos (Alunos / Turmas / Técnicas / Relatorios) vai para baixo ou desaparece — professor acessa via nav bar (já existe).

---

### Seção HOJE

Busca aulas `agendada` + `aberta` + `finalizada` com `data = hoje`, agrupadas por status:

```ts
// dashboard/page.tsx — query
const { data: aulasHoje } = await supabase
  .from('aulas')
  .select('id, status, hora_inicio, turmas(nome), tema:categorias_tecnicas(nome)')
  .eq('academia_id', professor.academia_id)
  .eq('data', hoje)
  .in('status', ['agendada', 'aberta', 'finalizada'])
  .order('hora_inicio')
```

**Card de aula — 3 variantes de estado:**

```tsx
// PENDENTE (agendada)
<div className="aula-card">
  <div className="aula-top">
    <div>
      <p className="font-bold text-sm">{turma.nome}</p>
      <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>{hora}</p>
    </div>
    <span className="badge-pendente">Pendente</span>       {/* amarelo */}
  </div>
  
  {/* Técnicas planejadas: chips dourados + laranja (reforço) */}
  {planejadas.length > 0 ? (
    <TecnicasRow tecs={planejadas} />
  ) : (
    <span className="badge-aviso">⚠ Sem técnica planejada</span>
  )}
  
  <div className="flex gap-2 mt-2">
    <Link href={`/aulas/${id}`}>
      <button className="btn-gold">Iniciar aula</button>
    </Link>
    <Link href={`/aulas/${id}`}>
      <button className="btn-outline">Editar plano</button>
    </Link>
  </div>
</div>

// AO VIVO (aberta) — anel pulsante
<div className="aula-card border-live">   {/* borda verde sutil */}
  ...
  <button className="btn-gold">Acessar aula →</button>
</div>

// FINALIZADA — compacto, sem ação
<div className="aula-card opacity-60">
  <div className="flex items-center gap-2">
    <span className="badge-finalizada">Finalizada</span>
    <p className="text-xs">{hora} · {presentes} presentes</p>
  </div>
</div>
```

**Se não há aulas hoje:** Mostrar aulas das próximas 24h (como antes em "Próximas aulas") + botão "+ Nova aula".

---

### Seção INSIGHTS

RPC unificada `professor_dashboard_insights(p_academia_id)` — uma query, retorna JSON:

```sql
CREATE OR REPLACE FUNCTION professor_dashboard_insights(p_academia_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_resultado JSON;
  v_academia_id UUID;
BEGIN
  -- Segurança: validar que o chamador é professor desta academia
  SELECT academia_id INTO v_academia_id
  FROM professores WHERE user_id = auth.uid();
  IF v_academia_id IS DISTINCT FROM p_academia_id THEN RETURN NULL; END IF;

  SELECT json_build_object(
    -- Turmas com aula hoje sem técnica planejada
    'turmas_sem_plano', (
      SELECT json_agg(json_build_object('aula_id', a.id, 'turma_nome', t.nome, 'hora', a.hora_inicio))
      FROM aulas a
      LEFT JOIN turmas t ON t.id = a.turma_id
      LEFT JOIN aula_tecnicas at ON at.aula_id = a.id
      WHERE a.academia_id = p_academia_id
        AND a.data = CURRENT_DATE
        AND a.status = 'agendada'
        AND at.id IS NULL
    ),
    -- Categoria não ensinada há mais de 21 dias (para qualquer turma)
    'categoria_esquecida', (
      SELECT json_build_object('categoria_nome', c.nome, 'dias', CURRENT_DATE - MAX(a.data)::date)
      FROM aula_tecnicas at
      JOIN tecnicas tec ON tec.id = at.tecnica_id
      JOIN categorias_tecnicas c ON c.id = tec.categoria_id
      JOIN aulas a ON a.id = at.aula_id
      WHERE a.academia_id = p_academia_id AND at.tipo = 'ensinada'
      GROUP BY c.id, c.nome
      HAVING CURRENT_DATE - MAX(a.data)::date > 21
      ORDER BY CURRENT_DATE - MAX(a.data)::date DESC
      LIMIT 1
    ),
    -- Aluno ausente há mais de 14 dias
    'aluno_ausente', (
      SELECT json_build_object('aluno_nome', al.nome, 'aluno_id', al.id, 'dias', CURRENT_DATE - MAX(a.data)::date)
      FROM presencas p
      JOIN alunos al ON al.id = p.aluno_id
      JOIN aulas a ON a.id = p.aula_id
      WHERE a.academia_id = p_academia_id AND al.ativo = true
      GROUP BY al.id, al.nome
      HAVING CURRENT_DATE - MAX(a.data)::date > 14
      ORDER BY CURRENT_DATE - MAX(a.data)::date DESC
      LIMIT 1
    ),
    -- Reforços pendentes da semana passada (não foram ensinados ainda)
    'reforcos_pendentes', (
      SELECT COUNT(*) FROM aula_tecnicas at
      JOIN aulas a ON a.id = at.aula_id
      WHERE a.academia_id = p_academia_id AND at.reforco = true
        AND a.data >= CURRENT_DATE - 7 AND a.status = 'finalizada'
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$$;
```

**Render dos insight cards no dashboard:**

```tsx
{insights.turmas_sem_plano?.length > 0 && (
  <InsightCard cor="orange" icone="⚠">
    <b>{insights.turmas_sem_plano[0].turma_nome}</b> ({insights.turmas_sem_plano[0].hora?.substring(0,5)}) — nenhuma técnica planejada
    <Link href={`/aulas/${insights.turmas_sem_plano[0].aula_id}`}> → Planejar</Link>
  </InsightCard>
)}
{insights.categoria_esquecida && (
  <InsightCard cor="yellow" icone="⏰">
    Categoria <b>{insights.categoria_esquecida.categoria_nome}</b> não ensinada há {insights.categoria_esquecida.dias} dias
  </InsightCard>
)}
{insights.aluno_ausente && (
  <InsightCard cor="yellow" icone="👤">
    <b>{insights.aluno_ausente.aluno_nome}</b> ausente há {insights.aluno_ausente.dias} dias
    <Link href={`/alunos/${insights.aluno_ausente.aluno_id}`}> → Ver perfil</Link>
  </InsightCard>
)}
{insights.reforcos_pendentes > 0 && (
  <InsightCard cor="blue" icone="🔁">
    {insights.reforcos_pendentes} técnica{insights.reforcos_pendentes > 1 ? 's marcadas' : ' marcada'} para reforço esta semana
  </InsightCard>
)}
```

O componente `InsightCard` — simples, sem elaboração:
```tsx
// Sem card separado por insight — linha com dot colorido e texto
<div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'9px 12px', borderRadius:10, background:'var(--brand-surf)' }}>
  <div style={{ width:6, height:6, borderRadius:'50%', background: COR_MAPA[cor], flexShrink:0, marginTop:4 }} />
  <p style={{ fontSize:11, color:'#888', lineHeight:1.45 }}>{children}</p>
</div>
```

**Insight card NÃO aparece se não há nada relevante.** Não mostrar "Tudo certo!" — simplesmente omitir.

---

### Seção SEMANA (mini-grid)

Mostra os próximos 7 dias (de hoje em diante). Cada dia: coluna compacta com as aulas (dot colorido + hora).

```tsx
// Dot colors: 
// agendada + sem técnica = cinza
// agendada + com técnica = dourado
// aberta = verde pulsante
// finalizada = verde estático (opacidade reduzida)
```

Clique no card da semana → `/semana` (tela existente).

---

### Arquivos afetados em B-055

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | Redesign completo — seção Hoje + Insights + Semana |
| `src/app/(app)/dashboard/aula-hoje-card.tsx` | NOVO client component — 3 variantes de card |
| `src/app/(app)/dashboard/insight-card.tsx` | NOVO — linha de insight com dot colorido |
| `supabase/migrations/XXXX_professor_dashboard_insights.sql` | NOVA RPC |

Remover ou mover para baixo: stats strip atual, grid de atalhos, seção "Próximas aulas" (integrada no "Hoje").

---

## B-056 · Planejamento com contexto da última aula da turma

### O problema

Hoje o formulário já pré-seleciona técnicas com `reforco=true` da última aula da turma (código existe em `nova/page.tsx`). Mas o professor **não vê o contexto** — não sabe quais técnicas foram ensinadas, quais foram marcadas pra reforço, quanto tempo faz.

### O que muda

**Na tela da aula PENDENTE (`/aulas/[id]`)** — quando `status='agendada'`, mostrar painel de contexto ANTES do formulário de técnicas:

```ts
// aulas/[id]/page.tsx — adicionar query quando status='agendada' e turma_id existe
let ultimaAulaDaTurma: { data: string; tecnicas: { nome: string; reforco: boolean }[] } | null = null

if (aula.turma_id && aula.status === 'agendada') {
  const { data: ultima } = await supabase
    .from('aulas')
    .select('id, data')
    .eq('turma_id', aula.turma_id)
    .eq('status', 'finalizada')
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ultima) {
    const { data: tecs } = await supabase
      .from('aula_tecnicas')
      .select('reforco, tecnicas(nome)')
      .eq('aula_id', ultima.id)
      .eq('tipo', 'ensinada')
    
    ultimaAulaDaTurma = {
      data: ultima.data,
      tecnicas: (tecs ?? []).map(t => ({
        nome: (t.tecnicas as any)?.nome ?? '',
        reforco: t.reforco,
      })),
    }
  }
}
```

**UI do painel de contexto (no início da tela da aula pendente, antes de TecnicasAula):**

```tsx
{ultimaAulaDaTurma && (
  <div className="mx-5 mt-4 px-4 py-3 rounded-xl"
    style={{ background:'var(--brand-surf)', border:'1px solid var(--brand-border)' }}>
    <p className="text-[9px] uppercase tracking-widest mb-2"
      style={{ color:'var(--brand-texto-muted)' }}>
      Última aula desta turma — {formatarDataCurta(ultimaAulaDaTurma.data)}
    </p>
    <div className="flex flex-wrap gap-1.5">
      {ultimaAulaDaTurma.tecnicas.map(t => (
        <span key={t.nome}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
          style={{
            background: t.reforco ? 'rgba(251,146,60,0.1)' : 'rgba(74,222,128,0.08)',
            border: `1px solid ${t.reforco ? 'rgba(251,146,60,0.25)' : 'rgba(74,222,128,0.2)'}`,
            color: t.reforco ? '#FB923C' : '#4ADE80',
          }}>
          {t.reforco ? '↺' : '✓'} {t.nome}
        </span>
      ))}
    </div>
    {ultimaAulaDaTurma.tecnicas.some(t => t.reforco) && (
      <p className="text-[9px] mt-2" style={{ color:'#FB923C' }}>
        Técnicas laranja foram marcadas para reforço — já adicionadas ao plano de hoje
      </p>
    )}
  </div>
)}
```

**Reforços pré-adicionados automaticamente:**

Quando a aula é criada pelo sistema (auto-abertura, B-058) ou pelo professor via formulário, técnicas com `reforco=true` da última aula da mesma turma já são inseridas em `aula_tecnicas` com `tipo='planejada'`. Isso evita que o professor precise lembrar ou buscar.

```ts
// No server action abrirAula() — após criar a aula:
// (já existe código de reforcos, mas só está no form client-side)
// MOVER para o server action para garantir que funciona em qualquer contexto de criação

if (turmaId) {
  const { data: ultimaAula } = await supabase
    .from('aulas')
    .select('id')
    .eq('turma_id', turmaId)
    .eq('status', 'finalizada')
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (ultimaAula) {
    const { data: reforcos } = await supabase
      .from('aula_tecnicas')
      .select('tecnica_id')
      .eq('aula_id', ultimaAula.id)
      .eq('tipo', 'ensinada')
      .eq('reforco', true)

    const idsJaAdicionados = new Set(planejadas)
    const reforcoNovos = (reforcos ?? [])
      .map(r => r.tecnica_id)
      .filter(id => !idsJaAdicionados.has(id))

    if (reforcoNovos.length > 0) {
      await supabase.from('aula_tecnicas').insert(
        reforcoNovos.map(tecnica_id => ({
          aula_id: aula.id,
          tecnica_id,
          tipo: 'planejada',
          reforco: true,  // mantém o flag pra UI saber que é reforço
        }))
      )
    }
  }
}
```

**Arquivos afetados em B-056:**

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/aulas/[id]/page.tsx` | Query de última aula + painel de contexto |
| `src/app/(app)/aulas/actions.ts` | `abrirAula()` — reforços inseridos server-side (não só client) |

---

## B-057 · Feedback pós-aula — "Como foi a turma?"

### O fluxo

Hoje: FINALIZAR AULA → redireciona para `/aulas` diretamente. O professor perde a janela de registrar absorção.

Novo fluxo:
```
[FINALIZAR AULA] → tela de feedback → [CONCLUIR] → redirect /dashboard
```

### Nova rota `/aulas/[id]/feedback`

Server component que mostra as técnicas ensinadas e botões de feedback.

**`src/app/(app)/aulas/[id]/feedback/page.tsx`:**

```tsx
export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  // Auth + professor check igual ao /aulas/[id]
  
  const { data: aula } = await supabase
    .from('aulas')
    .select('id, status, turmas(nome), data')
    .eq('id', id)
    .single()

  // Só aparece para aulas finalizadas
  if (!aula || aula.status !== 'finalizada') redirect(`/aulas/${id}`)

  const { data: tecnicas } = await supabase
    .from('aula_tecnicas')
    .select('tecnica_id, reforco, tecnicas(nome)')
    .eq('aula_id', id)
    .eq('tipo', 'ensinada')

  return <FeedbackForm aulaId={id} tecnicas={tecnicas ?? []} turma={aula.turmas?.nome} data={aula.data} />
}
```

**`src/app/(app)/aulas/[id]/feedback/form.tsx` (client component):**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarFeedbackAula } from './actions'

// Estado: Set de tecnica_ids marcadas como "Repetir"
// Default: todas como "Ótimo" (reforco=false), exceto as já marcadas como reforco=true

export default function FeedbackForm({ aulaId, tecnicas, turma, data }) {
  const [repetir, setRepetir] = useState<Set<string>>(
    new Set(tecnicas.filter(t => t.reforco).map(t => t.tecnica_id))
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle(id: string) {
    setRepetir(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleConcluir() {
    startTransition(async () => {
      await salvarFeedbackAula(aulaId, [...repetir])
      router.replace('/dashboard')
    })
  }

  const nRepetir = repetir.size

  return (
    <div>
      <header>
        <p className="text-xs text-muted">{turma} · {formatarData(data)}</p>
        <h1 className="font-bold text-xl uppercase tracking-wider">Como foi a aula?</h1>
      </header>

      <p className="text-xs text-muted mt-1 mb-4">
        Marque as técnicas que a turma não absorveu bem — elas entram automaticamente no plano da próxima aula.
      </p>

      {tecnicas.map(t => (
        <div key={t.tecnica_id} className="feedback-row">
          <p className="font-bold text-sm">{t.tecnicas?.nome}</p>
          <div className="flex gap-2">
            <button
              onClick={() => { if (repetir.has(t.tecnica_id)) toggle(t.tecnica_id) }}
              className={`btn-feedback ${!repetir.has(t.tecnica_id) ? 'selected-green' : ''}`}>
              ✓ Ótimo
            </button>
            <button
              onClick={() => { if (!repetir.has(t.tecnica_id)) toggle(t.tecnica_id) }}
              className={`btn-feedback ${repetir.has(t.tecnica_id) ? 'selected-orange' : ''}`}>
              ↺ Repetir
            </button>
          </div>
        </div>
      ))}

      {/* Preview do impacto */}
      {nRepetir > 0 && (
        <div className="preview-box">
          <p className="text-xs text-muted">Próxima aula desta turma</p>
          <p className="text-xs mt-1">
            <span style={{ color:'#FB923C' }}>{nRepetir} técnica{nRepetir > 1 ? 's irão' : ' irá'} para reforço</span>
          </p>
        </div>
      )}

      <button onClick={handleConcluir} disabled={isPending} className="btn-gold-full mt-4">
        {isPending ? 'Salvando...' : 'Concluir e fechar aula'}
      </button>
    </div>
  )
}
```

**`src/app/(app)/aulas/[id]/feedback/actions.ts`:**

```ts
'use server'
export async function salvarFeedbackAula(aulaId: string, idsParaRepetir: string[]) {
  const supabase = await createClient()
  // Auth check igual aos demais actions

  // 1. Zerar todos os reforco da aula
  await supabase
    .from('aula_tecnicas')
    .update({ reforco: false })
    .eq('aula_id', aulaId)
    .eq('tipo', 'ensinada')

  // 2. Marcar os selecionados como reforco=true
  if (idsParaRepetir.length > 0) {
    await supabase
      .from('aula_tecnicas')
      .update({ reforco: true })
      .eq('aula_id', aulaId)
      .eq('tipo', 'ensinada')
      .in('tecnica_id', idsParaRepetir)
  }

  revalidatePath('/dashboard')
  return { success: true }
}
```

**Mudar redirect do FINALIZAR:**

`attendance-list.tsx` ou `finalizarAula()` action — atualmente faz `redirect('/aulas')` ou `revalidatePath`. Mudar para redirecionar para `/aulas/${aulaId}/feedback`.

**Arquivos afetados em B-057:**

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/aulas/[id]/feedback/page.tsx` | NOVA ROTA |
| `src/app/(app)/aulas/[id]/feedback/form.tsx` | NOVO client component |
| `src/app/(app)/aulas/[id]/feedback/actions.ts` | NOVO `salvarFeedbackAula()` |
| `src/app/(app)/aulas/[id]/attendance-list.tsx` | Mudar redirect pós-FINALIZAR para `/aulas/[id]/feedback` |

---

## B-058 · Auto-abertura de aulas por turma

### O que é

"Sempre com 12h de antecedência a turma é aberta."

Professor configura uma vez: "Turma da Noite abre 12h antes do horário." O sistema faz o resto.

### Migration

```sql
-- supabase/migrations/XXXX_turma_auto_abrir.sql
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS auto_abrir_horas INT DEFAULT NULL;
-- NULL = manual (não abre sozinho)
-- 12 = abre 12h antes do horário da aula
-- 2 = abre 2h antes
-- 0 = abre no horário exato
```

### UI na tela de edição da turma (`/turmas/[id]/editar`)

```tsx
<div>
  <label>Abertura automática das aulas</label>
  <select name="auto_abrir_horas">
    <option value="">Manual (professor abre)</option>
    <option value="24">24h antes</option>
    <option value="12">12h antes (padrão recomendado)</option>
    <option value="2">2h antes</option>
    <option value="0">No horário exato</option>
  </select>
  <p className="text-xs text-muted mt-1">
    Quando configurado, aulas agendadas desta turma abrem automaticamente e enviam push para os alunos.
  </p>
</div>
```

Salvar em `UPDATE turmas SET auto_abrir_horas = $1 WHERE id = $2`.

### Cron job — Vercel

**`vercel.json`** (criar se não existe, ou adicionar):
```json
{
  "crons": [
    {
      "path": "/api/cron/abrir-aulas",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**`src/app/api/cron/abrir-aulas/route.ts`:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToAll } from '@/lib/push'

export async function GET(req: NextRequest) {
  // Segurança: só Vercel Cron pode chamar
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Busca aulas agendadas onde (data + hora_inicio - auto_abrir_horas) <= agora
  // Usa RPC para fazer o cálculo com timezone correto
  const { data: aulasParaAbrir } = await supabase.rpc('aulas_para_abrir_agora')

  if (!aulasParaAbrir || aulasParaAbrir.length === 0) {
    return NextResponse.json({ abridas: 0 })
  }

  let abridas = 0
  for (const aula of aulasParaAbrir) {
    const { error } = await supabase
      .from('aulas')
      .update({ status: 'aberta' })
      .eq('id', aula.id)
      .eq('status', 'agendada') // idempotente

    if (!error) {
      abridas++
      // Push para alunos da turma
      if (aula.turma_id) {
        const { data: subs } = await supabase.rpc('subscricoes_da_turma', { p_turma_id: aula.turma_id })
        if (subs?.length > 0) {
          await sendPushToAll(subs, {
            title: '🥋 Aula aberta!',
            body: `${aula.turma_nome ?? 'Sua turma'} — confirme sua presença`,
            url: '/aluno',
          })
        }
      }
    }
  }

  return NextResponse.json({ abridas })
}
```

**RPC `aulas_para_abrir_agora`:**

```sql
CREATE OR REPLACE FUNCTION aulas_para_abrir_agora()
RETURNS TABLE(id UUID, turma_id UUID, turma_nome TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.turma_id,
    t.nome AS turma_nome
  FROM aulas a
  JOIN turmas t ON t.id = a.turma_id
  WHERE
    a.status = 'agendada'
    AND t.auto_abrir_horas IS NOT NULL
    AND (
      -- data + hora_inicio - auto_abrir_horas <= now()
      (a.data::timestamp + COALESCE(a.hora_inicio, '00:00'::time)::interval)
      - (t.auto_abrir_horas * INTERVAL '1 hour')
    ) <= NOW() AT TIME ZONE 'America/Sao_Paulo'
    AND (
      -- não abrir aulas de mais de 2h atrás (evita abrir acidentalmente)
      (a.data::timestamp + COALESCE(a.hora_inicio, '00:00'::time)::interval)
    ) >= NOW() AT TIME ZONE 'America/Sao_Paulo' - INTERVAL '2 hours';
END;
$$;
```

**Observação:** O timezone `America/Sao_Paulo` deve ser configurável ou derivado da academia (`academias.timezone TEXT DEFAULT 'America/Sao_Paulo'`). Por ora, fixo no Brasil.

**`CRON_SECRET`** — adicionar às env vars do Vercel + `.env.local`:
```
CRON_SECRET=gerar_um_secret_aleatorio_aqui
```

**Arquivos afetados em B-058:**

| Arquivo | Mudança |
|---|---|
| `vercel.json` | Adicionar cron job |
| `src/app/api/cron/abrir-aulas/route.ts` | NOVO endpoint de cron |
| `src/app/(app)/turmas/[id]/editar` | Campo `auto_abrir_horas` no form de turma |
| `supabase/migrations/XXXX_turma_auto_abrir.sql` | `ALTER TABLE turmas ADD COLUMN auto_abrir_horas INT` |
| `supabase/migrations/XXXX_aulas_para_abrir_agora.sql` | RPC `aulas_para_abrir_agora()` |

---

## Ordem de implementação

```
B-056 primeiro — muda apenas queries + UI estática, sem nova rota, sem migration
B-057 segundo — nova rota /feedback, mudar redirect do FINALIZAR
B-055 terceiro — redesign do dashboard (usa a RPC nova de insights)
B-058 por último — migration + vercel.json + cron (mais partes móveis)
```

---

## Resumo de migrations

| Migration | Arquivo |
|---|---|
| RPC `professor_dashboard_insights()` | `XXXX_professor_dashboard_insights.sql` |
| `turmas.auto_abrir_horas INT DEFAULT NULL` | `XXXX_turma_auto_abrir.sql` |
| RPC `aulas_para_abrir_agora()` | `XXXX_aulas_para_abrir_agora.sql` |

As 3 migrations são novas adições — nenhum `ALTER` destrutivo. Idempotentes com `IF NOT EXISTS`.

---

## Critérios de aceite

**B-055 Dashboard:**
- [ ] Seção "Hoje" mostra aulas do dia com status correto (Pendente/AO VIVO/Finalizada)
- [ ] Aula pendente sem técnica mostra badge ⚠ laranja + botão "Planejar agora"
- [ ] Aula AO VIVO tem destaque (borda verde) + botão "Acessar aula"
- [ ] Insights aparecem apenas quando há algo relevante (zero falsos positivos)
- [ ] Mini-grid da semana mostra dots coloridos por status de cada aula
- [ ] Dashboard vazio (sem aulas hoje): mostra botão "+ Nova aula" prominente

**B-056 Planejamento com contexto:**
- [ ] Tela da aula pendente (com turma) mostra painel "Última aula desta turma"
- [ ] Técnicas com ✓ = verde, com ↺ = laranja
- [ ] Reforços da última aula já aparecem como técnicas planejadas na aula atual
- [ ] Se não há última aula (turma nova): painel não aparece
- [ ] Aula sem turma: painel não aparece

**B-057 Feedback pós-aula:**
- [ ] FINALIZAR AULA redireciona para `/aulas/[id]/feedback`
- [ ] Tela de feedback lista todas as técnicas ensinadas na aula
- [ ] Default: "Ótimo" para todas; reforços já marcados pré-selecionados como "Repetir"
- [ ] Preview: "X técnica(s) irão para reforço na próxima aula"
- [ ] CONCLUIR: salva reforco=true/false, redireciona para /dashboard
- [ ] Se professor voltar via `/aulas/[id]` após finalizar: botão "Ver feedback" em vez de refinalizar

**B-058 Auto-abertura:**
- [ ] Campo "Abertura automática" editável na tela de edição da turma
- [ ] Cron roda a cada 30min; endpoint protegido por `CRON_SECRET`
- [ ] Aula é aberta E push é enviado
- [ ] Janela de abertura: não abre aulas com horário > 2h atrás (evita abrir aulas antigas)
- [ ] `auto_abrir_horas = NULL` = manual (não abre sozinha)

---

## O loop completo após este sprint

```
[Turma configurada com auto_abrir_horas=12]
         ↓
[Sistema: 12h antes → aula vira 'aberta' + push para alunos]
         ↓
[Professor: abre dashboard → vê "Turma da Noite · pendente · ⚠ sem técnica"]
         ↓
[Toca "Planejar" → vê contexto da última aula → Bow and Arrow já está como reforço]
         ↓
[Adiciona mais 1-2 técnicas → salva em 30 segundos]
         ↓
[Durante a aula: registra presença, confirma técnicas ensinadas]
         ↓
[Toca "Finalizar" → tela de feedback → "Bow and Arrow ↺ repetir"]
         ↓
[Próxima aula desta turma: Bow and Arrow já está pré-adicionada]
         ↓
[Dashboard mostra insight se turma não treina há X dias]
```

Isso é o produto. Treino após treino, acumulando contexto.

---

**feito com 🥋 por Vitim e Claude**
