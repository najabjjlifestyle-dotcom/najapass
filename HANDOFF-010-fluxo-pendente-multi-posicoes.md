# HANDOFF-010 — Fluxo Pendente + Multi-Posições + Duplicar

**Sprint:** 14  
**Branch:** `feat/sprint14-fluxo-pendente`  
**A partir de:** `feat/sprint13-aluno-insights` (ou `main` após merge)  
**Cards:** B-051 · B-052 · B-053 · B-054  
**Status:** Aguardando implementação

---

## Contexto

Screenshots de 09/07/2026 mostraram 5 problemas no fluxo do professor:

1. Professor criou uma aula às 15h para as 17h → foi imediatamente para **AO VIVO**, sem fase de planejamento
2. A view Semana mostrava **"Nenhuma posição planejada"** para a aula das 17h porque ela já era `aberta` quando foi criada — sem chance de planejar antes
3. O formulário de nova aula **limita técnicas ao tema único** selecionado — não dá pra planejar Costas + Guarda Fechada na mesma aula
4. O dropdown "ADICIONAR AD-HOC" durante aula ao vivo é **uma lista flat de 100+ itens** sem busca
5. Não existe forma de **duplicar o planejamento** de uma aula para outra turma/horário

---

## B-051 · Status Pendente — toda aula nasce como `agendada`

### Problema raiz

`src/app/(app)/aulas/actions.ts`, linha ~28:
```ts
const status = data_aula > hoje ? 'agendada' : 'aberta'
```

Aulas criadas para hoje viram `aberta` imediatamente. Isso elimina a fase de planejamento.

### O que muda

**`src/app/(app)/aulas/actions.ts` — função `abrirAula()`:**
```ts
// ANTES
const status = data_aula > hoje ? 'agendada' : 'aberta'

// DEPOIS — sempre agendada, nunca abre direto
const status = 'agendada'
```

O bloco de push notification no final de `abrirAula()` já tem `if (status === 'aberta')` — não precisa mudar. Push só dispara via `abrirAulaAgendada()` (já existe em `agendada-actions.tsx`).

**`src/app/(app)/aulas/nova/form.tsx`:**
- Remover o cálculo `isAgendamento = dataSelecionada > hoje`
- Remover o aviso amarelo "Data futura — a aula fica agendada até você abrir no dia" (não faz mais sentido, é o comportamento padrão)
- Botão: sempre **"SALVAR AULA"** (não "ABRIR AULA" / "Agendar Aula")
- Após salvar, redirect para `/aulas/${id}` como já faz

**`src/app/(app)/aulas/[id]/page.tsx` — label do badge:**
```tsx
// ANTES (linha ~156)
{aula.status === 'agendada' && (
  <span>Agendada</span>
)}

// DEPOIS — diferencia hoje vs. futuro na UI (DB continua 'agendada' nos dois casos)
{aula.status === 'agendada' && (() => {
  const hoje = new Date().toISOString().split('T')[0]
  const isPendente = (aula.data as string) <= hoje
  return (
    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
      style={{
        color: isPendente ? '#FBBF24' : 'var(--brand-texto-muted)',
        border: `1px solid ${isPendente ? 'rgba(251,191,36,0.3)' : 'var(--brand-border)'}`,
      }}>
      {isPendente ? 'Pendente' : 'Agendada'}
    </span>
  )
})()}
```

**`src/app/(app)/semana/page.tsx`:**
- Já funciona: mostra todas as aulas da semana independente de status
- Mudar label no badge: mesma lógica (`data <= hoje && status === 'agendada'` → "Pendente", senão "Agendada")
- O botão "Abrir" dentro do card não existe aqui — professor clica no card, vai para `/aulas/[id]`, onde o `AulaAgendadaActions` já mostra os botões "Abrir" e "Cancelar"

