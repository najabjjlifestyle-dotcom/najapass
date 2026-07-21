# HANDOFF-020 — Performance + Unificação do Fluxo de Entrada

**Data:** 2026-07-17  
**Branch:** `feat/sprint23-homepage` *(substitui HANDOFF-019 — mesma branch)*  
**Base:** `main`  
**Épico:** EP-25 — Homepage / Marketing  
**Cards:** B-079 · B-080

> **HANDOFF-019 supersedido por este.** O spec da landing page aqui é o mesmo, mas este documento adiciona o fix de performance e a unificação com o fluxo de boas-vindas.

---

## Diagnóstico

### Problema 1 — Tela branca

**`boas-vindas/page.tsx`** faz 5 queries ao Supabase *sequencialmente* antes de renderizar qualquer coisa:

```
1. auth.getUser()          — cookie, rápido
2. from('professores')     — aguarda resultado 1
3. from('alunos')          — aguarda resultado 2
4. from('professores')     — check pré-cadastro (aguarda 3)
5. from('solicitacoes')    — aguarda 4
6. from('academias')       — aguarda 5
```

Resultado: 500–1200ms de tempo de servidor antes do primeiro pixel aparecer. Sem `loading.tsx`, o browser fica em branco durante todo esse tempo.

**`src/app/page.tsx`** (root) também faz queries sequenciais e adiciona um redirect para `/login` para usuários não autenticados — um round-trip extra desnecessário.

**Sem `loading.tsx`** na raiz (`src/app/`) nem no grupo `(auth)`, navegação para essas páginas congela a tela.

### Problema 2 — Fluxo duplicado

A tela "BEM-VINDO / Como você vai usar o NajaPass?" (`boas-vindas/role-select.tsx`, step `'role'`) é exatamente a mesma decisão que a landing page pede — mas acontece *depois* do login, quando o usuário já escolheu. São duas telas que fazem a mesma pergunta.

---

## B-079 — Landing Page (atualização do HANDOFF-019)

### 1. `src/app/page.tsx` — renderizar landing sem redirect

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing-page'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <LandingPage />

  // Usuário logado — queries em paralelo (não sequencial)
  const [professorRes, alunoRes] = await Promise.all([
    supabase.from('professores').select('id, academia_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('alunos').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  if (professorRes.data?.academia_id) redirect('/dashboard')
  if (professorRes.data) redirect('/onboarding')
  redirect(alunoRes.data ? '/aluno' : '/boas-vindas')
}
```

> **Por que isso resolve a tela branca para novos usuários:** antes havia um redirect de `/` para `/login` (round-trip extra). Agora a landing page renderiza diretamente — zero redirect, zero query extra para não-logados.

### 2. `src/components/landing-page.tsx` — novo componente

Server Component (sem 'use client'). Reutiliza `/cobra.webp` já existente.

```tsx
import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-fundo)' }}>

      {/* Cobra */}
      <div className="flex justify-center pt-12 relative">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cobra.webp"
            alt="NajaBJJ"
            className="w-36 object-contain select-none"
          />
          <div className="absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to top, var(--brand-fundo), transparent)' }} />
        </div>
      </div>

      {/* Branding */}
      <div className="text-center px-6 pt-2 pb-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto)' }}>
          NajaBJJ
        </h1>
        <p className="text-[10px] uppercase tracking-[0.4em] mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
          NajaPass
        </p>
      </div>

      {/* Pitch */}
      <div className="flex-1 px-6 space-y-4">
        <p className="text-center font-bold leading-snug" style={{ color: 'var(--brand-texto)' }}>
          A evolução do Jiu-Jitsu,<br />registrada treino após treino.
        </p>

        <div style={{ borderTop: '1px solid var(--brand-border)' }} />

        <div className="rounded-2xl p-4"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
            style={{ color: 'var(--brand-gold)' }}>
            Para Professores
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-texto-sec)' }}>
            Abra aulas, registre técnicas e acompanhe quem está evoluindo — em menos de um minuto por treino.
          </p>
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
            style={{ color: 'var(--brand-gold)' }}>
            Para Alunos
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-texto-sec)' }}>
            Veja sua frequência, técnicas aprendidas e toda a sua história no tatame.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-6 pt-6 pb-10 space-y-3"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}>
        <Link href="/login?role=professor"
          className="block w-full text-center py-4 rounded-2xl font-bold uppercase tracking-widest transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000', fontSize: 14 }}>
          Sou Professor
        </Link>
        <Link href="/login?role=aluno"
          className="block w-full text-center py-4 rounded-2xl font-bold uppercase tracking-widest transition-transform active:scale-[0.98]"
          style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)', fontSize: 14 }}>
          Sou Aluno
        </Link>
        <p className="text-center text-[10px] pt-1 uppercase tracking-widest"
          style={{ color: 'var(--brand-texto-muted)' }}>
          Já tem conta? Use o mesmo e-mail.
        </p>
      </div>
    </div>
  )
}
```

---

## B-080 — Fix de Performance + Unificação boas-vindas

### 1. Adicionar `src/app/loading.tsx` — esqueleto raiz

Exibido imediatamente pelo Next.js durante qualquer navegação server-side na raiz. Elimina tela branca para navegações internas.

```tsx
export default function RootLoading() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }} />
  )
}
```

> Simples fundo escuro. Impede o flash branco enquanto o server processa. O `(app)/loading.tsx` já tem o skeleton com animate-pulse para rotas do professor — aqui é só o fundo.

### 2. Adicionar `src/app/(auth)/loading.tsx`

```tsx
export default function AuthLoading() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }} />
  )
}
```

### 3. `login/page.tsx` — ler `?role` e propagar

O componente é `'use client'`. Adicionar leitura do `searchParams`:

```tsx
// Adicionar ao topo dos imports:
import { useSearchParams } from 'next/navigation'

