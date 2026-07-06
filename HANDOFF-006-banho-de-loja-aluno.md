# HANDOFF-006 — Banho de Loja: Portal do Aluno

**Status:** Pronto para implementação  
**Data:** 2026-07-02  
**PM:** Claude.ai  
**Para:** Claude Code (CTO)  
**Arquivos principais:** `src/app/(app)/aluno/page.tsx`, `aluno/checkin.tsx`, `aluno/push-subscribe.tsx`

---

## Contexto

O portal do aluno tem os mesmos problemas de token do restante do app (bg-black, Oswald, rgba hardcoded), mas tem também três problemas de experiência que são mais graves:

1. **Header identitário fraco.** A faixa aparece como uma barrinha lateral escondida. A identidade do aluno — seu nome, sua faixa, seu grau — deveria estar no centro visual da tela de entrada.
2. **Check-in não tem hierarquia.** A ação mais importante (confirmar presença em aula ao vivo) não se destaca o suficiente. O card existe, mas está no meio de outros elementos.
3. **Estado sem aula é frustrante.** "Nenhuma aula ativa no momento" é um beco sem saída. O aluno fecha o app. O correto é mostrar o próximo treino e a contagem do mês — algo que motive.

Este HANDOFF resolve os três, além dos fixes de token.

---

## Princípio de design do portal do aluno

**O professor usa o app para operar. O aluno usa para se sentir parte.**

A hierarquia de informação deve responder a uma só pergunta: *"tem aula hoje?"*  
- **Sim:** check-in domina a tela.  
- **Não:** header com identidade + próximo treino + contagem do mês.

---

## FIX-01 — Header: identidade visual da faixa

**Arquivo:** `src/app/(app)/aluno/page.tsx`

Substituir o header atual (faixa como barra vertical lateral) por:

```tsx
// Mapa hex das faixas (para a fita do topo)
const FAIXA_HEX: Record<string, string> = {
  branca:  '#FFFFFF',
  cinza:   '#9CA3AF',
  amarela: '#FBBF24',
  laranja: '#F97316',
  verde:   '#16A34A',
  azul:    '#2563EB',
  roxa:    '#7C3AED',
  marrom:  '#92400E',
  preta:   '#111111',
}

// Header
<header>
  {/* Fita de cor da faixa — identidade imediata */}
  <div
    style={{
      height: 3,
      background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF',
    }}
  />

  <div
    className="flex items-center gap-3 px-5 pt-4 pb-4"
    style={{ borderBottom: '1px solid var(--brand-border)' }}>
    
    {/* Avatar */}
    <AvatarUpload
      alunoId={aluno.id}
      nome={aluno.nome}
      fotoUrlAtual={aluno.foto_url}
      persist={updateFotoPropria}
      size={44}
    />

    {/* Nome e faixa */}
    <div className="flex-1 min-w-0">
      <h1 className="text-[20px] font-bold leading-tight truncate" style={{ color: 'var(--brand-texto)' }}>
        {aluno.nome.split(' ')[0]}
      </h1>
      <div className="flex items-center gap-1.5 mt-0.5">
        <div
          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF' }}
        />
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand-texto-muted)' }}>
          {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
        </p>
      </div>
    </div>

    {/* Push notification como ícone — não texto underline */}
    <PushSubscribeButton />
  </div>
</header>
```

---

## FIX-02 — Push subscribe: ícone em vez de texto underline

**Arquivo:** `src/app/(app)/aluno/push-subscribe.tsx`

O botão atual é `text-[10px] underline` — toque muito pequeno e invisível como ação.

Substituir por um ícone de sino com estado claro:

```tsx
// Em vez do botão de texto, renderizar:

if (status === 'denied') {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      title="Notificações bloqueadas"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      {/* Bell off icon — Lucide BellOff */}
      <BellOff size={16} style={{ color: 'var(--brand-texto-muted)' }} />
    </div>
  )
}

return (
  <button
    onClick={status === 'subscribed' ? desativar : ativar}
    disabled={loading}
    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
    title={status === 'subscribed' ? 'Desativar notificações' : 'Ativar notificações'}
    style={{
      background: status === 'subscribed' ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
      border: `1px solid ${status === 'subscribed' ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
    }}>
    {/* Bell / BellOff icon — Lucide */}
    {loading
      ? <span style={{ fontSize: 12, color: 'var(--brand-texto-muted)' }}>…</span>
      : status === 'subscribed'
        ? <Bell size={16} style={{ color: 'var(--brand-gold)' }} />
        : <BellOff size={16} style={{ color: 'var(--brand-texto-muted)' }} />
    }
  </button>
)

