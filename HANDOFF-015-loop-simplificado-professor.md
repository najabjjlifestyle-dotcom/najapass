# HANDOFF-015 — Loop Simplificado do Professor

**Data:** 2026-07-12  
**Branch:** `feat/sprint19-loop-simplificado`  
**Base:** `main` (após merge das sprints 17 e 18)  
**Épico:** EP-21 — Loop Simplificado do Professor  
**Cards:** B-069 · B-070 · B-071 · B-072

---

## Contexto

Victor descreveu o fluxo ideal do professor em 5 passos:

> "Professor pensa na aula → Cadastra posições → Abre a aula → Alunos fazem checkin → Professor finaliza a aula e fala se as técnicas foram ensinadas → Planeja próxima aula."

### O que o app faz hoje vs. o que deveria fazer

| Passo | Hoje | Problema |
|---|---|---|
| Planejar + Abrir | 2 telas (nova aula → salvar → detalhe → "ABRIR AULA") | Passo extra desnecessário quando o professor quer abrir na hora |
| Técnicas durante a aula | 3 botões por técnica: ✓ / 🔁 / ✗ | O botão ✗ gera ruído — professor não "não-ensina" uma técnica durante a aula, isso é descoberto depois |
| Finalizar | Botão no topo da lista de presença, auto-marca planejadas → nao_ensinada | Sumido no scroll; não dá chance pro professor dizer o que ensinou |
| "Quais técnicas ensinou?" | Acontece ANTES de finalizar (live class) | O professor sabe o que ensinou só quando TERMINA, não durante |
| Pós-aula | Feedback mostra só `ensinada` para marcar reforço | Professor não tem como corrigir o registro durante a aula ao vivo |

### Fluxo corrigido (4 mudanças cirúrgicas)

```
Nova aula form
  ├── [ABRIR AGORA]  → cria aberta + push → /aulas/[id]     ← B-069
  └── [Planejar para depois] → cria agendada → /aulas/[id]

Aula ao vivo /aulas/[id]
  ├── Técnicas: ✓ / 🔁 (sem ✗)                              ← B-072
  └── [barra fixa inferior] "12 presentes · FINALIZAR AULA"  ← B-070
       └── navega para /aulas/[id]/feedback (enquanto aberta)

Feedback /aulas/[id]/feedback                               ← B-071
  ├── Lista TODAS as técnicas planejadas
  ├── Professor toca para marcar "Ensinei"
  ├── Para cada Ensinei: toggle "Repetir próxima?"
  └── [CONCLUIR AULA] → marca técnicas + finaliza + tela de sucesso
       └── Tela de sucesso: "→ Planejar próxima aula" | "[Início]"
```

---

## B-069 — "Abrir Agora": criar e abrir em uma ação

**Arquivo:** `src/app/(app)/aulas/actions.ts`

Mudar a action `abrirAula()` para ler um campo `intent` do FormData e decidir o status:

```ts
// Em abrirAula(), substituir:
const status = 'agendada'

// Por:
const intent = formData.get('intent') as string | null
const status: 'agendada' | 'aberta' = intent === 'abrir_agora' ? 'aberta' : 'agendada'
```

Quando `status === 'aberta'`, disparar push DENTRO da mesma action (copiar lógica de `abrirAulaAgendada()`):

```ts
// Após inserir a aula e as técnicas planejadas:
if (status === 'aberta' && turma_id) {
  const { data: turmaData } = await supabase.from('turmas').select('nome').eq('id', turma_id).maybeSingle()
  const { data: subs } = await supabase.rpc('subscricoes_da_turma', { p_turma_id: turma_id })
  if (subs && subs.length > 0) {
    await sendPushToAll(subs, {
      title: '🥋 Aula aberta!',
      body: `${turmaData?.nome ?? 'Sua turma'} — confirme sua presença`,
      url: '/aluno',
    })
  }
}
```

**Arquivo:** `src/app/(app)/aulas/nova/form.tsx`

Trocar o único botão "Salvar Aula" por dois:

