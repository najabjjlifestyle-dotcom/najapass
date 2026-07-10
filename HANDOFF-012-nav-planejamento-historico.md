# HANDOFF-012 — Nav Professor: Planejamento + Retrospecto

**Sprint:** 16  
**Branch:** `feat/sprint16-nav-planejamento`  
**A partir de:** `feat/sprint15-cockpit-professor` (após merge)  
**Cards:** B-059 · B-060 · B-061  
**Status:** Aguardando implementação

---

## Contexto

O 4º slot do nav do professor é "Perfil" — algo que ele acessa raramente. O slot vai para "Planejamento", que ele precisa toda semana. O acesso ao perfil migra para o header do dashboard (toque no avatar já abre `/perfil`).

Ao mesmo tempo, o "Histórico" (atualmente `/aulas`) é uma lista flat de classes sem contexto de aprendizado. Vira um retrospecto por turma: o professor pode ver o que ensinou em cada turma, a evolução e os gaps.

---

## B-059 · Nav professor — "Perfil" → "Planejamento"

### O que muda

**`src/components/bottom-nav.tsx`:**

```tsx
// ANTES
import { LayoutDashboard, Users, ClipboardList, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', Icon: LayoutDashboard, label: 'Início' },
  { href: '/alunos', Icon: Users, label: 'Alunos' },
  { href: '/aulas', Icon: ClipboardList, label: 'Histórico' },
  { href: '/perfil', Icon: User, label: 'Perfil' },
]

// DEPOIS
import { LayoutDashboard, Users, ClipboardList, CalendarCheck2 } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', Icon: LayoutDashboard, label: 'Início' },
  { href: '/alunos', Icon: Users, label: 'Alunos' },
  { href: '/aulas', Icon: ClipboardList, label: 'Histórico' },
  { href: '/planejamento', Icon: CalendarCheck2, label: 'Planejamento' },
]
```

Ícone: `CalendarCheck2` do Lucide (calendário com check — comunica "agenda + confirmação"). Alternativa: `LayoutList` se preferir algo mais neutro.

**Active detection:**  
A lógica existente `pathname.startsWith(href)` já funciona para `/planejamento` e suas sub-rotas.

### Perfil — acesso via header do dashboard

**`src/app/(app)/dashboard/page.tsx`** — o header já tem o avatar do professor (de B-038). Tornar o bloco do avatar clicável:

```tsx
// ANTES (provável)
<div className="flex items-center gap-3">
  <AvatarUpload ... />
  <div>
    <h1>{professor.nome}</h1>
    ...
  </div>
</div>

// DEPOIS — envolve em Link
<Link href="/perfil" className="flex items-center gap-3">
  <AvatarUpload entityId={professor.id} ... size={40} readOnly /> {/* AvatarUpload não-editável no dashboard */}
  <div>
    <h1>{professor.nome}</h1>
    <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>Ver perfil →</p>
  </div>
</Link>
```

**Observação:** `AvatarUpload` pode receber uma prop `readOnly?: boolean` — quando `true`, renderiza apenas a imagem sem o `<label>` e o camera overlay. Isso evita abrir o file picker ao tocar no avatar do dashboard.

---

## B-060 · Nova página `/planejamento` — visão turma-centric

### O que é

Uma visão focada em **cada turma individualmente**, conectando o que foi ensinado (passado) com o que está agendado (futuro). O professor usa isso para:
- Saber onde cada turma parou
- Ver o que precisa de reforço
- Planejar as próximas aulas com contexto

