# KANBAN — NajaPass

**Atualizado em:** 2026-07-17 (v2.24 — B-079/B-080: landing page + fix tela branca)

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
| B-073 | Insights por turma no Planejamento (RPC insights_turma + UI) | Planejamento |
| B-074 | Histórico: presentes por aula + chips de turma | Histórico |
| B-075 | Nova Aula: turma como cards + tema como chips (zero selects nativos) | UX |
| B-076 | Turmas lista: contagem de alunos ativos por turma | UX |
| B-077 | Turma cockpit: 3 abas Dados / Alunos / Config | Turmas |
| B-078 | Histórico global: linha do tempo compacta (sem chips) | Histórico |
| B-079 | Homepage / landing page para novos usuários | Marketing |
| B-080 | Performance (tela branca) + unificação do fluxo de entrada | Marketing/Perf |

> B-026 (deploy) já estava configurado na Vercel segundo o usuário — não verificado a partir do código.
> B-037/B-038 concluídos na branch `feat/sprint8-mobile-makeover`; B-039/B-040/B-042 na branch `feat/sprint9-insights` (a partir da 008); B-043/B-044 (+ HANDOFF-006) na branch `feat/sprint11-portal-aluno-v2` (a partir da `main`); B-045/B-046/B-047 na branch `feat/sprint12-agendamento` (a partir da sprint11); B-048/B-049/B-050 na branch `feat/sprint13-aluno-insights` (a partir da `main`); B-051/B-052/B-053/B-054 na branch `feat/sprint14-fluxo-pendente` (a partir da `main`); B-055/B-056/B-057/B-058 na branch `feat/sprint15-cockpit-professor` (a partir da `main`); B-059/B-060/B-061 na branch `feat/sprint16-nav-planejamento` (a partir da `main`) — ver seção de detalhes abaixo.
> B-062/B-063 na branch `feat/sprint17-historinhas` (a partir da `main`, mergeada); B-064/B-065/B-066/B-067/B-068 na branch `feat/sprint18-jornada-usabilidade` (a partir da `feat/sprint17-historinhas`, mergeada) — ver seção de detalhes abaixo.
> Tradução do currículo (sem cards no backlog) na branch `feat/sprint19-traducao-curriculo` (a partir da `main`, aguardando merge).
> B-069/B-070/B-071/B-072 na branch `feat/sprint19-loop-simplificado` (a partir da `main` após merge das sprints 17 e 18) — ver seção de detalhes abaixo.
> B-073/B-074 na branch `feat/sprint20-planejamento-dados` (a partir da `main`) — ver seção de detalhes abaixo.
> B-075/B-076 na branch `feat/sprint21-banho-loja-selects` (mergeada); B-077/B-078 na branch `feat/sprint22-turma-cockpit` (mergeada) — ver seções de detalhes abaixo.
> B-079 na branch `feat/sprint23-homepage` (a partir da `main`) — ver seção de detalhes abaixo.

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

## 🔍 Detalhes B-073 / B-074 (branch `feat/sprint20-planejamento-dados`, a partir da `main`, HANDOFF-016)

**B-073 — Insights por turma no Planejamento:** nova RPC `insights_turma(p_turma_id, p_academia_id)` retorna, num JSON só: até 5 técnicas há mais tempo sem aparecer nessa turma (nunca ensinadas entram primeiro), até 3 mais ensinadas nos últimos 30 dias, e até 3 alunos sem presença há 14+ dias (ou nunca presentes). `/planejamento` chama a RPC em paralelo com as queries já existentes de última/próximas aulas (um `Promise.all` por turma) e renderiza três blocos novos no card — "⏱ Há mais tempo sem aparecer", "🔁 Mais ensinadas no mês", "👻 Alunos sumindo" — cada um só aparece se tiver dado (sem estado vazio poluindo o card). **Correção ao handoff:** a função usava `RAISE EXCEPTION 'unauthorized'` pra validação de acesso — trocado por `RETURN NULL`, mesmo padrão de segurança de todas as outras RPCs do projeto (`aluno_mais_ausente`, `frequencia_resumo`, `jornada_tecnica_aluno`, `professor_dashboard_insights`), pra manter consistência em como o frontend trata falha de autorização.