// Dentro do componente:
const searchParams = useSearchParams()
const role = searchParams.get('role') // 'professor' | 'aluno' | null
```

No `handleVerifyCode`, trocar o redirect final:

```tsx
// Antes:
router.replace(aluno ? '/aluno' : '/boas-vindas')

// Depois:
const boasVindasUrl = role ? `/boas-vindas?role=${role}` : '/boas-vindas'
router.replace(aluno ? '/aluno' : boasVindasUrl)
```

> `useSearchParams` já é importável de `'next/navigation'` — verificar se já existe no import e adicionar se não existir.

### 4. `boas-vindas/page.tsx` — parallelizar queries + passar role

**Problema atual:** 5 queries sequenciais. A maior oportunidade é rodar professor + aluno em paralelo desde o início.

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoleSelect from './role-select'

export default async function BoasVindasPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Queries 2 e 3 em paralelo (antes eram sequenciais)
  const [professorRes, alunoRes] = await Promise.all([
    supabase.from('professores').select('id, academia_id, email').eq('user_id', user.id).maybeSingle(),
    supabase.from('alunos').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  if (professorRes.data?.academia_id) redirect('/dashboard')
  if (professorRes.data) redirect('/onboarding')
  if (alunoRes.data) redirect('/aluno')

  // Professor pré-cadastrado por outro professor (email match)
  const { data: profPreReg } = await supabase
    .from('professores')
    .select('id')
    .eq('email', user.email!)
    .is('user_id', null)
    .maybeSingle()

  if (profPreReg) {
    await supabase.rpc('vincular_professor_por_email', { p_email: user.email!, p_user_id: user.id })
    redirect('/dashboard')
  }

  // Se role=professor na URL → pular role-select, ir direto pro onboarding
  if (role === 'professor') redirect('/onboarding')

  // Queries 5 e 6 em paralelo (antes eram sequenciais)
  const [solicitacaoRes, academiasRes] = await Promise.all([
    supabase
      .from('solicitacoes')
      .select('status, academias(nome)')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('academias').select('id, nome, cidade').order('nome'),
  ])

  const solicitacaoFormatada = solicitacaoRes.data
    ? {
        status: solicitacaoRes.data.status,
        academia_nome: (solicitacaoRes.data.academias as unknown as { nome: string } | null)?.nome ?? '',
      }
    : null

  return (
    <RoleSelect
      academias={academiasRes.data ?? []}
      solicitacao={solicitacaoFormatada}
      // Se role=aluno, pular direto para academia-form
      initialStep={role === 'aluno' ? 'academia-form' : 'role'}
    />
  )
}
```

