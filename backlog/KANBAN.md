# KANBAN — NajaPass

**Atualizado em:** 2026-07-12 (v2.15 — navegação secundária consolidada em "Mais")

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
| B-048 | Técnicas: overview compacto + drill-down por categoria | Aluno App |
| B-049 | Home insights engine (RPC + 4 cards) | Aluno App |
| B-050 | Avatar upload UX + header redesign | Aluno App |
| B-051 | Status pendente — toda aula nasce `agendada` | Aulas |
| B-052 | Múltiplas posições por aula (picker desacoplado do tema) | Aulas |
| B-053 | Busca de técnica ad-hoc durante aula ao vivo | Aulas |
| B-054 | Duplicar aula | Aulas |
| B-055 | Dashboard "cockpit" — Hoje + Insights + Semana | Dashboard |
| B-056 | Planejamento com contexto da última aula da turma | Aulas |
| B-057 | Feedback pós-aula — "Como foi a turma?" | Aulas |
| B-058 | Auto-abertura de aulas por turma (cron + config) | Aulas |
| B-059 | Nav professor: Perfil → Planejamento | UX/Nav |
| B-060 | Página `/planejamento` — visão turma-centric | Aulas |
| B-061 | Retrospecto `/historico` — abas Conteúdo/Frequência | Aulas |
| B-062 | Picker de técnicas filtrado pelo tema selecionado | Aulas |
| B-063 | Histórinhas — sequências de técnicas nomeadas | Aulas |
| B-064 | Jornada técnica do aluno — visão professor | Alunos |
| B-065 | Turma — aulas com técnicas ensinadas | Turmas |
| B-066 | Relatorios acessível + lacunas de currículo | Dashboard |
| B-067 | BackButton inteligente + reforços auto-selecionados | UX |
| B-068 | Checkin do aluno mostra técnicas ensinadas | Aluno App |
| B-069 | "Abrir Agora": criar + abrir em uma ação | Aulas |
| B-070 | Sticky "Finalizar Aula" → redireciona para feedback | UX/Aulas |
| B-071 | Feedback revisado: "Quais técnicas você ensinou?" + concluirAula() | Aulas |
| B-072 | Remover ✗ durante aula ao vivo | UX |

> B-026 (deploy) já estava configurado na Vercel segundo o usuário — não verificado a partir do código.
> B-037/B-038 concluídos na branch `feat/sprint8-mobile-makeover`; B-039/B-040/B-042 na branch `feat/sprint9-insights` (a partir da 008); B-043/B-044 (+ HANDOFF-006) na branch `feat/sprint11-portal-aluno-v2` (a partir da `main`); B-045/B-046/B-047 na branch `feat/sprint12-agendamento` (a partir da sprint11); B-048/B-049/B-050 na branch `feat/sprint13-aluno-insights` (a partir da `main`); B-051/B-052/B-053/B-054 na branch `feat/sprint14-fluxo-pendente` (a partir da `main`); B-055/B-056/B-057/B-058 na branch `feat/sprint15-cockpit-professor` (a partir da `main`); B-059/B-060/B-061 na branch `feat/sprint16-nav-planejamento` (a partir da `main`) — ver seção de detalhes abaixo.
> B-062/B-063 na branch `feat/sprint17-historinhas` (a partir da `main`, mergeada); B-064/B-065/B-066/B-067/B-068 na branch `feat/sprint18-jornada-usabilidade` (a partir da `feat/sprint17-historinhas`, mergeada) — ver seção de detalhes abaixo.
> Tradução do currículo (sem cards no backlog) na branch `feat/sprint19-traducao-curriculo` (a partir da `main`, aguardando merge).
> B-069/B-070/B-071/B-072 na branch `feat/sprint19-loop-simplificado` (a partir da `main` após merge das sprints 17 e 18) — ver seção de detalhes abaixo.

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

## 🔍 Detalhes B-048 / B-049 / B-050 (branch `feat/sprint13-aluno-insights`, a partir da `main`)

