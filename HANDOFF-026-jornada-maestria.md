# HANDOFF-026 — Jornada à Maestria

**Data:** 2026-07-22  
**Branch:** `feat/sprint29-jornada-maestria`  
**Base:** `main`  
**Épico:** EP-31 — Jornada à Maestria  
**Cards:** B-103 · B-104 · B-105

> Inspirado no MatTime: transformar dados que já existem em combustível motivacional. O aluno já treina — agora ele precisa ver o quanto treinou, onde está no ranking da academia e quais conquistas acumulou ao longo da jornada.

---

## Contexto

Quase todos os dados necessários já existem. A única adição é `duracao_minutos` na tabela `turmas` — o professor configura uma vez por turma e o cálculo de horas passa a usar a duração real de cada aula.

| Feature | Dados necessários | Já existe? |
|---|---|---|
| Horas no Tatame | presencas + turmas.duracao_minutos | ⚠️ nova coluna em `turmas` |
| Leaderboard Mensal | presencas, alunos, academia_id | ✅ |
| Badges de Milestones | presencas (count), matriculado_em, faixa | ✅ |

---

## B-103 — Horas no Tatame

### Conceito

Cada presença = 1 aula = duração configurada na turma. **Padrão: 60 minutos (1h)**. O professor pode ajustar para 90min ou 120min por turma — uma vez só, vale para todas as aulas daquela turma. O cálculo soma a duração real de cada aula frequentada:

`horas = SUM(turma.duracao_minutos / 60.0) para cada presença`

Mostramos no perfil do aluno: número grande + barra de progresso rumo ao próximo marco.

**Marcos:** 50h · 100h · 250h · 500h · 1.000h · 2.500h · 5.000h · 10.000h

### 1. Migration — nova coluna em `turmas`

Adicionar ao arquivo: `supabase/migrations/20260722000005_rpcs_maestria.sql`

```sql
-- Duração padrão da aula por turma (1h, 1.5h ou 2h)
ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS duracao_minutos SMALLINT NOT NULL DEFAULT 60;

ALTER TABLE turmas
  DROP CONSTRAINT IF EXISTS turmas_duracao_valida;

ALTER TABLE turmas
  ADD CONSTRAINT turmas_duracao_valida
  CHECK (duracao_minutos IN (60, 90, 120));
```

### 2. RPC SQL

```sql
-- Horas reais no tatame — usa a duração configurada em cada turma
CREATE OR REPLACE FUNCTION horas_no_tatame(p_aluno_id UUID)
RETURNS NUMERIC
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ROUND(
    COALESCE(SUM(COALESCE(t.duracao_minutos, 60) / 60.0), 0),
    1
  )
  FROM presencas p
  JOIN aulas a ON a.id = p.aula_id
  JOIN turmas t ON t.id = a.turma_id
  WHERE p.aluno_id = p_aluno_id
$$;
```

### 3. UI do Professor — editar duração da turma

Em `src/app/(app)/turmas/[id]/page.tsx` (ou o componente de edição da turma), adicionar campo de duração na seção de configurações da turma:

```tsx
{/* Duração da aula — 3 opções */}
<div className="space-y-2">
  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
    Duração da aula
  </p>
  <div className="grid grid-cols-3 gap-2">
    {([60, 90, 120] as const).map(min => (
      <button
        key={min}
        type="button"
        onClick={() => setDuracaoMinutos(min)}
        className="py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{
          background: duracaoMinutos === min ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
          border: `1px solid ${duracaoMinutos === min ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
          color: duracaoMinutos === min ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
        }}>
        {min === 60 ? '1h' : min === 90 ? '1h30' : '2h'}
      </button>
    ))}
  </div>
  <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
    Usado para calcular as horas totais dos alunos no tatame.
  </p>
</div>
```

Na server action de salvar turma, incluir `duracao_minutos` no update:

```typescript
await supabase
  .from('turmas')
  .update({ /* ...outros campos... */ duracao_minutos: duracaoMinutos })
  .eq('id', turmaId)
```

### 2. Componente: `src/components/aluno/horas-tatame.tsx`

```tsx
'use client'

const MARCOS = [50, 100, 250, 500, 1000, 2500, 5000, 10000]

