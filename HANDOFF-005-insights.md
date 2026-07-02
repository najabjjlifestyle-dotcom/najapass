# HANDOFF-005 — Insights da Academia

**Status:** Pronto para implementação (após merge do HANDOFF-004)  
**Data:** 2026-07-02  
**PM:** Claude.ai  
**Para:** Claude Code (CTO)  
**Cards:** B-039, B-040, B-042

---

## Dependência

Este HANDOFF assume que o **HANDOFF-004** (banho de loja) já foi mergeado. Especificamente:
- Bottom nav já existe com o item **Insights → `/relatorios`**
- Tokens `--brand-*` já aplicados em todo o app
- `BarChart2` do lucide-react já importado no projeto

Se o HANDOFF-004 ainda não foi mergeado, implementar este em branch separada a partir da branch do 004.

---

## Contexto

O NajaPass coleta dados desde o início: `aula_tecnicas`, `presencas`, `tecnicas`. Nenhum campo novo é necessário — o que falta é a camada de leitura e visualização. Este HANDOFF transforma os dados já existentes em decisões visíveis para o professor.

**Três entregas:**
1. **B-039** — Tela `/relatorios` com 3 abas e filtro de período
2. **B-040** — Card de insight dinâmico no dashboard
3. **B-042** — Seção "Candidatos a graduação" dentro de `/relatorios`

---

## B-039 — Tela de Insights (`/relatorios`)

### Estrutura da página

```tsx
// src/app/(app)/relatorios/page.tsx
// Server Component — busca dados com base no período (padrão: mês atual)
```

A página recebe `searchParams.periodo` (valores: `mes` | `trimestre` | `ano`). A troca de período é feita via `<Link href="?periodo=trimestre">` — sem client-side state, sem useRouter, sem JavaScript extra. O server re-renderiza com os dados do período correto.

### Header

```tsx
<header className="px-5 pt-12 pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
    {labelPeriodo}  {/* "Julho 2026" / "Mai – Jul 2026" / "Jan – Jul 2026" */}
  </p>
  <h1 className="text-[22px] font-bold mt-1" style={{ color: 'var(--brand-texto)' }}>
    Insights <span style={{ color: 'var(--brand-gold)' }}>da academia</span>
  </h1>

  {/* Seletor de período */}
  <div className="flex gap-1 mt-3">
    {[
      { value: 'mes',       label: 'Mês' },
      { value: 'trimestre', label: '3M'  },
      { value: 'ano',       label: 'Ano' },
    ].map(op => (
      <Link
        key={op.value}
        href={`?periodo=${op.value}`}
        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
        style={periodo === op.value
          ? { background: 'var(--brand-gold)', color: '#000' }
          : { background: 'var(--brand-surf)', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
        }>
        {op.label}
      </Link>
    ))}
  </div>
</header>
```

### Tabs (Técnicas / Alunos / Frequência)

Usar o mesmo padrão de `searchParams`: `?periodo=mes&aba=tecnicas`. Tab ativa lida do searchParam `aba` (padrão: `tecnicas`).

```tsx
const tabs = [
  { value: 'tecnicas',   label: 'Técnicas'   },
  { value: 'alunos',     label: 'Alunos'     },
  { value: 'frequencia', label: 'Frequência' },
]

// Cada tab é um Link que preserva o período:
<Link href={`?periodo=${periodo}&aba=${tab.value}`} ...>
```

---

### Aba: Técnicas

**Queries necessárias:**