**B-050 — Avatar upload + header:** `AvatarUpload` refatorado — o próprio círculo do avatar agora é o `<label>` do input de arquivo (via `useId()`), com overlay de câmera dourado no canto inferior direito; zero texto "TROCAR FOTO" em qualquer tela (afeta as 4 telas que usam o componente: home/perfil do aluno, perfil do professor, edição de aluno). Header da home: avatar 52px + nome + badge de faixa numa linha, bell (Bell/BellOff) fixado em 38px à direita.

**B-048 — Técnicas: overview + drill-down:** overview (`/aluno/tecnicas`) reescrito — cada categoria é um card tappável com barra de progresso, até 4 chips (as com mais de 21 dias sem repetir em laranja com ⚠, as recentes em dourado) + contador "+N" das não vistas, ordenado por urgência (tem stale > tem vistas > nenhuma vista). Nova rota `/aluno/tecnicas/[id]` com 3 seções: "Precisa reforçar" (laranja), "Aprendidas" (dourado, com badge de frequência Frequente/Boa/Nx), "Ainda não viu" (chips neutros, limitado a 8 + contador do resto).

**B-049 — Home insights engine:** RPC `aluno_home_insights(p_aluno_id)` — uma chamada só (evita N queries sequenciais), retorna JSON com técnica mais antiga sem revisar (>21d), presenças/técnicas do mês, melhor categoria (% de cobertura), e última aula com técnicas ensinadas. **Reforço de segurança sobre o handoff:** a função original do PM não validava que `p_aluno_id` pertence ao usuário autenticado — como é `SECURITY DEFINER`, isso permitiria ler o progresso de qualquer aluno de qualquer academia só trocando o parâmetro. Adicionado `IF p_aluno_id != id_do_aluno() THEN RETURN NULL` no início, mesmo padrão de `atualizar_foto_propria`/`aluno_mais_ausente`. Home substituiu o antigo bloco estático "próximo treino" (e a função `calcularProximoTreino`, removida por ficar redundante) pelos 4 cards de insight + empty state motivacional pra aluno novo.

---

## 🔍 Detalhes B-051 / B-052 / B-053 / B-054 (branch `feat/sprint14-fluxo-pendente`, a partir da `main`)

**B-051 — Status pendente:** `abrirAula()` agora sempre insere `status: 'agendada'` (era `data > hoje ? 'agendada' : 'aberta'`) — toda aula passa pela fase de planejamento, mesmo as de hoje. Como consequência direta, o bloco de push notification no fim de `abrirAula()` virou código morto de verdade (`status === 'aberta'` nunca mais é true ali) — removido, já que o TS acusou a comparação como sempre-falsa. Push continua disparando normalmente, só que exclusivamente via `abrirAulaAgendada()`. Badge na tela da aula e na Semana diferencia "Pendente" (agendada com `data <= hoje`, laranja) de "Agendada" (data futura, cinza) — a distinção é só de UI, o banco continua com um único valor `'agendada'` pros dois casos. Botão do form virou sempre "Salvar Aula".

**B-052 — Múltiplas posições:** o formulário de nova aula tinha o picker de técnicas travado no `categoria_id` do tema único selecionado — impossível planejar Costas + Guarda Fechada na mesma aula. Reescrito como um picker desacoplado: busca por nome (≥2 caracteres) ou navegação por categorias expansíveis (auto-expande categorias com técnica já selecionada), com chips das selecionadas sempre visíveis no topo. O campo "Tema da aula" virou puramente um label de display. Mesmo destravamento em `/aulas/[id]`: removido o filtro `.filter(t => !aulaTemaid || t.categoria_id === aulaTemaid)` da lista de técnicas disponíveis pra ad-hoc (variável `aulaTemaid` ficou sem uso e foi removida). Em `tecnicas-aula.tsx`, "Planejadas" e "Ensinadas" agora agrupam por categoria quando há mais de uma envolvida, e o título do bloco vira "Posições — X" só quando todas as técnicas são da mesma categoria, senão só "Posições".

