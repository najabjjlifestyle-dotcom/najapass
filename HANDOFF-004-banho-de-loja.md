# HANDOFF-004 — Banho de Loja (Mobile-First Makeover)

**Status:** Pronto para implementação  
**Data:** 2026-07-02  
**PM:** Claude.ai  
**Para:** Claude Code (CTO)

---

## Contexto

O rebranding visual (HANDOFF-003) foi aplicado no dashboard. Agora precisamos estender a consistência para TODAS as páginas e resolver os problemas estruturais de UX mobile. O app é PWA mobile-first — cada detalhe abaixo importa para experiência no celular.

Leia este HANDOFF do início ao fim antes de tocar no código. As correções têm dependências.

---

## 🚨 Bugs Críticos (corrigir primeiro)

### BUG-01 — Font: Arial no body

**Arquivo:** `src/app/globals.css` — linha 38  
**Problema:** `font-family: Arial, Helvetica, sans-serif;` sobrescreve o Geist Sans configurado no projeto.  
**Fix:**

```css
body {
  background: var(--brand-fundo);
  color: var(--brand-texto);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

---

### BUG-02 — Layout hardcoded `bg-black`

**Arquivo:** `src/app/(app)/layout.tsx` — linha 11  
**Problema:** `bg-black text-white` ignora os tokens de branding.  
**Fix:**

```tsx
return (
  <div className="min-h-screen" style={{ background: 'var(--brand-fundo)', color: 'var(--brand-texto)' }}>
    {children}
  </div>
)
```

---

### BUG-03 — Emoji icons no dashboard

**Arquivo:** `src/app/(app)/dashboard/page.tsx` — linhas 186–213  
**Problema:** Grid de ações usa emoji (`👥📋📅📨`) e links usam emoji (`📣📋`). Emojis são inconsistentes entre OS, não escalam e não respeitam o brand.

**Fix — substituir o mapa de cards:**

```tsx
import { Users, LayoutGrid, ClipboardList, InboxIcon, Megaphone, CalendarDays } from 'lucide-react'

// Grid de Ações
{[
  { href: '/alunos',      Icon: Users,          label: 'Alunos',      sub: `${totalAlunos ?? 0} ativos`, pendente: false },
  { href: '/turmas',      Icon: LayoutGrid,     label: 'Turmas',      sub: `${turmasAtivas ?? 0} turmas`, pendente: false },
  { href: '/aulas',       Icon: ClipboardList,  label: 'Histórico',   sub: ultimaAulaLabel(ultimaAula?.data ?? null), pendente: false },
  { href: '/solicitacoes',Icon: InboxIcon,      label: 'Solicitações',sub: pendentes > 0 ? `${pendentes} pendente${pendentes !== 1 ? 's' : ''}` : 'nenhuma pendente', pendente: pendentes > 0 },
].map(card => (
  <Link key={card.href} href={card.href} ...>
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ ... }}>
      <card.Icon size={15} />
    </div>
    ...
  </Link>
))}
```

**Fix — links Avisos e Semana:**

```tsx
// Avisos
import { Megaphone } from 'lucide-react'
<Megaphone size={18} style={{ color: 'var(--brand-gold)' }} />

