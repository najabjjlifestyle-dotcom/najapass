# KANBAN — NajaPass

**Atualizado em:** 2026-07-06 (v2.1 — B-045/B-046/B-047 concluídos na branch `feat/sprint12-agendamento`)

---

## 🥋 Currículo global de técnicas (branch `feat/sprint10-curriculo-global`, a partir da `feat/sprint9-insights`)

Sem card no `BACKLOG.md` — pedido direto pelo Mestre Naja: uma lista de posições/técnicas por faixa (Guarda Fechada, Guarda Aberta, Meia Guarda, Guarda Borboleta, De La Riva, Guarda Aranha, Guarda Lasso, 50/50, Montada, Cem Quilos, Joelho na Barriga, Norte-Sul, Costas, Tartaruga, Passagem de Guarda, Takedown/Queda, Chaves de Pé) para virar sugestão no app.

Implementado ativando um recurso que já existia no schema desde a v1 mas nunca tinha sido usado: `tecnicas.global` + `tecnicas.academia_id` nullable. ~168 técnicas inseridas com `academia_id NULL, global=true`, nova policy de RLS (`tecnicas_global_select`) e as 4 queries do app que buscam técnicas atualizadas pra incluir `.or(academia_id.eq.X, global.eq.true)`. Por ser de verdade global (não replicado por academia), toda academia — inclusive as criadas depois — já vê essas sugestões sem precisar reseedar nada.

6 temas novos criados (Guarda Borboleta, Guarda Lasso, Joelho na Barriga, Norte-Sul, Tartaruga, Chaves de Pé); os demais reaproveitaram categorias já existentes em vez de criar quase-duplicatas (ex: "Guarda De La Riva" do texto original virou a categoria já existente "De La Riva").

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
| B-043 | Portal do Aluno V2 — multi-page com bottom nav | Aluno App |
| B-044 | Técnicas aprendidas do aluno (`/aluno/tecnicas`) | Aluno App |
| B-045 | Aulas agendadas — professor cria e gerencia aulas futuras | Aulas |
| B-046 | Recorrência — gerar ciclo de aulas a partir da turma | Aulas |
| B-047 | Portal do aluno — próximas aulas agendadas | Aluno App |

> B-026 (deploy) já estava configurado na Vercel segundo o usuário — não verificado a partir do código.
> B-037/B-038 concluídos na branch `feat/sprint8-mobile-makeover`; B-039/B-040/B-042 na branch `feat/sprint9-insights` (a partir da 008); B-043/B-044 (+ HANDOFF-006) na branch `feat/sprint11-portal-aluno-v2` (a partir da `main`); B-045/B-046/B-047 na branch `feat/sprint12-agendamento` (a partir da sprint11) — ver seções de detalhes abaixo.

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

## 🔍 Detalhes B-043 / B-044 + HANDOFF-006 (branch `feat/sprint11-portal-aluno-v2`, a partir da `main`)

**HANDOFF-006 (banho de loja do portal do aluno)** aplicado direto no redesign, sem passo intermediário: fita de cor da faixa no topo do header, avatar+nome+faixa compactos, `PushSubscribeButton` virou ícone de sino (Bell/BellOff do lucide) em vez de texto sublinhado, check-in com título "Aula ao vivo agora" + dot pulsante, spinner/ícones Check/Circle no botão de check-in em vez de caracteres unicode (`⟳ ✓ ○`), empty state mostra "Próximo treino: {dia}" + contagem de treinos do mês em vez de um beco sem saída, `/aluno/sem-conta` com ícone `UserX`.

**B-043 — Portal do Aluno V2:** `src/lib/aluno-auth.ts` centraliza auth (`getAlunoOuRedireciona`, redireciona pra `/aluno/sem-conta` quando não encontra vínculo); `src/components/aluno-bottom-nav.tsx` + `src/app/(app)/aluno/layout.tsx` injetam a nav (Home/Técnicas/Histórico/Perfil) em todas as `/aluno/*`, oculta em `/aluno/sem-conta`. Home (`/aluno`) enxugada: só check-in + avisos + técnicas da semana + empty state — frequência, presenças recentes e turmas migraram pra `/aluno/historico` e `/aluno/perfil`.