function proximoMarco(horas: number): { meta: number; anterior: number } {
  const meta = MARCOS.find(m => m > horas) ?? 10000
  const idx = MARCOS.indexOf(meta)
  const anterior = idx > 0 ? MARCOS[idx - 1] : 0
  return { meta, anterior }
}

function formatarHoras(h: number): string {
  if (h >= 1000) return `${(h / 1000).toFixed(1).replace('.', ',')}k`
  return h.toFixed(1).replace('.', ',')
}

export function HorasNoTatame({ horas, totalPresencas }: { horas: number; totalPresencas: number }) {
  const { meta, anterior } = proximoMarco(horas)
  const progresso = Math.min(((horas - anterior) / (meta - anterior)) * 100, 100)
  const horasRestantes = Math.max(meta - horas, 0)
  const atingiuMeta = horas >= 10000

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

      {/* Header */}
      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Horas no Tatame
      </p>

      {/* Número principal */}
      <div className="flex items-end gap-3">
        <span className="text-5xl font-black tracking-tight leading-none"
          style={{ color: 'var(--brand-gold)' }}>
          {formatarHoras(horas)}
        </span>
        <div className="pb-1.5">
          <span className="text-lg font-bold" style={{ color: 'var(--brand-texto)' }}>h</span>
          <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
            {totalPresencas} {totalPresencas === 1 ? 'treino' : 'treinos'}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      {!atingiuMeta && (
        <div className="space-y-2">
          <div className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--brand-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progresso}%`,
                background: 'linear-gradient(90deg, var(--brand-gold) 0%, #E8C98E 100%)',
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
              Próximo marco: <span style={{ color: 'var(--brand-gold)' }}>{meta.toLocaleString('pt-BR')}h</span>
            </p>
            <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
              Faltam {horasRestantes.toFixed(1).replace('.', ',')}h
            </p>
          </div>
        </div>
      )}

      {/* Marco atingido */}
      {atingiuMeta && (
        <div className="text-center py-2">
          <p className="text-2xl mb-1">🏆</p>
          <p className="text-sm font-bold" style={{ color: 'var(--brand-gold)' }}>
            10.000 horas alcançadas. Mestre.
          </p>
        </div>
      )}

      {/* Mini marcos */}
      <div className="flex gap-1.5 flex-wrap">
        {MARCOS.map(m => (
          <span key={m}
            className="text-[9px] px-2 py-0.5 rounded-full font-medium transition-all"
            style={{
              background: horas >= m ? 'var(--brand-gold-dim)' : 'transparent',
              border: `1px solid ${horas >= m ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
              color: horas >= m ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
            }}>
            {m >= 1000 ? `${m / 1000}k` : m}h
          </span>
        ))}
      </div>
    </div>
  )
}
```

### 3. Integração em `/aluno/perfil/page.tsx`

Adicionar ao `Promise.all` existente:

```typescript
const [/* ...dados existentes... */, horasData] = await Promise.all([
  // ...queries existentes...
  supabase.rpc('horas_no_tatame', { p_aluno_id: aluno.id }),
])

const horas = (horasData.data as number) ?? 0
const totalPresencas = /* já existe na página como contagem de presencas */
```

Inserir `<HorasNoTatame>` no JSX, logo abaixo da seção de faixa/BeltBar e acima das anotações/link de graduação:

```tsx
import { HorasNoTatame } from '@/components/aluno/horas-tatame'