```typescript
// 1. Técnicas mais ensinadas no período
const { data: maisEnsinadas } = await supabase
  .from('aula_tecnicas')
  .select('tecnica_id, tecnicas(nome, categorias_tecnicas(nome)), aulas!inner(data, academia_id)')
  .eq('aulas.academia_id', acadId)
  .eq('tipo', 'ensinada')
  .gte('aulas.data', dataInicio)
  .lte('aulas.data', dataFim)

// Agrupar por tecnica_id no código (JS) — contar ocorrências, ordenar DESC, pegar top 8

// 2. Técnicas com reforço marcado na aula mais recente
const { data: ultimaAula } = await supabase
  .from('aulas')
  .select('id')
  .eq('academia_id', acadId)
  .eq('status', 'finalizada')
  .order('data', { ascending: false })
  .limit(1)
  .maybeSingle()

const { data: reforcos } = ultimaAula ? await supabase
  .from('aula_tecnicas')
  .select('tecnicas(nome)')
  .eq('aula_id', ultimaAula.id)
  .eq('reforco', true) : { data: [] }

// 3. Total de técnicas cadastradas vs. ensinadas alguma vez (lacunas)
const { count: totalTecnicas } = await supabase
  .from('tecnicas')
  .select('id', { count: 'exact', head: true })
  .eq('academia_id', acadId)

const tecnicasEnsinadas = new Set(maisEnsinadas?.map(r => r.tecnica_id))
const lacunas = (totalTecnicas ?? 0) - tecnicasEnsinadas.size
```

**UI da aba Técnicas:**

```tsx
{/* Card 1: Mais ensinadas */}
<section style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
  <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
    Mais ensinadas no período
  </p>
  {ranking.map(t => (
    <div key={t.id} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#ccc' }}>{t.nome}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-gold)' }}>{t.count}x</span>
      </div>
      <div style={{ background: 'var(--brand-border)', borderRadius: 4, height: 5 }}>
        <div style={{ width: `${Math.round(t.count / ranking[0].count * 100)}%`, height: '100%', background: 'var(--brand-gold)', borderRadius: 4 }} />
      </div>
    </div>
  ))}
</section>

{/* Card 2: Reforço pendente (só aparece se houver) */}
{reforcos.length > 0 && (
  <section style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
    <p style={{ fontSize: 9, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
      Reforço pendente — da última aula
    </p>
    {reforcos.map((r, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < reforcos.length - 1 ? '1px solid var(--brand-border)' : 'none' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand-gold)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--brand-texto)' }}>{r.nome}</span>
      </div>
    ))}
  </section>
)}

{/* Card 3: Lacunas (só aparece se lacunas > 0) */}
{lacunas > 0 && (
  <section style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 14 }}>
    <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Lacunas de conteúdo</p>
    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-texto)', marginTop: 4 }}>{lacunas} técnicas nunca ensinadas</p>
    <p style={{ fontSize: 10, color: 'var(--brand-texto-muted)', marginTop: 2 }}>de {totalTecnicas} cadastradas no período selecionado</p>
  </section>
)}
```

---

### Aba: Alunos

**Queries necessárias:**

```typescript
// 1. Alunos sem treinar há +14 dias
const cutoff14 = new Date()
cutoff14.setDate(cutoff14.getDate() - 14)

const { data: alunosAtivos } = await supabase
  .from('alunos')
  .select('id, nome, faixa, grau')
  .eq('academia_id', acadId)
  .eq('ativo', true)

const { data: ultimasPresencas } = await supabase
  .from('presencas')
  .select('aluno_id, registrado_em')
  .in('aluno_id', alunosAtivos.map(a => a.id))
  .order('registrado_em', { ascending: false })

// Agrupar por aluno_id, pegar a mais recente de cada um (JS)
// Filtrar os que a última presença < cutoff14 OU nunca treinaram

// 2. Ranking de presença no período
const { data: presencasPeriodo } = await supabase
  .from('presencas')
  .select('aluno_id, aulas!inner(data, academia_id)')
  .eq('aulas.academia_id', acadId)
  .gte('aulas.data', dataInicio)
  .lte('aulas.data', dataFim)

// Contar por aluno_id, cruzar com nomes, ordenar DESC
```

**UI da aba Alunos:**