### Nova rota `src/app/(app)/planejamento/page.tsx`

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function PlanejamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!professor?.academia_id) redirect('/onboarding')

  const { data: turmas } = await supabase
    .from('turmas')
    .select('id, nome, dias_semana, hora_inicio, auto_abrir_horas')
    .eq('academia_id', professor.academia_id)
    .eq('ativa', true)
    .order('nome')

  if (!turmas?.length) {
    // Empty state
    return <PlanejamentoEmptyState />
  }

  // Para cada turma: última aula + próximas 3 aulas (paralelo)
  const dadosPorTurma = await Promise.all(
    turmas.map(async (turma) => {
      const [ultimaAulaRes, proximasRes] = await Promise.all([
        // Última aula finalizada
        supabase
          .from('aulas')
          .select('id, data, hora_inicio, aula_tecnicas(reforco, tipo, tecnicas(nome, categorias_tecnicas(nome)))')
          .eq('turma_id', turma.id)
          .eq('status', 'finalizada')
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Próximas 3 aulas agendadas
        supabase
          .from('aulas')
          .select('id, data, hora_inicio, aula_tecnicas(tipo, tecnicas(nome))')
          .eq('turma_id', turma.id)
          .eq('status', 'agendada')
          .gte('data', new Date().toISOString().split('T')[0])
          .order('data')
          .limit(3),
      ])

      return {
        turma,
        ultimaAula: ultimaAulaRes.data,
        proximasAulas: proximasRes.data ?? [],
      }
    })
  )

  return <PlanejamentoView dadosPorTurma={dadosPorTurma} />
}
```

### Componente `PlanejamentoView`

Um card por turma. Layout:

```
┌─────────────────────────────────────────────────┐
│  TURMA DA NOITE · seg/qua/sex 19h               │
│                                                  │
│  ÚLTIMA AULA — seg, 07 jul                       │
│  ✓ Arm Trap  ✓ Body Triangle  ↺ Bow and Arrow   │
│                                                  │
│  PRÓXIMAS AULAS                                  │
│  [Qua 09] Sem plano ⚠  → [Planejar]             │
│  [Sex 11] Sem plano    → [Planejar]              │
│                                                  │
│  [+ Gerar aulas da semana]                       │
└─────────────────────────────────────────────────┘
```

```tsx
// src/app/(app)/planejamento/planejamento-view.tsx
// (pode ser Server Component ou passar dados para Client se necessário)

type TurmaDados = {
  turma: { id: string; nome: string; dias_semana: string[] | null; hora_inicio: string | null }
  ultimaAula: AulaComTecnicas | null
  proximasAulas: AulaAgendada[]
}