**B-053 — Busca ad-hoc:** o `<select>` nativo com 100+ técnicas (inutilizável no mobile) foi trocado por `BuscaTecnicaInline` — campo de texto, resultados só a partir de 2 caracteres, máximo 6 chips, cada um mostrando a categoria em dim (ex: "Arm Trap · Costas"). Verificado que `adicionarTecnicaAula()` já inseria com `tipo: 'ensinada'` (upsert) — nenhuma mudança necessária ali, item do handoff já estava satisfeito.

**B-054 — Duplicar aula:** nova action `duplicarAula()` em `aulas/actions.ts` — copia `tema_id`/`video_url` da aula origem e só as técnicas `tipo='planejada'` (não copia `ensinada`/`nao_ensinada`, que são resultado da execução da aula original). Nova aula sempre nasce `agendada`. UI: `DuplicarAulaButton` (ícone Copy no header de `/aulas/[id]`) abre bottom sheet com turma/data/hora; após duplicar, redirect pra `/aulas/{novaAulaId}`.

**Sem migrations** — `agendada` já existia no constraint desde o B-045; `aulas.hora_inicio` já cobria o caso de uso que o handoff achava que precisava de coluna nova.

---

## 🔍 Detalhes B-055 / B-056 / B-057 / B-058 (branch `feat/sprint15-cockpit-professor`, a partir da `main`)

**B-056 — Planejamento com contexto:** tela da aula `agendada` com turma agora busca a última aula finalizada da mesma turma e mostra um painel com as técnicas ensinadas nela (✓ verde) e as marcadas pra reforço (↺ laranja) antes do bloco de técnicas da aula atual. `abrirAula()` passou a inserir os reforços da última aula **server-side** (união com o que o form já manda), preservando `reforco: true` na nova linha `planejada` — antes isso só acontecia no client e perdia a flag.

**B-057 — Feedback pós-aula:** nova rota `/aulas/[id]/feedback` — ao finalizar a aula, `attendance-list.tsx` redireciona pra lá em vez de ficar na mesma tela. Lista as técnicas ensinadas com toggle Ótimo/Repetir (default: repete o que já veio marcado como reforço), preview de quantas vão pra próxima aula, e `salvarFeedbackAula()` zera + remarca `reforco` em `aula_tecnicas`. Se o professor voltar em `/aulas/[id]` depois de finalizada, o botão "Finalizar Aula" vira link "Ver feedback →".

**B-055 — Dashboard cockpit:** redesenhado em 3 seções — **Hoje** (aulas do dia com `AulaHojeCard`: 3 variantes por status — pendente com chips de técnica/aviso de "sem plano" + botões Iniciar/Editar, ao vivo com destaque verde, finalizada compacta; fallback pra próximas aulas + CTA "Nova aula" quando não há nada hoje), **Insights** (RPC `professor_dashboard_insights` — turma sem plano, categoria esquecida, aluno ausente, reforços pendentes; card só aparece se houver algo, sem "tudo certo"), **Semana** (mini-grid de 7 dias com dots coloridos por status, link pra `/semana`). Removido o card de insight antigo (`calcularInsight`) e as queries que ele usava, substituídos pela RPC nova. Stats strip e grid de atalhos (Alunos/Turmas/Histórico/Solicitações) mantidos, movidos pra baixo das 3 seções novas.

**B-058 — Auto-abertura por turma:** campo "Abertura automática das aulas" no formulário de editar turma (`turmas.auto_abrir_horas`, NULL = manual). Cron `/api/cron/abrir-aulas` a cada 30min via `vercel.json`, protegido por `CRON_SECRET`, chama a RPC `aulas_para_abrir_agora()` (compara `data + hora_inicio - auto_abrir_horas` contra o horário atual em `America/Sao_Paulo`, com janela de tolerância de 2h pra trás) e abre + dispara push pras aulas que caem na janela. **Correção ao handoff:** o cron usa um cliente Supabase novo (`src/lib/supabase/service.ts`, service role key) em vez do cliente cookie-based usado no resto do app — o handoff original reaproveitava `createClient()` de `@/lib/supabase/server`, que depende de cookies de sessão inexistentes numa chamada de cron sem usuário logado; isso faria toda leitura/escrita falhar silenciosamente sob RLS. **Pendências de configuração:** adicionar `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` (gerar um valor aleatório) nas env vars da Vercel e no `.env.local`.