**B-074 — Histórico por data, com presença visível:** a ordenação por `data DESC` já estava correta (confirmado, sem mudança na query) — o problema era só de UX. `<select>` nativo de turma virou uma strip de chips horizontais roláveis (`Todas` + uma por turma), movida pra **antes** das abas Conteúdo/Frequência. Cada aula na aba Conteúdo agora mostra quantos alunos estiveram presentes (`N 🥋`, via `presencas(id)` adicionado à query), e o topo da lista mostra o total de aulas no filtro atual.

Sem migrations em B-074.

---

## 🔍 Fix — planejar posições em aula agendada (branch `fix/planejar-posicoes-aula-agendada`, a partir da `main`)

Bug reportado pelo usuário: dentro de `/planejamento`, tocar "Planejar" numa próxima aula levava pra `/aulas/[id]` (status `agendada`), mas ali não havia como adicionar/remover posições — o componente `TecnicasAula` só habilitava o campo "Adicionar posição" e os controles de edição quando a aula estava `aberta` (ao vivo). Ou seja, aulas geradas por recorrência (que nascem sem técnicas) ou criadas via "Planejar para depois" ficavam impossíveis de planejar depois da criação — a única janela pra montar o plano era no `/aulas/nova`.

Correção: `TecnicasAula` ganhou prop `aulaAgendada`. Introduzido `editavel = aulaAberta || aulaAgendada` — nas duas fases a lista de posições é editável, mas com semânticas diferentes: no planejamento (agendada) o professor adiciona/remove **planejadas**; ao vivo (aberta) confirma/adiciona **ensinadas**. `adicionarTecnicaAula` passou a aceitar um 3º parâmetro `tipo` (default `'ensinada'` pra não quebrar a chamada da aula ao vivo), gravando `'planejada'` quando chamado do planejamento. Planejadas ganham botão de remover (×) na fase agendada; o rótulo do campo vira "Planejar posição" em vez de "Adicionar posição". Zero mudança de schema — só reaproveita o fluxo de busca de técnica que já existia pra aula ao vivo.

---

## 🔍 Detalhes B-075 / B-076 (branch `feat/sprint21-banho-loja-selects`, a partir da `main`, HANDOFF-017)

**B-075 — Selects nativos → pickers no fluxo que o professor usa todo treino** (`/aulas/nova` + lista de presença). No iOS o `<select>` abre uma roda que cobre meia tela — trocado por controles inline:
- **Turma** (`aulas/nova/form.tsx`): virou lista de cards tappáveis full-width (gold-dim + ✓ quando ativo), com um `<input type="hidden" name="turma_id" value={turmaId}>` carregando o valor pro FormData (os cards são `type=button`). `handleTurmaChange` inalterado, então os reforços da última aula continuam pré-selecionando ao trocar de turma.
- **Tema** (`aulas/nova/form.tsx`): virou strip de chips horizontais roláveis (`Geral` + um por tema), também com `<input type="hidden" name="tema_id">`. Preserva o filtro do B-062 (selecionar tema ainda foca o picker de posições naquela categoria e o "Ver todas"/`Geral` limpa). Botão "+ Novo tema" e criação inline mantidos.
- **Aluno avulso** (`aulas/[id]/attendance-list.tsx`): o `<select>` de "adicionar aluno de outra turma" virou lista de botões selecionáveis. **Melhoria além do handoff:** como `outrosAlunos` pode ser a academia inteira menos a turma, adicionei um campo de busca (só aparece com >6 alunos) + container rolável (`max-height`), mesmo padrão da busca de técnica — evita uma lista gigante de botões. Botão "Adicionar à lista" só aparece depois de selecionar alguém; empty state mantém a mensagem "Todos os alunos da academia já estão nesta turma".

