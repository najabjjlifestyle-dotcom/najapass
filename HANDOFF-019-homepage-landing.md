# HANDOFF-019 — Homepage: Landing Page do NajaPass

**Data:** 2026-07-17  
**Branch:** `feat/sprint23-homepage`  
**Base:** `main`  
**Épico:** EP-25 — Homepage / Marketing  
**Cards:** B-079

---

## Contexto

Hoje o `src/app/page.tsx` faz redirect imediato: usuário não logado → `/login`. Não existe nenhuma apresentação do produto. Quem recebe o link do app pela primeira vez cai direto numa tela de login sem entender o que é o NajaPass.

A homepage resolve isso. Para usuário não autenticado, mostra um pitch curto + dois CTAs. Para usuário autenticado, redireciona como hoje (dashboard/onboarding/aluno).

---

## B-079 — Homepage landing para novos usuários

### Objetivo

Usuário não logado que acessa `/` vê:
- Branding do NajaBJJ (cobra + nome)
- Tagline do produto
- Proposta de valor curta para professores e alunos
- Dois CTAs: **"Sou Professor"** e **"Sou Aluno"**

Usuário já logado continua sendo redirecionado normalmente (zero mudança de comportamento para quem já tem conta).

---

### 1. Modificar `src/app/page.tsx`

Hoje o arquivo tem:
```ts
if (!user) redirect('/login')
```

Substituir por renderização condicional — se não logado, retorna o componente de landing:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing-page'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Usuário logado: redirecionar como antes
  if (user) {
    const { data: professor } = await supabase
      .from('professores')
      .select('id, academia_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (professor?.academia_id) redirect('/dashboard')
    if (professor) redirect('/onboarding')

    const { data: aluno } = await supabase
      .from('alunos')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    redirect(aluno ? '/aluno' : '/boas-vindas')
  }

  // Não logado: mostrar landing
  return <LandingPage />
}
```

---

### 2. Criar `src/components/landing-page.tsx`

Componente Server Component (sem 'use client' — só Links estáticos, sem interatividade).

**Design completo:**

```tsx
import Link from 'next/link'
import Image from 'next/image'

export function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--brand-fundo)' }}
    >

      {/* ── Cobra ── */}
      <div className="flex justify-center pt-12">
        <div className="relative">
          <Image
            src="/cobra.webp"
            alt="NajaBJJ"
            width={140}
            height={140}
            className="object-contain select-none"
            priority
          />
          {/* fade bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: 'linear-gradient(to top, var(--brand-fundo), transparent)' }}
          />
        </div>
      </div>

      {/* ── Branding ── */}
      <div className="text-center px-6 pt-2 pb-8">
        <h1
          className="text-3xl font-bold uppercase tracking-widest"
          style={{ color: 'var(--brand-texto)' }}
        >
          NajaBJJ
        </h1>
        <p
          className="text-[10px] uppercase tracking-[0.4em] mt-0.5"
          style={{ color: 'var(--brand-texto-muted)' }}
        >
          NajaPass
        </p>
      </div>

      {/* ── Pitch ── */}
      <div className="flex-1 px-6 space-y-4">

        {/* Tagline */}
        <p
          className="text-center text-lg font-bold leading-snug"
          style={{ color: 'var(--brand-texto)' }}
        >
          A evolução do Jiu-Jitsu,<br />
          registrada treino após treino.
        </p>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--brand-border)' }} />

        {/* Bloco Professor */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}
        >
          <p
            className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
            style={{ color: 'var(--brand-gold)' }}
          >
            Para Professores
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--brand-texto-sec)' }}
          >
            Abra aulas, registre técnicas e acompanhe quem está evoluindo — em menos de um minuto por treino.
          </p>
        </div>

        {/* Bloco Aluno */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}
        >
          <p
            className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
            style={{ color: 'var(--brand-gold)' }}
          >
            Para Alunos
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--brand-texto-sec)' }}
          >
            Veja sua frequência, técnicas aprendidas e toda a sua história no tatame.
          </p>
        </div>

      </div>

      {/* ── CTAs ── */}
      <div
        className="px-6 pb-10 pt-6 space-y-3"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        <Link
          href="/login?role=professor"
          className="block w-full text-center py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000' }}
        >
          Sou Professor
        </Link>

        <Link
          href="/login?role=aluno"
          className="block w-full text-center py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-transform active:scale-[0.98]"
          style={{
            background: 'transparent',
            border: '1px solid var(--brand-border-str)',
            color: 'var(--brand-texto)',
          }}
        >
          Sou Aluno
        </Link>

        <p
          className="text-center text-xs pt-1 uppercase tracking-widest"
          style={{ color: 'var(--brand-texto-muted)' }}
        >
          Já tem conta? Use o mesmo e-mail.
        </p>
      </div>

    </div>
  )
}
```

---

### 3. Passar `role` pelo login → boas-vindas

O login já redireciona para `/boas-vindas` quando o usuário não tem perfil. Para a role pré-selecionar nessa tela, o `login/page.tsx` precisa ler `?role` da URL e propagá-lo no redirect final.

**Arquivo:** `src/app/(auth)/login/page.tsx`

Adicionar hook no início do componente:

```tsx
const searchParams = useSearchParams()
const role = searchParams.get('role') // 'professor' | 'aluno' | null
```

No `router.replace('/boas-vindas')` (dentro de `handleVerifyCode`):

```tsx
// Antes:
router.replace(aluno ? '/aluno' : '/boas-vindas')