---

## 🔍 Detalhes B-059 / B-060 / B-061 (branch `feat/sprint16-nav-planejamento`, a partir da `main`)

**B-059 — Nav Planejamento:** `bottom-nav.tsx` troca "Perfil" (`User`) por "Planejamento" (`CalendarCheck2`), apontando pra `/planejamento`. Acesso ao perfil migra pro header do dashboard, que já era um `Link` pra `/perfil` desde antes deste sprint — só trocado o círculo de iniciais por `Avatar` de verdade (mostra a foto se o professor tiver uma, componente já existente e reaproveitado, sem precisar mexer em `AvatarUpload`) + nome ao lado.

**B-060 — `/planejamento` (nova):** visão turma-centric — um card por turma ativa com a última aula finalizada (chips ✓ verde/↺ laranja das técnicas ensinadas) e as próximas 3 aulas agendadas (badge "Sem planejamento" laranja + botão Planejar, ou "X técnicas planejadas" + Ver plano). **Correção ao handoff:** a query de exemplo usava `turmas.hora_inicio`, mas essa coluna não existe em `turmas` (é `horario`) — só existe em `aulas`. Corrigido na query e no card. Sem migration, todos os dados já existiam.

**B-061 — `/historico` (antes `/aulas`) retrospecto:** duas abas via `?aba=` — "Conteúdo" (default, aulas finalizadas/ao vivo agrupadas por mês com chips de técnica, reforço em laranja) e "Frequência" (RPC `frequencia_resumo`: total de aulas, média de presentes, top 5 assíduos — últimos 90 dias). Filtro de turma preservado nas duas abas via querystring. O filtro de mês antigo (`?mes=`) saiu — o agrupamento automático por mês substitui a necessidade dele.

---

## 🔍 Ajuste pós-sprint16 — grid de atalhos removido do dashboard (branch `feat/sprint16-nav-dashboard-cleanup`, a partir da `main`)

Pedido direto do usuário, sem card no `BACKLOG.md`: com a bottom nav já cobrindo Alunos/Histórico/Planejamento, o grid de atalhos "Alunos/Turmas/Histórico/Solicitações" do dashboard (introduzido no B-055) virou redundante. Removido do `dashboard/page.tsx`, junto com a query de `ultimaAula`/contagem de solicitações que só alimentava esse grid (`ultimaAulaLabel()` também saiu, ficou sem uso).

Como Solicitações e Turmas não tinham mais nenhum ponto de entrada na UI depois da remoção do grid, viraram abas visuais dentro das seções da bottom nav a que pertencem: novo componente `src/components/section-tabs.tsx` (barra de 2 abas, `<Link>` reais entre rotas, sem client state) usado em `/alunos` ↔ `/solicitacoes` (aba Solicitações com badge de pendentes) e `/planejamento` ↔ `/turmas`. Cada rota continua sendo uma página cheia e independente — as abas só dão navegação visual entre elas, não fundiram lógica de uma dentro da outra.

---

## 🔍 Detalhes B-062 / B-063 (branch `feat/sprint17-historinhas`, a partir da `main`)

**B-062 — Picker filtrado por tema:** em `/aulas/nova/form.tsx`, quando `temaId` está selecionado o picker de categorias mostra só a categoria correspondente (`categoriasVisiveis = temaId ? categorias.filter(cat => cat.id === temaId) : categorias`) e a expande automaticamente via `useEffect([temaId])`. Link "Ver todas" abaixo do picker limpa o filtro. Como o estado de expansão do picker já era um único `categoriaExpandida: string | null` (não um `Set`, como o handoff assumia), o auto-expand ficou mais simples do que o exemplo do handoff — só `setCategoriaExpandida(temaId)`.