// Imports necessários:
import { Bell, BellOff } from 'lucide-react'
```

---

## FIX-03 — Check-in: hierarquia correta

**Arquivo:** `src/app/(app)/aluno/checkin.tsx`

O componente já usa CSS vars e está bem estruturado. Dois ajustes:

**3a. Botão de toggle com loading textual → spinner visual:**

```tsx
// DE:
{loading ? '⟳' : checked ? '✓' : '○'}

// PARA:
{loading
  ? <span className="animate-spin block w-4 h-4 border-2 rounded-full"
      style={{ borderColor: 'var(--brand-gold)', borderTopColor: 'transparent' }} />
  : checked
    ? <Check size={20} />
    : <Circle size={20} />
}
// import { Check, Circle } from 'lucide-react'
```

**3b. Exibição na página — seção com título mais chamativo:**

Em `aluno/page.tsx`, a seção de check-in ganha título diferenciado e aparece **antes de tudo**:

```tsx
{aulasAtivas.length > 0 && (
  <section className="px-5 pt-5 space-y-3">
    {/* Título urgente */}
    <div className="flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
        style={{ background: 'var(--brand-gold)' }}
      />
      <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--brand-gold)' }}>
        Aula ao vivo agora
      </p>
    </div>
    {aulasAtivas.map(aula => (
      <CheckinCard key={aula.id} aula={aula} jaFezCheckin={checkinSet.has(aula.id)} />
    ))}
  </section>
)}
```

---

## FIX-04 — Estado sem aula: próximo treino + contagem do mês

**Arquivo:** `src/app/(app)/aluno/page.tsx`

Substituir:

```tsx
// DE (atual):
{aulasAtivas.length === 0 && turmas.length === 0 && (presencasData ?? []).length === 0 && (
  <div className="text-center py-16">
    <p className="text-white/30 text-sm uppercase tracking-widest"
      style={{ fontFamily: 'var(--font-oswald)' }}>
      Nenhuma aula ativa no momento
    </p>
  </div>
)}
```

Por uma lógica mais rica:

```tsx
// Se não há aula ativa, mas há turmas cadastradas:
{aulasAtivas.length === 0 && turmas.length > 0 && (
  <section className="px-5 pt-5">
    <div
      className="rounded-2xl px-5 py-4 text-center"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        Nenhuma aula ao vivo agora
      </p>
      {proximoTreino && (
        <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--brand-texto)' }}>
          Próximo treino: <span style={{ color: 'var(--brand-gold)' }}>{proximoTreino}</span>
        </p>
      )}
      {(presencas30 ?? 0) > 0 && (
        <p className="text-[11px] mt-3" style={{ color: 'var(--brand-texto-muted)' }}>
          <span style={{ color: 'var(--brand-gold)', fontWeight: 700, fontSize: 18 }}>
            {presencas30}
          </span>
          {' '}treinos este mês
        </p>
      )}
    </div>
  </section>
)}
```

**Calcular `proximoTreino`** no Server Component (antes do `return`):

```typescript
// Descobre o próximo dia de treino com base nos dias_semana das turmas do aluno
const DIAS_MAP: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3,
  quinta: 4, sexta: 5, sabado: 6,
}
const DIAS_LABEL: Record<string, string> = {
  domingo: 'domingo', segunda: 'segunda', terca: 'terça',
  quarta: 'quarta', quinta: 'quinta', sexta: 'sexta', sabado: 'sábado',
}

function calcularProximoTreino(turmas: typeof turmas): string | null {
  const hoje = new Date().getDay() // 0 = domingo
  const diasTreino = new Set(
    turmas.flatMap(t => (t.dias_semana ?? []).map(d => DIAS_MAP[d]))
  )
  if (diasTreino.size === 0) return null

  for (let i = 1; i <= 7; i++) {
    const dia = (hoje + i) % 7
    if (diasTreino.has(dia)) {
      const label = Object.entries(DIAS_MAP).find(([, v]) => v === dia)?.[0]
      return label ? DIAS_LABEL[label] : null
    }
  }
  return null
}

const proximoTreino = calcularProximoTreino(turmas)
```

---

## FIX-05 — Token consistency (mesmo padrão do HANDOFF-004)

**Arquivo:** `src/app/(app)/aluno/page.tsx`

Aplicar em todo o arquivo:

| De | Para |
|---|---|
| `className="min-h-screen bg-black"` | `style={{ background: 'var(--brand-fundo)' }}` |
| `border border-white/10 bg-white/5` | `style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}` |
| `border-white/5` | `style={{ borderBottom: '1px solid var(--brand-border)' }}` |
| `style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)' }}` | `style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}` |
| `style={{ background: 'rgba(200,169,110,0.15)', ... }}` | `style={{ background: 'var(--brand-gold-dim)', ... }}` |
| `color: '#C8A96E'` hardcoded | `color: 'var(--brand-gold)'` |
| `fontFamily: 'var(--font-oswald)'` | remover — Geist Bold com `font-bold tracking-wider` resolve |
| `text-white/40`, `text-white/60` | `style={{ color: 'var(--brand-texto-muted)' }}` |

