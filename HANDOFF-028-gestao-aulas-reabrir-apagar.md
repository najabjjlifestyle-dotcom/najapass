# HANDOFF-028 — Gestão Completa de Aulas: Reabrir + Apagar

**Data:** 2026-07-25  
**Branch:** `fix/sprint31-gestao-aulas`  
**Base:** `main`  
**Épico:** EP-33 — Gestão Completa de Aulas  
**Cards:** B-109 · B-110  
**Prioridade:** 🔴 P0 — bloqueia operação diária do professor

---

## Diagnóstico

### Bug 1 — Não consigo reabrir aula finalizada

**Cenário:** Professor fechou a aula de hoje mas estava na semana passada (fechou antes da hora, ou mudou de ideia sobre técnicas). Agora o status é `finalizada`, tudo virou read-only e não tem como voltar.

**Causa:** Não existe um botão ou action de "Reabrir". O status `finalizada` é um beco sem saída na UI atual.

**Fix:** Botão **"Reabrir Aula"** na página da aula. Muda `status` de `finalizada` → `aberta`. Sem migration, sem dados perdidos — é só mudar o status.

---

### Bug 2 — Não consigo apagar aula

**Cenário:** Professor gerou a aula de quinta, mas ela ficou na quarta por engano (data errada ao criar). Consegue editar a data, mas a aula "errada" não some — não existe botão de apagar.

**Causa:** Não existe UI de deleção de aulas.

**Fix:** Botão **"Apagar Aula"** na página da aula com confirmação. Se a aula tiver presenças, avisa o professor antes de apagar.

> **Decisão de produto:** permitir apagar QUALQUER aula (aberta, agendada ou finalizada). O professor sabe o que está fazendo. A responsabilidade de confirmar é do modal de confirmação. Cascade no banco (presencas, aula_tecnicas) já deve existir — confirmar com `ON DELETE CASCADE`.

---

## Verificação de CASCADE (antes de implementar)

No Supabase Studio, verificar se as foreign keys que referenciam `aulas.id` têm `ON DELETE CASCADE`:

- `presencas.aula_id → aulas.id` — deve ter CASCADE
- `aula_tecnicas.aula_id → aulas.id` — deve ter CASCADE
- `anotacoes_treino.aula_id → aulas.id` — deve ter CASCADE
- `resenhas_aula.aula_id → aulas.id` — tem CASCADE (criada no HANDOFF-025)
- `notas_professor` — não referencia aulas diretamente, sem problema

**Se alguma FK não tiver CASCADE**, aplicar a migration abaixo. Se já tiverem, pular:

```sql
-- Verificar e corrigir cascades (só executar se necessário)
-- Descomentar apenas o que não tiver ON DELETE CASCADE

-- ALTER TABLE presencas DROP CONSTRAINT presencas_aula_id_fkey;
-- ALTER TABLE presencas ADD CONSTRAINT presencas_aula_id_fkey
--   FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE;

-- ALTER TABLE aula_tecnicas DROP CONSTRAINT aula_tecnicas_aula_id_fkey;
-- ALTER TABLE aula_tecnicas ADD CONSTRAINT aula_tecnicas_aula_id_fkey
--   FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE;

-- ALTER TABLE anotacoes_treino DROP CONSTRAINT anotacoes_treino_aula_id_fkey;
-- ALTER TABLE anotacoes_treino ADD CONSTRAINT anotacoes_treino_aula_id_fkey
--   FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE;
```

---

## B-109 — Reabrir aula finalizada

### 1. Server Action — `src/app/(app)/aulas/[id]/actions.ts`

Adicionar ao arquivo existente:

```typescript
export async function reabrirAula(aulaId: string) {
  const supabase = await createClient()
  const professor = await getProfessorOuRedireciona()

  // Verificar que a aula pertence à academia do professor
  const { data: aula } = await supabase
    .from('aulas')
    .select('id, status, academia_id')
    .eq('id', aulaId)
    .eq('academia_id', professor.academia_id)
    .maybeSingle()

  if (!aula) return { error: 'Aula não encontrada.' }
  if (aula.status !== 'finalizada') return { error: 'Aula não está finalizada.' }

  const { error } = await supabase
    .from('aulas')
    .update({ status: 'aberta' })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao reabrir aula.' }

  revalidatePath(`/aulas/${aulaId}`)
  revalidatePath('/historico')
  revalidatePath('/dashboard')
  return { success: true }
}
```

### 2. Botão "Reabrir" na UI da aula

Em `src/app/(app)/aulas/[id]/page.tsx` (ou no componente de header/ações da aula), adicionar o botão quando `aula.status === 'finalizada'`:

```tsx
'use client'
import { useTransition } from 'react'
import { reabrirAula } from './actions'
import { useRouter } from 'next/navigation'

function BotaoReopenAula({ aulaId }: { aulaId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleReabrir() {
    startTransition(async () => {
      const res = await reabrirAula(aulaId)
      if (!res?.error) router.refresh()
    })
  }

  return (
    <button
      onClick={handleReabrir}
      disabled={isPending}
      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left active:scale-[0.98] transition-all disabled:opacity-50"
      style={{
        background: 'var(--brand-surf)',
        border: '1px solid var(--brand-border)',
        color: 'var(--brand-texto)',
      }}>
      <span className="text-base">🔓</span>
      {isPending ? 'Reabrindo...' : 'Reabrir aula'}
      <span className="ml-auto text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
        volta para em andamento
      </span>
    </button>
  )
}
```

**Localização no JSX:** exibir `<BotaoReopenAula>` apenas quando `aula.status === 'finalizada'`. Idealmente na mesma região do botão "Finalizar" (que já não aparece pois a aula está fechada) — numa seção de "Ações" ou no menu de opções da aula.