// Técnicas da Semana  
import { CalendarDays } from 'lucide-react'
<CalendarDays size={18} style={{ color: 'var(--brand-gold)' }} />
```

---

## 🎨 Design Consistency — Páginas Secundárias

Todas as páginas abaixo usam `bg-black` hardcoded e botões `bg-white text-black`. Aplicar o padrão do dashboard em cada uma.

---

### DESIGN-01 — `/alunos/page.tsx`

**Problemas:**
1. `div.min-h-screen bg-black` → usar CSS var
2. Header: `border-b border-white/10` → `style={{ borderBottom: '1px solid var(--brand-border)' }}`
3. Botão "+ Novo": `bg-white text-black` → brand gold
4. Empty state: botão `bg-white text-black` → brand gold
5. Cards de aluno: `border border-white/10 bg-white/5` → CSS vars

**Fix padrão para o container:**
```tsx
<div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
```

**Fix botão "+ Novo" e "Cadastrar primeiro aluno":**
```tsx
className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider"
style={{ background: 'var(--brand-gold)', color: '#000' }}
```

**Fix cards de aluno:**
```tsx
className="flex items-center gap-3 px-4 py-3 rounded-2xl active:scale-[0.98] transition-transform"
style={{
  background: 'var(--brand-surf)',
  border: '1px solid var(--brand-border)',
}}
```

---

### DESIGN-02 — `/turmas/page.tsx`

Mesmos problemas que `/alunos`. Aplicar os mesmos fixes:
1. Container: `bg-black` → CSS var
2. Botões `bg-white` → brand gold
3. Cards: `border-white/10 bg-white/5` → CSS vars

---

### DESIGN-03 — `/aluno/page.tsx` (portal do aluno)

**Problemas:**
1. Container: `bg-black` → CSS var
2. Header: `border-b border-white/10` → CSS var
3. "Conta não vinculada" empty state: `bg-black` → CSS var
4. Cards de turma: `border-white/10 bg-white/5` → CSS vars
5. Cards de presença recente: `border-white/5` → CSS var
6. Avisos usam `rgba(200,169,110,0.1)` e `rgba(200,169,110,0.3)` hardcoded → `var(--brand-gold-dim)` e `var(--brand-gold-border)`
7. Técnicas da semana: `background: 'rgba(200,169,110,0.15)'` → `var(--brand-gold-dim)`, border → `var(--brand-gold-border)`
8. Frequência: `border-white/10 bg-white/5 text-center` → CSS vars
9. `fontFamily: 'var(--font-oswald)'` — verificar se Oswald está carregado no layout raiz. Se não estiver, remover e usar `font-bold tracking-wider` (Geist Bold fica bem)

**Fix geral:**
```tsx
// Substituir padrão em todos os cards:
// DE:  className="... border border-white/10 bg-white/5"
// PARA:
style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}

// Avisos — DE:
style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)' }}
// PARA:
style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}
```

---

### DESIGN-04 — `/aulas/[id]/attendance-list.tsx`

**Problemas:**
1. Botão "Finalizar Aula": `hover:bg-white hover:text-black` → ao hover usar brand gold, não branco
2. Botões "+ Visitante" e "+ Aluno de outra turma": `border-white/20 text-white/70` → CSS vars
3. Botões "Add" dentro dos forms: `bg-white text-black` → brand gold
4. Card de aluno **presente**: `bg-white border-white` com `text-black` — este é o toggle state principal. Considerar alternativa: fundo brand gold (ou brand surf com borda gold) para manter identidade, mas legível. Proposta:

```tsx
// Estado PRESENTE:
style={{
  background: 'var(--brand-gold)',
  border: '1px solid var(--brand-gold)',
}}
// texto do nome:
style={{ color: '#000' }}