```tsx
{/* Card de alertas — só aparece se houver alunos ausentes */}
{ausentes.length > 0 && (
  <section style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
    <p style={{ fontSize: 9, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
      Atenção — frequência baixa
    </p>
    {ausentes.map((a, i) => (
      <Link
        key={a.id}
        href={`/alunos/${a.id}`}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < ausentes.length - 1 ? '1px solid var(--brand-gold-border)' : 'none' }}>
        <span style={{ fontSize: 12, color: 'var(--brand-texto)', fontWeight: 500 }}>{a.nome}</span>
        <span style={{ fontSize: 11, color: 'var(--brand-gold)' }}>{a.diasSemTreinar}d sem treinar</span>
      </Link>
    ))}
  </section>
)}

{/* Ranking de presença */}
<section style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 14 }}>
  <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
    Ranking de presença
  </p>
  {rankingAlunos.map((a, i) => (
    <Link key={a.id} href={`/alunos/${a.id}`}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < rankingAlunos.length - 1 ? '1px solid #1A1A1A' : 'none' }}>
      <span style={{ fontSize: 10, color: 'var(--brand-texto-muted)', width: 16, textAlign: 'center', fontWeight: 700 }}>{i + 1}</span>
      <Avatar nome={a.nome} fotoUrl={a.fotoUrl} size={28} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: 'var(--brand-texto)', fontWeight: 500 }}>{a.nome}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-gold)' }}>{a.presencas}</p>
        <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)' }}>aulas</p>
      </div>
    </Link>
  ))}
</section>
```

---

### Aba: Frequência

**Queries necessárias:**

```typescript
// 1. Total de aulas e média de presentes no período
const { data: aulasNoPeriodo } = await supabase
  .from('aulas')
  .select('id, presencas(id)')
  .eq('academia_id', acadId)
  .in('status', ['aberta', 'finalizada'])
  .gte('data', dataInicio)
  .lte('data', dataFim)

const totalAulas = aulasNoPeriodo?.length ?? 0
const mediaPresentes = totalAulas > 0
  ? (aulasNoPeriodo!.reduce((acc, a) => acc + (a.presencas as {id:string}[]).length, 0) / totalAulas)
  : 0

// 2. Presentes por dia da semana
// Para cada aula no período, pegar o dia da semana da data e acumular contagem de presentes
// Resultado: { seg: N, ter: N, qua: N, qui: N, sex: N, sab: N }
```

**UI da aba Frequência:**

```tsx
{/* Stats */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
  <div style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 14 }}>
    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-gold)', lineHeight: 1 }}>{totalAulas}</p>
    <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 4 }}>aulas no período</p>
  </div>
  <div style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 14 }}>
    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-gold)', lineHeight: 1 }}>{mediaPresentes.toFixed(1)}</p>
    <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 4 }}>média de presentes</p>
  </div>
</div>

{/* Gráfico de barras por dia da semana */}
<section style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 14 }}>
  <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
    Presentes por dia da semana
  </p>
  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
    {diasSemana.map(({ label, total, isMax }) => (
      <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, color: isMax ? 'var(--brand-gold)' : 'var(--brand-texto-muted)', fontWeight: 700 }}>{total}</span>
        <div style={{ width: '100%', background: 'var(--brand-border)', borderRadius: 4, height: 56, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: `${Math.round(total / maxTotal * 100)}%`, background: isMax ? 'var(--brand-gold)' : '#2A2A2A', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 9, color: isMax ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>{label}</span>
      </div>
    ))}
  </div>
</section>
```

---

### Utilitário: calcular `dataInicio` / `dataFim`

```typescript
// src/lib/periodo.ts
export function getPeriodoDatas(periodo: string): { dataInicio: string; dataFim: string; label: string } {
  const hoje = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (periodo === 'trimestre') {
    const inicio = new Date(hoje)
    inicio.setMonth(inicio.getMonth() - 2)
    inicio.setDate(1)
    return { dataInicio: fmt(inicio), dataFim: fmt(hoje), label: `${fmtMes(inicio)} – ${fmtMes(hoje)}` }
  }

  if (periodo === 'ano') {
    const inicio = new Date(hoje.getFullYear(), 0, 1)
    return { dataInicio: fmt(inicio), dataFim: fmt(hoje), label: `Jan – ${fmtMes(hoje)} ${hoje.getFullYear()}` }
  }

  // padrão: mês atual
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  return { dataInicio: fmt(inicio), dataFim: fmt(hoje), label: fmtMes(hoje, true) }
}

function fmtMes(d: Date, comAno = false) {
  return d.toLocaleDateString('pt-BR', { month: 'long', ...(comAno ? { year: 'numeric' } : {}) })
}
```

---

