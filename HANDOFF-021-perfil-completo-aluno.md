# HANDOFF-021 — Perfil Completo do Aluno

**Data:** 2026-07-17  
**Branch:** `feat/sprint24-perfil-aluno`  
**Base:** `main`  
**Épico:** EP-26 — Dados do Aluno  
**Cards:** B-081 · B-082 · B-083

---

## Contexto

Pedido direto do Mestre Naja:

> "seria bom mano pegar uns dados do aluno tipo nome completo, data de nascimento, se tem alguma doença ou algo assim / para eu poder saber o nome dele para graduar / e dar parabens no bigbig / tipo a Laura que é diabetica / importante o professor saber"

Necessidades concretas:
1. **Data de nascimento** — para saber a idade e dar os parabéns no aniversário
2. **Condições de saúde** — para o professor saber de alergias, diabetes, lesões crônicas, etc.
3. **Data de entrada na academia** — `matriculado_em` já existe no banco, mas não aparece no perfil do próprio aluno. Mostrar "na Naja desde [mês/ano]" e tempo de casa.
4. **Data de mensalidade** — dia do mês do vencimento (visual only, sem integração de pagamento). Ex: "Dia 10".
5. **Perfil incompleto** — sinalizar para o aluno quando falta preencher esses dados

---

## B-081 — Migration: `data_nascimento` + `condicoes_saude`

**Arquivo:** `supabase/migrations/20260717000001_perfil_aluno_saude.sql`

```sql
-- Adicionar campos ao perfil do aluno
ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS data_nascimento  DATE,
  ADD COLUMN IF NOT EXISTS condicoes_saude  TEXT,
  ADD COLUMN IF NOT EXISTS dia_mensalidade  SMALLINT CHECK (dia_mensalidade BETWEEN 1 AND 31);

COMMENT ON COLUMN alunos.data_nascimento  IS 'Data de nascimento — usada para aniversários e registro de graduação';
COMMENT ON COLUMN alunos.condicoes_saude  IS 'Condições de saúde relevantes para o treino (diabetes, asma, lesões, alergias). NULL = não preenchido. String vazia = sem condições.';
COMMENT ON COLUMN alunos.dia_mensalidade  IS 'Dia do mês do vencimento da mensalidade (1–31). Visual only — sem integração de pagamento.';
```

> **`matriculado_em`** já existe no schema (`TIMESTAMPTZ DEFAULT NOW()`). Não precisa de migration — só precisa aparecer no perfil do aluno e no professor de forma mais proeminente (ver B-082).

> **Sem novas políticas de RLS.** Ambas as colunas pertencem à tabela `alunos` que já tem:
> - Professor lê/escreve todos os alunos da própria academia
> - Aluno lê/escreve apenas o próprio registro (via `user_id`)
> 
> As políticas existentes já cobrem os dois novos campos.

---

## B-082 — Perfil expandido: professor vê + aluno edita

### 1. `src/lib/aluno-auth.ts` — adicionar campos ao tipo e query

```ts
export type AlunoBasico = {
  id: string
  nome: string
  faixa: string
  grau: number
  academia_id: string
  foto_url: string | null
  matriculado_em: string | null    // ← já existia, incluir no select
  data_nascimento: string | null   // ← novo
  condicoes_saude: string | null   // ← novo
  dia_mensalidade: number | null   // ← novo
}

// Na query, trocar:
.select('id, nome, faixa, grau, academia_id, foto_url')

// Por:
.select('id, nome, faixa, grau, academia_id, foto_url, matriculado_em, data_nascimento, condicoes_saude, dia_mensalidade')
```

> Isso faz os dois campos ficarem disponíveis automaticamente em todas as páginas que usam `getAlunoOuRedireciona()` — a home do aluno, o perfil e qualquer página futura.

---

### 2. `alunos/[id]/page.tsx` — professor vê os dados

**Query:** adicionar os novos campos ao select:

```ts
.select('id, nome, faixa, grau, email, telefone, ativo, matriculado_em, foto_url, data_nascimento, condicoes_saude, dia_mensalidade')
```

**Helper de aniversário:** calcular dias até o próximo aniversário e mostrar badge quando próximo:

