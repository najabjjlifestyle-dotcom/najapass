# HANDOFF — NajaPass · Fase 1

> **Para:** Claude Code  
> **De:** Claude.ai (Gestor de Projetos)  
> **Data:** 2026-06-29  
> **Missão:** Implementar a Fase 1 — A Academia Digital

---

## Contexto do Produto

O NajaPass é um PWA para professores de Jiu-Jitsu registrarem aulas, presença e técnicas ensinadas. O objetivo é construir a **memória técnica da academia** — não um sistema financeiro.

**Usuário primário:** Professor de BJJ no celular, durante ou logo após o treino.  
**Constraint de UX:** Abrir aula + registrar presença deve levar < 1 minuto.

---

## Stack

```
Next.js 15 (App Router) + TypeScript + Tailwind CSS
Supabase (PostgreSQL + Auth + RLS)
Vercel (deploy)
Vitest (testes)
PWA (manifest.json + Service Worker)
```

---

## Estrutura de Pastas (Next.js)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx           # Proteção de rota + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── aulas/
│   │   │   ├── page.tsx         # Histórico
│   │   │   ├── nova/page.tsx    # Abrir aula
│   │   │   └── [id]/page.tsx    # Detalhe / presença
│   │   ├── alunos/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── turmas/
│   │       └── page.tsx
│   └── api/
│       └── auth/callback/route.ts
├── components/
│   ├── ui/                      # Botões, inputs, cards genéricos
│   ├── aula/                    # ListaPresenca, ChipTecnica, etc.
│   └── aluno/                   # CardAluno, BadgeFaixa, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client (RSC)
│   │   └── types.ts             # Types gerados do schema
│   └── utils.ts
└── middleware.ts                # Proteção de rotas
```

---

## Banco de Dados

O schema completo está em `docs/modelo-de-dados.md`.

**Ordem de criação das migrations:**
1. `academias`
2. `professores`
3. `alunos`
4. `turmas`
5. `alunos_turmas`
6. `categorias_tecnicas` + seed
7. `tecnicas`
8. `aulas`
9. `presencas`
10. `aula_tecnicas`
11. Indexes
12. RLS policies

Use o **Supabase CLI** com migrations versionadas (`supabase migration new <nome>`).

---

## Autenticação

Magic Link via Supabase Auth. Ver `docs/ADRs/ADR-004-autenticacao-magic-link.md`.

```typescript
// Login
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${origin}/api/auth/callback` }
})

// Callback (route.ts)
const { searchParams } = new URL(request.url)
const code = searchParams.get('code')
if (code) {
  await supabase.auth.exchangeCodeForSession(code)
}
return NextResponse.redirect(new URL('/dashboard', request.url))
```

**Middleware de proteção:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

---

## Fluxos de Usuário

Documentados em `docs/fluxos-de-usuario.md`. Os 10 fluxos principais:

- **FU-01:** Primeiro acesso / onboarding
- **FU-02:** Login recorrente
- **FU-03:** Abrir aula (< 30 segundos)
- **FU-04:** Registrar presença (toggle)
- **FU-05:** Registrar técnicas
- **FU-06:** Finalizar aula
- **FU-07:** Cadastrar aluno
- **FU-08:** Histórico do aluno
- **FU-09:** Histórico de aulas
- **FU-10:** Dashboard

---

## Backlog Priorizado

Ver `backlog/BACKLOG.md` para todos os cards.  
Ver `backlog/KANBAN.md` para o board de progresso.

**Ordem de implementação (Sprint 1 primeiro):**

```
Sprint 1: B-025 → B-026 → B-001 → B-002 → B-003 → B-004
Sprint 2: B-006 → B-007 → B-010 → B-012 → B-020
Sprint 3: B-013 → B-016 → B-018 → B-014 → B-015
Sprint 4: B-021 → B-022 → B-023 → B-024 → B-008 → B-009
```

---

## Design & UX

**Princípios:**
- Mobile-first. Tudo deve funcionar com polegar.
- Área de toque mínima: 44px.
- Feedback imediato em toda ação (loading states, toasts).
- Cores: roxo/preto (identidade BJJ). Faixa como badge colorido.

**Paleta sugerida:**
```
Primária:  #7C3AED (roxo)
Sucesso:   #16A34A (verde)
Alerta:    #CA8A04 (amarelo)
Perigo:    #DC2626 (vermelho)
Neutro:    #1F2937 (cinza escuro)
Background:#F9FAFB (off-white)
```

**Componentes essenciais:**
- `<BadgeFaixa />` — exibe faixa com cor correspondente
- `<BotaoPresenca />` — toggle grande, fácil de tocar
- `<ChipTecnica />` — tag removível
- `<CardAula />` — resumo de aula na listagem

---

## Regras de Negócio Críticas

1. **RLS no Supabase:** professor só vê dados da própria academia.
2. **Aula finalizada:** não permite alterar presenças, apenas observações.
3. **Aluno inativo:** some das listas mas histórico é preservado.
4. **Técnica duplicada:** não pode ter duas técnicas com mesmo nome na mesma academia.
5. **Presença:** unique constraint `(aula_id, aluno_id)`.
6. **Grau:** 0 a 4 por faixa (exceto preta: 0 a 6).

---

## Comandos Úteis

```bash
# Setup inicial
npx create-next-app@latest najapass --typescript --tailwind --app
cd najapass
npm install @supabase/supabase-js @supabase/ssr

# Supabase CLI
npx supabase init
npx supabase start          # local dev
npx supabase migration new  <nome>
npx supabase db push        # aplica migrations
npx supabase gen types typescript --local > src/lib/supabase/types.ts

# Testes
npm run test
npm run test:coverage

# Deploy
vercel --prod
```

---

## Definição de Done (Fase 1 completa)

- [ ] Professor consegue criar conta e logar via magic link
- [ ] Professor consegue cadastrar alunos e turmas
- [ ] Professor abre aula em < 30 segundos
- [ ] Professor registra presença de uma turma de 20 alunos em < 1 minuto
- [ ] Professor associa pelo menos 3 técnicas a uma aula
- [ ] Professor finaliza a aula e vê o resumo
- [ ] Professor consulta histórico de qualquer aluno
- [ ] App instala na tela inicial do celular (PWA)
- [ ] App em produção na Vercel com domínio HTTPS
- [ ] Nenhum dado de um professor vaza para outro (RLS validado)
- [ ] Testes unitários para lógica de negócio crítica (cobertura > 70%)

---

## Contato

Dúvidas sobre regras de negócio → Mestre Naja  
Dúvidas sobre prioridade / escopo → Vitim  
Dúvidas sobre arquitetura → ADRs em `docs/ADRs/`

**Boa sorte. Construa algo que o professor nem perceba que está usando.**
