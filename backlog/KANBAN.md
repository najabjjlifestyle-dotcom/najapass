# KANBAN — NajaPass

**Atualizado em:** 2026-07-02 (v1.6 — B-039, B-040 e B-042 concluídos na branch `feat/sprint9-insights`)

---

## ✅ Concluído

| ID | Card | Épico |
|---|---|---|
| B-001 | Tela de login com Magic Link | Auth |
| B-002 | Persistência de sessão | Auth |
| B-003 | Proteção de rotas | Auth |
| B-004 | Onboarding: criar academia | Academia |
| B-005 | Perfil do professor | Academia |
| B-006 | Listar alunos | Alunos |
| B-007 | Cadastrar aluno | Alunos |
| B-008 | Editar aluno | Alunos |
| B-009 | Inativar aluno | Alunos |
| B-010 | Criar turma | Turmas |
| B-011 | Editar turma | Turmas |
| B-012 | Listar turmas | Turmas |
| B-013 | Abrir nova aula | Aulas |
| B-014 | Finalizar aula | Aulas |
| B-015 | Aula em andamento no dashboard | Aulas |
| B-016 | Registrar presença por toggle | Presença |
| B-017 | Adicionar aluno avulso à presença | Presença |
| B-018 | Listar e buscar técnicas | Técnicas |
| B-019 | Criar técnica nova | Técnicas |
| B-020 | Seed de categorias padrão | Técnicas |
| B-021 | Histórico de aulas (com filtros) | Histórico |
| B-022 | Detalhe de aula | Histórico |
| B-023 | Histórico do aluno (visão professor) | Histórico |
| B-024 | Dashboard inicial | Dashboard |
| B-025 | Configuração PWA | PWA |
| B-026 | Deploy Vercel + Supabase | Deploy |
| B-027 | Trigger associação user → aluno | Aluno App |
| B-028 | Home do Aluno (quem vai, confirmados, vídeo, técnicas) | Aluno App |
| B-029 | Check-in do Aluno | Aluno App |
| B-030 | Ver quem vai na aula | Aluno App |
| B-031 | Histórico próprio do aluno (frequência 30/90d) | Aluno App |
| B-032 | Adicionar visitante/experimental (Professor) | Presença |
| B-033 | Tema e vídeo da aula (Professor) | Aulas |
| B-034 | Foto de perfil do aluno | Alunos |
| B-035 | Push Notification — aula aberta | Notificações |
| B-036 | Avisos da academia | Avisos |
| B-037 | Banho de loja — consistência visual e mobile-first | Design/UX |
| B-038 | Foto de perfil do professor | Alunos/Academia |
| B-039 | Tela de Insights (`/relatorios`) | Dashboard |
| B-040 | Insight dinâmico no dashboard | Dashboard |
| B-042 | Candidatos a graduação | Alunos |

> B-026 (deploy) já estava configurado na Vercel segundo o usuário — não verificado a partir do código.
> B-037/B-038 concluídos na branch `feat/sprint8-mobile-makeover`; B-039/B-040/B-042 na branch `feat/sprint9-insights` (a partir da 008) — ver seções de detalhes abaixo.

---

## ⭐ Implementado além do backlog original (sprints anteriores)

Sem card correspondente no `BACKLOG.md`, mas em produção: seleção de papel no primeiro acesso + fluxo de solicitação aluno→academia, múltiplos professores por academia, relatórios, hierarquia Tema > Posição com faixas recomendadas, planejamento de aulas (técnicas planejadas vs. ensinadas), Técnicas da Semana, histórico de aulas dentro da turma.

---

## 🔍 Detalhes B-037 / B-038 (branch `feat/sprint8-mobile-makeover`)

**B-037 — Banho de loja**, seguindo `HANDOFF-004-banho-de-loja.md` + auditoria própria pedida pelo usuário:
- BUG-01/02/03 do handoff corrigidos, mais dois problemas achados na investigação que não estavam listados: `--font-geist-sans` no fix sugerido do BUG-01 era referência morta (nunca existiu Geist no projeto, só Oswald/Inter) — usei `var(--font-inter)`; e o **root** `layout.tsx` também tinha `bg-black` hardcoded, um nível acima do `(app)/layout.tsx` que o handoff mencionava.
- Bottom nav (Início/Alunos/Histórico/Perfil) só pro professor — portal do aluno continua single-page por design, conforme o handoff pediu.
- Back buttons com touch target 44px em ~17 páginas (achei mais ocorrências do que o grep exato do handoff listava).
- Consistência de tokens `--brand-*` + `active:scale` em todas as páginas secundárias (alunos, turmas, aulas, solicitações, onboarding, boas-vindas, login).
- Estado "presente"/"check-in feito" trocou de branco pra gold em `attendance-list.tsx` e `checkin.tsx`.
- Removidas 97 ocorrências de `fontFamily: var(--font-oswald)` em 14 arquivos + o import do Oswald no root layout (não sobrou nenhum uso).
- Safe-area (`.pt-safe`) aplicada nos 18 headers que usavam `pt-12`.
- **Gap real encontrado na auditoria pedida:** professor não tinha como subir foto de perfil (só aluno tinha) → virou o card B-038.
- **3 rotas órfãs encontradas** (`/tecnicas`, `/professores`, `/relatorios` — existiam e funcionavam mas sem link nenhum na UI): resolvidas com uma seção "Mais" dentro de `/perfil`.