**Dashboard — `src/app/(app)/dashboard/page.tsx`:**
- "Próximas aulas" (B-045) filtra `status='agendada'` e `data >= hoje` — já inclui aulas de hoje automaticamente após a mudança. Nenhuma alteração necessária.
- Garantir que o query NÃO filtre `data > hoje` (verificar se usa `gte` ou `gt`)

### Sem migration

`agendada` já está no CHECK constraint desde B-045. Nenhuma mudança de schema.

---

## B-052 · Múltiplas posições por aula

### Problema raiz

**No formulário de nova aula**, técnicas são filtradas pelo tema único:
```ts
// form.tsx
const tecnicasDoTema = temaId
  ? tecnicas.filter(t => t.categoria_id === temaId)
  : []
```

Resultado: se tema = "Costas", só aparecem técnicas de Costas. Impossível planejar "Costas + Guarda Fechada" na mesma aula.

**No detalhe da aula AO VIVO**, o mesmo filtro existe para técnicas disponíveis para adição:
```ts
// aulas/[id]/page.tsx linha 122
.filter(t => !aulaTemaid || t.categoria_id === aulaTemaid)
```

Resultado: ad-hoc só mostra técnicas do tema da aula.

### O que muda

**`src/app/(app)/aulas/nova/form.tsx` — reescrever picker de técnicas:**

O campo "Tema da aula" permanece como **label de display** (aparece no cabeçalho do card na semana e na home do aluno). Mas a seleção de técnicas é **totalmente desacoplada do tema**.

Remover:
```ts
const tecnicasDoTema = temaId ? tecnicas.filter(t => t.categoria_id === temaId) : []
```

Adicionar:
```ts
const [buscaTecnica, setBuscaTecnica] = useState('')
const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null)

// Agrupar TODAS as técnicas por categoria
const categorias = useMemo(() => {
  const mapa: Record<string, { id: string; nome: string; tecnicas: TecnicaOpt[] }> = {}
  for (const t of tecnicas) {
    const catId = t.categoria_id ?? '__sem_categoria'
    if (!mapa[catId]) mapa[catId] = { id: catId, nome: t.categoria_id ? '' : 'Outras', tecnicas: [] }
    mapa[catId].tecnicas.push(t)
  }
  return Object.values(mapa).sort((a, b) => a.nome.localeCompare(b.nome))
}, [tecnicas])

// Busca em tempo real (filtra por nome em qualquer categoria)
const resultadosBusca = buscaTecnica.trim().length >= 2
  ? tecnicas.filter(t => t.nome.toLowerCase().includes(buscaTecnica.toLowerCase()))
  : []
```

**UI do picker (substitui o bloco `{temaId && (...)}`):**