**B-063 — Histórinhas:** migration nova (`historinhas` + `historinha_tecnicas`, RLS por academia via `professores.user_id = auth.uid()`, mesmo padrão das demais tabelas). CRUD completo em `/historinhas` (lista), `/historinhas/nova`, `/historinhas/[id]/editar`, componente client `historinha-form.tsx` (reordenação por botões ↑/↓ — sem drag-and-drop, mobile-first) e `actions.ts` (`salvarHistorinha`/`deletarHistorinha`, delete+reinsert das técnicas a cada save). Integrado em `/aulas/nova/form.tsx`: seção "Histórinhas" acima do picker de posições, botão "Aplicar" soma todas as técnicas da sequência ao Set de `planejadas` (sem duplicar), vira "✓ Aplicada" quando já estão todas selecionadas. Link "Histórinhas" adicionado à seção "Mais" de `/perfil`.

**Correção ao handoff:** o doc assumia um componente compartilhado `@/components/busca-tecnica-inline` — na verdade `BuscaTecnicaInline` é um componente privado dentro de `aulas/[id]/tecnicas-aula.tsx`, acoplado a uma server action específica (`adicionarTecnicaAula`), não reaproveitável. `historinha-form.tsx` implementa sua própria busca inline (mesmo padrão visual, callback `onSelect` local em vez de server action direta). Também trocado o botão `←` de texto puro do exemplo do handoff pelo componente `BackButton` já padronizado no resto do app.

---

## 🔍 Tradução do currículo global pra PT-BR (branch `feat/sprint19-traducao-curriculo`, a partir da `main`)

Sem card no `BACKLOG.md` — pedido direto do usuário ao ver muitos nomes de técnica em inglês no app: "O ESPORTE É BRASILEIRO. PRECISAMOS TRADUZIR TUDO". Usuário mandou um catálogo próprio de referência (posições/técnicas em PT-BR com critério de quando manter o termo original) pra guiar a tradução.

`supabase/migrations/20260712000001_traducao_curriculo_pt.sql` — `UPDATE` de ~90 das 168 técnicas globais (`global = true`, inseridas na `20260703000001_curriculo_global.sql`), escopado por categoria + nome antigo pra não afetar técnicas cadastradas por academias específicas. Categoria "Takedown / Queda" renomeada pra "Queda" (único nome de categoria com palavra em inglês). Critério aplicado: nome próprio mantido (Kimura, Berimbolo, Ezequiel), termo cunhado sem tradução usada no tatame mantido (Dogfight, Matrix), termo com tradução consagrada no BJJ brasileiro traduzido (Butterfly Sweep → Raspagem Borboleta, Heel Hook → Chave de Calcanhar, Toe Hold → Chave de Pé).

Migration idempotente por natureza — como casa por `nome_antigo` exato, rodar de novo depois que já rodou uma vez simplesmente não encontra mais match e não faz nada.

**Pendência:** alguns nomes traduzidos são chamada de julgamento (ex: Kiss of the Dragon → Beijo do Dragão, Coyote Guard → Guarda Coiote, Estima Lock → Chave Estima) — o próprio catálogo do usuário recomenda validar com o Mestre Naja antes de virar taxonomia oficial. Vale uma segunda passada depois do deploy.

---

## 🔍 Detalhes B-069 / B-070 / B-071 / B-072 (branch `feat/sprint19-loop-simplificado`, a partir da `main`, HANDOFF-015)

**B-069 — Abrir Agora:** `abrirAula()` lê `intent` do FormData (`'abrir_agora'` → `status='aberta'` + push imediato pra turma, igual `abrirAulaAgendada()` já fazia; qualquer outro valor → `status='agendada'`, comportamento antigo). `/aulas/nova/form.tsx` ganhou dois botões — "Abrir Agora" (primário, dourado) e "Planejar para depois" (secundário) — cada um seta um `<input type="hidden" name="intent">` via ref antes do submit (mutação direta do DOM, não `useState`, porque o clique e o submit do form acontecem no mesmo tick e o React não teria repintado o input a tempo).