**B-076 — Turmas com contagem de alunos** (`turmas/page.tsx`): query ganhou `alunos_turmas(id)` com `.eq('alunos_turmas.ativo', true)` (filtra o array aninhado; turmas sem alunos continuam aparecendo com array vazio, conforme comportamento do PostgREST). Cada card mostra "X aluno(s)" no canto direito do nome. Sem migration.

**Sem migrations nesta sprint.** Nota: os `<select>` de fluxos secundários (cadastro/edição de aluno, editar turma, avisos) ficaram de fora de propósito — o handoff foca só no fluxo diário do professor.

---

## 🔍 Fix — feedback de toque e navegação (branch `fix/tap-feedback-loading`, a partir da `main`)

Bug reportado pelo usuário: "muitos botões que eu clico e ou demora muito ou não vai". Auditoria de TODOS os componentes interativos (27 arquivos com `onClick` + todos os `<Link>` estilizados como botão) concluiu:

**Botões de ação (server actions): todos já corretos.** Os 18 componentes que disparam actions têm `disabled` durante o pending + label de progresso ("Aprovando...", "Abrindo...", "Salvando..."), e os toggles (presença, check-in, matrícula) são otimistas. Nenhuma mudança necessária.

**A causa real era navegação sem feedback:** o app não tinha NENHUM `loading.tsx` — tocar em qualquer link (bottom nav, cards do dashboard, "Planejar", abas, chips de filtro) deixava a tela atual congelada até o servidor terminar todas as queries da próxima página (Supabase, várias queries por página, facilmente 1s+). Pro usuário, o toque "não foi". Correção:

- `src/app/(app)/loading.tsx` — skeleton instantâneo (header + blocos fantasma com `animate-pulse`, tokens da marca) pra toda navegação nas rotas do professor. A `BottomNav` vive no layout, então permanece visível e responsiva durante o load.
- `src/app/(app)/aluno/loading.tsx` — boundary próprio pro portal do aluno, pra `AlunoBottomNav` (que vive no layout do segmento) não ser substituída pelo fallback do nível de cima.
- `globals.css` — `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` em `button/a/input/select/textarea/label`: elimina o atraso que o navegador reserva pra detectar duplo-toque/zoom (iOS principalmente) e o flash cinza nativo por cima dos nossos estados de `active:`.

Resultado: todo toque tem resposta visual imediata — ação mostra progresso no próprio botão (já mostrava), navegação mostra skeleton na hora em vez de tela parada.

---

## 🔍 Detalhes B-077 / B-078 (branch `feat/sprint22-turma-cockpit`, a partir da `main`, HANDOFF-018)

**B-077 — Turma como cockpit:** `/turmas/[id]` reescrita — deixou de abrir num painel de admin (editar/matricular/gerar aulas empilhados) e virou hub de análise com 3 abas via `?aba=` (mesmo padrão URL-based de `/aulas` e `/relatorios`):
- **Dados** (default): stats strip (aulas/mês, alunos, presença média), os 3 blocos de insight da RPC `insights_turma` (⏱ técnicas há mais tempo sem aparecer, 🔁 mais ensinadas no mês, 👻 alunos sumindo), histórico compacto das últimas 10 aulas (data · N🥋 · N téc. · →) e CTA fixo "Abrir Nova Aula" que pré-seleciona a turma via `?turma_id=`.
- **Alunos**: lista dos matriculados com **% de presença nos últimos 30 dias** (verde ≥70 / amarelo ≥40 / vermelho <40), cada um linkando pro perfil; `EnrollmentManager` fica no rodapé da aba como "Gerenciar matrículas".
- **Config**: `EditarTurmaForm` + `GerarAulasForm` — disponíveis, mas fora do fluxo principal.

Em `/planejamento`, o header de cada card de turma virou link pro cockpit (`/turmas/[id]`); os botões Planejar/Ver plano seguem indo pra aula. **Correção ao handoff:** o % de presença por aluno era calculado sobre a lista `limit(10)` do histórico — turma 3x/semana tem ~13 aulas em 30 dias, o corte distorceria o %. Adicionada query própria (só `id`, sem limit) das finalizadas dos últimos 30 dias como base do cálculo. O `BackButton` usa `useBack` (volta pra `/planejamento` ou `/turmas`, de onde o professor veio) em vez do `/planejamento` fixo do handoff.

