# HANDOFF-018 — Turma como Hub de Dados

**Data:** 2026-07-13  
**Branch:** `feat/sprint22-turma-cockpit`  
**Base:** `main`  
**Épico:** EP-24 — Turma como hub central de dados  
**Cards:** B-077 · B-078

---

## Diagnóstico

**Por que o app parece confuso:**

A página `/turmas/[id]` hoje é um formulário de configuração (editar nome, dias, matricular alunos, gerar aulas). Quando o professor clica numa turma esperando ver dados — o que está acontecendo, quem está sumindo, o que já foi ensinado — encontra um painel de admin.

**O que precisamos:**

Turma = objeto central de análise. Clicar em uma turma deve responder:
- "Como está essa turma?"
- "Quem está faltando?"
- "O que ainda não ensinei?"
- "Qual foi a última aula?"

Configurações (editar, matricular, gerar aulas) ficam disponíveis mas NÃO são a abertura da página.

**Histórico global também sofre:** mostra um card grande por aula com chips de técnicas expandidos. Com 30 aulas, a página vira um mural interminável. Histórico deve ser uma linha do tempo compacta — os detalhes ficam no detalhe de cada aula.

---

## B-077 — Turma: redesign como cockpit com 3 abas

### Nova estrutura da página `/turmas/[id]`

```
┌────────────────────────────────────────────────────┐
│  ←   TURMA DA NOITE                               │
│      Seg/Qua/Sex · 19:30 · 12 alunos              │
├────────────────────────────────────────────────────┤
│  [Dados]  [Alunos]  [Configurações]                │
├────────────────────────────────────────────────────┤
│  ABA DADOS:                                        │
│                                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │  8   │ │ 11   │ │ 73%  │                       │
│  │aulas │ │alunos│ │pres. │                       │
│  │/mês  │ │ativos│ │média │                       │
│  └──────┘ └──────┘ └──────┘                       │
│                                                    │
│  ⏱ HÁ MAIS TEMPO SEM APARECER                     │
│  Chave de Pé · 53d  Raspagem · 41d                │
│                                                    │
│  🔁 MAIS ENSINADAS NO MÊS                         │
│  Kimura ×4  Americana ×3                          │
│                                                    │
│  👻 ALUNOS SUMINDO                                │
│  Carlos · 27 dias  Marina · 19 dias               │
│                                                    │
│  ÚLTIMAS AULAS                                    │
│  sex 11/jul  8🥋  4 téc.  [→]                     │
│  ter 08/jul  6🥋  5 téc.  [→]                     │
│                                                    │
│  [ABRIR NOVA AULA]                                │
└────────────────────────────────────────────────────┘
```

### Mudanças na query — `turmas/[id]/page.tsx`

```ts
const hoje = new Date().toISOString().split('T')[0]
const primeiroDiaMes = new Date(
  new Date().getFullYear(), new Date().getMonth(), 1
).toISOString().split('T')[0]
const ha30Dias = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

const [
  turmaRes,
  matriculadosRes,
  todosAlunosRes,
  aulasRes,
  aulasMesCountRes,
  insightsRes,
] = await Promise.all([
  supabase
    .from('turmas')
    .select('id, nome, dias_semana, horario, ativa, auto_abrir_horas')
    .eq('id', id).single(),

  supabase
    .from('alunos_turmas')
    .select('alunos(id, nome, faixa, foto_url)')
    .eq('turma_id', id).eq('ativo', true),

  supabase
    .from('alunos')
    .select('id, nome, faixa')
    .eq('academia_id', professor.academia_id)
    .eq('ativo', true).order('nome'),

  // Histórico compacto — presencas(id) para contagem, técnicas já via aula_tecnicas abaixo
  supabase
    .from('aulas')
    .select('id, data, status, hora_inicio, presencas(id), aula_tecnicas(tipo)')
    .eq('turma_id', id)
    .in('status', ['finalizada', 'aberta'])
    .order('data', { ascending: false })
    .limit(10),

  // Contagem de aulas finalizadas este mês
  supabase
    .from('aulas')
    .select('id', { count: 'exact', head: true })
    .eq('turma_id', id)
    .eq('status', 'finalizada')
    .gte('data', primeiroDiaMes),

  // Insights (RPC já existente — garantir que migration foi aplicada)
  supabase.rpc('insights_turma', {
    p_turma_id: id,
    p_academia_id: professor.academia_id,
  }),
])
```

Para a aba Alunos (frequência de cada aluno no mês):