**B-070 — Sticky Finalizar:** botão "Finalizar Aula" saiu do topo da lista de presença (sumia no scroll com turmas grandes) e virou uma barra fixa no rodapé com contagem de presentes: "N presentes · Finalizar Aula". Ao tocar, só navega pra `/aulas/[id]/feedback` — não finaliza mais nesse momento (finalizar virou responsabilidade do feedback, depois de marcar as técnicas).

**B-071 — Feedback "O que você ensinou?":** reescrita completa. Antes: só listava técnicas já marcadas `ensinada` durante a aula, e servia só pra marcar reforço. Agora: lista TODAS as planejadas (independente de já terem sido confirmadas ao vivo ou não), professor toca "Ensinei" pra confirmar cada uma e "Repetir na próxima" pra marcar reforço; as que já estavam `ensinada` (confirmadas ao vivo) chegam pré-marcadas. `concluirAula()` (nova action) faz tudo de uma vez: marca ensinadas, marca reforços, joga as não confirmadas pra `nao_ensinada`, e só então finaliza a aula (`status='finalizada'`). Tela de sucesso oferece "Planejar próxima aula" (pré-seleciona a turma e reforços na próxima criação) ou "Ir para o início".

**B-072 — Sem ✗ ao vivo:** o botão "Não ensinada" some da tela da aula ao vivo — só existiam os 3 botões (✓/🔁/✗) dentro do bloco condicionado a `aulaAberta`, então bastou remover o botão de dentro desse bloco. "Não ensinada" continua existindo como resultado automático (técnicas planejadas não confirmadas até o fim viram `nao_ensinada` no `concluirAula()`), só não é mais uma ação manual durante a aula.

**Correções ao handoff:**
- O doc listava GAP 3 ("reforços computados mas nunca aplicados") como se ainda fosse um problema — já tinha sido corrigido no HANDOFF-014 (B-067), `handleTurmaChange()` já fazia `setPlanejadas(new Set(refs))`. Nenhuma mudança adicional necessária ali além do que HANDOFF-014 já tinha feito.
- O doc dizia pra manter `finalizarAula()` porque "`concluirAula()` a usa internamente" — na prática `concluirAula()` reimplementa a lógica de finalizar diretamente (é o próprio código do handoff que faz isso), nunca chama `finalizarAula()`. Com o botão removido de `attendance-list.tsx`, `finalizarAula()` ficou sem nenhum call site — removida por completo em vez de deixar como código morto.
- Pelo mesmo motivo, `salvarFeedbackAula()` (a action antiga do feedback) também ficou sem nenhum call site depois da reescrita — removida em vez de mantida como wrapper de compatibilidade, já que nada mais a importa.
- A query nova do feedback tentava `.order('created_at')` em `aula_tecnicas`, mas essa tabela nunca teve essa coluna (schema original só tem `id, aula_id, tecnica_id, tipo`; `reforco` foi adicionado depois, `created_at` nunca foi). Removido o `.order()`.

Sem migrations nesta sprint.

---

## 🔍 Detalhes B-064 / B-065 / B-066 / B-067 / B-068 (branch `feat/sprint18-jornada-usabilidade`, a partir da `feat/sprint17-historinhas`)

**B-067 — BackButton inteligente + reforços:** `back-button.tsx` virou client component com prop `useBack?: boolean` — quando true, renderiza `<button onClick={() => router.back()}>` em vez do `<Link href>`. Aplicado em `/aulas/[id]` (voltar pra onde o professor veio: dashboard ou histórico). **Correção ao handoff:** a Parte 2 (reforços auto-selecionados ao trocar turma em `/aulas/nova`) já estava implementada — `handleTurmaChange()` em `form.tsx` já chama `setPlanejadas(new Set(refs))` ao trocar a turma. O GAP 3 do audit do handoff estava desatualizado; nenhuma mudança necessária ali.