```ts
function proximoAniversario(dataNasc: string | null): { diasAte: number; idade: number } | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc + 'T12:00:00')
  const idade = hoje.getFullYear() - nasc.getFullYear()

  const proxAniv = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate())
  if (proxAniv < hoje) proxAniv.setFullYear(hoje.getFullYear() + 1)

  const diasAte = Math.round((proxAniv.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  return { diasAte, idade: diasAte === 0 ? idade : idade - (proxAniv.getFullYear() > hoje.getFullYear() ? 1 : 0) }
}
```

**Seção "Dados pessoais"** — inserir logo após o bloco de contato (email/telefone):

```tsx
{/* Dados pessoais */}
{(aluno.data_nascimento || aluno.condicoes_saude !== null) && (
  <div className="space-y-2">
    <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
      Dados pessoais
    </p>

    {aluno.data_nascimento && (() => {
      const aniv = proximoAniversario(aluno.data_nascimento)
      const dataFormatada = new Date(aluno.data_nascimento + 'T12:00:00')
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      return (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              Nascimento
            </p>
            <p className="text-sm" style={{ color: 'var(--brand-texto-sec)' }}>
              {dataFormatada}
            </p>
            {aniv && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                {aniv.idade} anos
              </p>
            )}
          </div>
          {aniv && aniv.diasAte <= 7 && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-xl"
              style={{
                background: aniv.diasAte === 0
                  ? 'rgba(251,191,36,0.15)'
                  : 'var(--brand-gold-dim)',
                border: `1px solid ${aniv.diasAte === 0 ? 'rgba(251,191,36,0.5)' : 'var(--brand-gold-border)'}`,
                color: 'var(--brand-gold)',
              }}>
              {aniv.diasAte === 0 ? '🎂 Hoje!' : `🎂 em ${aniv.diasAte}d`}
            </span>
          )}
        </div>
      )
    })()}

    {aluno.condicoes_saude !== null && (
      <div className="px-4 py-3 rounded-2xl"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
          Saúde
        </p>
        <p className="text-sm" style={{ color: aluno.condicoes_saude ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
          {aluno.condicoes_saude || 'Nenhuma condição informada'}
        </p>
      </div>
    )}

    {aluno.dia_mensalidade && (
      <div className="px-4 py-3 rounded-2xl"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
          Mensalidade
        </p>
        <p className="text-sm" style={{ color: 'var(--brand-texto-sec)' }}>
          Dia {aluno.dia_mensalidade} de cada mês
        </p>
      </div>
    )}
  </div>
)}
```

> Se `data_nascimento` e `condicoes_saude` forem ambos null (aluno não preencheu), a seção não aparece — professor não vê um bloco vazio.

---

### 3. `alunos/[id]/editar.tsx` — professor também pode editar

**Adicionar props:**

```tsx
export default function EditarAlunoForm({
  alunoId, nomeAtual, emailAtual, telefoneAtual, ativo,
  dataNascimentoAtual,    // ← novo: string | null (formato 'YYYY-MM-DD')
  condicoesSaudeAtual,   // ← novo: string | null
  diaMensalidadeAtual,   // ← novo: number | null (1–31)
}: {
  // ...props anteriores...
  dataNascimentoAtual: string | null
  condicoesSaudeAtual: string | null
  diaMensalidadeAtual: number | null
}) {
  const [dataNascimento, setDataNascimento] = useState(dataNascimentoAtual ?? '')
  const [condicoesSaude, setCondicoesSaude] = useState(condicoesSaudeAtual ?? '')
  const [diaMensalidade, setDiaMensalidade] = useState(diaMensalidadeAtual?.toString() ?? '')
  // ...
```

**Adicionar campos no formulário (após telefone):**