**B-078 — Histórico global compacto:** `ConteudoTab` de `/aulas` parou de buscar/renderizar `aula_tecnicas` — o card virou uma linha de timeline (data grande à esquerda · turma + hora/status · N🥋 · →). Mais aulas visíveis por tela, sem o peso dos chips; o detalhe completo continua a um toque. Os chips de técnica introduzidos no B-074 saem daqui, mas a informação continua no cockpit da turma e no detalhe da aula.

**Correção extra (bug real, achado ao implementar o CTA fixo):** as barras fixas de rodapé existentes — "Finalizar Aula" (`attendance-list.tsx`), "Concluir aula" (`feedback/form.tsx`) e o rodapé salvar/excluir de `historinha-form.tsx` — usavam `bottom-0` com z-index igual (ou menor) que o da bottom nav, que renderiza depois no layout e por isso **cobria a metade de baixo desses botões**; toque na área coberta acertava a nav e navegava pra outra tela (parte do "clico e não vai" reportado). Todas as barras (incluindo o CTA novo do cockpit) agora ancoram em `bottom: calc(56px + env(safe-area-inset-bottom))` — acima da nav — com clearance de conteúdo ajustada.

Sem migrations nesta sprint (reusa a RPC `insights_turma` do B-073, já aplicada).

---

## 🔍 Detalhes B-079 (branch `feat/sprint23-homepage`, a partir da `main`, HANDOFF-019)

**B-079 — Homepage / landing page:** `/` deixou de redirecionar todo mundo pro login. Quem não está logado vê a landing (`components/landing-page.tsx` — Server Component: cobra, branding, tagline, dois blocos de pitch professor/aluno, CTAs "Sou Professor" → `/login?role=professor` e "Sou Aluno" → `/login?role=aluno`, safe-area no rodapé). Quem já tem conta continua redirecionado normalmente (dashboard/onboarding/aluno). A role escolhida na landing viaja pelo login e pré-seleciona em boas-vindas: professor cai direto no `/onboarding`, aluno abre já no passo de escolher academia (adaptado ao UI real de boas-vindas, que são dois botões de ação, não um estado de "role selecionada").

**Correção ao handoff (crítica — a landing não apareceria sem isso):** o handoff não mencionou o `middleware.ts`, que redirecionava QUALQUER rota não-autenticada (menos `/login` e `/api`) direto pro `/login` — ou seja, interceptava `/` antes do `page.tsx` renderizar a landing. Adicionada a raiz `/` como rota pública no middleware. Verificado no preview: `/` renderiza a landing pra deslogado, CTAs com hrefs corretos, `/login?role=professor` renderiza sem crash.

**Correção ao handoff (menor):** `login/page.tsx` é `'use client'` e `useSearchParams()` no Next 15 exige boundary de Suspense senão o build quebra — o componente foi envolto num `<Suspense>` (`LoginPage` wrapper → `LoginForm` interno). `boas-vindas` fica sob `(app)`, não `(auth)` como o doc dizia. Usei `<img>` em vez de `next/image` pra bater com o padrão do login. `npm run build` passou (`/` dinâmica, `/login` estática).

Sem migrations. Sem mudança de schema.

---

## 🔍 Multi-tema derivado + filtro por faixa no picker (branch `feat/multi-tema-filtro-faixa`, a partir da `main`)

Pedido direto do usuário: "sinto falta de colocar mais de um tema na aula e por graduação". Duas decisões confirmadas com ele antes de implementar (via pergunta): tema múltiplo → **derivar das posições** (não campo manual); graduação → **filtrar posições por faixa**.