## B-040 — Insight dinâmico no dashboard

Adicionar **um único card** entre o stats strip e o grid de ações no `dashboard/page.tsx`. Aparece apenas quando há algo relevante — nunca força um "tudo certo".

### Query (adicionar ao `Promise.all` já existente)

```typescript
// Dentro do Promise.all do dashboard:

// Aluno mais ausente (se > 14 dias)
supabase.rpc('aluno_mais_ausente', { p_academia_id: acadId }),

// Última vez que cada categoria foi ensinada — para detectar lacunas de +21 dias
supabase
  .from('aula_tecnicas')
  .select('tecnicas!inner(categorias_tecnicas(nome)), aulas!inner(data, academia_id)')
  .eq('aulas.academia_id', acadId)
  .eq('tipo', 'ensinada')
  .order('aulas.data', { ascending: false })
  .limit(50),
```

**Criar a RPC `aluno_mais_ausente`:**

```sql
-- supabase/migrations/YYYYMMDDXXXXXX_aluno_mais_ausente.sql
CREATE OR REPLACE FUNCTION aluno_mais_ausente(p_academia_id UUID)
RETURNS TABLE(aluno_id UUID, nome TEXT, dias_ausente INT) AS $$
  SELECT
    a.id,
    a.nome,
    EXTRACT(DAY FROM NOW() - MAX(p.registrado_em))::INT AS dias_ausente
  FROM alunos a
  LEFT JOIN presencas p ON p.aluno_id = a.id
  WHERE a.academia_id = p_academia_id AND a.ativo = TRUE
  GROUP BY a.id, a.nome
  HAVING MAX(p.registrado_em) < NOW() - INTERVAL '14 days'
      OR MAX(p.registrado_em) IS NULL
  ORDER BY dias_ausente DESC NULLS LAST
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Lógica de prioridade no componente

```typescript
// Determina qual insight mostrar (em ordem de prioridade):
type Insight =
  | { tipo: 'ausente'; nome: string; dias: number; alunoId: string }
  | { tipo: 'lacuna_categoria'; categoria: string; dias: number }
  | { tipo: 'reforco'; tecnica: string }
  | null

function calcularInsight(...): Insight {
  // 1. Aluno ausente há +14 dias?
  if (alunoMaisAusente && alunoMaisAusente.dias_ausente >= 14) {
    return { tipo: 'ausente', nome: alunoMaisAusente.nome, dias: alunoMaisAusente.dias_ausente, alunoId: alunoMaisAusente.aluno_id }
  }

  // 2. Alguma categoria sem ser ensinada há +21 dias?
  // (calcular da lista de últimas aula_tecnicas)
  if (categoriaLacuna) {
    return { tipo: 'lacuna_categoria', categoria: categoriaLacuna.nome, dias: categoriaLacuna.dias }
  }

  // 3. Reforço pendente da última aula?
  if (reforcosPendentes.length > 0) {
    return { tipo: 'reforco', tecnica: reforcosPendentes[0].nome }
  }

  return null
}
```

### UI do card de insight

```tsx
{insight && (
  <div className="px-4 mb-3">
    <Link
      href={insight.tipo === 'ausente' ? `/alunos/${insight.alunoId}` : '/relatorios'}
      className="flex items-center justify-between rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)' }}>
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--brand-gold)' }} />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--brand-texto)' }}>
            {insight.tipo === 'ausente' && `${insight.nome} — ${insight.dias}d sem treinar`}
            {insight.tipo === 'lacuna_categoria' && `${insight.categoria} — ${insight.dias}d sem ensinar`}
            {insight.tipo === 'reforco' && `Reforço pendente`}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
            {insight.tipo === 'ausente' && 'Ver perfil do aluno'}
            {insight.tipo === 'lacuna_categoria' && 'Ver insights da academia'}
            {insight.tipo === 'reforco' && insight.tecnica}
          </p>
        </div>
      </div>
      <span style={{ color: 'var(--brand-gold)', fontSize: 18 }}>→</span>
    </Link>
  </div>
)}
```

**Posição no dashboard:** entre o stats strip e o grid de ações.

---

## B-042 — Candidatos a graduação

Implementar como **seção ao final da aba Alunos** em `/relatorios`. Não é uma aba separada.

### Query

```typescript
// Buscar alunos com presença suficiente desde a última graduação
// Threshold padrão: 50 presenças para grau, 120 para faixa
// Como não temos tabela de graduações ainda, usar:
// — proxy: contar total de presenças do aluno (histórico completo)
// — comparar com thresholds por faixa (valores sugeridos abaixo)