```ts
// Pega todos os IDs de aulas finalizadas da turma no último mês
const aulasMesIds = (aulasRes.data ?? [])
  .filter(a => a.status === 'finalizada' && a.data >= ha30Dias)
  .map(a => a.id)

// Presencas por aluno nas aulas do mês
const presencasMes = aulasMesIds.length > 0
  ? await supabase
      .from('presencas')
      .select('aluno_id')
      .in('aula_id', aulasMesIds)
  : { data: [] }

// Map: aluno_id → contagem
const presencasPorAluno = ((presencasMes.data ?? []) as { aluno_id: string }[])
  .reduce<Record<string, number>>((acc, p) => {
    if (p.aluno_id) acc[p.aluno_id] = (acc[p.aluno_id] ?? 0) + 1
    return acc
  }, {})

const totalAulasMes = aulasMesIds.length
```

### Props computados

```ts
const alunosMatriculados = ((matriculadosRes.data ?? [])
  .map(m => m.alunos as unknown as AlunoRow | null)
  .filter(Boolean) as AlunoRow[])
  .sort((a, b) => a.nome.localeCompare(b.nome))

const matriculadosIds = new Set(alunosMatriculados.map(a => a.id))
const disponiveis = (todosAlunosRes.data ?? []).filter(a => !matriculadosIds.has(a.id))

const aulas = (aulasRes.data ?? []) as AulaHist[]
const aulasMes = aulasMesCountRes.count ?? 0
const insights = (insightsRes.data ?? null) as InsightsTurma | null

// Média de presença (últimas 5 aulas finalizadas)
const aulasFinalizadas = aulas.filter(a => a.status === 'finalizada')
const mediaPresenca = aulasFinalizadas.length > 0
  ? Math.round(
      aulasFinalizadas.reduce((s, a) => s + (a.presencas?.length ?? 0), 0) / aulasFinalizadas.length
    )
  : null
```

### Estrutura de abas (URL-based)

Lê `searchParams.aba` — `'dados'` (padrão) | `'alunos'` | `'config'`.

```ts
export default async function TurmaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string }>
}) {
  const { id } = await params
  const { aba: abaParam } = await searchParams
  const aba = ['dados', 'alunos', 'config'].includes(abaParam ?? '')
    ? (abaParam as 'dados' | 'alunos' | 'config')
    : 'dados'
  // ...
}
```

### JSX — estrutura geral