```tsx
{/* Botão primário — oculta o campo intent=abrir_agora antes de submeter */}
<button
  type="submit"
  disabled={isPending}
  onClick={() => intentRef.current?.setAttribute('value', 'abrir_agora')}
  className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98]"
  style={{ background: 'var(--brand-gold)', color: '#000' }}
>
  {isPending ? 'Abrindo...' : 'ABRIR AGORA'}
</button>

<button
  type="submit"
  disabled={isPending}
  onClick={() => intentRef.current?.setAttribute('value', 'planejar')}
  className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98] mt-2"
  style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)', background: 'transparent' }}
>
  Planejar para depois
</button>

{/* Campo oculto que transporta o intent */}
<input ref={intentRef} type="hidden" name="intent" defaultValue="planejar" />
```

Adicionar `intentRef` com `useRef<HTMLInputElement>(null)`.

O redirect no form já está condicionado ao resultado:
```ts
// Já existente no form, verificar se funciona para os dois fluxos:
// result.id existe em ambos os casos → router.replace(`/aulas/${result.id}`)
```

---

## B-070 — Sticky "Finalizar Aula" → redireciona para Feedback

**Arquivo:** `src/app/(app)/aulas/[id]/attendance-list.tsx`

### 1. Adicionar padding-bottom ao container para não cobrir o conteúdo

No `<main>` ou container principal da lista, adicionar `pb-28` (espaço para a barra fixa).

### 2. Remover o botão "Finalizar" do cabeçalho da lista

```tsx
// Remover este bloco do header da lista:
{!isLocked && (
  <button onClick={handleFinalizar}>Finalizar Aula</button>
)}
```

### 3. Adicionar barra fixa no rodapé

```tsx
{!isLocked && (
  <div
    className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-safe z-50"
    style={{ background: 'var(--brand-fundo)', borderTop: '1px solid var(--brand-border)' }}
  >
    <button
      onClick={() => router.push(`/aulas/${aulaId}/feedback`)}
      className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest transition-transform active:scale-[0.98]"
      style={{ background: 'var(--brand-gold)', color: '#000' }}
    >
      {presentes.size} {presentes.size === 1 ? 'presente' : 'presentes'} · Finalizar Aula
    </button>
  </div>
)}
```

> O componente já tem `useRouter` — importar se não existir. `aulaId` precisa ser passado como prop ao componente (já deve existir como `aula.id`).

### 4. Manter `handleFinalizar` como rota de emergência (sem interface)

Não remover a action `finalizarAula()` nem o handler — ela continua sendo usada internamente pela nova action `concluirAula()` (que finaliza depois de marcar as técnicas). Apenas remover o botão da UI.

---

## B-071 — Feedback revisado: "Quais técnicas você ensinou?"

Esta é a maior mudança. O feedback passa de "marcar reforços nas ensinadas" para "dizer o que foi ensinado, depois marcar reforços".

### Feedback page: aceitar status `aberta` + buscar todas as planejadas

**Arquivo:** `src/app/(app)/aulas/[id]/feedback/page.tsx`

```ts
// Trocar:
if (aula.status !== 'finalizada') redirect(`/aulas/${id}`)

// Por:
if (!['aberta', 'finalizada'].includes(aula.status)) redirect(`/aulas/${id}`)
```

Buscar TODAS as técnicas (planejadas + ensinadas), não só ensinadas:

```ts
// Trocar:
const { data: tecnicasData } = await supabase
  .from('aula_tecnicas')
  .select('tecnica_id, reforco, tecnicas(nome)')
  .eq('aula_id', id)
  .eq('tipo', 'ensinada')

// Por:
const { data: tecnicasData } = await supabase
  .from('aula_tecnicas')
  .select('tecnica_id, tipo, reforco, tecnicas(nome)')
  .eq('aula_id', id)
  .in('tipo', ['planejada', 'ensinada'])
  .order('created_at')
```

Passar `aulaStatus` e `turmaId` para o form:

```ts
// Incluir na query da aula:
.select('id, status, data, turma_id, turmas(nome)')

// Passar para o form:
<FeedbackForm
  aulaId={id}
  aulaStatus={aula.status}
  turmaId={aula.turma_id ?? null}
  tecnicas={tecnicas} // agora inclui planejadas também
  turmaNome={turma?.nome ?? 'Aula avulsa'}
  data={aula.data}
/>
```

### Feedback form: novo UX

**Arquivo:** `src/app/(app)/aulas/[id]/feedback/form.tsx`

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Repeat, ChevronRight } from 'lucide-react'
import { concluirAula } from './actions'