**Múltiplos temas (derivado):** o campo "Tema da aula" (chip único) saiu de `/aulas/nova`. Como o picker de posições já é multi-categoria, o(s) tema(s) da aula agora são simplesmente as categorias das posições escolhidas — sem seleção redundante. `aulas.tema_id` deixa de ser preenchido em aulas novas (fica null; a coluna continua pra compat). Todo lugar que mostrava "Tema: X" (único, do `tema_id`) passou a derivar as categorias das técnicas da aula, com fallback pro `tema_id` antigo pra não regredir aulas já existentes: detalhe da aula (`aulas/[id]` — "Tema:" / "Temas:" com as categorias), `/semana` (deriva do `aula_tecnicas` que já buscava), home do aluno (check-in card — query ganhou `categorias_tecnicas(nome)`). O componente `tecnicas-aula.tsx` já agrupava as posições por categoria, então o multi-tema já aparecia ali. Removido o "+ Novo tema" do form (criar categoria continua existindo em `/tecnicas/nova`, onde faz sentido).

**Filtro por faixa (graduação):** o picker de posições ganhou uma strip de chips de faixa (Todas / Branca / Azul / Roxa / Marrom / Preta). Filtra as técnicas usando `tecnicas.faixas` — que já existia no schema mas era ignorado nas telas do professor (achado da auditoria de complexidade). Técnica sem faixa definida serve todas. Com uma faixa ativa, as categorias visíveis já vêm expandidas (mostrando direto as posições daquela faixa) e categorias sem match somem. A busca por nome também respeita o filtro. Isso **substitui** o antigo filtro "por tema" do picker (B-062) — que perdeu o sentido junto com o campo de tema único.

Sem migrations. Sem mudança de schema (reusa `tema_id` só como fallback de leitura e `tecnicas.faixas` que já existia).

---

## 🔍 Detalhes B-080 (branch `feat/sprint24-unificacao-entrada`, a partir da `main`, HANDOFF-020)

B-079 (landing) já tinha sido feito no HANDOFF-019 e mergeado. Este handoff (que supersede o 019) adicionou o B-080: performance + unificação do fluxo de entrada.

**Performance (tela branca):** `page.tsx` (raiz) e `boas-vindas/page.tsx` faziam queries de perfil sequenciais (professor → aluno → pré-cadastro → solicitação → academias). Paralelizadas com `Promise.all` (professor+aluno juntos; solicitação+academias juntas). Novos `src/app/loading.tsx` (raiz) e `src/app/(auth)/loading.tsx` — só o fundo escuro, matam o flash branco enquanto o servidor decide entre landing e redirect (o `(app)/loading.tsx` com skeleton já existia).

**Unificação do fluxo de entrada:** as telas "landing" (`/`) e "BEM-VINDO" (`/boas-vindas`) faziam a MESMA pergunta (Sou Professor / Sou Aluno) — o usuário respondia duas vezes. Agora a escolha da landing carrega via `?role`: CTAs → `/login?role=X` → login propaga → `/boas-vindas?role=X`, onde **professor vai direto pro `/onboarding`** e **aluno abre direto o formulário de academia** (`initialStep='academia-form'`), pulando a tela "BEM-VINDO". Essa tela vira **fallback** só pra quem acessa `/boas-vindas` direto sem `?role` (link antigo, etc.). `login/page.tsx` voltou a ler `?role` (com wrapper de `<Suspense>`, exigido pelo Next 15); `role-select.tsx` ganhou prop `initialStep`.

> **Reversão consciente do fix `fix/boas-vindas-role-skip`:** aquele fix tinha *removido* esse mesmo pulo por `?role` porque na época pulava o BEM-VINDO de forma que pareceu bug. O usuário reavaliou (mandou print das duas telas fazendo a mesma pergunta) e decidiu que a unificação é o comportamento desejado — agora é decisão intencional, com a landing como ponto único de escolha e o BEM-VINDO como fallback.

**Extra:** a tela BEM-VINDO (fallback) tinha um `<img src="/logo.webp">` de um asset inexistente (aparecia como ícone quebrado no print do usuário) — trocado por `/cobra.webp`, que já existe.

Sem migrations. Sem mudança de schema.

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