```tsx
<div>
  <label className="block text-[10px] uppercase tracking-widest mb-1"
    style={{ color: 'var(--brand-texto-muted)' }}>
    Data de nascimento
  </label>
  <input
    type="date"
    value={dataNascimento}
    onChange={e => setDataNascimento(e.target.value)}
    className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
    style={{ border: '1px solid var(--brand-border-str)', colorScheme: 'dark' }}
  />
</div>

<div>
  <label className="block text-[10px] uppercase tracking-widest mb-1"
    style={{ color: 'var(--brand-texto-muted)' }}>
    Condições de saúde
  </label>
  <textarea
    value={condicoesSaude}
    onChange={e => setCondicoesSaude(e.target.value)}
    placeholder="Ex: diabetes tipo 1, lesão no joelho. Sem condições, deixe em branco."
    rows={2}
    className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none resize-none placeholder-white/20"
    style={{ border: '1px solid var(--brand-border-str)' }}
  />
</div>

<div>
  <label className="block text-[10px] uppercase tracking-widest mb-1"
    style={{ color: 'var(--brand-texto-muted)' }}>
    Dia da mensalidade
  </label>
  <input
    type="number"
    min={1}
    max={31}
    value={diaMensalidade}
    onChange={e => setDiaMensalidade(e.target.value)}
    placeholder="Ex: 10"
    className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
    style={{ border: '1px solid var(--brand-border-str)' }}
  />
  <p className="text-[9px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
    Dia do mês em que a mensalidade vence. Visual only.
  </p>
</div>
```

**Atualizar chamada do `handleSalvar`:**

```tsx
const res = await updateAluno(alunoId, nome, email, telefone, dataNascimento, condicoesSaude, diaMensalidade)
```

**Passar as novas props de `page.tsx` para o componente:**

```tsx
<EditarAlunoForm
  alunoId={aluno.id}
  nomeAtual={aluno.nome}
  emailAtual={aluno.email}
  telefoneAtual={aluno.telefone}
  ativo={aluno.ativo ?? true}
  dataNascimentoAtual={aluno.data_nascimento ?? null}
  condicoesSaudeAtual={aluno.condicoes_saude ?? null}
  diaMensalidadeAtual={aluno.dia_mensalidade ?? null}
/>
```

---

### 4. `alunos/[id]/actions.ts` — atualizar `updateAluno`

```ts
export async function updateAluno(
  alunoId: string,
  nome: string,
  email: string,
  telefone: string,
  dataNascimento: string,   // ← novo (string vazia = null no banco)
  condicoesSaude: string,   // ← novo (string vazia = '' no banco, não null)
  diaMensalidade: string,   // ← novo (string vazia = null no banco)
) {
  const nomeTrim = nome.trim()
  if (!nomeTrim) return { error: 'Nome é obrigatório.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('alunos')
    .update({
      nome: nomeTrim,
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      data_nascimento: dataNascimento.trim() || null,           // null se vazio
      condicoes_saude: condicoesSaude,                         // '' é válido (= sem condições)
      dia_mensalidade: diaMensalidade ? Number(diaMensalidade) || null : null,
    })
    .eq('id', alunoId)

  if (error) return { error: 'Erro ao atualizar aluno.' }
  revalidatePath(`/alunos/${alunoId}`)
  revalidatePath('/alunos')
  return { success: true }
}
```

> **Distinção importante:** `data_nascimento` vazio → `null` no banco (não preenchido). `condicoes_saude` vazio → `''` no banco (explicitamente sem condições). Isso diferencia "não preencheu" de "preencheu e não tem nada".

---

### 5. `aluno/perfil/page.tsx` — aluno edita o próprio perfil

Adicionar seção "Informações pessoais" como novo componente client inline ou componente separado `perfil-form.tsx`.

**Novo componente client:** `src/app/(app)/aluno/perfil/perfil-form.tsx`