**B-065 — Turma tech history:** `turmas/[id]/page.tsx` trocou a query bugada (`tema` — coluna TEXT legada, sempre null/stale) por `tema:categorias_tecnicas(nome)` + busca separada de `aula_tecnicas` tipo `ensinada`. Cada aula da lista agora mostra status badge (Finalizada/Ao vivo/Pendente/Cancelada) e até 4 chips de técnicas ensinadas.

**B-064 — Jornada técnica do aluno:** nova RPC `jornada_tecnica_aluno(p_aluno_id)` (SECURITY DEFINER, valida que o professor autenticado é da mesma academia do aluno). `/alunos/[id]` ganhou seção "Jornada Técnica" — técnicas aprendidas agrupadas por categoria, chip verde a partir de 3 repetições. Header trocou "Perfil" pelo primeiro nome do aluno.

**B-066 — Relatórios acessível:** dashboard ganhou card "Insights da academia" logo após o stats strip. **Correção ao handoff:** o doc assumia que não existia nenhum conceito de "lacunas de currículo" em `/relatorios` e propunha uma subseção nova do zero — na verdade a aba Técnicas já calculava `lacunas` (contagem de técnicas nunca ensinadas no período selecionado via `?periodo=`), só que sem listar quais. Em vez de duplicar a query, a mesma seção existente foi enriquecida pra listar as técnicas por nome (chips vermelhos, com categoria, +N quando passa de 20) — reaproveita o período (Mês/3M/Ano) já escolhido pelo professor em vez do "últimos 90 dias" fixo que o handoff sugeria.

**B-068 — Checkin com técnicas ensinadas:** `/aluno/page.tsx` busca `aula_tecnicas` com `tipo IN ('planejada','ensinada')` (antes só planejada) e separa os dois arrays. `CheckinCard` ganhou chips verdes "✓ Ensinadas nesta aula" — o aluno vê em tempo real o que o professor já registrou, sem esperar abrir o app de novo depois.

**Sem migrations além da RPC de B-064** (`jornada_tecnica_aluno`).

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
4. **Novas migrations do sprint 15 não aplicadas.** `professor_dashboard_insights.sql` e `turma_auto_abrir.sql` (colunas + RPC `aulas_para_abrir_agora`) precisam ser rodadas manualmente no SQL Editor do Supabase, igual às anteriores.
5. **`SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` não configurados.** Necessários pro cron de auto-abertura (`/api/cron/abrir-aulas`) funcionar — sem eles o endpoint sempre responde 401/erro. Pegar a service role key no painel do Supabase (Project Settings → API) e gerar um `CRON_SECRET` aleatório; adicionar nos dois lugares: `.env.local` (dev) e env vars do projeto na Vercel (produção — sem isso lá, o cron configurado em `vercel.json` chama o endpoint e recebe 401 a cada 30min).
6. ~~**Auditoria de complexidade pendente de ação.**~~ Item "4 padrões de navegação diferentes" resolvido em 2026-07-12 (branch `feat/sprint20-nav-consolidada`) — ver seção "🔍 Auditoria" abaixo. Os demais achados (frequência duplicada, terminologia Tema/Categoria, `tecnicas.faixas` morto, `/turmas/[id]` sem hierarquia visual, dashboard com 7 seções) seguem sem ação, aguardando priorização do usuário.

---

## 🔍 Auditoria — complexidade do fluxo do professor (2026-07-12, pedido direto do usuário)

Pedido: "o app pro professor tá mais complexo que o necessário" + verificar se existe alguma feature de "separar o treino em graduados e não graduados". Leitura de código (não só nomes de arquivo) em `/turmas`, `/planejamento`, `/aulas`, `/tecnicas`, `/relatorios`, `/historinhas`, `/alunos`, bottom nav e dashboard.