// Estado AUSENTE:
style={{
  background: 'var(--brand-surf)',
  border: '1px solid var(--brand-border)',
}}
// texto do nome:
style={{ color: 'var(--brand-texto)' }}
```

5. Checkmark do presente: `border-black bg-black text-white` quando em fundo gold → manter assim (contrasta bem)

**Fix botão "Finalizar Aula":**
```tsx
className="px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 transition-colors"
style={{
  border: '1px solid var(--brand-gold-border)',
  color: 'var(--brand-gold)',
  background: 'transparent',
}}
// onMouseEnter/hover: usar Tailwind hover: não funciona com CSS vars — usar className com data-state ou simplesmente deixar o estilo acima
```

---

## 📱 Mobile-First — Problemas Estruturais

### MOBILE-01 — CRÍTICO: Sem Bottom Navigation

**Problema:** O app não tem navegação persistente. Para ir de Alunos → Histórico → Dashboard, o professor precisa dar 2-3 passos para trás. Em um celular durante o treino, isso é inaceitável.

**Solução: Bottom Nav Bar no layout do professor**

Criar `src/components/bottom-nav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',  Icon: LayoutDashboard, label: 'Início' },
  { href: '/alunos',     Icon: Users,           label: 'Alunos' },
  { href: '/aulas',      Icon: ClipboardList,   label: 'Histórico' },
  { href: '/perfil',     Icon: User,            label: 'Perfil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: 'var(--brand-surf)',
        borderTop: '1px solid var(--brand-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      }}>
      {NAV_ITEMS.map(({ href, Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            style={{ color: active ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ opacity: active ? 1 : 0.5 }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
```

**Wiring no layout:**

```tsx
// src/app/(app)/layout.tsx
import BottomNav from '@/components/bottom-nav'

return (
  <div className="min-h-screen" style={{ background: 'var(--brand-fundo)', color: 'var(--brand-texto)' }}>
    <div className="pb-16">  {/* espaço para o bottom nav */}
      {children}
    </div>
    <BottomNav />
  </div>
)
```

**Importante:** O bottom nav é somente para o professor. O portal do aluno (`/aluno`) tem layout próprio — não incluir bottom nav lá (o aluno usa o app de forma mais simples).

---

### MOBILE-02 — Safe Area Insets (iOS PWA)

**Problema:** Em iPhone com home indicator, o conteúdo fica embaixo da barra. O `pb-10` atual não é suficiente nem consistente.

**Fix no `globals.css` — adicionar após o `:root`:**

```css
/* iOS safe areas */
@supports (padding: env(safe-area-inset-bottom)) {
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

**Fix nas páginas com `pb-10` no final:** substituir por `pb-safe` ou `pb-20` (que cobre tanto o bottom nav quanto o safe area). Com o bottom nav fixo no layout, o `pb-16` no wrapper já resolve — mas verifique se o conteúdo das páginas internas tem `pb-8` extra para respirar acima do nav.

---

### MOBILE-03 — Touch Targets Pequenos

**Problema:** O back arrow `←` como texto simples tem área de toque inferior a 44px (mínimo iOS HIG).

**Fix — substituir o padrão de back button em todas as páginas:**

```tsx
// DE (atual em alunos, turmas, aulas, etc.):
<Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>

// PARA — target de 44x44 mínimo:
import { ChevronLeft } from 'lucide-react'

<Link
  href="/dashboard"
  className="flex items-center justify-center w-10 h-10 rounded-full active:scale-90 transition-transform"
  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
  <ChevronLeft size={18} style={{ color: 'var(--brand-texto-muted)' }} />
</Link>
```

Aplicar em: `/alunos`, `/turmas`, `/aulas`, `/aulas/[id]`, `/avisos`, `/solicitacoes`, `/tecnicas`, `/semana`, `/relatorios`, `/perfil`, `/professores`, e qualquer outra página com back arrow.

---

### MOBILE-04 — Botões de Ação com `active:` Feedback

**Problema:** Em mobile, sem hover, o único feedback visual de toque é o `active:scale-[0.98]`. Verificar que TODOS os botões e cards clicáveis têm esse class.

**Padrão obrigatório para qualquer elemento clicável:**
```tsx
className="... active:scale-[0.98] transition-transform"
// ou para botões:
className="... active:opacity-80 transition-opacity"
```

O dashboard já aplica isso nos cards e no CTA. Estender para todas as páginas.

---

### MOBILE-05 — `pt-12` → Safe Area Top

**Situação atual:** Os headers usam `pt-12` para compensar o notch/câmera. Isso funciona na maioria dos iPhones mas pode ser insuficiente em modelos com Dynamic Island.

**Fix progressivo (não quebra nada):**
```tsx
// No globals.css, adicionar:
.pt-safe {
  padding-top: max(3rem, env(safe-area-inset-top));
}
```

Então nas páginas: substituir `pt-12` por `className="pt-safe"` ou manter `pt-12` como fallback aceitável por enquanto (prioridade baixa).

---

## 🔧 Outros Problemas Menores

### MINOR-01 — Oswald Font

**Problema:** Várias páginas usam `style={{ fontFamily: 'var(--font-oswald)' }}` mas o dashboard não usa isso — usa apenas Geist Bold com `tracking-wider`. Verificar se Oswald está importado em `src/app/layout.tsx` (root layout).

- **Se Oswald está carregado:** manter, mas padronizar — ou usa em tudo ou remove de tudo.
- **Se Oswald NÃO está carregado:** remover todas as ocorrências e usar `font-bold tracking-wider` (Geist Bold). Busca global: `fontFamily: 'var(--font-oswald)'` → remover.

**Recomendação PM:** Manter consistência com o dashboard (que não usa Oswald e ficou bom). Remover Oswald de todas as páginas secundárias.

---

### MINOR-02 — Indicador de Status no Header do Aluno

**Arquivo:** `src/app/(app)/aluno/page.tsx` — linha 201  
**Problema:** O header do aluno usa `border-b border-white/10` hardcoded.  
**Fix:**
```tsx
style={{ borderBottom: '1px solid var(--brand-border)' }}
```

---

### MINOR-03 — `/tecnicas` não aparece no dashboard

**Observação:** A rota `/tecnicas` existe mas não está linkada no dashboard nem no bottom nav proposto acima. O Kanban marca como "quebrada" — mas ela existe como rota.

**Verificar:** O link para `/tecnicas` provavelmente deveria aparecer como ação rápida em `/aulas/[id]` (dentro de "Técnicas da Aula") ou como item de menu. Por ora, não adicionar ao bottom nav (4 itens está bom). Se o professor precisar acessar, é via fluxo de aula.

**Ação:** Verificar se dentro de `/aulas/[id]/tecnicas-aula.tsx` há um link/botão para cadastrar nova técnica (`/tecnicas/nova`). Se não tiver, adicionar um link.

---

### MINOR-04 — Faixa Colors via CSS Custom Props

**Arquivo:** `src/app/(app)/alunos/page.tsx` (e outros com `FAIXA_COR`)  
**Situação:** As cores de faixa usam classes Tailwind (`bg-blue-400`, `bg-purple-400`). Isso funciona, mas viola o "sem hardcode" do design system.

**Decisão PM:** Manter como está por agora. As cores de faixa são padrão BJJ universal e não mudam com o white-label. Não priorizar nesta sprint.

---

## ✅ Ordem de Execução Recomendada

```
1. BUG-01  globals.css font                          (2 min)
2. BUG-02  layout.tsx bg-black                       (2 min)  
3. BUG-03  Dashboard emoji → Lucide                  (15 min)
4. MOBILE-01  Criar BottomNav + wiring no layout     (30 min)
5. DESIGN-01  /alunos consistency                    (10 min)
6. DESIGN-02  /turmas consistency                    (10 min)
7. MOBILE-03  Back buttons → touch targets           (20 min, todas as páginas)
8. DESIGN-03  /aluno portal consistency              (15 min)
9. DESIGN-04  attendance-list toggle state           (20 min)
10. MINOR-01  Oswald cleanup                          (10 min busca global)
11. MOBILE-02  Safe area CSS                          (5 min)
12. MINOR-02  Aluno header border                     (2 min)
13. MINOR-03  /tecnicas link check                    (10 min)
```

**Estimativa total:** ~2.5 horas de implementação

---

## Critério de Aceite

Quando terminar, o app deve passar neste checklist visual:

- [ ] Todas as telas têm fundo `#080808` (não `#000000` puro)
- [ ] Nenhuma tela tem botão primário branco (exceto estado de aluno presente no toggle)
- [ ] Bottom nav aparece em todas as páginas do professor
- [ ] Back buttons são tocáveis com polegar sem precisar de precisão
- [ ] Fonte é Geist Sans (não Arial) — verificar no DevTools → Elements → body
- [ ] Nenhum emoji de UI visível (emoji de faixa em presença ainda pode existir se houver)
- [ ] Gold `#C8A96E` é o único accent de interface

---

## Arquivos a Tocar

```
src/app/globals.css
src/app/(app)/layout.tsx
src/app/(app)/dashboard/page.tsx
src/app/(app)/alunos/page.tsx
src/app/(app)/turmas/page.tsx
src/app/(app)/aluno/page.tsx
src/app/(app)/aulas/[id]/attendance-list.tsx
src/components/bottom-nav.tsx              ← NOVO
```

Páginas com back arrow a atualizar (apenas o botão, não o conteúdo):
```
src/app/(app)/alunos/page.tsx
src/app/(app)/turmas/page.tsx
src/app/(app)/aulas/page.tsx
src/app/(app)/aulas/[id]/page.tsx
src/app/(app)/avisos/page.tsx
src/app/(app)/solicitacoes/page.tsx
src/app/(app)/tecnicas/page.tsx
src/app/(app)/semana/page.tsx
src/app/(app)/relatorios/page.tsx
src/app/(app)/perfil/page.tsx
```

---

*HANDOFF-004 — preparado por Claude.ai (PM) em 2026-07-02*  
*Baseado em leitura direta do código-fonte em najapass/*