```tsx
'use client'

import { useState, useTransition } from 'react'
import { updatePerfilProprio } from '../actions'

export default function PerfilForm({
  dataNascimentoAtual,
  condicoesSaudeAtual,
  diaMensalidadeAtual,
}: {
  dataNascimentoAtual: string | null
  condicoesSaudeAtual: string | null
  diaMensalidadeAtual: number | null
}) {
  const [open, setOpen] = useState(false)
  const [dataNascimento, setDataNascimento] = useState(dataNascimentoAtual ?? '')
  const [condicoesSaude, setCondicoesSaude] = useState(condicoesSaudeAtual ?? '')
  const [diaMensalidade, setDiaMensalidade] = useState(diaMensalidadeAtual?.toString() ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSalvar() {
    setError('')
    startTransition(async () => {
      const res = await updatePerfilProprio(dataNascimento, condicoesSaude, diaMensalidade)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <div className="px-4 py-4 rounded-2xl"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Informações pessoais
          </p>
          <button
            onClick={() => setOpen(true)}
            className="text-[10px] uppercase tracking-widest underline underline-offset-2 active:opacity-60"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Editar
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nascimento
            </p>
            <p className="text-sm mt-0.5" style={{ color: dataNascimentoAtual ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
              {dataNascimentoAtual
                ? new Date(dataNascimentoAtual + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Não informado'}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Saúde
            </p>
            <p className="text-sm mt-0.5" style={{ color: condicoesSaudeAtual !== null ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
              {condicoesSaudeAtual === null
                ? 'Não informado'
                : condicoesSaudeAtual || 'Nenhuma condição'}
            </p>
          </div>
          {diaMensalidadeAtual && (
            <div>
              <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                Mensalidade
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--brand-texto-sec)' }}>
                Dia {diaMensalidadeAtual}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Informações pessoais
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Data de nascimento
          </label>
          <input
            type="date"
            value={dataNascimento}
            onChange={e => setDataNascimento(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none"
            style={{ border: '1px solid var(--brand-border-str)', colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-1"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Condições de saúde
          </label>
          <textarea
            value={condicoesSaude}
            onChange={e => setCondicoesSaude(e.target.value)}
            placeholder="Ex: diabetes, asma, lesão no joelho. Se não tiver nenhuma, deixe em branco."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm text-white focus:outline-none resize-none placeholder-white/20"
            style={{ border: '1px solid var(--brand-border-str)' }}
          />
          <p className="text-[9px] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Visto pelo seu professor. Ajuda a ter um treino mais seguro.
          </p>
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSalvar} disabled={isPending}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
```

**Atualizar `aluno/perfil/page.tsx`:**

```tsx
// Adicionar import
import PerfilForm from './perfil-form'

// "Na academia desde" — mostrar no card de stats já existente ou como novo bloco:
const desde = aluno.matriculado_em
  ? new Date(aluno.matriculado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  : null

const tempoNaAcademia = aluno.matriculado_em
  ? (() => {
      const meses = Math.floor((Date.now() - new Date(aluno.matriculado_em).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
      if (meses < 1) return 'Menos de 1 mês'
      if (meses < 12) return `${meses} mês${meses > 1 ? 'es' : ''}`
      const anos = Math.floor(meses / 12)
      const resto = meses % 12
      return resto > 0 ? `${anos} ano${anos > 1 ? 's' : ''} e ${resto} mês${resto > 1 ? 'es' : ''}` : `${anos} ano${anos > 1 ? 's' : ''}`
    })()
  : null
```

Adicionar card "Tempo de casa" ao lado do "Total de aulas" (ou abaixo se preferir layout vertical):

```tsx
{desde && (
  <div className="rounded-2xl py-4 text-center"
    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
    <p className="text-sm font-bold leading-tight" style={{ color: 'var(--brand-gold)' }}>
      {tempoNaAcademia}
    </p>
    <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
      na academia · desde {desde}
    </p>
  </div>
)}
```

Inserir `<PerfilForm>` antes de `<LogoutButton />`:

```tsx
<PerfilForm
  dataNascimentoAtual={aluno.data_nascimento}
  condicoesSaudeAtual={aluno.condicoes_saude}
  diaMensalidadeAtual={aluno.dia_mensalidade}
/>
```

---

### 6. `aluno/actions.ts` — nova action `updatePerfilProprio`

```ts
export async function updatePerfilProprio(dataNascimento: string, condicoesSaude: string, diaMensalidade: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada.' }

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) return { error: 'Perfil não encontrado.' }

  const { error } = await supabase
    .from('alunos')
    .update({
      data_nascimento: dataNascimento.trim() || null,
      condicoes_saude: condicoesSaude,
      dia_mensalidade: diaMensalidade ? Number(diaMensalidade) || null : null,
    })
    .eq('id', aluno.id)

  if (error) return { error: 'Erro ao salvar informações.' }

  revalidatePath('/aluno/perfil')
  revalidatePath('/aluno')
  return { success: true }
}
```

---

