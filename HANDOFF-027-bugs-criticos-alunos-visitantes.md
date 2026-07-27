# HANDOFF-027 — Bugs Críticos: Visibilidade de Alunos + Múltiplos Visitantes

**Data:** 2026-07-25  
**Branch:** `fix/sprint30-bugs-criticos`  
**Base:** `main`  
**Épico:** EP-32 — Bugs Críticos  
**Cards:** B-106 · B-107 · B-108  
**Prioridade:** 🔴 P0 — bloqueia experiência do aluno e do professor

---

## Diagnóstico dos bugs

### Bug 1 — Aluno não vê colegas na aula

**Causa raiz: RLS na tabela `alunos`.**

A query que busca quem está na aula faz um nested select:

```typescript
supabase
  .from('presencas')
  .select('aluno_id, nome_visitante, alunos(nome, foto_url, faixa, grau)')
  .eq('aula_id', id)
```

O `alunos(nome, foto_url, ...)` é resolvido como um JOIN. A RLS da tabela `alunos` só permite que o aluno veja **sua própria linha** (`user_id = auth.uid()`). O resultado: todos os outros alunos retornam `null` — como se ninguém estivesse na aula.

**Fix:** nova RLS policy que permite ao aluno ver dados básicos de colegas da mesma academia. Os campos sensíveis (`condicoes_saude`, `dia_mensalidade`, `data_nascimento`) nunca são selecionados em queries do portal do aluno — responsabilidade da camada de aplicação.

---

### Bug 2 — Professor não consegue adicionar mais de um visitante

**Causa raiz: muito provavelmente `upsert` com `onConflict: 'aula_id,nome_visitante'`.**

A action de adicionar visitante quase certamente usa:

```typescript
await supabase.from('presencas').upsert(
  { aula_id, nome_visitante: nome, aluno_id: null },
  { onConflict: 'aula_id,nome_visitante' }
)
```

Dois problemas possíveis:
- Se existe `UNIQUE(aula_id, nome_visitante)`: dois visitantes com o mesmo nome falham silenciosamente
- Se o `upsert` está errado: um segundo visitante com nome diferente funciona, mas o professor está tentando adicionar com o mesmo nome

**Fix primário:** mudar de `upsert` para `insert` puro para visitantes. Visitante não tem `user_id`, não faz sentido dar upsert. Dois "João" visitando em datas diferentes (ou mesmo na mesma aula em idades de time) devem ser registros separados.

**Fix secundário:** verificar e remover o UNIQUE constraint em `(aula_id, nome_visitante)` se existir, pois bloqueia o cenário legítimo de dois visitantes com o mesmo nome.

---

## B-106 — Fix RLS: aluno vê colegas da academia

### Migration: `supabase/migrations/20260725000001_rls_alunos_colegas.sql`

```sql
-- ============================================================
-- Fix: aluno pode ver dados básicos de colegas da mesma academia
-- Segurança: row-level (mesma academia, apenas ativos)
-- Responsabilidade do app: NUNCA buscar campos sensíveis
-- (condicoes_saude, dia_mensalidade, data_nascimento) em 
-- queries do portal do aluno — só usar: id, nome, foto_url, 
-- faixa, grau, academia_id, matriculado_em, ativo
-- ============================================================

-- Remover constraint de visitante se existir (permite 2 visitantes com mesmo nome)
ALTER TABLE presencas
  DROP CONSTRAINT IF EXISTS presencas_aula_id_nome_visitante_key;

-- Nova policy: aluno vê alunos ativos da mesma academia
-- (as policies de SELECT são OR'd pelo Postgres — não quebra policies existentes)
DROP POLICY IF EXISTS "aluno_ve_colegas_mesma_academia" ON alunos;
CREATE POLICY "aluno_ve_colegas_mesma_academia"
ON alunos FOR SELECT
USING (
  ativo = TRUE
  AND academia_id IN (
    SELECT academia_id
    FROM alunos
    WHERE user_id = auth.uid()
  )
);
```

> **Nota:** a policy existente (`user_id = auth.uid()`) continua válida e cobre o próprio aluno mesmo inativo (ex.: para buscar seus próprios dados no perfil). As duas policies são combinadas com OR pelo Postgres RLS.

---

## B-107 — Página de perfil público do aluno

### Contexto

Com o RLS corrigido, é possível criar `/aluno/perfil/[id]` — o perfil de qualquer colega de academia. Mostra: foto, nome, faixa (BeltBar), conquistas desbloqueadas e stats de frequência. **Não mostra** campos sensíveis.