**B-044 — Técnicas aprendidas (`/aluno/tecnicas`):** cruza `presencas` (aulas que o aluno esteve) × `aula_tecnicas` (tipo='ensinada') × `tecnicas` (currículo global + da academia, do sprint10) agrupado por categoria, com barra de progresso e chips gold (vistas) / cinza (não vistas), ordenado por % de cobertura. Zero migration nova — currículo global do sprint10 supre toda a base.

⚠️ **Nota de layout:** o `(app)/layout.tsx` do professor já envolve todas as rotas (inclusive `/aluno/*`) num wrapper `pb-16` fixo, mesmo com o `BottomNav` do professor retornando `null` em `/aluno*`. O novo `aluno/layout.tsx` soma seu próprio `pb-20`, resultando em ~144px de espaço em branco no fundo das telas do aluno em vez de ~80px. Cosmético, não funcional — ajustar se incomodar visualmente após deploy.

---

## 🔍 Detalhes B-045 / B-046 / B-047 (branch `feat/sprint12-agendamento`, a partir da `feat/sprint11-portal-aluno-v2`)

**Correção ao handoff:** HANDOFF-008 assumia que faltava uma coluna `aulas.horario`. Na verdade `aulas.hora_inicio` (TIME) já existe desde o schema original e cobre o mesmo caso de uso — reaproveitado em vez de criar coluna nova. O status `'agendada'` também já era aceito pela constraint original; só faltava `'cancelada'`, adicionado via migration.

**B-045 — Aulas agendadas:** `abrirAula()` agora calcula `status` (`data > hoje` → `agendada`, senão `aberta`) em vez de sempre `'aberta'`; push só dispara quando a aula abre de fato (`abrirAulaAgendada`), não no agendamento. Dashboard ganhou seção "Próximas aulas" (próximos 14 dias) com `AgendadaCard` (botões Abrir/Cancelar inline). Página de detalhe da aula (`/aulas/[id]`) ganhou badges Agendada/Cancelada + ações rápidas; `attendance-list.tsx` trava o toggle de presença e o botão "Finalizar" enquanto a aula está agendada (`isLocked = isFinished || isScheduled`), sem afetar a pré-confirmação do aluno (mecanismo separado).

**B-046 — Recorrência:** `src/lib/gerar-aulas.ts` (função pura `calcularDatasRecorrentes`, testável sem DB) + `gerarAulasRecorrentes()` server action com dedupe (não recria aula em data que já tem `agendada`/`aberta`) + `GerarAulasForm` em `/turmas/[id]` com preview ao vivo antes de confirmar.

**B-047 — Próximas aulas no portal do aluno:** Home do aluno busca aulas `agendada` das turmas do aluno, conta confirmados e verifica se o próprio aluno já confirmou; `ConfirmarPresencaButton` reaproveita `fazerCheckin`/`cancelarCheckin` (mesma tabela `presencas` do check-in ao vivo — quando o professor abre a aula, quem já confirmou aparece automaticamente como presente). Hierarquia final do empty state: aula ao vivo → próximas agendadas → "próximo treino" genérico (só quando não há nem uma coisa nem outra).

---

## 📋 Backlog

*Nenhum card pendente no momento.*

---

## 🟡 Em Progresso

*Nenhum card em progresso no momento — aguardando push/PR/merge das branches `feat/sprint8-mobile-makeover` e `feat/sprint9-insights`.*

---

## 🔴 Bloqueado

*Nenhum bloqueio registrado.*

---

## ⚠️ Pendências operacionais (não são cards, mas bloqueiam funcionamento pleno)

1. ~~**Migrations não aplicadas.**~~ Resolvido em 2026-07-03: todas as migrations pendentes (`quem_vai`, `avatars_storage`, `push_subscriptions`, `dedupe_categorias`, `categorias_insert_policy`, `foto_professor`, `aluno_mais_ausente`, `curriculo_global`, `tecnicas_global_select`) foram aplicadas manualmente via SQL Editor do Supabase (CLI desta máquina continua não linkado ao projeto — permanece a forma de aplicar migrations daqui em diante). Todas foram reescritas para serem idempotentes (`DROP POLICY IF EXISTS`, `CREATE TABLE IF NOT EXISTS`, `WHERE NOT EXISTS` em bulk inserts) e podem ser reaplicadas com segurança se necessário.
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