## B-083 — Banner de perfil incompleto na home do aluno

**Arquivo:** `src/app/(app)/aluno/page.tsx`

**Lógica de perfil incompleto:**
- `data_nascimento === null` OU `condicoes_saude === null` → perfil incompleto
- `data_nascimento` preenchida E `condicoes_saude` não null (mesmo que `''`) → perfil completo

Como `getAlunoOuRedireciona()` vai retornar os dois campos (após a mudança em `aluno-auth.ts`), a verificação é simples:

```ts
const perfilIncompleto = !aluno.data_nascimento || aluno.condicoes_saude === null
```

**Banner — inserir logo após o `<header>` da página, antes do conteúdo:**

```tsx
{perfilIncompleto && (
  <Link href="/aluno/perfil"
    className="flex items-center justify-between mx-4 mt-4 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
    style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--brand-gold)' }}>
        Complete seu perfil
      </p>
      <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
        Adicione data de nascimento e informações de saúde
      </p>
    </div>
    <span className="text-sm flex-shrink-0 ml-3" style={{ color: 'var(--brand-gold)' }}>→</span>
  </Link>
)}
```

> O banner só aparece enquanto o perfil está incompleto. Depois que o aluno preenche os dois campos, some automaticamente.

---

## Resumo de arquivos modificados

| Arquivo | Card | O que muda |
|---|---|---|
| `supabase/migrations/20260717000001_perfil_aluno_saude.sql` | B-081 | **Novo.** `ALTER TABLE alunos ADD COLUMN data_nascimento DATE, condicoes_saude TEXT, dia_mensalidade SMALLINT` |
| `src/lib/aluno-auth.ts` | B-082 | `AlunoBasico` type + select incluem novos campos |
| `src/app/(app)/alunos/[id]/page.tsx` | B-082 | Select + seção "Dados pessoais" com aniversário + saúde |
| `src/app/(app)/alunos/[id]/editar.tsx` | B-082 | Props `dataNascimentoAtual` + `condicoesSaudeAtual` + dois novos inputs |
| `src/app/(app)/alunos/[id]/actions.ts` | B-082 | `updateAluno` aceita `dataNascimento` + `condicoesSaude` |
| `src/app/(app)/aluno/perfil/perfil-form.tsx` | B-082 | **Novo.** Formulário client de auto-edição |
| `src/app/(app)/aluno/perfil/page.tsx` | B-082 | Importa e renderiza `<PerfilForm />` |
| `src/app/(app)/aluno/actions.ts` | B-082 | Nova action `updatePerfilProprio` |
| `src/app/(app)/aluno/page.tsx` | B-083 | Banner dourado "Complete seu perfil" quando `perfilIncompleto` |

---

## Critérios de aceite (Sprint 24)

- [ ] Migration aplicada — `alunos.data_nascimento`, `condicoes_saude` e `dia_mensalidade` existem no banco
- [ ] Professor abre `/alunos/[id]` e vê nascimento (com idade) + saúde + mensalidade quando preenchidos
- [ ] Badge "🎂 Hoje!" ou "🎂 em Xd" aparece quando aniversário está em ≤7 dias
- [ ] Professor edita todos os campos em "Editar dados" na ficha do aluno
- [ ] Aluno abre `/aluno/perfil` e vê: tempo de casa + "na academia desde [mês/ano]"
- [ ] Aluno abre `/aluno/perfil` e vê seção "Informações pessoais" com botão Editar
- [ ] Aluno salva data de nascimento, condições de saúde e dia de mensalidade — reflete na ficha do professor
- [ ] Aluno sem `data_nascimento` ou `condicoes_saude` vê banner dourado na home do aluno
- [ ] Banner some automaticamente após preencher os dois campos
- [ ] `data_nascimento` vazia = null; `condicoes_saude` vazia = `''`; `dia_mensalidade` vazia = null

---

## Nota sobre privacidade (LGPD)

`condicoes_saude` contém dado sensível de saúde (categoria especial pela LGPD). A proteção vem das policies de RLS já existentes — só o professor da academia e o próprio aluno acessam o dado. Não expor esse campo em queries públicas, views ou funções sem `SECURITY DEFINER` com validação de academia.
