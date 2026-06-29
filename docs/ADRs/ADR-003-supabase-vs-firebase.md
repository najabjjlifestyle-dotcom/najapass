# ADR-003 — Supabase vs Firebase

**Status:** Aceito  
**Data:** 2026-06-29  
**Decisores:** Vitim, Claude.ai

---

## Contexto

O NajaPass precisa de banco de dados, autenticação e (futuramente) storage. O time tem um único desenvolvedor. A solução precisa ser gerenciada (sem administrar servidor), ter tier gratuito para o MVP e suportar consultas relacionais complexas — já que a evolução técnica do aluno envolve múltiplas entidades (aluno → aulas → técnicas → posições).

---

## Decisão

**Usar Supabase.**

Supabase entrega PostgreSQL gerenciado + Auth + Storage + Realtime em uma única plataforma, com SQL nativo e suporte a Row Level Security (RLS).

---

## Por que não Firebase

| Requisito | Firebase (Firestore) | Supabase (PostgreSQL) |
|---|---|---|
| Relacionamentos | Desnormalização manual | JOINs nativos |
| Queries complexas | Limitado | SQL completo |
| Relatórios futuros | Difícil (aggregations) | Fácil (GROUP BY, etc.) |
| Auth | ✅ | ✅ |
| Storage | ✅ | ✅ |
| Realtime | ✅ | ✅ |
| Open Source | ❌ | ✅ |
| Self-host futuro | ❌ | ✅ |
| Tier gratuito | Generoso | Generoso |

O ponto decisivo: a Fase 2 exige consultas do tipo "quais técnicas o aluno X ainda não treinou?" e "há quanto tempo não ensino raspagens?". Essas queries são triviais em SQL e complexas em NoSQL.

---

## Consequências

- **Positivo:** Schema tipado com migrations versionadas (Supabase CLI).
- **Positivo:** RLS garante que cada professor só veja os dados da sua academia.
- **Positivo:** TypeScript types gerados automaticamente do schema.
- **Risco:** Supabase é menos maduro que Firebase — mas já está production-ready.
- **Plano de contingência:** Por ser PostgreSQL padrão, migrar para outro host é viável se necessário.