**B-038 — Foto de perfil do professor:** `professores.foto_url` + policies de storage no bucket `avatars` já existente (mesmo mecanismo do aluno). Aproveitei pra renomear o prop `alunoId` do componente `AvatarUpload` pra `entityId`, já que ele virou genérico (usado por aluno e professor).

⚠️ **Descoberta durante a implementação:** apareceu `HANDOFF-005-insights.md` no repo (cards B-039/B-040/B-042) que assume um item **"Insights" direto no bottom nav** apontando pra `/relatorios` — diferente da solução "Mais em /perfil" que usei aqui pra essas 3 rotas órfãs. Resolvido no B-039 (ver abaixo): mantive a solução "Mais em /perfil" — trocar o bottom nav agora abriria mão de um dos 4 itens fixos (Início/Alunos/Histórico/Perfil), o que parece pior trade-off do que manter Insights acessível via Perfil.

---

## 🔍 Detalhes B-039 / B-040 / B-042 (branch `feat/sprint9-insights`, a partir da `feat/sprint8-mobile-makeover`)

**B-039 — Tela de Insights (`/relatorios`):** a rota já existia com um relatório simples (filtro de data livre + ranking de presença) — troquei pelo desenho do `HANDOFF-005-insights.md`: seletor de período (Mês/3M/Ano, via `?periodo=` sem client-side state) + 3 abas (Técnicas/Alunos/Frequência, via `?aba=`). `src/lib/periodo.ts` novo, `filtros.tsx` antigo removido (virou código morto).

**B-040 — Insight dinâmico no dashboard:** card entre o stats strip e o grid de ações, prioridade aluno ausente +14d → categoria sem ensinar +21d → reforço pendente, só aparece quando há algo relevante. RPC `aluno_mais_ausente()` nova, com o mesmo padrão de segurança do `quem_vai()` (SECURITY DEFINER validando `p_academia_id = academia_do_professor()` internamente, não confia no parâmetro cru).

**Bug corrigido no meio do B-040:** a query sugerida no handoff pra achar lacunas de categoria usava `.order('aulas(data)').limit(50)` — no Supabase/PostgREST, `.order()` numa tabela referenciada só reordena o array aninhado, não a seleção externa, então isso não pegava de fato "as 50 técnicas ensinadas mais recentes". Troquei por filtro de janela (últimos 90 dias) + processamento em JS.

**B-042 — Candidatos a graduação:** implementado como seção dentro da aba Alunos de `/relatorios` (não é aba própria), exatamente como pedido — proxy por total de presenças vs. threshold por faixa, já que não existe tabela de graduações ainda.

---

## 📋 Backlog

*Nenhum card pendente no momento.*

> B-041 (integração com Claude chat) descartado — o app deve ser autossuficiente.

---

## 🟡 Em Progresso

*Nenhum card em progresso no momento — aguardando push/PR/merge das branches `feat/sprint8-mobile-makeover` e `feat/sprint9-insights`.*

---

## 🔴 Bloqueado

*Nenhum bloqueio registrado.*

---

## ⚠️ Pendências operacionais (não são cards, mas bloqueiam funcionamento pleno)

1. **Migrations não aplicadas.** Nenhuma migration criada nas branches `feat/sprint7-pendencias`, `feat/sprint8-mobile-makeover` e `feat/sprint9-insights` foi aplicada ao banco — o projeto Supabase do NajaPass não estava linkado no Supabase CLI desta máquina (só apareciam outros projetos não relacionados). Rodar `supabase link` + `supabase db push`, ou aplicar via SQL Editor do painel Supabase, na ordem: `quem_vai.sql`, `avatars_storage.sql`, `push_subscriptions.sql`, `dedupe_categorias.sql`, `categorias_insert_policy.sql`, `foto_professor.sql`, `aluno_mais_ausente.sql` (todas com timestamp `202607020000XX`).
2. **Chaves VAPID.** Geradas localmente e adicionadas ao `.env.local` (gitignored). Para push funcionar em produção, adicionar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` nas env vars do projeto na Vercel.
3. **Sem suíte de testes.** O CLAUDE.md cita Vitest como parte da stack, mas não há `vitest` no `package.json` nem testes escritos. Fora do escopo desta branch.

---

## Legenda

| Símbolo | Significado |
|---|---|
| P0 | Crítico — sem isso o MVP não existe |
| P1 | Importante — faz parte do MVP completo |
| P2 | Desejável — melhora a experiência |

---

> **Instrução para o Claude Code:** Mover o card para "Em Progresso" ao iniciar, para "Concluído" ao terminar. Nunca trabalhar em mais de 2 cards simultaneamente.