// No JSX:
<HorasNoTatame horas={horas} totalPresencas={totalPresencas} />
```

---

## B-104 — Leaderboard Mensal

### Conceito

O aluno vê quem treinou mais na academia este mês. Simples, anônimo por opção mas com nomes — dentro da mesma academia todos se conhecem. A posição do aluno fica destacada em dourado.

### 1. RPC SQL

No mesmo arquivo `20260722000005_rpcs_maestria.sql`:

```sql
-- Ranking mensal de frequência da academia
CREATE OR REPLACE FUNCTION ranking_frequencia_mensal(
  p_academia_id UUID,
  p_ano INT,
  p_mes INT
)
RETURNS TABLE (
  aluno_id UUID,
  aluno_nome TEXT,
  foto_url TEXT,
  presencas_mes BIGINT,
  posicao BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    al.id                     AS aluno_id,
    al.nome                   AS aluno_nome,
    al.foto_url               AS foto_url,
    COUNT(p.id)               AS presencas_mes,
    RANK() OVER (ORDER BY COUNT(p.id) DESC) AS posicao
  FROM alunos al
  INNER JOIN presencas p ON p.aluno_id = al.id
  INNER JOIN aulas a ON a.id = p.aula_id
    AND EXTRACT(YEAR FROM a.data) = p_ano
    AND EXTRACT(MONTH FROM a.data) = p_mes
    AND a.academia_id = p_academia_id
  WHERE al.academia_id = p_academia_id
    AND al.ativo = TRUE
  GROUP BY al.id, al.nome, al.foto_url
  ORDER BY presencas_mes DESC, al.nome ASC
$$;
```

### 2. Componente: `src/components/aluno/leaderboard-mensal.tsx`

```tsx
import Image from 'next/image'

type EntradaRanking = {
  aluno_id: string
  aluno_nome: string
  foto_url: string | null
  presencas_mes: number
  posicao: number
}

const POSICAO_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function Avatar({ nome, foto, size = 32 }: { nome: string; foto: string | null; size?: number }) {
  if (foto) return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={foto} alt={nome}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  )
  return (
    <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'var(--brand-gold-dim)',
        color: 'var(--brand-gold)',
        fontSize: size * 0.38,
        border: '1px solid var(--brand-gold-border)',
      }}>
      {nome.charAt(0)}
    </div>
  )
}

