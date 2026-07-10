# HANDOFF-013 — Filtro por Tema + Histórinhas

**Sprint:** 17  
**Branch:** `feat/sprint17-historinhas`  
**A partir de:** `feat/sprint16-nav-planejamento` (após merge)  
**Cards:** B-062 · B-063  
**Status:** Aguardando implementação

---

## Contexto

Duas melhorias no fluxo de planejamento de aula:

**B-062** — Hoje o professor seleciona "Tema: Cem Quilos" mas o picker de técnicas continua mostrando TODAS as categorias (50/50, Chave de Pé, Costas…). Confuso. Quando o tema está definido, o picker deve focar só naquele tema.

**B-063** — "Histórinhas": o professor monta sequências de técnicas que contam uma história de treino. Ex: "Passar a guarda → Cem Quilos → Montada → a pessoa por baixo raspa". Ele dá um nome, salva, e pode aplicar essa sequência inteira numa aula com um toque.

---

## B-062 · Picker de técnicas filtrado pelo tema selecionado

### O que muda

**Arquivo:** `src/app/(app)/aulas/nova/form.tsx`

Quando `temaId` está definido, o picker de categorias deve:
1. Mostrar apenas a categoria que corresponde ao tema selecionado (expandida por padrão)
2. Esconder todas as outras categorias
3. Exibir um aviso sutil de que outras técnicas estão ocultas

Quando `temaId` é `null` / vazio → comportamento atual (todas as categorias visíveis).

### Mudança no componente do picker

O picker hoje itera sobre `categorias` para renderizar os colapsáveis. A mudança é aplicar um filtro antes desse map:

```tsx
// No form.tsx — onde o picker é renderizado
// Antes: todas as categorias
// Depois: filtrado pelo tema quando selecionado

const categoriasVisiveis = temaId
  ? categorias.filter(cat => cat.id === temaId)
  : categorias

// Dentro do picker, troca `categorias.map(...)` por `categoriasVisiveis.map(...)`

// Abaixo das categorias filtradas, quando temaId está ativo:
{temaId && (
  <p className="text-center text-[10px] py-2" style={{ color: 'var(--brand-texto-muted)' }}>
    Filtrando por tema · 
    <button
      type="button"
      onClick={() => setTemaId(null)}
      className="underline ml-1"
      style={{ color: 'var(--brand-gold)' }}>
      Ver todas
    </button>
  </p>
)}
```

### Auto-expansão da categoria do tema

Quando `temaId` é definido, a categoria correspondente deve expandir automaticamente (sem precisar de um toque):

```tsx
// O picker usa um estado local `expandidas: Set<string>` ou similar.
// Quando temaId muda, auto-expandir:
useEffect(() => {
  if (temaId) {
    setExpandidas(prev => new Set([...prev, temaId]))
  }
}, [temaId])
```

### Critérios de aceite B-062

- [ ] Selecionar "Cem Quilos" como tema → picker mostra APENAS categoria "Cem Quilos", expandida
- [ ] Técnicas de outras categorias ficam ocultas (não na lista, não no scroll)
- [ ] Link "Ver todas" abaixo do picker limpa o temaId e restaura todas as categorias
- [ ] Quando tema está vazio → comportamento idêntico ao atual (todas as categorias)
- [ ] Chips selecionados de outras categorias NÃO são removidos ao filtrar (só a exibição muda)
- [ ] Seleção prévia de chips permanece visível nos chips flutuantes no topo mesmo ao filtrar

---

## B-063 · Histórinhas — sequências de técnicas

### O conceito

Uma Historinha é uma sequência ordenada de técnicas que conta uma progressão de Jiu-Jitsu. O professor cria antes das aulas. Aplica na aula com um toque.

```
"Passagem Toreando"
  └→ Toreando → Cem Quilos → Americana → Kimura → North-South Choke

"Raspagem da Meia Guarda"
  └→ Meia Guarda → Sweep do Elevador → Montada → Armbar
```

### Migration