```tsx
<div>
  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
    Posições a ensinar
    {planejadas.size > 0 && (
      <span className="ml-2 normal-case font-normal">({planejadas.size} selecionada{planejadas.size !== 1 ? 's' : ''})</span>
    )}
  </label>

  {/* Chips selecionados — sempre visíveis */}
  {planejadas.size > 0 && (
    <div className="flex flex-wrap gap-1.5 mb-3 pb-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
      {[...planejadas].map(id => {
        const t = tecnicas.find(x => x.id === id)
        if (!t) return null
        return (
          <button key={id} type="button" onClick={() => togglePlanejada(id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)', color: 'var(--brand-gold)' }}>
            {t.nome} ×
          </button>
        )
      })}
    </div>
  )}

  {/* Busca */}
  <input
    type="text"
    placeholder="Buscar posição..."
    value={buscaTecnica}
    onChange={e => setBuscaTecnica(e.target.value)}
    className="w-full px-3 py-2 rounded-xl text-sm mb-3"
    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}
  />

  {/* Resultados de busca */}
  {buscaTecnica.trim().length >= 2 ? (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {resultadosBusca.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>Nenhuma posição encontrada</p>
      ) : resultadosBusca.map(t => {
        const sel = planejadas.has(t.id)
        return (
          <button key={t.id} type="button" onClick={() => togglePlanejada(t.id)}
            className="px-3 py-1.5 rounded-xl text-sm font-bold border"
            style={{
              background: sel ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
              borderColor: sel ? 'var(--brand-gold)' : 'var(--brand-border)',
              color: sel ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
            }}>
            {t.nome} {sel ? '✓' : ''}
          </button>
        )
      })}
    </div>
  ) : (
    /* Navegação por categoria (quando não há busca) */
    <div className="space-y-2">
      {categorias.map(cat => {
        const temSelecionadas = cat.tecnicas.some(t => planejadas.has(t.id))
        const isExpanded = categoriaExpandida === cat.id || temSelecionadas
        return (
          <div key={cat.id} className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--brand-border)', background: 'var(--brand-surf)' }}>
            <button type="button"
              onClick={() => setCategoriaExpandida(isExpanded && !temSelecionadas ? null : cat.id)}
              className="w-full flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--brand-texto-sec)' }}>
                {cat.nome}
              </span>
              <div className="flex items-center gap-2">
                {temSelecionadas && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
                    {cat.tecnicas.filter(t => planejadas.has(t.id)).length}
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>
            </button>
            {isExpanded && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                {cat.tecnicas.map(t => {
                  const sel = planejadas.has(t.id)
                  const isReforco = reforcosATurma.includes(t.id)
                  return (
                    <button key={t.id} type="button" onClick={() => togglePlanejada(t.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border"
                      style={{
                        background: sel ? 'var(--brand-gold-dim)' : 'transparent',
                        borderColor: sel ? 'var(--brand-gold)' : 'var(--brand-border)',
                        color: sel ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
                      }}>
                      {isReforco && '🔁 '}{t.nome}{sel ? ' ✓' : ''}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )}
</div>
```

**`src/app/(app)/aulas/[id]/page.tsx` — remover filtro de tema em `disponiveis`:**
```ts
// REMOVER esta linha:
.filter(t => !aulaTemaid || t.categoria_id === aulaTemaid)

// MANTER apenas:
.filter(t => !naAulaIds.has(t.id))
```

**`src/app/(app)/aulas/[id]/tecnicas-aula.tsx` — agrupar por categoria no display:**

Dentro do bloco "ENSINADAS", agrupar técnicas por categoria:
```tsx
// Agrupar ensinadas por categoria para display
const ensinadasPorCategoria = ensinadas.reduce<Record<string, AulaTecnica[]>>((acc, t) => {
  const cat = t.categoria ?? 'Outras'
  if (!acc[cat]) acc[cat] = []
  acc[cat].push(t)
  return acc
}, {})

// Render
{Object.entries(ensinadasPorCategoria).map(([cat, tecs]) => (
  <div key={cat}>
    <p className="text-[8px] uppercase tracking-widest mb-1"
      style={{ color: 'var(--brand-texto-muted)' }}>
      {cat}
    </p>
    <div className="flex flex-wrap gap-1.5">
      {tecs.map(t => (/* chip existente */
      ))}
    </div>
  </div>
))}
```

Fazer o mesmo para `planejadas` (cada categoria como sub-seção dentro de "PLANEJADAS").

O header "POSIÇÕES — {temaNome}" pode passar a mostrar "POSIÇÕES" sem o tema fixo quando houver múltiplas categorias:
```tsx
// Se todas as ensinadas são da mesma categoria → "POSIÇÕES — COSTAS"
// Se há múltiplas categorias → apenas "POSIÇÕES"
const categorias = [...new Set(tecnicas.map(t => t.categoria).filter(Boolean))]
const tituloHeader = categorias.length === 1 ? `POSIÇÕES — ${categorias[0]?.toUpperCase()}` : 'POSIÇÕES'
```

---

## B-053 · Busca de técnicas ad-hoc durante aula AO VIVO

### Problema raiz