---

## B-110 — Apagar aula

### 1. Server Action

Adicionar ao mesmo `src/app/(app)/aulas/[id]/actions.ts`:

```typescript
export async function apagarAula(aulaId: string) {
  const supabase = await createClient()
  const professor = await getProfessorOuRedireciona()

  // Verificar que a aula pertence à academia do professor
  const { data: aula } = await supabase
    .from('aulas')
    .select('id, academia_id, status')
    .eq('id', aulaId)
    .eq('academia_id', professor.academia_id)
    .maybeSingle()

  if (!aula) return { error: 'Aula não encontrada.' }

  // Cascade cuida de presencas, aula_tecnicas, anotacoes_treino, resenhas_aula
  const { error } = await supabase
    .from('aulas')
    .delete()
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao apagar aula.' }

  revalidatePath('/historico')
  revalidatePath('/dashboard')
  revalidatePath('/planejamento')
  return { success: true }
}
```

### 2. Componente de confirmação + botão

```tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { apagarAula } from './actions'

function BotaoApagarAula({
  aulaId,
  turmaLabel,
  dataLabel,
  totalPresencas,
}: {
  aulaId: string
  turmaLabel: string
  dataLabel: string
  totalPresencas: number
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleApagar() {
    startTransition(async () => {
      const res = await apagarAula(aulaId)
      if (!res?.error) {
        router.push('/historico')
        router.refresh()
      }
    })
  }

  if (confirmando) {
    return (
      <div className="rounded-xl p-4 space-y-3"
        style={{ background: '#1A0000', border: '1px solid #4A0000' }}>
        <p className="text-sm font-bold" style={{ color: '#FF4444' }}>
          ⚠️ Apagar aula permanentemente?
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#AA6666' }}>
          <strong style={{ color: '#FF8888' }}>{turmaLabel} · {dataLabel}</strong>
          {totalPresencas > 0 && (
            <> — esta aula tem <strong style={{ color: '#FF8888' }}>{totalPresencas} {totalPresencas === 1 ? 'presença' : 'presenças'}</strong> registradas. Todos os dados serão apagados.</>
          )}
          {totalPresencas === 0 && <> — nenhuma presença registrada.</>}
          {' '}Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmando(false)}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'var(--brand-surf)',
              border: '1px solid var(--brand-border)',
              color: 'var(--brand-texto)',
            }}>
            Cancelar
          </button>
          <button
            onClick={handleApagar}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: '#7A0000', color: '#FF8888' }}>
            {isPending ? 'Apagando...' : 'Sim, apagar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-left active:scale-[0.98] transition-all"
      style={{
        background: 'transparent',
        border: '1px solid #2A0000',
        color: '#FF4444',
      }}>
      <span className="text-base">🗑️</span>
      Apagar aula
    </button>
  )
}
```

### 3. Integração na página da aula

Precisamos saber o total de presenças para o modal de confirmação. Adicionar ao `Promise.all` da página:

```typescript
const { count: totalPresencas } = await supabase
  .from('presencas')
  .select('*', { count: 'exact', head: true })
  .eq('aula_id', id)
```

No JSX, numa seção de "Zona de perigo" (sempre ao final da página, visualmente separada):

```tsx
{/* Zona de perigo — sempre ao final */}
<div className="mt-8 pt-6" style={{ borderTop: '1px solid #1A0000' }}>
  <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: '#333' }}>
    Zona de perigo
  </p>
  <div className="space-y-2">
    {aula.status === 'finalizada' && (
      <BotaoReopenAula aulaId={id} />
    )}
    <BotaoApagarAula
      aulaId={id}
      turmaLabel={aula.turmas?.nome ?? 'Aula'}
      dataLabel={new Date(aula.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
      totalPresencas={totalPresencas ?? 0}
    />
  </div>
</div>
```

---

## Resumo dos arquivos

| Arquivo | Card | O que muda |
|---|---|---|
| `src/app/(app)/aulas/[id]/actions.ts` | B-109/110 | Adicionar `reabrirAula()` e `apagarAula()` |
| `src/app/(app)/aulas/[id]/page.tsx` | B-109/110 | Adicionar `BotaoReopenAula`, `BotaoApagarAula` e query de `totalPresencas` |
| `supabase/migrations/20260725000002_cascade_aulas.sql` | B-110 | **Condicional** — só aplicar se algum CASCADE estiver faltando |

---

## Critérios de aceite

**B-109 — Reabrir aula:**
- [ ] Botão "🔓 Reabrir aula" aparece apenas quando `status === 'finalizada'`
- [ ] Clicar reabre a aula (`status → 'aberta'`) sem modal de confirmação (ação segura, sem perda de dados)
- [ ] Após reabrir: técnicas e presenças voltam a ser editáveis
- [ ] Botão "Finalizar" reaparece normalmente
- [ ] Aula de outra academia retorna erro (RLS + verificação na action)

**B-110 — Apagar aula:**
- [ ] Botão "🗑️ Apagar aula" sempre visível na zona de perigo
- [ ] Primeiro clique abre confirmação inline (sem modal separado)
- [ ] Modal mostra: nome da turma, data, e quantidade de presenças (se houver)
- [ ] Se `totalPresencas > 0`: aviso explícito de perda de dados históricos
- [ ] "Cancelar" volta para o botão inicial
- [ ] "Sim, apagar" executa e redireciona para `/historico`
- [ ] Todos os filhos apagados em cascade (presencas, aula_tecnicas, anotacoes_treino, resenhas_aula)
- [ ] Aula de outra academia retorna erro