```sql
-- supabase/migrations/XXXX_historinhas.sql

CREATE TABLE historinhas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE historinha_tecnicas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historinha_id UUID NOT NULL REFERENCES historinhas(id) ON DELETE CASCADE,
  tecnica_id    UUID NOT NULL REFERENCES tecnicas(id),
  ordem         INT NOT NULL DEFAULT 0,
  UNIQUE (historinha_id, tecnica_id)
);

-- RLS
ALTER TABLE historinhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historinha_tecnicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professor vê historinhas da sua academia"
  ON historinhas FOR SELECT
  USING (
    academia_id IN (
      SELECT academia_id FROM professores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "professor gerencia historinhas da sua academia"
  ON historinhas FOR ALL
  USING (
    academia_id IN (
      SELECT academia_id FROM professores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "professor vê tecnicas de historinhas da sua academia"
  ON historinha_tecnicas FOR SELECT
  USING (
    historinha_id IN (
      SELECT h.id FROM historinhas h
      JOIN professores p ON p.academia_id = h.academia_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "professor gerencia tecnicas de historinhas"
  ON historinha_tecnicas FOR ALL
  USING (
    historinha_id IN (
      SELECT h.id FROM historinhas h
      JOIN professores p ON p.academia_id = h.academia_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX idx_historinhas_academia ON historinhas(academia_id);
CREATE INDEX idx_historinha_tecnicas_historinha ON historinha_tecnicas(historinha_id, ordem);
```

### Rotas novas

```
/historinhas              → lista de historinhas da academia
/historinhas/nova         → criar historinha
/historinhas/[id]/editar  → editar historinha
```

### Page: `/historinhas/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function HistorinhasPage() {
  const supabase = await createClient()
  // ... auth check ...

  const { data: historinhas } = await supabase
    .from('historinhas')
    .select('id, nome, historinha_tecnicas(ordem, tecnicas(nome))')
    .eq('academia_id', professor.academia_id)
    .order('nome')

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div>
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Histórinhas
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
            Sequências de técnicas para suas aulas
          </p>
        </div>
        <Link href="/historinhas/nova"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          <Plus size={14} strokeWidth={2.5} />
          Nova
        </Link>
      </header>

      <main className="px-5 pt-4 pb-24 space-y-3">
        {historinhas?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma historinha ainda
            </p>
            <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
              Crie sequências de técnicas para reutilizar nas aulas
            </p>
          </div>
        )}

        {historinhas?.map(h => {
          const tecnicas = [...(h.historinha_tecnicas ?? [])]
            .sort((a, b) => a.ordem - b.ordem)
            .map(ht => ht.tecnicas?.nome)
            .filter(Boolean)

          return (
            <Link key={h.id} href={`/historinhas/${h.id}/editar`}
              className="block px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="font-bold text-sm mb-2" style={{ color: 'var(--brand-texto)' }}>
                {h.nome}
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--brand-texto-muted)' }}>
                {tecnicas.join(' → ')}
              </p>
              <p className="text-[9px] mt-1.5" style={{ color: 'var(--brand-gold)' }}>
                {tecnicas.length} técnica{tecnicas.length !== 1 ? 's' : ''}
              </p>
            </Link>
          )
        })}
      </main>
    </div>
  )
}
```

### Page: `/historinhas/nova/page.tsx` e `/historinhas/[id]/editar/page.tsx`

Ambas usam o mesmo form component. A de edição carrega os dados existentes.

```tsx
// src/app/(app)/historinhas/nova/page.tsx
import HistorinhaForm from '../historinha-form'
export default function NovaHistorinhaPage() {
  return <HistorinhaForm />
}

// src/app/(app)/historinhas/[id]/editar/page.tsx
import { createClient } from '@/lib/supabase/server'
import HistorinhaForm from '../../historinha-form'

export default async function EditarHistorinhaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: historinha } = await supabase
    .from('historinhas')
    .select('id, nome, historinha_tecnicas(ordem, tecnica_id, tecnicas(id, nome, categorias_tecnicas(nome)))')
    .eq('id', params.id)
    .single()

  if (!historinha) redirect('/historinhas')

  const tecnicasOrdenadas = [...(historinha.historinha_tecnicas ?? [])]
    .sort((a, b) => a.ordem - b.ordem)

  return (
    <HistorinhaForm
      id={historinha.id}
      nomeInicial={historinha.nome}
      tecnicasIniciais={tecnicasOrdenadas.map(ht => ({
        id: ht.tecnica_id,
        nome: ht.tecnicas?.nome ?? '',
        categoria: ht.tecnicas?.categorias_tecnicas?.nome ?? '',
      }))}
    />
  )
}
```

### Componente `HistorinhaForm` (Client Component)

```tsx
// src/app/(app)/historinhas/historinha-form.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, X } from 'lucide-react'
import { salvarHistorinha, deletarHistorinha } from './actions'
import BuscaTecnicaInline from '@/components/busca-tecnica-inline'