`tecnicas-aula.tsx` usa `<select>` com todos os técnicas disponíveis. Com 100+ itens, é inutilizável no mobile.

### O que muda

**`src/app/(app)/aulas/[id]/tecnicas-aula.tsx` — substituir o bloco "Adicionar ad-hoc":**

```tsx
// REMOVER o bloco select + button existente

// ADICIONAR:
{aulaAberta && (
  <div>
    <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
      Adicionar posição
    </p>
    <BuscaTecnicaInline
      disponiveis={disponiveis}
      aulaId={aulaId}
      isPending={isPending}
      startTransition={startTransition}
    />
  </div>
)}
```

**Novo componente `BuscaTecnicaInline` (dentro do mesmo arquivo ou extraído):**

```tsx
function BuscaTecnicaInline({
  disponiveis, aulaId, isPending, startTransition
}: {
  disponiveis: Tecnica[]
  aulaId: string
  isPending: boolean
  startTransition: (fn: () => Promise<void>) => void
}) {
  const [busca, setBusca] = useState('')

  const resultados = busca.trim().length >= 2
    ? disponiveis
        .filter(t => t.nome.toLowerCase().includes(busca.toLowerCase()))
        .slice(0, 6)
    : []

  function handleAdicionar(id: string) {
    startTransition(async () => {
      await adicionarTecnicaAula(aulaId, id)
      setBusca('')
    })
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar posição..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        disabled={isPending}
        className="w-full px-3 py-2.5 rounded-xl text-sm"
        style={{
          background: 'var(--brand-surf)',
          border: '1px solid var(--brand-border)',
          color: 'var(--brand-texto)',
        }}
      />
      {resultados.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {resultados.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleAdicionar(t.id)}
              disabled={isPending}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border disabled:opacity-40"
              style={{
                background: 'var(--brand-surf)',
                borderColor: 'var(--brand-border)',
                color: 'var(--brand-texto-sec)',
              }}>
              {t.nome}
              {t.categoria && (
                <span className="ml-1 opacity-50 font-normal">· {t.categoria}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {busca.trim().length >= 2 && resultados.length === 0 && (
        <p className="mt-2 text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
          Nenhuma posição encontrada
        </p>
      )}
    </div>
  )
}
```

**Comportamento:**
- Mínimo 2 caracteres para mostrar resultados (evita lista enorme)
- Máximo 6 chips de resultado (não sobrecarrega a tela)
- Cada chip mostra nome + categoria em dim (ex: "Arm Trap · Costas")
- Toque em chip → `adicionarTecnicaAula(aulaId, t.id)` direto como `'ensinada'` (não `'planejada'`)
- Após adicionar, campo de busca limpa automaticamente

**Observação:** `adicionarTecnicaAula` precisa ser verificada — ela atualmente adiciona como `'planejada'` ou `'ensinada'`? Se adiciona como `'planejada'`, durante uma aula AO VIVO deveria adicionar já como `'ensinada'`. Verificar `tecnicas-actions.ts` e ajustar se necessário:
```ts
// tecnicas-actions.ts — adicionarTecnicaAula()
// Deve inserir com tipo='ensinada' quando adicionada durante aula aberta
// Verificar se a action recebe o status da aula ou se usa um param fixo
```

---

## B-054 · Duplicar aula

### Motivação

"A aula de 18h vai ser igual à das 9h. Mesmo que sejam outras turmas. Ele quer reaproveitar a seleção de técnicas e posições."

### Nova server action

**`src/app/(app)/aulas/actions.ts` — adicionar `duplicarAula()`:**