**Ganho:** queries paralelas cortam o tempo de espera pela metade. `role=professor` vai direto para `/onboarding` sem nem renderizar o `RoleSelect`. `role=aluno` pula o step intermediário.

### 5. `boas-vindas/role-select.tsx` — aceitar `initialStep`

Adicionar prop `initialStep` e usar no `useState`:

```tsx
export default function RoleSelect({
  academias,
  solicitacao,
  initialStep = 'role',
}: {
  academias: Academia[]
  solicitacao: Solicitacao
  initialStep?: Step
}) {
  const [step, setStep] = useState<Step>(
    solicitacao?.status === 'pendente'
      ? 'waiting'
      : initialStep  // ← antes era sempre 'role'
  )
  // ...resto inalterado
```

> O step `'role'` (tela "BEM-VINDO") continua existindo como fallback — quando o usuário chega em `/boas-vindas` sem `?role` na URL (link direto, email antigo, etc.). Só é pulado quando a role já foi escolhida na landing page.

---

## Resumo dos arquivos modificados

| Arquivo | Card | O que muda |
|---|---|---|
| `src/app/page.tsx` | B-079 | Renderiza `<LandingPage />` para não-logados; queries em paralelo para logados |
| `src/components/landing-page.tsx` | B-079 | **Novo.** Cobra + pitch + CTAs com role na URL |
| `src/app/loading.tsx` | B-080 | **Novo.** Fundo escuro imediato (raiz) |
| `src/app/(auth)/loading.tsx` | B-080 | **Novo.** Fundo escuro imediato (rotas de auth) |
| `src/app/(auth)/login/page.tsx` | B-080 | Lê `?role`, propaga para `/boas-vindas?role=X` |
| `src/app/(app)/boas-vindas/page.tsx` | B-080 | Queries em paralelo; `role=professor` → redirect imediato para `/onboarding`; passa `initialStep` para `RoleSelect` |
| `src/app/(app)/boas-vindas/role-select.tsx` | B-080 | Aceita prop `initialStep`; pula tela "BEM-VINDO" quando `initialStep='academia-form'` |

Sem migrations. Sem mudança de schema.

---

## Fluxo novo completo

```
Novo usuário
    └─ acessa /
        └─ vê landing page (cobra + pitch + CTAs)
            ├─ "Sou Professor" → /login?role=professor
            │      └─ após OTP → /boas-vindas?role=professor
            │             └─ redirect imediato para /onboarding
            │
            └─ "Sou Aluno" → /login?role=aluno
                   └─ após OTP → /boas-vindas?role=aluno
                          └─ abre academia-form (sem tela "BEM-VINDO")

Usuário existente
    └─ acessa /
        └─ servidor vê sessão → redirect direto para /dashboard ou /aluno
```

---

## Critérios de aceite (Sprint 23)

- [ ] Usuário não logado acessa `/` → vê landing page sem redirect (zero tela branca)
- [ ] Clicar "Sou Professor" → `/login?role=professor` → após login → `/onboarding` direto
- [ ] Clicar "Sou Aluno" → `/login?role=aluno` → após login → academia-form direto (sem "BEM-VINDO")
- [ ] Link direto para `/boas-vindas` (sem role) → continua funcionando com a tela "BEM-VINDO" como fallback
- [ ] Usuário já logado acessa `/` → redirecionado para dashboard/aluno sem atraso percebido
- [ ] Navegação para `/boas-vindas` não mostra tela branca — `loading.tsx` exibe fundo escuro imediato
- [ ] Navegação para `/login` não mostra tela branca — `loading.tsx` exibe fundo escuro imediato
- [ ] Safe area iOS aplicada no rodapé da landing page