type Tecnica = {
  tecnica_id: string
  nome: string
  tipo: 'planejada' | 'ensinada'
  reforco: boolean
}

export default function FeedbackForm({
  aulaId,
  aulaStatus,
  turmaId,
  tecnicas,
  turmaNome,
  data,
}: {
  aulaId: string
  aulaStatus: string
  turmaId: string | null
  tecnicas: Tecnica[]
  turmaNome: string
  data: string
}) {
  const router = useRouter()

  // Técnicas já marcadas como ensinadas durante a aula ficam pré-selecionadas
  const [ensinadas, setEnsinadas] = useState<Set<string>>(
    new Set(tecnicas.filter(t => t.tipo === 'ensinada').map(t => t.tecnica_id))
  )
  const [reforcos, setReforcos] = useState<Set<string>>(
    new Set(tecnicas.filter(t => t.reforco).map(t => t.tecnica_id))
  )
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const dataFmt = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short',
  })

  function toggleEnsinada(id: string) {
    setEnsinadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // Remove reforço se desmarcar ensinada
        setReforcos(r => { const rr = new Set(r); rr.delete(id); return rr })
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleReforco(id: string) {
    if (!ensinadas.has(id)) return // só reforça o que foi ensinado
    setReforcos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConcluir() {
    startTransition(async () => {
      await concluirAula(aulaId, [...ensinadas], [...reforcos])
      setDone(true)
    })
  }

  // Tela de sucesso
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
        style={{ background: 'var(--brand-fundo)' }}>
        <div className="text-5xl mb-4">🥋</div>
        <h1 className="font-bold text-2xl uppercase tracking-wider mb-1" style={{ color: 'var(--brand-gold)' }}>
          Aula encerrada!
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--brand-texto-muted)' }}>
          {ensinadas.size} técnica{ensinadas.size !== 1 ? 's' : ''} registrada{ensinadas.size !== 1 ? 's' : ''} ·{' '}
          {reforcos.size > 0 ? `${reforcos.size} para reforço` : 'sem reforços'}
        </p>

        {turmaId && (
          <button
            onClick={() => router.replace(`/aulas/nova?turma_id=${turmaId}`)}
            className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-widest transition-transform active:scale-[0.98] mb-3 flex items-center justify-center gap-2"
            style={{ background: 'var(--brand-gold)', color: '#000' }}
          >
            Planejar próxima aula
            <ChevronRight size={18} />
          </button>
        )}

        <button
          onClick={() => router.replace('/dashboard')}
          className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest"
          style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)', background: 'transparent' }}
        >
          Ir para o início
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
          {turmaNome} · {dataFmt}
        </p>
        <h1 className="font-bold text-xl uppercase tracking-wider mt-0.5" style={{ color: 'var(--brand-texto)' }}>
          O que você ensinou?
        </h1>
        <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
          Toque nas técnicas que foram ao tatame. As com reforço entram automaticamente na próxima aula.
        </p>
      </header>

      <main className="px-5 pt-5 pb-32">
        {tecnicas.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--brand-texto-muted)' }}>
            Nenhuma técnica planejada para esta aula.
          </p>
        ) : (
          <div className="space-y-2">
            {tecnicas.map(t => {
              const foiEnsinada = ensinadas.has(t.tecnica_id)
              const foiReforco = reforcos.has(t.tecnica_id)
              return (
                <div key={t.tecnica_id}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${foiEnsinada ? 'rgba(74,222,128,0.3)' : 'var(--brand-border)'}`,
                           background: foiEnsinada ? 'rgba(74,222,128,0.06)' : 'var(--brand-surf)' }}>
                  {/* Linha principal: nome + toggle Ensinei */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <p className="font-bold text-sm flex-1 min-w-0" style={{ color: 'var(--brand-texto)' }}>
                      {t.nome}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleEnsinada(t.tecnica_id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.96]"
                      style={foiEnsinada
                        ? { background: 'rgba(74,222,128,0.2)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.4)' }
                        : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                      }
                    >
                      <Check size={13} />
                      Ensinei
                    </button>
                  </div>

                  {/* Linha de reforço: só aparece se ensinada */}
                  {foiEnsinada && (
                    <div className="px-4 pb-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => toggleReforco(t.tecnica_id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-[0.96]"
                        style={foiReforco
                          ? { background: 'rgba(251,146,60,0.2)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.4)' }
                          : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                        }
                      >
                        <Repeat size={11} />
                        Repetir na próxima
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Barra fixa de conclusão */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-safe z-50"
        style={{ background: 'var(--brand-fundo)', borderTop: '1px solid var(--brand-border)' }}>
        {reforcos.size > 0 && (
          <p className="text-[10px] text-center mb-2 uppercase tracking-widest" style={{ color: '#FB923C' }}>
            {reforcos.size} técnica{reforcos.size !== 1 ? 's' : ''} para reforço na próxima aula
          </p>
        )}
        <button
          onClick={handleConcluir}
          disabled={isPending}
          className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest disabled:opacity-40 transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000' }}
        >
          {isPending ? 'Encerrando...' : `Concluir aula · ${ensinadas.size} ensinada${ensinadas.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
```

### Nova action: `concluirAula`

**Arquivo:** `src/app/(app)/aulas/[id]/feedback/actions.ts`

Substituir completamente por:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function concluirAula(
  aulaId: string,
  ensinadasIds: string[],
  reforcosIds: string[],
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  // 1. Zera reforços anteriores
  await supabase
    .from('aula_tecnicas')
    .update({ reforco: false })
    .eq('aula_id', aulaId)

  // 2. Marca as ensinadas como tipo='ensinada'
  if (ensinadasIds.length > 0) {
    await supabase
      .from('aula_tecnicas')
      .update({ tipo: 'ensinada' })
      .eq('aula_id', aulaId)
      .in('tecnica_id', ensinadasIds)
  }

  // 3. Marca reforços
  if (reforcosIds.length > 0) {
    await supabase
      .from('aula_tecnicas')
      .update({ reforco: true })
      .eq('aula_id', aulaId)
      .in('tecnica_id', reforcosIds)
  }

  // 4. Planejadas não confirmadas → nao_ensinada
  await supabase
    .from('aula_tecnicas')
    .update({ tipo: 'nao_ensinada' })
    .eq('aula_id', aulaId)
    .eq('tipo', 'planejada')

  // 5. Finaliza a aula
  const horaFim = new Date().toTimeString().slice(0, 8)
  const { error } = await supabase
    .from('aulas')
    .update({ status: 'finalizada', hora_fim: horaFim })
    .eq('id', aulaId)

  if (error) return { error: 'Erro ao finalizar aula.' }

  revalidatePath(`/aulas/${aulaId}`)
  revalidatePath('/aulas')
  revalidatePath('/dashboard')
  return { success: true }
}

// Mantida para compatibilidade (usada pelo link "pular" no feedback quando não há técnicas)
export async function salvarFeedbackAula(aulaId: string, idsParaRepetir: string[]) {
  return concluirAula(aulaId, [], idsParaRepetir)
}
```

---

## B-072 — Remover ✗ durante aula ao vivo

**Arquivo:** `src/app/(app)/aulas/[id]/tecnicas-aula.tsx`

O componente provavelmente recebe `status` como prop (do `aula.status`). Se não receber, adicionar.

Localizar o bloco dos 3 botões por técnica e condicionar o botão ✗:

```tsx
// Encontrar o botão "Não ensinada" / ✗
// Envolvê-lo em uma condição:
{status !== 'aberta' && (
  <button onClick={() => handleConfirmar(t.id, 'nao_ensinada', false)} ...>
    ✗
  </button>
)}
```

> Durante a aula ao vivo, o professor só tem: ✓ "Ensinei" e 🔁 "Reforço". O ✗ reaparece no histórico (status='finalizada') para referência.

---

## Impacto no `finalizarAula()` de `actions.ts`

A action `finalizarAula()` continua existindo mas **não é mais chamada diretamente pela UI**. O novo caminho é:

```
attendance-list.tsx → router.push('/feedback') → form → concluirAula()
```

`finalizarAula()` deve ser mantida pois o feedback chama `concluirAula()`, que replica sua lógica. Não remover — pode ser útil para testes e edge cases (ex: aula sem técnicas planejadas onde o professor não quer marcar nada).

---

## Mudança no `nova/page.tsx`: pré-selecionar turma via query param

Quando o usuário chega em `/aulas/nova?turma_id=X` (redirecionado da tela de sucesso do feedback), o form deve pré-selecionar a turma automaticamente.

**Arquivo:** `src/app/(app)/aulas/nova/page.tsx`

```tsx
export default async function NovaAulaPage({
  searchParams,
}: {
  searchParams: Promise<{ turma_id?: string }>
}) {
  const { turma_id: turmaIdParam } = await searchParams
  // ...resto do carregamento de dados...

  return (
    <NovaAulaForm
      turmas={turmas}
      temas={temasResult.data ?? []}
      tecnicas={tecnicas}
      reforcosPorTurma={reforcosPorTurma}
      historinhas={historinhas}
      defaultTurmaId={turmaIdParam ?? null}   // ← NOVO
    />
  )
}
```

**Arquivo:** `src/app/(app)/aulas/nova/form.tsx`

Adicionar `defaultTurmaId` como prop e inicializar `turmaId` com esse valor:

```tsx
const [turmaId, setTurmaId] = useState<string>(
  defaultTurmaId && turmas.some(t => t.id === defaultTurmaId)
    ? defaultTurmaId
    : turmas[0]?.id ?? ''
)
```

> O `useEffect` do `handleTurmaChange` já auto-popula os reforços quando `turmaId` muda — então isso fecha o loop: feedback → planejar próxima → reforços já selecionados.

---

## Resumo das mudanças

| Arquivo | Tipo | O que muda |
|---|---|---|
| `aulas/actions.ts` | Modifica | Lê `intent` no FormData; quando `abrir_agora`, cria com `status='aberta'` e dispara push |
| `aulas/nova/page.tsx` | Modifica | Lê `searchParams.turma_id`; passa `defaultTurmaId` para o form |
| `aulas/nova/form.tsx` | Modifica | Dois botões (ABRIR AGORA / Planejar para depois) + `intentRef` + prop `defaultTurmaId` |
| `aulas/[id]/attendance-list.tsx` | Modifica | Remove botão do header; adiciona barra sticky no rodapé que navega para `/feedback` |
| `aulas/[id]/tecnicas-aula.tsx` | Modifica | Esconde botão ✗ quando `status === 'aberta'` |
| `aulas/[id]/feedback/page.tsx` | Modifica | Aceita status `aberta`; busca planejadas + ensinadas; passa `turmaId` e `aulaStatus` |
| `aulas/[id]/feedback/form.tsx` | Reescreve | Novo UX: "Ensinei?" + "Repetir?" + tela de sucesso com "Planejar próxima aula" |
| `aulas/[id]/feedback/actions.ts` | Reescreve | `concluirAula()` marca técnicas + finaliza; `salvarFeedbackAula` vira wrapper de compat |

---

## Critérios de aceite (Sprint 19)

- [ ] Professor cria aula e toca "ABRIR AGORA" → aula vai direto para ao vivo, push enviado, sem segunda tela de abertura
- [ ] "Planejar para depois" continua funcionando como antes
- [ ] Durante aula ao vivo, o botão ✗ não aparece nas técnicas
- [ ] "Finalizar Aula" está numa barra fixa no rodapé (visível com 30+ alunos na lista)
- [ ] Tocar "Finalizar Aula" navega para `/aulas/[id]/feedback` (não finaliza na hora)
- [ ] Feedback mostra todas as técnicas planejadas (não só as marcadas durante a aula)
- [ ] Técnicas já marcadas ✓ durante a aula aparecem pré-selecionadas como "Ensinei"
- [ ] Professor pode marcar/desmarcar "Ensinei" e "Repetir na próxima"
- [ ] "Concluir aula" finaliza a aula, grava técnicas, redireciona para tela de sucesso
- [ ] Tela de sucesso mostra "Planejar próxima aula" (vai para `/aulas/nova?turma_id=X`) e "Ir para o início"
- [ ] Chegando em `/aulas/nova?turma_id=X`, a turma já aparece selecionada e os reforços pré-populados
- [ ] Aula sem técnicas planejadas: feedback exibe mensagem vazia e "Concluir aula" funciona normalmente (0 técnicas)

---

*Loop completo: Planejar + Abrir → Checkin → Finalizar + Marcar → Próxima aula. Cinco passos, zero fricção.*
