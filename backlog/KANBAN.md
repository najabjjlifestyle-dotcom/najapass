# KANBAN — NajaPass

**Atualizado em:** 2026-07-02 (v1.2 — reconciliado com o estado real do código, branch `feat/sprint5`)

> Esta atualização foi feita lendo o código-fonte e o histórico de commits, não apenas o BACKLOG.md. A v1.1 estava desatualizada (mostrava 0 cards concluídos apesar de várias sprints já implementadas).

---

## ✅ Concluído

| ID | Card | Épico | Evidência |
|---|---|---|---|
| B-001 | Tela de login com Magic Link | Auth | OTP 6 dígitos — `(auth)/login/page.tsx`, `api/auth/callback` |
| B-002 | Persistência de sessão | Auth | Supabase SSR (`lib/supabase/server.ts`) + middleware |
| B-003 | Proteção de rotas | Auth | `src/middleware.ts` |
| B-004 | Onboarding: criar academia | Academia | `app/onboarding/` |
| B-006 | Listar alunos | Alunos | `(app)/alunos/page.tsx` |
| B-007 | Cadastrar aluno | Alunos | `cadastrarAluno` em `alunos/actions.ts` |
| B-010 | Criar turma | Turmas | `criarTurma` em `turmas/actions.ts` |
| B-012 | Listar turmas | Turmas | `(app)/turmas/page.tsx` |
| B-013 | Abrir nova aula | Aulas | `abrirAula` em `aulas/actions.ts` |
| B-014 | Finalizar aula | Aulas | `finalizarAula` em `aulas/actions.ts` |
| B-016 | Registrar presença por toggle | Presença | `togglePresenca` + `attendance-list.tsx` |
| B-018 | Listar e buscar técnicas | Técnicas | `(app)/tecnicas/page.tsx` |
| B-019 | Criar técnica nova | Técnicas | `criarTecnica` em `tecnicas/actions.ts` |
| B-020 | Seed de categorias padrão | Técnicas | migration `20260629000005_seed_categorias.sql` |
| B-022 | Detalhe de aula | Histórico | `(app)/aulas/[id]/page.tsx` (presentes + técnicas) |
| B-023 | Histórico do aluno (visão professor) | Histórico | `(app)/alunos/[id]/page.tsx` (frequência 30d + lista de aulas) |
| B-024 | Dashboard inicial | Dashboard | `(app)/dashboard/page.tsx` (CTA nova aula, stats, atalhos) |
| B-027 | Trigger associação user → aluno | Aluno App | migration `20260630000001_vincular_aluno_fn.sql` |
| B-029 | Check-in do Aluno | Aluno App | `aluno/checkin.tsx` + `aluno/actions.ts` |
| B-033 | Tema e vídeo da aula | Aulas | evoluiu para hierarquia Tema > Posição (Sprint 6) — `aulas/nova/form.tsx`, `aulas/[id]/page.tsx` |

---

## 🟠 Parcial (funciona, mas não cobre todos os critérios de aceite)

| ID | Card | O que falta |
|---|---|---|
| B-008 | Editar aluno | Só existe `graduarAluno` (faixa/grau). Falta editar nome/e-mail/telefone. |
| B-015 | Aula em andamento no dashboard | Dashboard mostra "última aula" no atalho Histórico, mas não há banner dedicado de "aula aberta agora → continuar". |
| B-021 | Histórico de aulas da academia | Lista cronológica existe (`aulas/page.tsx`), mas sem os filtros por turma/mês pedidos no critério de aceite. |
| B-028 | Home do Aluno | Mostra check-in, turmas, técnicas da semana e presenças recentes — mas não mostra "X confirmados" nem link de vídeo/técnicas planejadas por aula individual. |
| B-031 | Histórico próprio do aluno | Mostra lista de presenças recentes, mas sem os números de frequência (mês atual / 3 meses) nem "última presença: X dias atrás" exigidos no critério de aceite. |

---

## 🔵 Backlog (pendente — não iniciado)

| ID | Card | Épico | Prioridade |
|---|---|---|---|
| B-005 | Perfil do professor | Academia | P1 |
| B-009 | Inativar aluno | Alunos | P1 |
| B-011 | Editar turma | Turmas | P1 |
| B-017 | Adicionar aluno avulso à presença | Presença | P1 |
| B-025 | Configuração PWA | PWA | **P0** |
| B-026 | Deploy Vercel + Supabase | Deploy | P0 — status real não verificável a partir do código |
| B-030 | Ver quem vai na aula | Aluno App | **P0** |
| B-032 | Adicionar visitante/experimental à aula (Professor) | Presença | **P0** |
| B-034 | Foto de perfil do aluno | Alunos | P1 |
| B-035 | Push Notification — aula aberta | Notificações | P1 |
| B-036 | Avisos da academia | Avisos | P1 |

---

## ⭐ Implementado além do backlog original

Trabalho feito nas últimas sprints que não corresponde a nenhum card do `BACKLOG.md` — vale formalizar como cards numa próxima revisão:

- **Seleção de papel no primeiro acesso** (professor ou aluno) + fluxo de solicitação de vínculo aluno→academia (`boas-vindas/`, `solicitacoes/`)
- **Múltiplos professores por academia** (`professores/` — adicionar/remover)
- **Relatórios** (`relatorios/`)
- **Hierarquia Tema > Posição** para técnicas, com faixas recomendadas por posição (migration `20260702000001_sprint6.sql`)
- **Planejamento de aulas** (técnicas planejadas vs. ensinadas, `tecnicas-actions.ts`)
- **Técnicas da Semana** — visão semanal filtrada por faixa, para professor e aluno (`(app)/semana/`)
- **Histórico de aulas dentro da turma** (commit `23a30d4`)

---

## 🟡 Em Progresso

*Nenhum card em progresso no momento.*

---

## 🔴 Bloqueado

*Nenhum bloqueio registrado.*

---

## Legenda

| Símbolo | Significado |
|---|---|
| P0 | Crítico — sem isso o MVP não existe |
| P1 | Importante — faz parte do MVP completo |
| P2 | Desejável — melhora a experiência |
| S | Small — < 1 dia |
| M | Medium — 1-2 dias |
| L | Large — 3+ dias |

---

> **Instrução para o Claude Code:** Mover o card para "Em Progresso" ao iniciar, para "Concluído" ao terminar. Nunca trabalhar em mais de 2 cards simultaneamente.