export default function PlanejamentoView({ dadosPorTurma }: { dadosPorTurma: TurmaDados[] }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Planejamento
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
          O que cada turma está precisando
        </p>
      </header>

      <main className="px-5 pt-5 pb-24 space-y-4">
        {dadosPorTurma.map(({ turma, ultimaAula, proximasAulas }) => {
          const tecnicas = (ultimaAula?.aula_tecnicas ?? []) as AulaTecnica[]
          const ensinadas = tecnicas.filter(t => t.tipo === 'ensinada')
          const reforcos = ensinadas.filter(t => t.reforco)
          const semPlano = proximasAulas.filter(a => !a.aula_tecnicas?.some(t => t.tipo === 'planejada'))

          return (
            <div key={turma.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

              {/* Header da turma */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                <p className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
                  {turma.nome}
                </p>
                {(turma.dias_semana?.length || turma.hora_inicio) && (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                    {turma.dias_semana?.join(' / ')} · {turma.hora_inicio?.substring(0,5)}
                  </p>
                )}
              </div>

              {/* Última aula */}
              {ultimaAula ? (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <p className="text-[9px] uppercase tracking-widest mb-2"
                    style={{ color: 'var(--brand-texto-muted)' }}>
                    Última aula — {formatarDataCurta(ultimaAula.data)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ensinadas.map(t => (
                      <span key={t.tecnicas?.nome}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{
                          background: t.reforco ? 'rgba(251,146,60,0.1)' : 'rgba(74,222,128,0.08)',
                          border: `1px solid ${t.reforco ? 'rgba(251,146,60,0.25)' : 'rgba(74,222,128,0.2)'}`,
                          color: t.reforco ? '#FB923C' : '#4ADE80',
                        }}>
                        {t.reforco ? '↺' : '✓'} {t.tecnicas?.nome}
                      </span>
                    ))}
                    {ensinadas.length === 0 && (
                      <span className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                        Nenhuma técnica registrada
                      </span>
                    )}
                  </div>
                  {reforcos.length > 0 && (
                    <p className="text-[9px] mt-2" style={{ color: '#FB923C' }}>
                      {reforcos.length} técnica{reforcos.length > 1 ? 's' : ''} para reforçar já {reforcos.length > 1 ? 'estão' : 'está'} no plano da próxima aula
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                    Nenhuma aula registrada ainda para esta turma
                  </p>
                </div>
              )}

              {/* Próximas aulas */}
              <div className="px-4 py-3">
                <p className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: 'var(--brand-texto-muted)' }}>
                  Próximas aulas
                </p>
                {proximasAulas.length === 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                      Nenhuma aula agendada
                    </p>
                    <Link href={`/turmas/${turma.id}`}
                      className="text-[10px] font-bold"
                      style={{ color: 'var(--brand-gold)' }}>
                      Gerar aulas →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proximasAulas.map(aula => {
                      const temPlano = aula.aula_tecnicas?.some(t => t.tipo === 'planejada')
                      const qtdPlano = aula.aula_tecnicas?.filter(t => t.tipo === 'planejada').length ?? 0
                      return (
                        <div key={aula.id}
                          className="flex items-center justify-between py-1">
                          <div>
                            <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
                              {formatarDiaMes(aula.data)}
                              {aula.hora_inicio && ` · ${aula.hora_inicio.substring(0,5)}`}
                            </p>
                            {temPlano ? (
                              <p className="text-[9px]" style={{ color: '#4ADE80' }}>
                                {qtdPlano} técnica{qtdPlano > 1 ? 's' : ''} planejada{qtdPlano > 1 ? 's' : ''}
                              </p>
                            ) : (
                              <p className="text-[9px]" style={{ color: '#FB923C' }}>
                                ⚠ Sem planejamento
                              </p>
                            )}
                          </div>
                          <Link href={`/aulas/${aula.id}`}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{
                              background: temPlano ? 'transparent' : 'var(--brand-gold)',
                              color: temPlano ? 'var(--brand-gold)' : '#000',
                              border: temPlano ? '1px solid var(--brand-gold-border)' : 'none',
                            }}>
                            {temPlano ? 'Ver plano' : 'Planejar'}
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
```

### Helpers

```ts
function formatarDataCurta(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
}

function formatarDiaMes(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
}
```

### Arquivos em B-060

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/planejamento/page.tsx` | NOVA ROTA |
| `src/app/(app)/planejamento/planejamento-view.tsx` | NOVO componente (pode ser Server Component) |

**Sem migration.** Todos os dados já existem no schema.

---

## B-061 · `/historico` redesign — retrospecto por turma

### O que muda

Atualmente `/aulas/page.tsx` é uma lista cronológica flat com filtro de turma + mês. Não mostra as técnicas. Não agrupa por contexto.

O redesign mantém a URL `/aulas` (já está no nav como "Histórico") mas muda o conteúdo para um retrospecto por turma.

### Nova estrutura da página

**Duas abas (via `searchParams.aba`):**
- `?aba=conteudo` (default) — o que foi ensinado, por turma, agrupado por mês
- `?aba=frequencia` — quem compareceu, por turma, com stats

```tsx
// Linha de abas (URL-based, sem client state)
<div className="flex gap-2 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
  <Link href="/aulas?aba=conteudo"
    className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider`}
    style={{
      background: aba === 'frequencia' ? 'transparent' : 'var(--brand-gold)',
      color: aba === 'frequencia' ? 'var(--brand-texto-muted)' : '#000',
    }}>
    Conteúdo
  </Link>
  <Link href="/aulas?aba=frequencia"
    className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider`}
    style={{
      background: aba === 'frequencia' ? 'var(--brand-gold)' : 'transparent',
      color: aba === 'frequencia' ? '#000' : 'var(--brand-texto-muted)',
    }}>
    Frequência
  </Link>
</div>
```

### Aba "Conteúdo"

Filtro de turma no topo (select, URL-based `?turma=`).

Aulas agrupadas por mês, cada card mostra:
- Turma + data + horário
- Técnicas ensinadas como chips (dourado) + marcadas para reforço (laranja)
- Status (Finalizada / AO VIVO / Pendente)

```tsx
// Query — agora inclui aula_tecnicas
const { data: aulasRaw } = await supabase
  .from('aulas')
  .select(`
    id, data, hora_inicio, status,
    turmas(id, nome),
    aula_tecnicas(tipo, reforco, tecnicas(nome))
  `)
  .eq('academia_id', professor.academia_id)
  .in('status', ['finalizada', 'aberta'])  // só aulas que aconteceram
  .order('data', { ascending: false })
  .limit(60)  // 60 = ~20 aulas/mês × 3 meses
  ... (filtros de turma se selecionada)

// Agrupar por mês
type MesGroup = { label: string; aulas: AulaRow[] }
const grupos = aulas.reduce<MesGroup[]>((acc, aula) => {
  const mesLabel = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric',
  })
  const grupo = acc.find(g => g.label === mesLabel)
  if (grupo) grupo.aulas.push(aula)
  else acc.push({ label: mesLabel, aulas: [aula] })
  return acc
}, [])
```

**Render por grupo:**

```tsx
{grupos.map(grupo => (
  <div key={grupo.label}>
    <p className="text-[9px] uppercase tracking-widest px-5 py-2 capitalize"
      style={{ color: 'var(--brand-gold)' }}>
      {grupo.label}
    </p>
    <div className="px-5 space-y-2">
      {grupo.aulas.map(aula => {
        const ensinadas = aula.aula_tecnicas?.filter(t => t.tipo === 'ensinada') ?? []
        const reforcos = ensinadas.filter(t => t.reforco)

        return (
          <Link key={aula.id} href={`/aulas/${aula.id}`}
            className="block px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
                  {aula.turmas?.nome ?? 'Aula Avulsa'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                  {formatarDataCurta(aula.data)}
                  {aula.hora_inicio && ` · ${aula.hora_inicio.substring(0,5)}`}
                </p>
              </div>
              {aula.status === 'finalizada' && ensinadas.length > 0 && (
                <span className="text-[10px]" style={{ color: '#4ADE80' }}>
                  {ensinadas.length} téc.
                </span>
              )}
            </div>

            {ensinadas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ensinadas.slice(0, 5).map(t => (
                  <span key={t.tecnicas?.nome}
                    className="px-2 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      background: t.reforco ? 'rgba(251,146,60,0.1)' : 'var(--brand-gold-dim)',
                      border: `1px solid ${t.reforco ? 'rgba(251,146,60,0.25)' : 'var(--brand-gold-border)'}`,
                      color: t.reforco ? '#FB923C' : 'var(--brand-gold)',
                    }}>
                    {t.reforco && '↺ '}{t.tecnicas?.nome}
                  </span>
                ))}
                {ensinadas.length > 5 && (
                  <span className="px-2 py-0.5 rounded text-[9px]"
                    style={{ color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }}>
                    +{ensinadas.length - 5}
                  </span>
                )}
              </div>
            )}

            {ensinadas.length === 0 && aula.status === 'finalizada' && (
              <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                Nenhuma técnica registrada
              </p>
            )}
          </Link>
        )
      })}
    </div>
  </div>
))}
```

### Aba "Frequência"

Stats de presença. Já existe em `/relatorios` (B-039), mas aqui fica mais acessível.

Para não duplicar a query, mostrar stats simples:
- Total de aulas no período (filter por turma + últimos 3 meses)
- Média de presentes por aula
- Alunos com maior frequência (top 5)

```ts
// Para a aba frequência, query separada:
const { data: statsFreq } = await supabase.rpc('frequencia_resumo', {
  p_academia_id: professor.academia_id,
  p_turma_id: turmaFiltro || null,
  p_dias: 90,
})
```

RPC `frequencia_resumo` — simples, já temos dados similares em outras partes:

```sql
CREATE OR REPLACE FUNCTION frequencia_resumo(
  p_academia_id UUID,
  p_turma_id UUID DEFAULT NULL,
  p_dias INT DEFAULT 90
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_prof_academia UUID;
BEGIN
  SELECT academia_id INTO v_prof_academia FROM professores WHERE user_id = auth.uid();
  IF v_prof_academia IS DISTINCT FROM p_academia_id THEN RETURN NULL; END IF;

  RETURN json_build_object(
    'total_aulas', (
      SELECT COUNT(*) FROM aulas a
      WHERE a.academia_id = p_academia_id AND a.status = 'finalizada'
        AND a.data >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
        AND (p_turma_id IS NULL OR a.turma_id = p_turma_id)
    ),
    'media_presentes', (
      SELECT ROUND(AVG(contagem), 1)
      FROM (
        SELECT COUNT(p.id) AS contagem
        FROM aulas a
        LEFT JOIN presencas p ON p.aula_id = a.id
        WHERE a.academia_id = p_academia_id AND a.status = 'finalizada'
          AND a.data >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
          AND (p_turma_id IS NULL OR a.turma_id = p_turma_id)
        GROUP BY a.id
      ) sub
    ),
    'top_alunos', (
      SELECT json_agg(sub ORDER BY sub.total DESC)
      FROM (
        SELECT al.nome, COUNT(p.id) AS total
        FROM presencas p
        JOIN alunos al ON al.id = p.aluno_id
        JOIN aulas a ON a.id = p.aula_id
        WHERE a.academia_id = p_academia_id
          AND a.data >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
          AND (p_turma_id IS NULL OR a.turma_id = p_turma_id)
        GROUP BY al.id, al.nome
        ORDER BY total DESC
        LIMIT 5
      ) sub
    )
  );
END;
$$;
```

**Render da aba frequência:**

```tsx
{aba === 'frequencia' && stats && (
  <div className="px-5 pt-4 space-y-4">
    {/* Stats strip */}
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 rounded-xl" style={{ background:'var(--brand-surf)', border:'1px solid var(--brand-border)' }}>
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color:'var(--brand-texto-muted)' }}>Aulas (90d)</p>
        <p className="text-2xl font-bold" style={{ color:'var(--brand-texto)' }}>{stats.total_aulas}</p>
      </div>
      <div className="p-3 rounded-xl" style={{ background:'var(--brand-surf)', border:'1px solid var(--brand-border)' }}>
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color:'var(--brand-texto-muted)' }}>Média/aula</p>
        <p className="text-2xl font-bold" style={{ color:'var(--brand-texto)' }}>{stats.media_presentes ?? '—'}</p>
      </div>
    </div>

    {/* Ranking de presença */}
    <div>
      <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color:'var(--brand-texto-muted)' }}>
        Mais assíduos — últimos 90 dias
      </p>
      {(stats.top_alunos ?? []).map((aluno: { nome: string; total: number }, i: number) => (
        <div key={aluno.nome} className="flex items-center justify-between py-2.5"
          style={{ borderBottom: '1px solid var(--brand-border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold w-4 text-center"
              style={{ color: i === 0 ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
              {i + 1}
            </span>
            <p className="text-sm" style={{ color:'var(--brand-texto)' }}>{aluno.nome}</p>
          </div>
          <p className="text-xs font-bold" style={{ color:'var(--brand-texto-muted)' }}>
            {aluno.total} aulas
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

### Arquivos em B-061

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/aulas/page.tsx` | Redesign completo — abas Conteúdo/Frequência, grupos por mês, técnicas nos cards |
| `supabase/migrations/XXXX_frequencia_resumo.sql` | NOVA RPC `frequencia_resumo()` |

---

## Ordem de implementação

```
B-059 primeiro — 1 arquivo, 2 linhas, zero risco
B-060 segundo — nova rota, sem migration, todos os dados existem
B-061 por último — redesign de página existente + 1 migration simples
```

---

## Resumo de migrations

| Migration | Conteúdo |
|---|---|
| `XXXX_frequencia_resumo.sql` | RPC `frequencia_resumo(p_academia_id, p_turma_id, p_dias)` |

Apenas 1 migration nova. Nenhuma alteração destrutiva de schema.

---

## Critérios de aceite

**B-059 — Nav:**
- [ ] 4º item do nav é "Planejamento" com `CalendarCheck2` icon
- [ ] "Perfil" removido do nav
- [ ] No dashboard, o bloco avatar+nome do professor é um Link para `/perfil`
- [ ] `AvatarUpload` aceita prop `readOnly` — quando true, sem `<label>` e sem camera overlay
- [ ] Nav ativo detecta `/planejamento` e sub-rotas corretamente

**B-060 — /planejamento:**
- [ ] Uma seção por turma ativa
- [ ] "Última aula": data + chips de técnicas (verde = ensinada, laranja = reforço)
- [ ] Se turma sem aula: "Nenhuma aula registrada ainda"
- [ ] "Próximas aulas": cada aula com data/hora + status de planejamento + botão Planejar/Ver plano
- [ ] Aula sem planejamento: badge laranja ⚠ + botão "Planejar" dourado
- [ ] Aula com planejamento: "X técnicas planejadas" + botão "Ver plano" outline
- [ ] Sem próximas aulas: link "Gerar aulas →" aponta para `/turmas/[id]`
- [ ] Academia sem turmas ativas: empty state com link "+ Nova turma"

**B-061 — /historico:**
- [ ] Duas abas: Conteúdo (default) e Frequência
- [ ] Aba Conteúdo: aulas finalizadas agrupadas por mês, com chips de técnicas
- [ ] Técnicas de reforço em laranja, técnicas normais em dourado
- [ ] Filtro de turma (URL-based `?turma=`) funciona nas duas abas
- [ ] Mais de 5 técnicas: mostra 5 + "+N"
- [ ] Aba Frequência: total aulas (90d), média/aula, top 5 alunos
- [ ] Empty state quando não há aulas no período

---

**feito com 🥋 por Vitim e Claude**