const THRESHOLD_GRAU: Record<string, number> = {
  branca: 40, cinza: 40, amarela: 50, laranja: 50,
  verde: 60, azul: 80, roxa: 100, marrom: 120, preta: 0,
}

const { data: candidatos } = await supabase
  .from('alunos')
  .select('id, nome, faixa, grau, presencas(id)')
  .eq('academia_id', acadId)
  .eq('ativo', true)

// Filtrar no JS: alunos com presencas.length >= THRESHOLD_GRAU[faixa]
// Ordenar por (presencas.length - threshold) DESC — mais "prontos" primeiro
```

### UI

```tsx
{candidatos.length > 0 && (
  <section style={{ marginTop: 16 }}>
    <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
      Candidatos a graduação
    </p>
    <div style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', borderRadius: 14, padding: 14 }}>
      {candidatos.map((c, i) => (
        <Link key={c.id} href={`/alunos/${c.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < candidatos.length - 1 ? '1px solid #1A1A1A' : 'none' }}>
          <div style={{ width: 6, height: 24, borderRadius: 3, flexShrink: 0, background: FAIXA_COR_HEX[c.faixa] }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--brand-texto)', fontWeight: 500 }}>{c.nome}</p>
            <p style={{ fontSize: 10, color: 'var(--brand-texto-muted)' }}>
              {c.faixa} · {c.grau}º grau · {c.totalPresencas} presenças
            </p>
          </div>
          <span style={{ fontSize: 10, color: 'var(--brand-gold)', fontWeight: 700 }}>graduação →</span>
        </Link>
      ))}
    </div>
    <p style={{ fontSize: 9, color: 'var(--brand-texto-muted)', marginTop: 6, paddingHorizontal: 4 }}>
      Baseado no total de presenças registradas. A decisão de graduar é sempre do professor.
    </p>
  </section>
)}
```

---

## Arquivos a criar/editar

```
src/lib/periodo.ts                          ← NOVO — utilitário de datas
src/app/(app)/relatorios/page.tsx           ← EDITAR — implementar conteúdo real (rota já existe)
src/app/(app)/dashboard/page.tsx            ← EDITAR — adicionar insight dinâmico
supabase/migrations/XXXX_aluno_mais_ausente.sql  ← NOVO — RPC
```

---

## Ordem de execução

```
1. src/lib/periodo.ts                   (10 min)
2. RPC aluno_mais_ausente               (15 min — SQL + migration)
3. B-039: /relatorios/page.tsx          (90 min — queries + 3 abas + filtro período)
4. B-040: insight no dashboard          (30 min — lógica de prioridade + UI)
5. B-042: candidatos na aba Alunos      (20 min — query + seção)
```

**Estimativa total:** ~2.5h de implementação

---

## Critério de aceite

- [ ] `/relatorios` carrega sem erro para academia com 0 dados (empty states elegantes)
- [ ] Filtro de período muda os dados sem reload de página (Link com searchParams)
- [ ] Card de insight no dashboard aparece quando há aluno ausente +14d, some quando não há
- [ ] Aba Alunos mostra seção "Candidatos" apenas quando há candidatos
- [ ] Nenhuma tela trava com academia recém-criada (zero aulas, zero alunos)
- [ ] `npx tsc --noEmit` sem erros

---

## Nota sobre migrations

Assim como nos HANDOFFs anteriores: após criar a migration, rodar `supabase link` + `supabase db push`, ou aplicar o SQL manualmente via painel Supabase. Confirmar com Vitim antes do deploy.

---

*HANDOFF-005 — preparado por Claude.ai (PM) em 2026-07-02*  
*Cards: B-039 / B-040 / B-042 — EP-12 Insights & UX Mobile*