```ts
export async function duplicarAula(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: professor } = await supabase
    .from('professores').select('id, academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) return { error: 'Professor não encontrado.' }

  const aulaOrigemId = formData.get('aula_origem_id') as string
  const turmaId = (formData.get('turma_id') as string | null) || null
  const data_aula = formData.get('data') as string
  const hora_inicio = (formData.get('hora_inicio') as string | null) || null

  // Buscar aula original para copiar tema
  const { data: aulaOrigem } = await supabase
    .from('aulas')
    .select('tema_id, video_url, academia_id')
    .eq('id', aulaOrigemId)
    .eq('academia_id', professor.academia_id) // RLS extra: só duplica da própria academia
    .single()

  if (!aulaOrigem) return { error: 'Aula não encontrada.' }

  // Buscar técnicas PLANEJADAS da aula origem
  // (não copia ensinadas/nao_ensinadas — essas são resultado da aula executada)
  const { data: tecnicasOrigem } = await supabase
    .from('aula_tecnicas')
    .select('tecnica_id, reforco')
    .eq('aula_id', aulaOrigemId)
    .eq('tipo', 'planejada')

  // Criar nova aula
  const { data: novaAula, error } = await supabase
    .from('aulas')
    .insert({
      academia_id: professor.academia_id,
      professor_id: professor.id,
      turma_id: turmaId,
      data: data_aula,
      hora_inicio: hora_inicio || null,
      tema_id: aulaOrigem.tema_id,
      video_url: aulaOrigem.video_url,
      status: 'agendada', // sempre inicia como pendente
    })
    .select('id')
    .single()

  if (error || !novaAula) return { error: 'Erro ao criar aula duplicada.' }

  // Copiar técnicas planejadas
  if (tecnicasOrigem && tecnicasOrigem.length > 0) {
    await supabase.from('aula_tecnicas').insert(
      tecnicasOrigem.map(t => ({
        aula_id: novaAula.id,
        tecnica_id: t.tecnica_id,
        tipo: 'planejada',
        reforco: t.reforco,
      }))
    )
  }

  revalidatePath('/aulas')
  revalidatePath('/semana')
  revalidatePath('/dashboard')
  return { success: true, id: novaAula.id }
}
```

### UI — botão no detalhe da aula

**`src/app/(app)/aulas/[id]/page.tsx` — adicionar botão de duplicar no header:**

Novo client component `DuplicarAulaButton` para controlar o bottom sheet:

```tsx
// src/components/duplicar-aula-button.tsx
'use client'
import { useState, useTransition } from 'react'
import { Copy } from 'lucide-react'
import { duplicarAula } from '@/app/(app)/aulas/actions'
import { useRouter } from 'next/navigation'

export default function DuplicarAulaButton({
  aulaId,
  turmas,
}: {
  aulaId: string
  turmas: { id: string; nome: string }[]
}) {
  const [aberto, setAberto] = useState(false)
  const [turmaId, setTurmaId] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDuplicar() {
    const fd = new FormData()
    fd.set('aula_origem_id', aulaId)
    fd.set('turma_id', turmaId)
    fd.set('data', data)
    fd.set('hora_inicio', hora)

    startTransition(async () => {
      const result = await duplicarAula(fd)
      if (result?.id) {
        setAberto(false)
        router.push(`/aulas/${result.id}`)
      }
    })
  }

  return (
    <>
      {/* Botão no header */}
      <button
        onClick={() => setAberto(true)}
        title="Duplicar aula"
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
        <Copy size={16} />
      </button>

      {/* Bottom sheet */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setAberto(false) }}>
          <div className="rounded-t-2xl p-5 space-y-4"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <h2 className="font-bold uppercase tracking-wider text-sm"
              style={{ color: 'var(--brand-texto)' }}>
              Duplicar aula
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--brand-texto-muted)' }}>Turma</label>
              <select value={turmaId} onChange={e => setTurmaId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}>
                <option value="" className="bg-black">Mesma turma (ou avulsa)</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--brand-texto-muted)' }}>Data</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--brand-texto-muted)' }}>Hora</label>
                <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }} />
              </div>
            </div>

            <button
              onClick={handleDuplicar}
              disabled={!data || isPending}
              className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm disabled:opacity-40"
              style={{ background: 'var(--brand-gold)', color: '#000' }}>
              {isPending ? 'Duplicando...' : 'Duplicar aula'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
```