// Depois:
const boasVindasHref = role
  ? `/boas-vindas?role=${role}`
  : '/boas-vindas'
router.replace(aluno ? '/aluno' : boasVindasHref)
```

> `useSearchParams()` já é importado de `'next/navigation'` neste componente — verificar se já existe. Se não existir, adicionar ao import. O componente é 'use client', então funciona sem Suspense adicional.

**Em `/boas-vindas/role-select.tsx`** (ou equivalente): verificar se já lê `?role` da URL para pré-selecionar professor/aluno. Se não lê, adicionar:

```tsx
'use client'
import { useSearchParams } from 'next/navigation'

const searchParams = useSearchParams()
const roleParam = searchParams.get('role')
const [role, setRole] = useState<'professor' | 'aluno' | null>(
  roleParam === 'professor' ? 'professor'
  : roleParam === 'aluno' ? 'aluno'
  : null
)
```

Se o arquivo de boas-vindas não existe ou usa estrutura diferente, adaptar conforme o código real — o objetivo é que quem clicou em "Sou Professor" chegue na tela de boas-vindas com a opção professor já selecionada.

---

## Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `src/app/page.tsx` | Renderiza `<LandingPage />` quando não autenticado, mantém redirects quando autenticado |
| `src/components/landing-page.tsx` | **Novo.** Componente Server da landing page |
| `src/app/(auth)/login/page.tsx` | Lê `?role`, passa para `/boas-vindas?role=X` no redirect final |
| `src/app/(auth)/boas-vindas/...` | Pré-seleciona role se `?role` presente na URL |

Sem migrations. Sem mudança de schema.

---

## Critérios de aceite (Sprint 23)

- [ ] Usuário não logado acessa `/` e vê a landing page (cobra + pitch + CTAs)
- [ ] Clicar "Sou Professor" leva para `/login?role=professor`
- [ ] Clicar "Sou Aluno" leva para `/login?role=aluno`
- [ ] Usuário já logado acessa `/` e é redirecionado normalmente (dashboard/onboarding/aluno)
- [ ] Em iOS: CTAs têm toque responsivo, sem delay
- [ ] Safe area inset aplicado no botão inferior (não some atrás da barra do iOS)
- [ ] Novo usuário que clica "Sou Professor" chega em boas-vindas com professor pré-selecionado

---

## Notas de design

- Reusar `/cobra.webp` já existente no projeto (mesmo asset do login)
- Tokens CSS: `--brand-fundo`, `--brand-surf`, `--brand-border`, `--brand-gold`, `--brand-texto-sec`, `--brand-texto-muted` — todos já definidos em `globals.css`
- Fonte uppercase tracking-widest já é o padrão visual do app
- Não inventar novos tokens nem cores fora do design system existente

---

*A landing page não tenta vender o app para qualquer um — só prepara quem já recebeu o link de um professor ou academia. Por isso o pitch é curto, não tem screenshots nem feature list longa.*