### 1. `src/app/(app)/aluno/perfil/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import { BeltBar } from '@/components/belt-bar' // componente já existente
import { computarConquistas } from '@/lib/conquistas'  // já criado no HANDOFF-026

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const eu = await getAlunoOuRedireciona()
  const supabase = await createClient()

  // Buscar perfil público — só campos seguros, dentro da mesma academia
  const { data: alvo } = await supabase
    .from('alunos')
    .select('id, nome, foto_url, faixa, grau, academia_id, matriculado_em')
    .eq('id', id)
    .eq('academia_id', eu.academia_id) // garantia extra: mesma academia
    .eq('ativo', true)
    .maybeSingle()

  if (!alvo || alvo.id === eu.id) {
    // Próprio perfil → redireciona para /aluno/perfil
    // Aluno não encontrado ou de outra academia → 404
    if (alvo?.id === eu.id) {
      const { redirect } = await import('next/navigation')
      redirect('/aluno/perfil')
    }
    return notFound()
  }

  // Stats de frequência (apenas contagens — sem dados sensíveis)
  const [{ count: totalPresencas }, conquistasData] = await Promise.all([
    supabase
      .from('presencas')
      .select('*', { count: 'exact', head: true })
      .eq('aluno_id', alvo.id),
    supabase.rpc('dados_conquistas_aluno', { p_aluno_id: alvo.id }),
  ])

  const anosNaAcademia = alvo.matriculado_em
    ? (Date.now() - new Date(alvo.matriculado_em).getTime()) / (1000 * 60 * 60 * 24 * 365)
    : 0

  const dadosConquistas = {
    totalPresencas: (conquistasData.data?.[0]?.total_presencas as number) ?? 0,
    maxTreinosMes: (conquistasData.data?.[0]?.max_treinos_mes as number) ?? 0,
    anosNaAcademia,
    faixa: alvo.faixa ?? 'branca',
  }

  const todas = computarConquistas(dadosConquistas)
  const desbloqueadas = todas.filter(c => c.desbloqueada)

  const primeiroNome = alvo.nome.split(' ')[0]

  return (
    <div className="min-h-dvh pb-20" style={{ background: 'var(--brand-fundo)' }}>
      {/* Header */}
      <div className="px-4 pt-safe pt-4 pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/aluno/historico"
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ border: '1px solid var(--brand-border)' }}>
          <span style={{ color: 'var(--brand-texto)' }}>←</span>
        </Link>
        <p className="font-bold" style={{ color: 'var(--brand-texto)' }}>
          Perfil de {primeiroNome}
        </p>
      </div>

      <div className="px-4 space-y-6 mt-5">
        {/* Avatar + nome */}
        <div className="flex flex-col items-center gap-3 py-4">
          {alvo.foto_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={alvo.foto_url} alt={alvo.nome}
              className="w-24 h-24 rounded-full object-cover"
              style={{ border: '3px solid var(--brand-gold-border)' }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black"
              style={{
                background: 'var(--brand-gold-dim)',
                border: '3px solid var(--brand-gold-border)',
                color: 'var(--brand-gold)',
              }}>
              {alvo.nome.charAt(0)}
            </div>
          )}
          <div className="text-center">
            <p className="text-xl font-black" style={{ color: 'var(--brand-texto)' }}>
              {alvo.nome}
            </p>
            {alvo.matriculado_em && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                Na academia desde {new Date(alvo.matriculado_em).getFullYear()}
              </p>
            )}
          </div>
        </div>

        {/* Faixa */}
        <BeltBar faixa={alvo.faixa ?? 'branca'} grau={alvo.grau ?? 0} />

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl px-4 py-3 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-2xl font-black" style={{ color: 'var(--brand-gold)' }}>
              {totalPresencas ?? 0}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              treinos
            </p>
          </div>
          <div className="rounded-xl px-4 py-3 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-2xl font-black" style={{ color: 'var(--brand-gold)' }}>
              {desbloqueadas.length}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              conquistas
            </p>
          </div>
        </div>

        {/* Conquistas desbloqueadas */}
        {desbloqueadas.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Conquistas de {primeiroNome}
            </p>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {desbloqueadas.length === 0 && (
          <div className="rounded-xl py-8 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px dashed var(--brand-border)' }}>
            <p className="text-2xl mb-2">🥋</p>
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
              {primeiroNome} ainda não desbloqueou conquistas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. Link para o perfil público em `/aluno/aula/[id]` (HANDOFF-025)

Na lista "Quem foi" do detalhe da aula, cada item vira um link:

```tsx
// Antes (era um div estático):
<div key={p.id} className="flex items-center gap-2 ...">

// Depois (link para perfil público se for aluno, não visitante):
{p.isVisitante ? (
  <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
      style={{ background: '#222', color: '#444' }}>
      ?
    </div>
    <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
      {p.nome} (visitante)
    </span>
  </div>
) : (
  <Link key={p.id} href={`/aluno/perfil/${p.id}`}
    className="flex items-center gap-2 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
    {p.foto_url ? (
      <img src={p.foto_url} alt={p.nome}
        className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
        style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
        {p.nome.charAt(0)}
      </div>
    )}
    <span className="text-xs font-medium" style={{ color: 'var(--brand-texto)' }}>
      {p.nome.split(' ')[0]}
    </span>
  </Link>
)}
```

---

## B-108 — Fix: múltiplos visitantes na mesma aula

### Causa e fix

A migration B-106 já remove o constraint `presencas_aula_id_nome_visitante_key` se existir.

O segundo ponto é corrigir a **action de adicionar visitante** para usar `insert` puro em vez de `upsert`:

Em `src/app/(app)/aulas/[id]/actions.ts` (ou onde estiver a action de visitante), localizar a função de adicionar visitante e substituir:

```typescript
// ANTES (causa o bug):
const { error } = await supabase
  .from('presencas')
  .upsert(
    { aula_id, nome_visitante: nome.trim(), aluno_id: null },
    { onConflict: 'aula_id,nome_visitante' }  // ← esse é o problema
  )

// DEPOIS (fix correto):
const { error } = await supabase
  .from('presencas')
  .insert({ aula_id, nome_visitante: nome.trim(), aluno_id: null })
```

> **Por que insert e não upsert?** Visitante não tem `user_id` nem chave de negócio — não há o que fazer update. Se o professor adiciona "João" duas vezes, são dois registros distintos (dois visitantes diferentes ou o mesmo que veio duas aulas seguidas registradas de uma vez). `insert` é o comportamento correto.

### Verificação do fluxo da UI

Além da action, verificar no componente de presença da aula se o estado é resetado corretamente após adicionar um visitante. O comportamento esperado:

1. Professor digita nome do visitante
2. Clica "Adicionar" 
3. Visitante aparece na lista, **campo de texto limpa**
4. Professor pode digitar um segundo visitante imediatamente
5. Ambos aparecem na lista

Se o campo não limpa após submit, o problema pode estar no state management do client component. Fix:

```typescript
// No client component de adicionar visitante:
async function handleAdicionarVisitante() {
  if (!nomeVisitante.trim()) return
  setIsLoading(true)
  const res = await adicionarVisitante(aulaId, nomeVisitante.trim())
  if (!res?.error) {
    setNomeVisitante('')  // ← garantir que limpa após sucesso
    router.refresh()      // ← re-fetch da lista de presentes
  }
  setIsLoading(false)
}
```

---

## Resumo dos arquivos

| Arquivo | Card | O que muda |
|---|---|---|
| `supabase/migrations/20260725000001_rls_alunos_colegas.sql` | B-106 | **Novo.** Policy RLS + remove constraint visitante |
| `src/app/(app)/aluno/perfil/[id]/page.tsx` | B-107 | **Novo.** Perfil público do colega |
| `src/app/(app)/aluno/aula/[id]/page.tsx` | B-107 | Items "Quem foi" viram links para `/aluno/perfil/[id]` |
| `src/app/(app)/aulas/[id]/actions.ts` | B-108 | `upsert` → `insert` para visitantes |
| Componente de presença (client) | B-108 | Garantir `setNomeVisitante('')` após submit |

---

## Ordem de implementação

1. **Aplicar migration** no SQL Editor — isso desbloqueia tudo que depende de RLS
2. **Testar imediatamente**: o "quem vai" e "quem foi" já devem mostrar os alunos com foto/faixa
3. Criar `src/app/(app)/aluno/perfil/[id]/page.tsx`
4. Linkar items "Quem foi" na aula detail para o perfil público
5. Corrigir action de visitante: `upsert` → `insert`
6. Testar múltiplos visitantes na mesma aula

---

## Critérios de aceite

**B-106 — RLS colegas:**
- [ ] Migration aplicada sem erros
- [ ] Aluno consegue ver nome, foto, faixa e grau dos colegas na lista "Quem foi"
- [ ] Aluno NÃO consegue ver `condicoes_saude`, `dia_mensalidade`, `data_nascimento` de colegas (validar no Supabase Studio)
- [ ] Aluno de academia A não consegue ver alunos da academia B (testar com conta diferente)

**B-107 — Perfil público:**
- [ ] `/aluno/perfil/[id]` exibe nome, foto, faixa com BeltBar, stats (treinos + conquistas)
- [ ] Conquistas desbloqueadas exibidas em grid dourado
- [ ] Redireciona para `/aluno/perfil` se o id for do próprio aluno
- [ ] 404 para id de aluno de outra academia
- [ ] Items "Quem foi" no detalhe da aula são clicáveis e abrem o perfil
- [ ] Visitantes NÃO são clicáveis (sem conta, sem perfil)

**B-108 — Múltiplos visitantes:**
- [ ] Professor consegue adicionar dois visitantes com nomes diferentes na mesma aula
- [ ] Professor consegue adicionar dois visitantes com o MESMO nome na mesma aula
- [ ] Campo de nome limpa após cada visitante adicionado
- [ ] Ambos aparecem na lista de presentes