**Integrar no `aulas/[id]/page.tsx`:**

```tsx
// No servidor: buscar turmas da academia para o select
const { data: turmasParaDuplicar } = await supabase
  .from('turmas')
  .select('id, nome')
  .eq('academia_id', professor.academia_id)
  .eq('ativa', true)
  .order('nome')

// No header, ao lado do BackButton:
<div className="flex items-center gap-2 ml-auto">
  <DuplicarAulaButton aulaId={id} turmas={turmasParaDuplicar ?? []} />
</div>
```

O header ficará: `[← Back]  [Nome da Turma / status / data]  [📋 Duplicar]`

---

## Ordem de implementação

```
B-051 primeiro — 1 linha em actions.ts, 2 linhas no form, labels na semana/detail
B-052 segundo — maior mudança (form + detail page + tecnicas-aula)
B-053 terceiro — depende do B-052 (remove filtro de tema em disponiveis)
B-054 por último — nova action + novo componente, independente dos demais
```

---

## Resumo de arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/aulas/actions.ts` | `status` sempre `'agendada'`; push só em `abrirAulaAgendada`; nova fn `duplicarAula()` |
| `src/app/(app)/aulas/nova/form.tsx` | Botão → "SALVAR AULA"; picker multi-categoria; remover lógica `isAgendamento` |
| `src/app/(app)/aulas/[id]/page.tsx` | Badge "Pendente" vs "Agendada"; remover filtro de tema em `disponiveis`; injetar `DuplicarAulaButton` |
| `src/app/(app)/aulas/[id]/tecnicas-aula.tsx` | `BuscaTecnicaInline` substitui `<select>`; agrupar técnicas por categoria; título dinâmico |
| `src/app/(app)/semana/page.tsx` | Badge "Pendente" para aulas de hoje |
| `src/components/duplicar-aula-button.tsx` | NOVO — bottom sheet de duplicação |
| `src/app/(app)/aulas/[id]/tecnicas-actions.ts` | Verificar se `adicionarTecnicaAula` insere como `'ensinada'` quando aula está aberta |

**Sem migrations.** `agendada` já existe no constraint. Nenhum campo novo no schema.

---

## Critérios de aceite

- [ ] Professor cria aula para hoje → status `agendada` (badge "Pendente"), não vai direto para AO VIVO
- [ ] Botão no formulário diz "SALVAR AULA", não "ABRIR AULA"
- [ ] Na tela da aula `agendada`, o botão "Abrir" do `AulaAgendadaActions` existente funciona → aula vai para `aberta`
- [ ] View Semana mostra aulas `agendada` de hoje com badge "Pendente" e as técnicas planejadas
- [ ] Dashboard "Próximas aulas" inclui aulas `agendada` de hoje (verificar se query usa `gte` ou `gt`)
- [ ] No formulário de nova aula, professor seleciona técnicas de MÚLTIPLAS categorias
- [ ] Busca de posição no formulário: digitar "arm" → mostra "Arm Trap · Costas" e similares
- [ ] Técnicas ad-hoc durante aula AO VIVO: campo de busca substitui dropdown; max 6 resultados; chip com categoria dim
- [ ] Ad-hoc: após adicionar, campo limpa e técnica aparece em "ENSINADAS"
- [ ] Técnicas na aula AO VIVO agrupadas por categoria quando há múltiplas
- [ ] Botão de duplicar (ícone Copy) visível no header da tela da aula
- [ ] Duplicar: bottom sheet com turma + data + hora
- [ ] Duplicar: nova aula criada como `agendada` com as técnicas `planejadas` da original; técnicas `ensinada`/`nao_ensinada` NÃO copiadas
- [ ] Após duplicar: redirect para `/aulas/{novaAulaId}`

---

**feito com 🥋 por Vitim e Claude**