**"Separar treino em graduados e não graduados": não existe.** Nem por turma, nem dentro de uma aula ao vivo, nem como dois tracks de currículo. A lista de chamada (`attendance-list.tsx`) é flat, ordenada por nome, com a barra de cor da faixa só decorativa (sem agrupar/filtrar). O picker de técnicas ao vivo (`tecnicas-aula.tsx`) não tem noção de faixa nenhuma. Blocos existentes que uma feature futura poderia reaproveitar: `alunos.faixa`/`grau` (já estruturado em toda a base), `tecnicas.faixas` (array por técnica, mas só é de fato *usado como filtro* no portal do aluno — `aluno/page.tsx` — e como texto em `/semana`; nas 3 telas onde o professor lista/escolhe técnicas esse dado é coletado e ignorado), `GraduacaoForm` (troca manual de faixa/grau, zero lógica de elegibilidade) e "Candidatos a graduação" em `/relatorios?aba=alunos` (o mais próximo que existe — calcula `presenças ≥ threshold da faixa` e lista quem já bateria o número esperado, mas é só informativo, não integra com nada).

**Achados de complexidade/redundância (nenhum é bug — tudo funciona, mas tem sobreposição):**
- ~~**4 padrões de navegação diferentes**~~ **— resolvido em 2026-07-12** (branch `feat/sprint20-nav-consolidada`): bottom nav (4 itens, inalterado) e `SectionTabs` (Turmas↔Planejamento, Solicitações↔Alunos, inalterados — são pares fortemente relacionados, não fragmentação de verdade) continuam os dois padrões "estruturais". Os dois padrões soltos viraram um só: a lista "Mais" em `/perfil` agora é o único catálogo de tudo que não está na bottom nav (Avisos e Semana entraram nela, além de Professores/Relatórios/Técnicas/Histórinhas já existentes), e os cards de atalho de Relatórios e Avisos saíram do dashboard (redundantes com "Mais"). O mini-grid de Semana no dashboard foi mantido — é um preview visual rico, não só um link, e agora tem uma entrada de menu de verdade em paralelo (antes não tinha nenhuma).
- **Frequência duplicada:** existe tanto em `/aulas?aba=frequencia` quanto em `/relatorios?aba=frequencia`, respondendo praticamente a mesma pergunta com escopo levemente diferente.
- **"Última aula desta turma" duplicada:** aparece em `/aulas/[id]` (quando a aula está agendada) E em `/planejamento` — mesmo dado, duas superfícies.
- **Terminologia inconsistente:** "Tema da aula" na UI é literalmente a mesma entidade que `categorias_tecnicas` (usada como "categoria" em `/tecnicas`) — o próprio código comenta isso (`aulas/nova/form.tsx`), mas o usuário final vê dois nomes pra mesma coisa dependendo da tela.
- **`tecnicas.faixas` é dado morto no lado do professor:** coletado no cadastro de técnica (`/tecnicas/nova`), mas não filtra nem aparece em `/tecnicas`, no picker de `/aulas/nova`, nem no picker ao vivo de `/aulas/[id]` — só é realmente consumido no portal do aluno.
- **`/turmas/[id]`** empilha 4 blocos (editar, matricular, gerar aulas recorrentes, histórico) sem nenhuma separação visual — tudo com o mesmo peso na mesma página longa.
- **Dashboard** tem 7 seções distintas na primeira tela (Hoje, Insights, Semana, Stats, link Relatórios, link Avisos, feed Últimas aulas) — nenhuma quebrada, mas é bastante scroll pra abertura diária do app.

Nenhuma dessas coisas foi alterada nesta sessão — é levantamento pra priorizar com o usuário antes de mexer.

---

## Legenda

| Símbolo | Significado |
|---|---|
| P0 | Crítico — sem isso o MVP não existe |
| P1 | Importante — faz parte do MVP completo |
| P2 | Desejável — melhora a experiência |

---

> **Instrução para o Claude Code:** Mover o card para "Em Progresso" ao iniciar, para "Concluído" ao terminar. Nunca trabalhar em mais de 2 cards simultaneamente.
