# HANDOFF-017 — Banho de Loja: Selects → Pickers + Turmas com Dados

**Data:** 2026-07-13  
**Branch:** `feat/sprint21-banho-loja-selects`  
**Base:** `main`  
**Épico:** EP-23 — UX Mobile: eliminar selects nativos nos fluxos críticos  
**Cards:** B-075 · B-076

---

## ⚠️ Fix urgente antes de implementar: insights_turma não aplicada no Supabase

O arquivo `supabase/migrations/20260713000001_insights_turma.sql` existe localmente mas **não foi aplicado ao banco**. Por isso os insights da página `/planejamento` retornam `null` e as seções não renderizam.

**Solução:** abrir o Supabase dashboard → SQL Editor → colar e executar o conteúdo completo do arquivo `supabase/migrations/20260713000001_insights_turma.sql`.

Não é bug de código. É migration pendente.

---

## Contexto

O maior problema de UX do app hoje está no fluxo mais crítico: **abrir uma aula**.

O formulário de nova aula usa dois `<select>` nativos — Turma e Tema. No iOS, um select abre uma gaveta de roda que cobre metade da tela. Lento, feio, interrompe o flow.

O professor abre esse formulário todo treino. É a tela que mais importa ser fluida.

Outros dois pontos de melhoria identificados na auditoria:
- **Turmas list** mostra só nome + dias, sem dados. O professor não sabe o tamanho de cada turma sem entrar nela.
- **Aluno avulso** na lista de presença também usa `<select>`.

---

## B-075 — Nova Aula: turma como cards, tema como chips

### Turma — de `<select>` para cards tappable

**Arquivo:** `src/app/(app)/aulas/nova/form.tsx`

**Remover** o bloco do `<select name="turma_id">` e substituir por grade de cards:

```tsx
{turmas.length > 0 && (
  <div>
    <label className="block text-xs uppercase tracking-widest mb-3"
           style={{ color: 'var(--brand-texto-muted)' }}>
      Turma
    </label>

    {/* Sem turma */}
    <button
      type="button"
      onClick={() => handleTurmaChange('')}
      className="w-full text-left px-4 py-3 rounded-xl mb-2 transition-all active:scale-[0.98]"
      style={!turmaId
        ? { background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }
        : { background: 'transparent', border: '1px solid var(--brand-border)' }
      }>
      <p className="text-sm font-bold" style={{ color: !turmaId ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
        Sem turma específica
      </p>
    </button>

    {/* Uma linha por turma */}
    {turmas.map(t => {
      const ativa = turmaId === t.id
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => handleTurmaChange(t.id)}
          className="w-full text-left px-4 py-3 rounded-xl mb-2 transition-all active:scale-[0.98]"
          style={ativa
            ? { background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }
            : { background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }
          }>
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm" style={{ color: ativa ? 'var(--brand-gold)' : 'var(--brand-texto)' }}>
              {t.nome}
            </p>
            {ativa && (
              <span className="text-[10px] font-bold" style={{ color: 'var(--brand-gold)' }}>✓</span>
            )}
          </div>
        </button>
      )
    })}

    {/* Reforços da turma selecionada */}
    {reforcosComNome.length > 0 && (
      <p className="text-xs mt-1" style={{ color: '#FBBF24' }}>
        🔁 {reforcosComNome.length} posição{reforcosComNome.length > 1 ? 'ões' : ''} de reforço pré-selecionada{reforcosComNome.length > 1 ? 's' : ''}
      </p>
    )}
  </div>
)}
```

> `handleTurmaChange` já existe no form e lida com reforços — só mudar como é chamada (onClick no card ao invés de onChange no select).

---

### Tema — de `<select>` para chips horizontais

**Remover** o `<select name="tema_id">` e substituir por strip de chips com scroll:

```tsx
<div>
  <div className="flex items-center justify-between mb-3">
    <label className="text-xs uppercase tracking-widest"
           style={{ color: 'var(--brand-texto-muted)' }}>
      Tema da aula
    </label>
    <button type="button" onClick={() => setShowNovoTema(v => !v)}
      className="text-xs underline underline-offset-2"
      style={{ color: 'var(--brand-texto-muted)' }}>
      + Novo tema
    </button>
  </div>

  {/* Strip de chips — scroll horizontal */}
  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
    {/* "Sem tema" */}
    <button
      type="button"
      onClick={() => setTemaId('')}
      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96]"
      style={!temaId
        ? { background: 'var(--brand-gold)', color: '#000' }
        : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
      }>
      Geral
    </button>

    {temasList.map(t => {
      const ativo = temaId === t.id
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => setTemaId(t.id)}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96]"
          style={ativo
            ? { background: 'var(--brand-gold)', color: '#000' }
            : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
          }>
          {t.nome}
        </button>
      )
    })}
  </div>

  {/* Campo oculto para o FormData — crítico para o server action receber o tema_id */}
  <input type="hidden" name="tema_id" value={temaId} />

  {/* Criar novo tema (já existia) */}
  {showNovoTema && (
    <div className="flex gap-2 mt-3">
      {/* ...mesmo código existente... */}
    </div>
  )}
</div>
```