```tsx
<div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>

  {/* Header */}
  <header className="px-5 pt-safe pb-4 flex items-start gap-3"
    style={{ borderBottom: '1px solid var(--brand-border)' }}>
    <BackButton href="/planejamento" />
    <div className="flex-1">
      <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
        {turma.nome}
      </h1>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {/* dias */}
        {/* horario */}
        <span className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
          · {alunosMatriculados.length} alunos
        </span>
      </div>
    </div>
    <Link href={`/aulas/nova?turma_id=${id}`}
      className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex-shrink-0 active:scale-[0.98] transition-transform"
      style={{ background: 'var(--brand-gold)', color: '#000' }}>
      + Aula
    </Link>
  </header>

  {/* Tabs */}
  <div className="flex px-5 pt-3 pb-3 gap-2" style={{ borderBottom: '1px solid var(--brand-border)' }}>
    {([
      { key: 'dados', label: 'Dados' },
      { key: 'alunos', label: 'Alunos' },
      { key: 'config', label: 'Config' },
    ] as const).map(t => (
      <Link key={t.key} href={`/turmas/${id}?aba=${t.key}`}
        className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
        style={aba === t.key
          ? { background: 'var(--brand-gold)', color: '#000' }
          : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
        }>
        {t.label}
      </Link>
    ))}
  </div>

  {/* Conteúdo da aba ativa */}
  <main className="px-5 pt-5 pb-28">

    {/* ─── ABA: DADOS ─────────────────────────────────────────── */}
    {aba === 'dados' && (
      <div className="space-y-5">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { valor: String(aulasMes), label: 'aulas/mês' },
            { valor: String(alunosMatriculados.length), label: 'alunos' },
            { valor: mediaPresenca !== null ? String(mediaPresenca) : '—', label: 'pres. média' },
          ].map(s => (
            <div key={s.label} className="px-3 py-3 rounded-xl text-center"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-xl font-bold" style={{ color: 'var(--brand-gold)' }}>{s.valor}</p>
              <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Insights (reutilizar os mesmos blocos já existentes em /planejamento) */}
        {insights && insights.tecnicas_ausentes.length > 0 && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-texto-muted)' }}>
              ⏱ Há mais tempo sem aparecer
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.tecnicas_ausentes.map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                  {t.nome}
                  <span className="font-normal opacity-70">
                    {t.dias_ausente !== null ? ` · ${t.dias_ausente}d` : ' · nunca'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {insights && insights.tecnicas_recentes.length > 0 && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-texto-muted)' }}>
              🔁 Mais ensinadas este mês
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.tecnicas_recentes.map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)', color: 'var(--brand-gold)' }}>
                  {t.nome} <span className="opacity-70">×{t.vezes}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {insights && insights.alunos_ausentes.length > 0 && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-[9px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--brand-texto-muted)' }}>
              👻 Alunos sumindo
            </p>
            <div className="space-y-2">
              {insights.alunos_ausentes.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{a.nome}</p>
                  <p className="text-xs" style={{ color: '#F87171' }}>
                    {a.dias_ausente !== null ? `${a.dias_ausente}d sem aparecer` : 'nunca veio'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico compacto */}
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
            Últimas aulas
          </p>
          {aulas.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma aula registrada
            </p>
          ) : (
            <div className="space-y-1">
              {aulas.map(a => {
                const dataFmt = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: 'short',
                })
                const presentes = a.presencas?.length ?? 0
                const ensinadas = (a.aula_tecnicas ?? []).filter(t => t.tipo === 'ensinada').length
                return (
                  <Link key={a.id} href={`/aulas/${a.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <p className="text-xs capitalize font-medium" style={{ color: 'var(--brand-texto)' }}>
                      {dataFmt}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                        {presentes} 🥋
                      </span>
                      {ensinadas > 0 && (
                        <span className="text-xs" style={{ color: '#4ADE80' }}>
                          {ensinadas} téc.
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: 'var(--brand-gold)' }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    )}

    {/* ─── ABA: ALUNOS ────────────────────────────────────────── */}
    {aba === 'alunos' && (
      <div className="space-y-2">
        {alunosMatriculados.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--brand-texto-muted)' }}>
            Nenhum aluno matriculado
          </p>
        ) : alunosMatriculados.map(aluno => {
          const presencasMesAluno = presencasPorAluno[aluno.id] ?? 0
          const pct = totalAulasMes > 0
            ? Math.round((presencasMesAluno / totalAulasMes) * 100)
            : null
          return (
            <Link key={aluno.id} href={`/alunos/${aluno.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--brand-texto)' }}>
                  {aluno.nome}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
                  {aluno.faixa}
                </p>
              </div>
              {pct !== null && (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold"
                    style={{ color: pct >= 70 ? '#4ADE80' : pct >= 40 ? '#FBBF24' : '#F87171' }}>
                    {pct}%
                  </p>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                    presença
                  </p>
                </div>
              )}
            </Link>
          )
        })}

        {/* Adicionar/remover alunos — compacto, não é o foco desta aba */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--brand-border)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Gerenciar matrículas
          </p>
          <EnrollmentManager
            turmaId={id}
            matriculados={alunosMatriculados}
            disponiveis={disponiveis}
          />
        </div>
      </div>
    )}

    {/* ─── ABA: CONFIG ────────────────────────────────────────── */}
    {aba === 'config' && (
      <div className="space-y-6">
        <EditarTurmaForm
          turmaId={id}
          nomeAtual={turma.nome}
          diasAtuais={(turma.dias_semana as string[] | null) ?? []}
          horarioAtual={turma.horario as string | null}
          autoAbrirHorasAtual={turma.auto_abrir_horas as number | null}
        />
        <GerarAulasForm
          turma={{ id: turma.id, dias_semana: turma.dias_semana as string[] | null, horario: turma.horario as string | null }}
          academiaId={professor.academia_id}
        />
      </div>
    )}

  </main>

  {/* CTA fixo: Abrir nova aula (só na aba dados) */}
  {aba === 'dados' && (
    <div className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-safe z-50"
      style={{ background: 'var(--brand-fundo)', borderTop: '1px solid var(--brand-border)' }}>
      <Link href={`/aulas/nova?turma_id=${id}`}
        className="block w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest text-center active:scale-[0.98] transition-transform"
        style={{ background: 'var(--brand-gold)', color: '#000' }}>
        ABRIR NOVA AULA
      </Link>
    </div>
  )}

</div>
```

### Atualizar o link de Planejamento → Turma

Em `planejamento/page.tsx`, cada turma card deve linkar para `/turmas/[id]` (não para `/aulas/nova` ou `/aulas/[id]`):

```tsx
// No card de cada turma, clicar no nome vai para o cockpit:
<Link href={`/turmas/${turma.id}`} className="block ...">
  <p className="font-bold ...">{turma.nome}</p>
  <p className="text-xs ...">{/* dias e horário */}</p>
</Link>

// O botão "Planejar" continua apontando para /aulas/nova?turma_id=X
// O botão "Ver plano" continua apontando para /aulas/[id]
```

---

## B-078 — Histórico global: linha do tempo compacta

O `/aulas` não precisa mais mostrar as técnicas no card. Essas informações estão disponíveis no detalhe. A lista deve ser uma **timeline rápida de scan**.

### Mudanças em `aulas/page.tsx` — `ConteudoTab`

**Remover:** `aula_tecnicas` da query e da exibição nos cards da lista.

**Manter:** presencas(id) para mostrar contagem.

```ts
// Trocar:
.select('id, data, hora_inicio, status, turmas(nome), aula_tecnicas(tipo, reforco, tecnicas(nome))')

// Por:
.select('id, data, hora_inicio, status, turmas(nome), presencas(id)')
```

**Novo card compacto (substitui o bloco existente):**

```tsx
{aulas.map(aula => {
  const turma = aula.turmas
  const presentes = (aula.presencas ?? []).length
  return (
    <Link key={aula.id} href={`/aulas/${aula.id}`}
      className="flex items-center gap-4 px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

      {/* Data */}
      <div className="text-center w-8 flex-shrink-0">
        <p className="text-sm font-bold leading-none" style={{ color: 'var(--brand-texto)' }}>
          {new Date(aula.data + 'T12:00:00').getDate().toString().padStart(2, '0')}
        </p>
        <p className="text-[8px] uppercase mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
          {new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
        </p>
      </div>

      {/* Turma + status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
          {turma?.nome ?? 'Aula avulsa'}
        </p>
        <p className="text-[10px] capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
          {aula.hora_inicio ? `${aula.hora_inicio.substring(0, 5)} · ` : ''}
          {aula.status === 'aberta' ? 'ao vivo' : 'finalizada'}
        </p>
      </div>

      {/* Presença */}
      {presentes > 0 && (
        <span className="text-xs font-bold flex-shrink-0"
              style={{ color: 'var(--brand-texto-muted)' }}>
          {presentes} 🥋
        </span>
      )}

      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--brand-gold)' }}>→</span>
    </Link>
  )
})}
```

O resultado: cards menores, mais aulas visíveis na tela, sem o peso visual das técnicas expandidas.

---

## Resumo das mudanças

| Arquivo | Card | O que muda |
|---|---|---|
| `turmas/[id]/page.tsx` | B-077 | Redesign completo com 3 abas: Dados / Alunos / Config. Query adiciona insights_turma RPC + presencas por aluno. Configurações (EditarTurmaForm, GerarAulasForm) movem para aba Config. |
| `planejamento/page.tsx` | B-077 | Nome da turma vira Link para `/turmas/[id]` |
| `aulas/page.tsx` | B-078 | Remove aula_tecnicas da ConteudoTab; card compacto mostra só data + turma + presentes |

---

## Critérios de aceite (Sprint 22)

**Turma cockpit:**
- [ ] Abrir uma turma → ver aba "Dados" por padrão (não formulário de edição)
- [ ] Stats strip mostra aulas/mês, total alunos e média de presença
- [ ] Insights visíveis (⏱ ausentes / 🔁 frequentes / 👻 sumindo) — depende de migration insights_turma aplicada
- [ ] Histórico compacto mostra data + presentes + n° técnicas por linha
- [ ] Botão "ABRIR NOVA AULA" fixo na barra inferior, pré-selecionando a turma
- [ ] Aba Alunos: lista com % de presença no mês (verde ≥70%, amarelo ≥40%, vermelho <40%)
- [ ] Aba Config: formulário de edição + gerar aulas (fora do fluxo principal)
- [ ] Planejamento → clicar no nome da turma → cockpit da turma

**Histórico global:**
- [ ] Cards compactos: data | turma | N🥋 (sem chips de técnicas)
- [ ] Página visivelmente mais rápida de escanear
- [ ] Detalhe completo ainda disponível ao clicar na aula

---

*O professor clica numa turma e em 3 segundos sabe: o tamanho, quem está sumindo, o que não ensinei há mais tempo. Essa é a informação que ele precisa antes de abrir a próxima aula.*