type TecninaItem = { id: string; nome: string; categoria: string }

type Props = {
  id?: string
  nomeInicial?: string
  tecnicasIniciais?: TecninaItem[]
}

export default function HistorinhaForm({ id, nomeInicial = '', tecnicasIniciais = [] }: Props) {
  const router = useRouter()
  const [nome, setNome] = useState(nomeInicial)
  const [tecnicas, setTecnicas] = useState<TecninaItem[]>(tecnicasIniciais)
  const [salvando, setSalvando] = useState(false)

  function adicionarTecnica(tecnica: TecninaItem) {
    if (tecnicas.some(t => t.id === tecnica.id)) return // deduplicar
    setTecnicas(prev => [...prev, tecnica])
  }

  function removerTecnica(id: string) {
    setTecnicas(prev => prev.filter(t => t.id !== id))
  }

  // Drag to reorder — simplified swap on long press
  // Para mobile: botões ↑ ↓ em vez de drag-and-drop
  function moverParaCima(index: number) {
    if (index === 0) return
    setTecnicas(prev => {
      const arr = [...prev]
      ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
      return arr
    })
  }

  function moverParaBaixo(index: number) {
    if (index === tecnicas.length - 1) return
    setTecnicas(prev => {
      const arr = [...prev]
      ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
      return arr
    })
  }

  async function handleSalvar() {
    if (!nome.trim()) return
    setSalvando(true)
    await salvarHistorinha({
      id,
      nome: nome.trim(),
      tecnicas: tecnicas.map((t, i) => ({ tecnica_id: t.id, ordem: i })),
    })
    router.push('/historinhas')
  }

  async function handleDeletar() {
    if (!id) return
    if (!confirm('Excluir esta historinha?')) return
    await deletarHistorinha(id)
    router.push('/historinhas')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      {/* Header */}
      <header className="px-5 pt-safe pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <button onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{ background: 'var(--brand-surf)' }}>
          ←
        </button>
        <h1 className="font-bold text-lg uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          {id ? 'Editar Historinha' : 'Nova Historinha'}
        </h1>
      </header>

      <main className="px-5 pt-5 pb-36 space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-[9px] uppercase tracking-widest mb-2"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Nome da historinha
          </label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Passagem Toreando"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--brand-surf)',
              border: '1px solid var(--brand-border)',
              color: 'var(--brand-texto)',
            }}
          />
        </div>

        {/* Sequência atual */}
        <div>
          <label className="block text-[9px] uppercase tracking-widest mb-3"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Sequência de técnicas ({tecnicas.length})
          </label>

          {tecnicas.length === 0 && (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--brand-texto-muted)' }}>
              Adicione técnicas abaixo para montar a sequência
            </p>
          )}

          <div className="space-y-2">
            {tecnicas.map((t, i) => (
              <div key={t.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                {/* Ordem */}
                <span className="text-[10px] font-bold w-5 text-center flex-shrink-0"
                  style={{ color: 'var(--brand-gold)' }}>
                  {i + 1}
                </span>

                {/* Nome + categoria */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
                    {t.nome}
                  </p>
                  <p className="text-[9px] truncate" style={{ color: 'var(--brand-texto-muted)' }}>
                    {t.categoria}
                  </p>
                </div>

                {/* Controles de ordem */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moverParaCima(i)}
                    disabled={i === 0}
                    className="w-6 h-5 flex items-center justify-center rounded text-[10px]"
                    style={{ color: i === 0 ? 'var(--brand-border)' : 'var(--brand-texto-muted)' }}>
                    ↑
                  </button>
                  <button onClick={() => moverParaBaixo(i)}
                    disabled={i === tecnicas.length - 1}
                    className="w-6 h-5 flex items-center justify-center rounded text-[10px]"
                    style={{ color: i === tecnicas.length - 1 ? 'var(--brand-border)' : 'var(--brand-texto-muted)' }}>
                    ↓
                  </button>
                </div>

                {/* Remover */}
                <button onClick={() => removerTecnica(t.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ color: '#ef4444' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Preview da sequência */}
          {tecnicas.length >= 2 && (
            <div className="mt-3 px-3 py-2 rounded-xl"
              style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-gold)' }}>
                Sequência
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--brand-texto)' }}>
                {tecnicas.map(t => t.nome).join(' → ')}
              </p>
            </div>
          )}
        </div>

        {/* Busca de técnica */}
        <div>
          <label className="block text-[9px] uppercase tracking-widest mb-2"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Adicionar técnica
          </label>
          <BuscaTecnicaInline
            onSelect={(tecnica) => adicionarTecnica({
              id: tecnica.id,
              nome: tecnica.nome,
              categoria: tecnica.categoria ?? '',
            })}
            placeholder="Buscar técnica..."
            excluirIds={tecnicas.map(t => t.id)}
          />
        </div>
      </main>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 space-y-2"
        style={{
          background: 'var(--brand-surf)',
          borderTop: '1px solid var(--brand-border)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}>
        <button
          onClick={handleSalvar}
          disabled={!nome.trim() || tecnicas.length === 0 || salvando}
          className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-40"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {salvando ? 'Salvando…' : 'Salvar historinha'}
        </button>
        {id && (
          <button onClick={handleDeletar}
            className="w-full py-3 rounded-xl text-xs font-bold"
            style={{ color: '#ef4444' }}>
            Excluir historinha
          </button>
        )}
      </div>
    </div>
  )
}
```

### Server Actions: `src/app/(app)/historinhas/actions.ts`

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type SalvarHistorinhaInput = {
  id?: string
  nome: string
  tecnicas: { tecnica_id: string; ordem: number }[]
}

export async function salvarHistorinha(data: SalvarHistorinhaInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: prof } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .single()
  if (!prof?.academia_id) throw new Error('Professor não encontrado')

  if (data.id) {
    // UPDATE
    await supabase
      .from('historinhas')
      .update({ nome: data.nome })
      .eq('id', data.id)
      .eq('academia_id', prof.academia_id) // RLS extra — garante ownership

    // Substituir técnicas (delete all + insert)
    await supabase.from('historinha_tecnicas').delete().eq('historinha_id', data.id)
    if (data.tecnicas.length > 0) {
      await supabase.from('historinha_tecnicas').insert(
        data.tecnicas.map(t => ({ historinha_id: data.id!, ...t }))
      )
    }
  } else {
    // INSERT
    const { data: nova } = await supabase
      .from('historinhas')
      .insert({ nome: data.nome, academia_id: prof.academia_id })
      .select('id')
      .single()

    if (nova && data.tecnicas.length > 0) {
      await supabase.from('historinha_tecnicas').insert(
        data.tecnicas.map(t => ({ historinha_id: nova.id, ...t }))
      )
    }
  }

  revalidatePath('/historinhas')
}

export async function deletarHistorinha(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: prof } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .single()
  if (!prof?.academia_id) throw new Error('Professor não encontrado')

  // ON DELETE CASCADE em historinha_tecnicas — apaga os filhos automaticamente
  await supabase
    .from('historinhas')
    .delete()
    .eq('id', id)
    .eq('academia_id', prof.academia_id)

  revalidatePath('/historinhas')
}
```

### Integração no formulário de nova aula

**Arquivo:** `src/app/(app)/aulas/nova/form.tsx`

Adicionar seção "HISTÓRINHAS" antes do picker de técnicas:

```tsx
// Props extras que chegam no form (query no page.tsx):
// historinhas: Array<{ id, nome, historinha_tecnicas: [{ ordem, tecnica_id, tecnicas: { id, nome } }] }>

// Estado local
const [historinaExpandida, setHistorinaExpandida] = useState<string | null>(null)

// Aplicar historinha: adiciona todas as técnicas dela como selecionadas
function aplicarHistorinha(historinha: Historinha) {
  const tecnicasOrdenadas = [...historinha.historinha_tecnicas]
    .sort((a, b) => a.ordem - b.ordem)

  const idsNovos = tecnicasOrdenadas
    .map(ht => ht.tecnica_id)
    .filter(id => !tecnicasSelecionadas.includes(id))

  setTecnicasSelecionadas(prev => [...prev, ...idsNovos])
}
```

```tsx
{/* Seção de Histórinhas — acima do picker de técnicas */}
{historinhas && historinhas.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Histórinhas
      </label>
      <Link href="/historinhas"
        className="text-[10px]"
        style={{ color: 'var(--brand-gold)' }}>
        Gerenciar →
      </Link>
    </div>

    <div className="space-y-2">
      {historinhas.map(h => {
        const tecnicas = [...h.historinha_tecnicas]
          .sort((a, b) => a.ordem - b.ordem)
        const jaAplicada = tecnicas.every(ht => tecnicasSelecionadas.includes(ht.tecnica_id))

        return (
          <div key={h.id}
            className="px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
                  {h.nome}
                </p>
                <p className="text-[9px] truncate mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  {tecnicas.map(ht => ht.tecnicas?.nome).join(' → ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => jaAplicada ? null : aplicarHistorinha(h)}
                className="ml-3 px-3 py-1.5 rounded-lg text-[10px] font-bold flex-shrink-0"
                style={{
                  background: jaAplicada ? 'transparent' : 'var(--brand-gold)',
                  color: jaAplicada ? '#4ADE80' : '#000',
                  border: jaAplicada ? '1px solid rgba(74,222,128,0.3)' : 'none',
                }}>
                {jaAplicada ? '✓ Aplicada' : 'Aplicar'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}
```

**Query adicional no `page.tsx` de nova aula:**

```ts
const { data: historinhas } = await supabase
  .from('historinhas')
  .select('id, nome, historinha_tecnicas(ordem, tecnica_id, tecnicas(id, nome))')
  .eq('academia_id', professor.academia_id)
  .order('nome')
```

### Acesso às histórinhas

Adicionar link em `/perfil` na seção "Mais" (onde já existem Técnicas, Relatórios etc):

```tsx
<Link href="/historinhas">
  <span>Histórinhas</span>
  <span>Sequências de técnicas →</span>
</Link>
```

Ou via `BuscaTecnicaInline` — o professor cria as historinhas antes e as encontra no form da aula.

---

## Ordem de implementação

```
B-062 primeiro — 1 arquivo, ~5 linhas de mudança, zero risk
B-063 segundo  — migration + 4 arquivos novos + integração no form
```

---

## Resumo de migrations

| Migration | Conteúdo |
|---|---|
| `XXXX_historinhas.sql` | Tabelas `historinhas` + `historinha_tecnicas` + RLS + índices |

---

## Arquivos em B-062

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/aulas/nova/form.tsx` | Filtro `categoriasVisiveis` por `temaId` + `useEffect` auto-expansão + link "Ver todas" |

## Arquivos em B-063

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/XXXX_historinhas.sql` | NOVA migration |
| `src/app/(app)/historinhas/page.tsx` | NOVA rota — lista |
| `src/app/(app)/historinhas/nova/page.tsx` | NOVA rota — criar |
| `src/app/(app)/historinhas/[id]/editar/page.tsx` | NOVA rota — editar |
| `src/app/(app)/historinhas/historinha-form.tsx` | NOVO componente client |
| `src/app/(app)/historinhas/actions.ts` | NOVAS actions: `salvarHistorinha`, `deletarHistorinha` |
| `src/app/(app)/aulas/nova/form.tsx` | + seção Histórinhas + `aplicarHistorinha()` + query |
| `src/app/(app)/aulas/nova/page.tsx` | + query `historinhas` passada pro form |
| `src/app/(app)/perfil/page.tsx` | + link "Histórinhas" na seção "Mais" |

---

## Critérios de aceite

**B-062:**
- [ ] Selecionando um tema → picker filtra para apenas essa categoria
- [ ] Categoria do tema expandida automaticamente ao selecionar o tema
- [ ] Link "Ver todas" abaixo do picker → limpa filtro, restaura todas as categorias
- [ ] Chips já selecionados de outras categorias não são removidos (apenas ficam ocultos no picker)
- [ ] Sem tema → comportamento idêntico ao atual

**B-063:**
- [ ] Professor consegue criar historinha com nome + sequência de técnicas ordenada
- [ ] Botões ↑/↓ reordenam as técnicas
- [ ] Técnica duplicada não é adicionada duas vezes (deduplicação por `tecnica_id`)
- [ ] Preview "A → B → C" aparece quando há 2+ técnicas
- [ ] Salvar historinha: persiste no banco com RLS correto (só a academia vê)
- [ ] Editar historinha carrega dados existentes, reordena, salva
- [ ] Excluir historinha com confirmação
- [ ] No form de nova aula: seção "Histórinhas" aparece quando academia tem historinhas
- [ ] Botão "Aplicar" adiciona TODAS as técnicas da historinha às selecionadas
- [ ] Quando todas as técnicas já estão selecionadas: botão mostra "✓ Aplicada"
- [ ] Link "Gerenciar →" no form abre `/historinhas`
- [ ] `/perfil` tem link para `/historinhas` na seção "Mais"

---

**feito com 🥋 por Vitim e Claude**