---

## FIX-06 — Dias da turma: chips com gold em vez de branco apagado

**Arquivo:** `src/app/(app)/aluno/page.tsx` — seção "Minhas turmas"

```tsx
// DE:
<span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
  {DIAS_ABBR[d] ?? d}
</span>

// PARA:
<span
  className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
  style={{
    background: 'var(--brand-gold-dim)',
    color: 'var(--brand-gold)',
    border: '1px solid var(--brand-gold-border)',
  }}>
  {DIAS_ABBR[d] ?? d}
</span>
```

---

## FIX-07 — Frequência: números maiores e mais prominentes

**Arquivo:** `src/app/(app)/aluno/page.tsx` — seção "Meu histórico"

```tsx
// DE: text-2xl dentro de grid cols-2
// PARA: mesma estrutura, mas número maior e centralizado

<div className="grid grid-cols-2 gap-2">
  {[
    { valor: presencas30 ?? 0, label: 'últimos 30 dias' },
    { valor: presencas90 ?? 0, label: 'últimos 90 dias' },
  ].map(stat => (
    <div
      key={stat.label}
      className="rounded-2xl py-5 text-center"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <p className="text-[28px] font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>
        {stat.valor}
      </p>
      <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
        {stat.label}
      </p>
    </div>
  ))}
</div>

{diasDesdeUltima !== null && (
  <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--brand-texto-muted)' }}>
    Último treino:{' '}
    <span style={{ color: 'var(--brand-texto)' }}>
      {diasDesdeUltima === 0 ? 'hoje' : diasDesdeUltima === 1 ? 'ontem' : `${diasDesdeUltima} dias atrás`}
    </span>
  </p>
)}
```

---

## FIX-08 — "Conta não vinculada" empty state

**Arquivo:** `src/app/(app)/aluno/page.tsx` — linhas 40-53

```tsx
// DE:
<div className="min-h-screen bg-black flex items-center justify-center px-6">

// PARA:
<div className="min-h-screen flex items-center justify-center px-6"
  style={{ background: 'var(--brand-fundo)' }}>
  <div className="text-center">
    {/* Ícone */}
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <UserX size={28} style={{ color: 'var(--brand-texto-muted)' }} />
    </div>
    <p className="font-bold text-lg uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
      Conta não vinculada
    </p>
    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--brand-texto-muted)' }}>
      Peça ao seu professor para cadastrar seu e-mail no sistema.
    </p>
  </div>
</div>
// import { UserX } from 'lucide-react'
```

---

## Ordem de execução

```
1. FIX-05  Token cleanup (bg-black, rgba, white/10, Oswald)     (20 min)
2. FIX-01  Header redesign com fita de faixa                     (20 min)
3. FIX-02  PushSubscribeButton → ícone Bell/BellOff              (15 min)
4. FIX-06  Chips de dias com gold                                 (5 min)
5. FIX-07  Frequência com número maior                           (10 min)
6. FIX-03  Check-in: spinner Lucide + título urgente             (15 min)
7. FIX-04  Estado sem aula: próximo treino + contagem do mês     (20 min)
8. FIX-08  "Conta não vinculada" com Lucide icon                 (5 min)
```

**Estimativa total:** ~1.5h

---

## Critério de aceite

- [ ] Fita colorida da faixa aparece no topo da tela ao abrir o portal
- [ ] Ícone de sino visível no header (não texto underline)
- [ ] Check-in com pulsing dot "Aula ao vivo agora" quando há aula ativa
- [ ] Tela sem aula ativa mostra "Próximo treino: quinta-feira" (ou equivalente)
- [ ] Números de frequência (30/90 dias) são os elementos mais visíveis da seção
- [ ] Zero `fontFamily: 'var(--font-oswald)'` no arquivo
- [ ] Zero `bg-black` hardcoded
- [ ] Zero `rgba(200,169,110,...)` hardcoded — tudo via CSS vars
- [ ] `npx tsc --noEmit` sem erros

---

## Arquivos a tocar

```
src/app/(app)/aluno/page.tsx          ← principal (FIX-01, 04, 05, 06, 07, 08)
src/app/(app)/aluno/checkin.tsx       ← FIX-03
src/app/(app)/aluno/push-subscribe.tsx ← FIX-02
```

Nenhuma migration, nenhuma query nova, nenhum componente novo criado — só reorganização visual com o que já existe.

---

*HANDOFF-006 — preparado por Claude.ai (PM) em 2026-07-02*  
*Portal do Aluno — EP-12 UX Mobile*