export function LeaderboardMensal({
  ranking,
  meuAlunoId,
  mesLabel,
}: {
  ranking: EntradaRanking[]
  meuAlunoId: string
  mesLabel: string
}) {
  if (ranking.length === 0) return null

  const minhaPosicao = ranking.find(r => r.aluno_id === meuAlunoId)
  // Mostrar: top 10 + minha linha se estiver fora do top 10
  const top10 = ranking.slice(0, 10)
  const euEstouForaDoTop10 = minhaPosicao && (minhaPosicao.posicao ?? 0) > 10
  const listaFinal = euEstouForaDoTop10
    ? [...top10, minhaPosicao!]
    : top10

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          🏅 Ranking de {mesLabel}
        </p>
        {minhaPosicao && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
            {minhaPosicao.posicao}º lugar
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--brand-border)' }}>
        {listaFinal.map((entrada, idx) => {
          const euSou = entrada.aluno_id === meuAlunoId
          const separador = euEstouForaDoTop10 && idx === 10

          return (
            <div key={entrada.aluno_id}>
              {/* Separador visual quando aluno está fora do top 10 */}
              {separador && (
                <div className="px-4 py-1 flex items-center gap-2">
                  <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
                  <span className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>···</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
                </div>
              )}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  background: euSou ? 'var(--brand-gold-dim)' : idx % 2 === 0 ? 'var(--brand-surf)' : 'transparent',
                  borderTop: idx > 0 && !separador ? '1px solid var(--brand-border)' : 'none',
                }}>
                {/* Posição */}
                <div className="w-6 text-center flex-shrink-0">
                  {POSICAO_EMOJI[entrada.posicao] ? (
                    <span className="text-base">{POSICAO_EMOJI[entrada.posicao]}</span>
                  ) : (
                    <span className="text-xs font-bold"
                      style={{ color: euSou ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                      {entrada.posicao}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar nome={entrada.aluno_nome} foto={entrada.foto_url} size={30} />

                {/* Nome */}
                <p className="flex-1 text-sm font-medium truncate"
                  style={{ color: euSou ? 'var(--brand-gold)' : 'var(--brand-texto)' }}>
                  {entrada.aluno_nome.split(' ')[0]}
                  {euSou && <span className="ml-1 text-[9px]">(você)</span>}
                </p>

                {/* Treinos */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold"
                    style={{ color: euSou ? 'var(--brand-gold)' : 'var(--brand-texto)' }}>
                    {entrada.presencas_mes}
                  </p>
                  <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
                    {entrada.presencas_mes === 1 ? 'treino' : 'treinos'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 3. Integração em `/aluno/historico/page.tsx`

No `Promise.all` do page:

```typescript
const hoje = new Date()
const { data: rankingData } = await supabase.rpc('ranking_frequencia_mensal', {
  p_academia_id: aluno.academia_id,
  p_ano: hoje.getFullYear(),
  p_mes: hoje.getMonth() + 1,
})

const mesLabel = hoje.toLocaleDateString('pt-BR', { month: 'long' })
```

No JSX, inserir **antes** da lista de aulas e **após** os stats de frequência:

```tsx
import { LeaderboardMensal } from '@/components/aluno/leaderboard-mensal'

// No JSX:
<LeaderboardMensal
  ranking={rankingData ?? []}
  meuAlunoId={aluno.id}
  mesLabel={mesLabel}
/>
```

---

## B-105 — Badges de Milestones

### Conceito

Conquistas permanentes calculadas a partir dos dados existentes — sem nova tabela. Badges bloqueados ficam visíveis em cinza (motivação para continuar treinando).

### 1. Definições: `src/lib/conquistas.ts`

```typescript
export type DadosConquistas = {
  totalPresencas: number
  anosNaAcademia: number
  faixa: string
  maxTreinosMes: number // máximo de treinos em qualquer mês
}

export type Conquista = {
  id: string
  emoji: string
  nome: string
  descricao: string
  desbloqueada: (dados: DadosConquistas) => boolean
}

const FAIXAS_ORDEM = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta']

function faixaAtingiuOuUltrapassou(faixaAtual: string, faixaAlvo: string): boolean {
  return FAIXAS_ORDEM.indexOf(faixaAtual) >= FAIXAS_ORDEM.indexOf(faixaAlvo)
}

export const CONQUISTAS: Conquista[] = [
  {
    id: 'primeiro_treino',
    emoji: '🥋',
    nome: 'Primeiro Treino',
    descricao: 'Pisou no tatame pela primeira vez.',
    desbloqueada: d => d.totalPresencas >= 1,
  },
  {
    id: 'dez_treinos',
    emoji: '🔟',
    nome: 'Dez Treinos',
    descricao: 'Os primeiros dez. A jornada começou de verdade.',
    desbloqueada: d => d.totalPresencas >= 10,
  },
  {
    id: 'cinquenta_treinos',
    emoji: '💪',
    nome: '50 Treinos',
    descricao: 'Meio century. Comprometimento real.',
    desbloqueada: d => d.totalPresencas >= 50,
  },
  {
    id: 'cem_treinos',
    emoji: '💯',
    nome: '100 Treinos',
    descricao: 'Centena completa. Guerreiro.',
    desbloqueada: d => d.totalPresencas >= 100,
  },
  {
    id: 'duzentos_treinos',
    emoji: '🔥',
    nome: '200 Treinos',
    descricao: 'Duzentos treinos. O tatame é sua segunda casa.',
    desbloqueada: d => d.totalPresencas >= 200,
  },
  {
    id: 'quinhentos_treinos',
    emoji: '⚔️',
    nome: '500 Treinos',
    descricao: '500 treinos. Lenda da academia.',
    desbloqueada: d => d.totalPresencas >= 500,
  },
  {
    id: 'mil_treinos',
    emoji: '👑',
    nome: '1000 Treinos',
    descricao: 'Mil treinos. Você é diferente.',
    desbloqueada: d => d.totalPresencas >= 1000,
  },
  {
    id: 'um_ano',
    emoji: '⭐',
    nome: '1 Ano no Tatame',
    descricao: 'Um ano completo treinando. Consistência é tudo.',
    desbloqueada: d => d.anosNaAcademia >= 1,
  },
  {
    id: 'dois_anos',
    emoji: '🌟',
    nome: '2 Anos no Tatame',
    descricao: 'Dois anos. A faixa vem com o tempo e o treino.',
    desbloqueada: d => d.anosNaAcademia >= 2,
  },
  {
    id: 'cinco_anos',
    emoji: '🏛️',
    nome: '5 Anos no Tatame',
    descricao: 'Cinco anos de dedicação. Respeito.',
    desbloqueada: d => d.anosNaAcademia >= 5,
  },
  {
    id: 'faixa_azul',
    emoji: '🟦',
    nome: 'Faixa Azul',
    descricao: 'Primeira grande graduação da jornada.',
    desbloqueada: d => faixaAtingiuOuUltrapassou(d.faixa, 'azul'),
  },
  {
    id: 'faixa_roxa',
    emoji: '🟪',
    nome: 'Faixa Roxa',
    descricao: 'A faixa mais rara. Poucos chegam aqui.',
    desbloqueada: d => faixaAtingiuOuUltrapassou(d.faixa, 'roxa'),
  },
  {
    id: 'faixa_marrom',
    emoji: '🟫',
    nome: 'Faixa Marrom',
    descricao: 'A pré-faixa preta. A visão está clara.',
    desbloqueada: d => faixaAtingiuOuUltrapassou(d.faixa, 'marrom'),
  },
  {
    id: 'faixa_preta',
    emoji: '⬛',
    nome: 'Faixa Preta',
    descricao: 'O topo da montanha. E o começo de uma nova jornada.',
    desbloqueada: d => d.faixa === 'preta',
  },
  {
    id: 'mes_consistente',
    emoji: '📅',
    nome: 'Mês Consistente',
    descricao: '12 ou mais treinos em um único mês.',
    desbloqueada: d => d.maxTreinosMes >= 12,
  },
  {
    id: 'mes_perfeito',
    emoji: '🌕',
    nome: 'Mês Perfeito',
    descricao: '20 treinos em um mês. Absurdo.',
    desbloqueada: d => d.maxTreinosMes >= 20,
  },
]

export function computarConquistas(dados: DadosConquistas) {
  return CONQUISTAS.map(c => ({
    ...c,
    desbloqueada: c.desbloqueada(dados),
  }))
}
```

### 2. RPC para dados de conquistas

No mesmo arquivo `20260722000005_rpcs_maestria.sql`:

```sql
-- Dados para computar conquistas do aluno
CREATE OR REPLACE FUNCTION dados_conquistas_aluno(p_aluno_id UUID)
RETURNS TABLE (
  total_presencas BIGINT,
  max_treinos_mes BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COUNT(p.id) AS total_presencas,
    COALESCE(MAX(mes_count), 0) AS max_treinos_mes
  FROM presencas p
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS mes_count
    FROM presencas p2
    JOIN aulas a2 ON a2.id = p2.aula_id
    WHERE p2.aluno_id = p_aluno_id
    GROUP BY EXTRACT(YEAR FROM a2.data), EXTRACT(MONTH FROM a2.data)
  ) sub ON TRUE
  WHERE p.aluno_id = p_aluno_id
$$;
```

### 3. Componente: `src/components/aluno/conquistas.tsx`

```tsx
import { computarConquistas, DadosConquistas } from '@/lib/conquistas'

export function Conquistas({ dados }: { dados: DadosConquistas }) {
  const todas = computarConquistas(dados)
  const desbloqueadas = todas.filter(c => c.desbloqueada)
  const bloqueadas = todas.filter(c => !c.desbloqueada)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          Conquistas
        </p>
        <span className="text-[10px] font-bold"
          style={{ color: 'var(--brand-gold)' }}>
          {desbloqueadas.length}/{todas.length}
        </span>
      </div>

      {/* Desbloqueadas */}
      {desbloqueadas.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {desbloqueadas.map(c => (
            <div key={c.id}
              className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
              style={{
                background: 'var(--brand-gold-dim)',
                border: '1px solid var(--brand-gold-border)',
              }}>
              <span className="text-xl flex-shrink-0">{c.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate"
                  style={{ color: 'var(--brand-texto)' }}>
                  {c.nome}
                </p>
                <p className="text-[9px] leading-tight mt-0.5 line-clamp-2"
                  style={{ color: 'var(--brand-texto-muted)' }}>
                  {c.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bloqueadas */}
      {bloqueadas.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest"
            style={{ color: '#222' }}>
            Bloqueadas · {bloqueadas.length} restantes
          </p>
          <div className="grid grid-cols-2 gap-2">
            {bloqueadas.map(c => (
              <div key={c.id}
                className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--brand-border)',
                  opacity: 0.45,
                }}>
                <span className="text-xl flex-shrink-0 grayscale">{c.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight truncate"
                    style={{ color: 'var(--brand-texto-muted)' }}>
                    {c.nome}
                  </p>
                  <p className="text-[9px] leading-tight mt-0.5 line-clamp-2"
                    style={{ color: '#333' }}>
                    {c.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tudo desbloqueado */}
      {bloqueadas.length === 0 && (
        <div className="text-center py-4">
          <p className="text-2xl mb-1">🏆</p>
          <p className="text-sm font-bold" style={{ color: 'var(--brand-gold)' }}>
            Todas as conquistas desbloqueadas.
          </p>
        </div>
      )}
    </div>
  )
}
```

### 4. Integração em `/aluno/perfil/page.tsx`

```typescript
import { computarConquistas } from '@/lib/conquistas'
import { Conquistas } from '@/components/aluno/conquistas'

// Adicionar ao Promise.all:
const [/* ...anteriores... */, conquistasData] = await Promise.all([
  // ...queries existentes + horas...
  supabase.rpc('dados_conquistas_aluno', { p_aluno_id: aluno.id }),
])

// Calcular anos na academia
const matriculadoEm = aluno.matriculado_em ? new Date(aluno.matriculado_em) : new Date()
const anosNaAcademia = (Date.now() - matriculadoEm.getTime()) / (1000 * 60 * 60 * 24 * 365)

const dadosConquistas = {
  totalPresencas: (conquistasData.data?.[0]?.total_presencas as number) ?? 0,
  maxTreinosMes: (conquistasData.data?.[0]?.max_treinos_mes as number) ?? 0,
  anosNaAcademia,
  faixa: aluno.faixa ?? 'branca',
}

// No JSX — após HorasNoTatame:
<Conquistas dados={dadosConquistas} />
```

---

## Migration completa

Arquivo: `supabase/migrations/20260722000005_rpcs_maestria.sql`

```sql
-- ============================================================
-- Sprint 29 — Jornada à Maestria
-- Nova coluna: turmas.duracao_minutos (1h padrão)
-- RPCs: horas no tatame (real), ranking mensal, dados de conquistas
-- ============================================================

-- B-103: Duração da aula configurável por turma
ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS duracao_minutos SMALLINT NOT NULL DEFAULT 60;

ALTER TABLE turmas
  DROP CONSTRAINT IF EXISTS turmas_duracao_valida;

ALTER TABLE turmas
  ADD CONSTRAINT turmas_duracao_valida
  CHECK (duracao_minutos IN (60, 90, 120));

-- B-103: Horas reais no tatame — usa a duração da turma de cada aula
CREATE OR REPLACE FUNCTION horas_no_tatame(p_aluno_id UUID)
RETURNS NUMERIC
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ROUND(
    COALESCE(SUM(COALESCE(t.duracao_minutos, 60) / 60.0), 0),
    1
  )
  FROM presencas p
  JOIN aulas a ON a.id = p.aula_id
  JOIN turmas t ON t.id = a.turma_id
  WHERE p.aluno_id = p_aluno_id
$$;

-- B-104: Ranking mensal de frequência da academia
CREATE OR REPLACE FUNCTION ranking_frequencia_mensal(
  p_academia_id UUID,
  p_ano INT,
  p_mes INT
)
RETURNS TABLE (
  aluno_id UUID,
  aluno_nome TEXT,
  foto_url TEXT,
  presencas_mes BIGINT,
  posicao BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    al.id,
    al.nome,
    al.foto_url,
    COUNT(p.id) AS presencas_mes,
    RANK() OVER (ORDER BY COUNT(p.id) DESC) AS posicao
  FROM alunos al
  INNER JOIN presencas p ON p.aluno_id = al.id
  INNER JOIN aulas a ON a.id = p.aula_id
    AND EXTRACT(YEAR FROM a.data) = p_ano
    AND EXTRACT(MONTH FROM a.data) = p_mes
    AND a.academia_id = p_academia_id
  WHERE al.academia_id = p_academia_id
    AND al.ativo = TRUE
  GROUP BY al.id, al.nome, al.foto_url
  ORDER BY presencas_mes DESC, al.nome ASC
$$;

-- B-105: Dados agregados para computar conquistas
CREATE OR REPLACE FUNCTION dados_conquistas_aluno(p_aluno_id UUID)
RETURNS TABLE (
  total_presencas BIGINT,
  max_treinos_mes BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH por_mes AS (
    SELECT COUNT(*) AS cnt
    FROM presencas p
    JOIN aulas a ON a.id = p.aula_id
    WHERE p.aluno_id = p_aluno_id
    GROUP BY EXTRACT(YEAR FROM a.data), EXTRACT(MONTH FROM a.data)
  )
  SELECT
    (SELECT COUNT(*) FROM presencas WHERE aluno_id = p_aluno_id) AS total_presencas,
    COALESCE((SELECT MAX(cnt) FROM por_mes), 0) AS max_treinos_mes
$$;
```

---

## Ordem de implementação no mesmo PR

1. Aplicar a migration no SQL Editor do Supabase
2. Criar `src/lib/conquistas.ts`
3. Criar `src/components/aluno/horas-tatame.tsx`
4. Criar `src/components/aluno/conquistas.tsx`
5. Criar `src/components/aluno/leaderboard-mensal.tsx`
6. Atualizar `src/app/(app)/aluno/perfil/page.tsx` (horas + conquistas)
7. Atualizar `src/app/(app)/aluno/historico/page.tsx` (leaderboard)

---

## Resumo dos arquivos

| Arquivo | Card | O que muda |
|---|---|---|
| `supabase/migrations/20260722000005_rpcs_maestria.sql` | B-103/104/105 | **Novo.** `ALTER TABLE turmas ADD duracao_minutos` + 3 RPCs |
| `src/app/(app)/turmas/[id]/page.tsx` (ou action) | B-103 | Adicionar seletor de duração (1h / 1h30 / 2h) nas configs da turma |
| `src/lib/conquistas.ts` | B-105 | **Novo.** 16 badges + lógica de cálculo |
| `src/components/aluno/horas-tatame.tsx` | B-103 | **Novo.** Contador + barra de progresso |
| `src/components/aluno/leaderboard-mensal.tsx` | B-104 | **Novo.** Ranking da academia |
| `src/components/aluno/conquistas.tsx` | B-105 | **Novo.** Grid de badges |
| `src/app/(app)/aluno/perfil/page.tsx` | B-103/105 | Adicionar horas + conquistas abaixo da faixa |
| `src/app/(app)/aluno/historico/page.tsx` | B-104 | Adicionar leaderboard acima da lista de aulas |

---

## Critérios de aceite

**B-103 — Horas no Tatame:**
- [ ] `turmas.duracao_minutos` adicionada com DEFAULT 60 e CHECK IN (60, 90, 120)
- [ ] Professor pode editar duração da turma (1h / 1h30 / 2h) nas configurações da turma
- [ ] Turmas existentes migram automaticamente para 60min (DEFAULT)
- [ ] RPC `horas_no_tatame` soma `SUM(duracao_minutos / 60.0)` via JOIN com turmas
- [ ] Exibe total de horas reais no perfil do aluno (número grande em dourado)
- [ ] Barra de progresso mostra % para o próximo marco
- [ ] "Faltam X,Xh" (não "X treinos" — duração varia por turma)
- [ ] Mini-marcos (50h → 10.000h) ficam dourados quando atingidos
- [ ] Aluno com 0 presenças exibe "0,0h" sem quebrar
- [ ] Aluno com 10.000h+ exibe mensagem especial "Mestre"

**B-104 — Leaderboard Mensal:**
- [ ] Exibe ranking do mês atual em `/aluno/historico`
- [ ] Linha do próprio aluno destacada em dourado
- [ ] Top 3 com emoji de medalha (🥇🥈🥉)
- [ ] Se aluno estiver fora do top 10: exibe top 10 + separador + linha do aluno
- [ ] Se aluno não treinou no mês: seção não exibe (ou exibe mês anterior)
- [ ] Alunos de outras academias nunca aparecem (SECURITY DEFINER garante)

**B-105 — Badges de Milestones:**
- [ ] 16 badges definidos em `conquistas.ts`
- [ ] Desbloqueadas: coloridas com fundo gold-dim
- [ ] Bloqueadas: visíveis mas com opacity 0.45 + grayscale no emoji
- [ ] Contador "X de 16 conquistas" no header da seção
- [ ] Cálculo correto de `anosNaAcademia` a partir de `matriculado_em`
- [ ] Hierarquia de faixas respeitada (roxa inclui azul já conquistada)