> **Importante:** como os chips são `<button type="button">`, o tema não vai pro FormData via `name`. O `<input type="hidden" name="tema_id" value={temaId} />` garante que o valor chegue na action. Verificar se já existe no form — se existir, não duplicar.

---

### Aluno avulso na lista de presença

**Arquivo:** `src/app/(app)/aulas/[id]/attendance-list.tsx`

O `<select>` de aluno avulso (para adicionar aluno que não é da turma) também abre o picker nativo. Como a lista de "outros alunos" pode ser pequena, a substituição aqui é simples:

**Substituir o `<select value={avulsoId}>` por uma lista de botões expansível:**

```tsx
{showAvulsoForm && (
  <div className="mb-4 space-y-1.5">
    {outrosAlunos.map(a => (
      <button
        key={a.id}
        type="button"
        onClick={() => setAvulsoId(prev => prev === a.id ? '' : a.id)}
        className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
        style={avulsoId === a.id
          ? { background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)', color: 'var(--brand-gold)', fontWeight: 700 }
          : { background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }
        }>
        {a.nome}
      </button>
    ))}
    <button
      onClick={handleAddAvulso}
      disabled={addingAvulso || !avulsoId}
      className="w-full py-2.5 text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 transition-transform active:scale-[0.98]"
      style={{ background: 'var(--brand-gold)', color: '#000' }}>
      {addingAvulso ? '...' : 'Adicionar à lista'}
    </button>
  </div>
)}
```

> Se `outrosAlunos` for vazio, manter a mensagem "Todos os alunos da academia já estão nesta turma" ou similar.

---

## B-076 — Turmas lista: contagem de alunos ativos

**Arquivo:** `src/app/(app)/turmas/page.tsx`

### 1. Adicionar contagem de alunos à query

```ts
// Trocar:
const { data: turmas } = await supabase
  .from('turmas')
  .select('id, nome, dias_semana, horario, ativa')
  .eq('academia_id', professor.academia_id)
  .order('nome')

// Por:
const { data: turmas } = await supabase
  .from('turmas')
  .select('id, nome, dias_semana, horario, ativa, alunos_turmas(id)')
  .eq('academia_id', professor.academia_id)
  .eq('alunos_turmas.ativo', true)   // só alunos ativos na turma
  .order('nome')
```

> **Atenção:** Supabase/PostgREST filtra o array aninhado mas não o pai — turmas sem alunos continuam aparecendo, com `alunos_turmas: []`.

### 2. Tipar corretamente

```ts
type TurmaRow = {
  id: string
  nome: string
  dias_semana: string[] | null
  horario: string | null
  ativa: boolean
  alunos_turmas: { id: string }[]
}
```

### 3. Mostrar contagem no card

```tsx
<Link key={turma.id} href={`/turmas/${turma.id}`}
  className="block px-4 py-4 rounded-2xl active:scale-[0.98] transition-transform"
  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

  <div className="flex items-center justify-between">
    <p className="font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
      {turma.nome}
    </p>
    {/* contagem de alunos */}
    <span className="text-xs font-bold flex-shrink-0"
          style={{ color: 'var(--brand-texto-muted)' }}>
      {(turma as TurmaRow).alunos_turmas?.length ?? 0} alunos
    </span>
  </div>

  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
    {(turma.dias_semana as string[] | null)?.map(d => (
      <span key={d} className="text-[10px] px-2 py-0.5 rounded"
            style={{ color: 'var(--brand-texto-sec)', background: 'var(--brand-surf-2)' }}>
        {DIAS_ABBR[d] ?? d}
      </span>
    ))}
    {turma.horario && (
      <span className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
        · {(turma.horario as string).substring(0, 5)}
      </span>
    )}
    {!turma.ativa && (
      <span className="text-[10px] ml-auto uppercase tracking-wider"
            style={{ color: 'var(--brand-texto-muted)' }}>
        Inativa
      </span>
    )}
  </div>
</Link>
```

---

## Resumo das mudanças

| Arquivo | Card | O que muda |
|---|---|---|
| `aulas/nova/form.tsx` | B-075 | `<select>` turma → cards; `<select>` tema → chips + hidden input |
| `aulas/[id]/attendance-list.tsx` | B-075 | `<select>` avulso → lista de botões |
| `turmas/page.tsx` | B-076 | Query + `alunos_turmas(id)` + contagem no card |

---

## Critérios de aceite (Sprint 21)

- [ ] Em `/aulas/nova`, selecionar turma = tocar num card (sem select nativo)
- [ ] Turma selecionada fica com borda gold + checkmark; outras ficam escuras
- [ ] Temas da aula = chips horizontais com scroll; chip selecionado fica gold
- [ ] Troca de tema ainda filtra as técnicas no picker (comportamento B-062 preservado)
- [ ] Adicionar aluno avulso na lista de presença = lista de botões, sem select
- [ ] `/turmas` mostra "X alunos" em cada card
- [ ] iOS: nenhum picker nativo aparece nos fluxos acima

---

*Selects nativos existem em outros lugares (cadastro de aluno, editar turma, avisos) — esses são fluxos secundários e podem esperar sprints futuras. O foco aqui é o fluxo que o professor usa todo dia.*
