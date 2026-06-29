# ADR-001 — Stack Tecnológica

**Status:** Aceito  
**Data:** 2026-06-29  
**Decisores:** Vitim, Claude.ai

---

## Contexto

O NajaPass precisa de uma stack que permita:
- Desenvolvimento rápido por um time pequeno (MVP em semanas)
- Custo operacional próximo de zero no início
- Experiência mobile-first (professores usam no celular durante o treino)
- Código tipado e testável desde o começo

---

## Decisão

Adotamos a seguinte stack:

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack em um único repo, SSR/SSG, ecosistema maduro |
| Linguagem | TypeScript | Tipagem elimina classe inteira de bugs; Zod valida em runtime |
| Estilo | Tailwind CSS | Velocidade de prototipação, sem CSS externo |
| BaaS | Supabase | PostgreSQL gerenciado + Auth + Storage + Realtime em um lugar |
| Deploy | Vercel | Zero-config para Next.js, preview deploys por PR |
| Testes | Vitest | Compatível com TypeScript, rápido, API similar ao Jest |
| Push | Web Push API | Nativo no browser, sem SDK externo |
| Distribuição | PWA | Instala como app sem passar pela loja |

---

## Alternativas Consideradas

### Firebase (Google)
- ✅ BaaS completo, bem documentado
- ❌ NoSQL dificulta relacionamentos complexos (aula → técnicas → alunos)
- ❌ Vendor lock-in mais profundo
- ❌ SQL é mais familiar e mais poderoso para relatórios futuros

### React Native / Expo
- ✅ Experiência nativa real
- ❌ Dois codebases (iOS + Android)
- ❌ Deploy na loja = fricção para updates
- ❌ PWA resolve 95% do caso de uso sem a complexidade

### SvelteKit
- ✅ Menor bundle, syntax mais simples
- ❌ Ecosistema menor
- ❌ Time tem mais familiaridade com React/Next

---

## Consequências

- **Positivo:** Um único desenvolvedor (Claude Code) consegue operar toda a stack.
- **Positivo:** Supabase elimina necessidade de servidor dedicado.
- **Positivo:** Vercel + Supabase têm tier gratuito suficiente para MVP e early adopters.
- **Risco:** PWA tem limitações em iOS (notificações push só a partir de iOS 16.4+).
- **Mitigação:** Fase 4 pode avaliar app nativo se PWA se tornar limitante.
