# Backlog — NajaPass Fase 1

**Última atualização:** 2026-07-09 (v1.5)  
**Fase:** 1 — A Academia Digital  
**Critério de done:** Feature funciona no mobile, testada por Mestre Naja, sem erros no console.

### Changelog
- v1.5: Adicionados EP-16 (Fluxo de Aula — Professor) com cards B-051 a B-054. Fluxo pendente, multi-posições, busca ad-hoc e duplicação de aula.
- v1.4: Adicionados EP-13 (Aluno — Jornada) com cards B-043 e B-044. Portal do aluno expandido para multi-page com nav bar focada em aprendizado.
- v1.3: Adicionados EP-12 (Insights) com cards B-037 a B-042 (exceto B-041, descartado). B-037/B-038 são UX (banho de loja), B-039/B-040/B-042 são Insights.
- v1.2: Branch `feat/sprint7-pendencias` fecha todos os cards P0/P1 pendentes (B-005, B-008, B-009, B-011, B-015, B-017, B-021, B-025, B-028, B-030, B-031, B-032, B-034, B-035, B-036). Ver `backlog/KANBAN.md` para detalhes e pendências operacionais (migrations a aplicar, chaves VAPID a configurar na Vercel).
- v1.1: Adicionado EP-11 (Aluno — App), novos cards B-027 a B-033. Atualizado EP-01 (autenticação dual). EP-06 atualizado com visitantes. EP-05 atualizado com tema/vídeo.

---

## Épicos

| ID | Épico | Prioridade |
|---|---|---|
| EP-01 | Autenticação (Professor + Aluno) | 🔴 P0 |
| EP-02 | Academia & Professor | 🔴 P0 |
| EP-03 | Alunos (cadastro) | 🔴 P0 |
| EP-04 | Turmas | 🟡 P1 |
| EP-05 | Aulas (com tema e vídeo) | 🔴 P0 |
| EP-06 | Presença (professor + aluno + visitante) | 🔴 P0 |
| EP-07 | Técnicas | 🟡 P1 |
| EP-08 | Histórico (Professor) | 🟡 P1 |
| EP-09 | Dashboard | 🟢 P2 |
| EP-10 | PWA & Deploy | 🔴 P0 |
| EP-11 | Aluno — App (check-in, aula, histórico) | 🔴 P0 |
| EP-12 | Insights & UX Mobile | 🟡 P1 |
| EP-13 | Aluno — Jornada de Aprendizado | 🟡 P1 |
| EP-14 | Agendamento e Recorrência | 🟡 P1 |
| EP-15 | Banho de Loja: Portal Aluno V2 (Insights + Drill-down) | 🟡 P1 |
| EP-16 | Fluxo de Aula — Professor (pendente + multi-posições + duplicar) | 🔴 P0 |

---

## Cards do Backlog

### EP-01 · Autenticação (Professor + Aluno)

#### B-001 · Tela de login com Magic Link (único para ambos os perfis)
**Prioridade:** P0 | **Estimativa:** S  
Como professor ou aluno, quero inserir meu e-mail e receber um link para entrar no app, sem criar senha.

**Critérios de aceite:**
- Campo de e-mail com validação
- Botão "Entrar" envia magic link via Supabase Auth
- Feedback visual de "e-mail enviado"
- Link abre o app e cria sessão automaticamente
- Após login: sistema detecta perfil (professor ou aluno) e redireciona para a home correta
- Se e-mail não está em nenhum perfil: mensagem "Fale com seu professor para ser cadastrado"

#### B-002 · Persistência de sessão
**Prioridade:** P0 | **Estimativa:** S  
Como professor ou aluno, quero que o app me reconheça sem precisar logar toda vez.

**Critérios de aceite:**
- Sessão persiste por 30 dias
- App redireciona direto para home correta (professor → dashboard / aluno → home do aluno)
- Logout disponível nas configurações

#### B-003 · Proteção de rotas e perfis
**Prioridade:** P0 | **Estimativa:** S  
Todas as rotas do app exigem sessão ativa. Sem sessão → redireciona para login.

---

### EP-02 · Academia & Professor

#### B-004 · Onboarding: criar academia
**Prioridade:** P0 | **Estimativa:** M  
Como professor novo, quero criar minha academia no primeiro acesso.

**Critérios de aceite:**
- Formulário: nome da academia, cidade
- Gera slug único (ex: "naja-bjj")
- Professor criador vira owner da academia
- Não pode ter dois professores com mesmo e-mail

#### B-005 · Perfil do professor
**Prioridade:** P1 | **Estimativa:** S  
Como professor, quero editar meu nome e faixa.

---

### EP-03 · Alunos

#### B-006 · Listar alunos
**Prioridade:** P0 | **Estimativa:** S  
Lista de alunos ativos com busca por nome.

**Critérios de aceite:**
- Busca em tempo real (debounce 300ms)
- Exibe nome, faixa, grau
- Ordenado por nome

#### B-007 · Cadastrar aluno
**Prioridade:** P0 | **Estimativa:** M  
Como professor, quero cadastrar um novo aluno rapidamente.

**Critérios de aceite:**
- Campos: nome (obrigatório), e-mail, telefone, faixa, grau
- Associar a turma(s) no cadastro
- Feedback de sucesso ao salvar

#### B-008 · Editar aluno
**Prioridade:** P1 | **Estimativa:** S  
Editar nome, contato, faixa e grau do aluno.

#### B-009 · Inativar aluno
**Prioridade:** P1 | **Estimativa:** S  
Aluno inativo some da lista e não aparece nas turmas, mas histórico é preservado.

---

### EP-04 · Turmas

#### B-010 · Criar turma
**Prioridade:** P1 | **Estimativa:** M  
Como professor, quero criar turmas (ex: "Adulto - Manhã") com dias e horário.

**Critérios de aceite:**
- Nome, dias da semana (multi-select), horário
- Associar professor responsável
- Associar alunos existentes

#### B-011 · Editar turma
**Prioridade:** P1 | **Estimativa:** S  
Editar nome, horário e alunos da turma.

#### B-012 · Listar turmas
**Prioridade:** P1 | **Estimativa:** S  
Lista de turmas ativas com número de alunos.

---

### EP-05 · Aulas

#### B-013 · Abrir nova aula
**Prioridade:** P0 | **Estimativa:** M  
Como professor, quero abrir uma aula em menos de 30 segundos.

**Critérios de aceite:**
- Selecionar turma ou "Aula avulsa"
- Data/hora preenchida com "agora"
- Aula criada com status "aberta"
- Redireciona para tela da aula

#### B-014 · Finalizar aula
**Prioridade:** P0 | **Estimativa:** S  
Como professor, quero finalizar a aula e voltar ao dashboard.

**Critérios de aceite:**
- Botão "Finalizar Aula"
- Resumo: X presentes, Y técnicas
- Campo opcional de observações
- Status muda para "finalizada"

#### B-015 · Aula em andamento (resumo no dashboard)
**Prioridade:** P0 | **Estimativa:** S  
Se houver aula aberta, dashboard mostra banner de acesso rápido.

---

### EP-06 · Presença

#### B-016 · Registrar presença por toggle
**Prioridade:** P0 | **Estimativa:** M  
Como professor, quero marcar/desmarcar presença tocando no nome do aluno.

**Critérios de aceite:**
- Lista de alunos da turma, todos começam ausentes
- Toque = alterna presente/ausente
- Feedback visual imediato (cor + ícone)
- Contador "X/Y presentes" atualiza em tempo real
- Persiste no Supabase ao alternar

#### B-017 · Adicionar aluno avulso à presença
**Prioridade:** P1 | **Estimativa:** S  
Professor pode adicionar um aluno não matriculado na turma para aquela aula específica.

---

### EP-07 · Técnicas

#### B-018 · Listar e buscar técnicas
**Prioridade:** P1 | **Estimativa:** M  
Como professor, quero buscar técnicas por nome ou categoria para adicionar à aula.

**Critérios de aceite:**
- Busca com debounce
- Filtro por categoria
- Técnicas selecionadas aparecem como chips

#### B-019 · Criar técnica nova
**Prioridade:** P1 | **Estimativa:** S  
Como professor, quero criar uma técnica nova "on the fly" durante a aula.

**Critérios de aceite:**
- Modal: nome + categoria
- Aparece imediatamente na lista selecionada

#### B-020 · Seed de categorias padrão
**Prioridade:** P0 | **Estimativa:** S  
10 categorias padrão (Guarda Fechada, Meia Guarda, etc.) criadas no setup inicial.

---

### EP-08 · Histórico

#### B-021 · Histórico de aulas da academia
**Prioridade:** P1 | **Estimativa:** M  
Lista cronológica reversa de aulas finalizadas com filtro por turma e mês.

#### B-022 · Detalhe de aula
**Prioridade:** P1 | **Estimativa:** S  
Ver quem esteve presente e quais técnicas foram ensinadas em uma aula específica.

#### B-023 · Histórico do aluno
**Prioridade:** P1 | **Estimativa:** M  
Perfil do aluno com frequência, última presença e aulas recentes.

**Critérios de aceite:**
- Frequência dos últimos 30 e 90 dias
- Listagem das últimas 20 aulas com técnicas ensinadas

---

### EP-09 · Dashboard

#### B-024 · Dashboard inicial
**Prioridade:** P2 | **Estimativa:** M  
Visão geral da semana: aulas abertas, total de presenças, atalhos rápidos.

**Critérios de aceite:**
- Botão "Nova Aula" em destaque
- Aulas desta semana: count
- Últimas 3 aulas finalizadas
- Atalhos: Alunos, Histórico

---

### EP-10 · PWA & Deploy

#### B-025 · Configuração PWA
**Prioridade:** P0 | **Estimativa:** M  
App instalável na tela inicial com ícone, splash e comportamento standalone.

**Critérios de aceite:**
- manifest.json configurado
- Service Worker básico para cache do shell
- Ícones em todos os tamanhos necessários
- "Adicionar à tela inicial" funciona no iOS e Android

#### B-026 · Deploy na Vercel + Supabase
**Prioridade:** P0 | **Estimativa:** M  
App em produção com domínio, variáveis de ambiente configuradas e CI básico.

**Critérios de aceite:**
- URL pública acessível
- Variáveis de ambiente no Vercel (não no código)
- Deploy automático via push na main

---

### EP-11 · Aluno — App

#### B-027 · Trigger de associação user → aluno no primeiro login
**Prioridade:** P0 | **Estimativa:** S  
Quando aluno faz primeiro login via Magic Link, o sistema associa automaticamente o `user_id` pelo e-mail.

**Critérios de aceite:**
- Trigger Supabase `on_auth_user_created` executa ao criar usuário
- Aluno com mesmo e-mail recebe `user_id`
- Aluno sem e-mail cadastrado não consegue logar (mensagem orientando contato com professor)

#### B-028 · Home do Aluno
**Prioridade:** P0 | **Estimativa:** M  
Como aluno, quero ver as próximas aulas das turmas em que estou matriculado.

**Critérios de aceite:**
- Lista de aulas `agendada` e `aberta` das minhas turmas
- Cada card mostra: data, horário, turma, tema, vídeo (link), técnicas planejadas, contagem de confirmados
- Botão "Confirmar presença" / "✓ Confirmado"
- Atalho para "Meu histórico"

#### B-029 · Check-in do Aluno
**Prioridade:** P0 | **Estimativa:** S  
Como aluno, quero confirmar que vou aparecer em uma aula com um toque.

**Critérios de aceite:**
- Toque em "Confirmar presença" → `presencas` inserida com `origem = 'aluno'`
- Toque novamente → cancela check-in (remove presença)
- Funciona para aulas `agendada` e `aberta`
- Aula `finalizada` → botão bloqueado

#### B-030 · Ver quem vai na aula
**Prioridade:** P0 | **Estimativa:** S  
Como aluno, quero ver quem já confirmou presença na aula.

**Critérios de aceite:**
- Lista de nomes (alunos confirmados + visitantes)
- Visitantes aparecem com label "(visitante)"
- Sem dados sensíveis (apenas nome)

#### B-031 · Histórico próprio do aluno
**Prioridade:** P0 | **Estimativa:** M  
Como aluno, quero ver meu histórico de presenças e o que foi ensinado em cada aula.

**Critérios de aceite:**
- Frequência: treinos no mês atual e últimos 3 meses
- Última presença: X dias atrás
- Lista de aulas em que estive presente (cronológica reversa)
- Cada aula mostra: data, turma, técnicas ensinadas

#### B-032 · Adicionar visitante/experimental à aula (Professor)
**Prioridade:** P0 | **Estimativa:** S  
Como professor, quero adicionar um visitante ou aluno experimental à lista de presentes sem precisar cadastrá-lo.

**Critérios de aceite:**
- Botão "+ Visitante" na tela da aula
- Campo de texto para nome
- Visitante aparece na lista de presentes com label "(visitante)"
- Aparece em "Quem vai" para os alunos
- Fica registrado no histórico da aula

#### B-034 · Foto de perfil do aluno
**Prioridade:** P1 | **Estimativa:** S  
Como professor ou aluno, quero que o perfil tenha foto, faixa e grau visíveis.

**Critérios de aceite:**
- Upload de foto via Supabase Storage (bucket `avatars`)
- Professor pode fazer upload no cadastro ou edição do aluno
- Aluno pode atualizar a própria foto no perfil
- Foto exibida no card do aluno, na lista de presentes e no perfil
- Fallback: avatar com inicial do nome se sem foto
- Faixa exibida como badge colorido (cor da faixa)
- Grau exibido como número de listras no badge

---

#### B-033 · Tema e vídeo da aula (Professor)
**Prioridade:** P0 | **Estimativa:** S  
Como professor, quero informar o tema da aula e um link de vídeo para que os alunos saibam o que vem por aí.

**Critérios de aceite:**
- Campo "Tema" (texto livre, ex: "Raspagens da meia guarda")
- Campo "Vídeo" (URL — YouTube, Instagram, etc.)
- Ambos editáveis em aulas `agendada` e `aberta`
- Aluno vê tema e vídeo na home antes de confirmar presença
- Link de vídeo abre no browser nativo

#### B-035 · Push Notification — Aula aberta
**Prioridade:** P1 | **Estimativa:** M  
Como aluno, quero receber uma notificação no celular quando o professor abre a aula da minha turma, para lembrar de fazer check-in.

**Critérios de aceite:**
- Aluno autoriza notificações no primeiro acesso (Web Push API)
- Ao mudar status da aula para `aberta`, dispara push para todos os alunos da turma
- Notificação: "🥋 Aula aberta! [Turma] — Confirme sua presença"
- Toque na notificação abre direto o card da aula
- Aluno pode desativar notificações nas configurações do app
- Funciona em Android e iOS 16.4+

#### B-036 · Avisos da Academia
**Prioridade:** P1 | **Estimativa:** M  
Como professor, quero postar avisos para os alunos diretamente no app, sem depender de WhatsApp.

**Critérios de aceite:**
- Professor cria aviso com título e texto (ex: "Sem treino na sexta-feira feriado")
- Aviso aparece fixado no topo da home do aluno
- Pode ser direcionado: academia toda ou turma específica
- Professor pode arquivar/remover aviso quando não for mais relevante
- Novo aviso dispara push notification para os alunos impactados
- Lista de avisos ativos visível no painel do professor

---

---

### EP-12 · Insights & UX Mobile

#### B-037 · Banho de loja — consistência visual e mobile-first
**Prioridade:** P1 | **Estimativa:** L  
Estender o design system (tokens `--brand-*`) a todas as páginas e resolver problemas estruturais de UX mobile.

**Critérios de aceite:**
- Fonte corrigida para Inter (não Arial) em `globals.css`
- `layout.tsx` usa tokens de cor, não `bg-black` hardcoded
- Ícones Lucide em todo lugar que hoje usa emoji de interface
- Bottom nav bar (Início / Alunos / Histórico / Perfil) fixo no layout do professor
- Back buttons com touch target mínimo de 44px (componente `BackButton`)
- Botões primários usam `--brand-gold`, não branco
- Safe area insets aplicados no iOS PWA
- Zero ocorrências de `fontFamily: 'var(--font-oswald)'` no codebase

**Referência:** `HANDOFF-004-banho-de-loja.md` na raiz do projeto.

---

#### B-038 · Foto de perfil do professor
**Prioridade:** P1 | **Estimativa:** S  
Como professor, quero ter foto no meu perfil, igual ao aluno já tem.

**Critérios de aceite:**
- Migration: `ALTER TABLE professores ADD COLUMN foto_url TEXT`
- Storage policies espelhando as do bucket `avatars` (RLS por `user_id`)
- `perfil/page.tsx` exibe `AvatarUpload` (mesmo componente reaproveitado do aluno)
- Foto aparece no header do dashboard (substitui o avatar de iniciais quando preenchida)

---

#### B-039 · Tela de Insights (`/relatorios`)
**Prioridade:** P1 | **Estimativa:** L  
Como professor, quero uma tela dedicada que me mostre padrões da academia: o que estou ensinando demais, o que estou esquecendo, quem está sumindo.

**Critérios de aceite:**
- Três abas: **Técnicas** / **Alunos** / **Frequência**
- Filtro de período: Mês / 3 meses / Ano
- **Aba Técnicas:**
  - Ranking das 5+ técnicas mais ensinadas (barra horizontal proporcional)
  - Lista de técnicas com flag `reforco = true` na última aula
  - Contagem de técnicas cadastradas mas nunca ensinadas ("lacunas")
- **Aba Alunos:**
  - Alertas: alunos sem treinar há mais de 14 dias
  - Ranking de presença no período
- **Aba Frequência:**
  - Total de aulas no período
  - Média de presentes por aula
  - Gráfico de barras: presentes por dia da semana
- Rota `/relatorios` já existe — implementar o conteúdo real

---

#### B-040 · Insight dinâmico no dashboard
**Prioridade:** P2 | **Estimativa:** S  
Como professor, quero ver um alerta contextual no dashboard que me faça agir — não só números estáticos.

**Critérios de aceite:**
- Um único card de insight abaixo do stats strip
- Lógica de prioridade (em ordem): aluno ausente há +14 dias → categoria não ensinada há +3 semanas → técnica com reforço pendente
- Exibe apenas o insight mais urgente
- Toque no card leva para a rota relevante (`/relatorios` ou perfil do aluno)
- Se não há nenhum alerta, o card não aparece (não mostrar "tudo certo" forçado)

---

#### B-042 · Candidatos a graduação
**Prioridade:** P2 | **Estimativa:** M  
Como professor, quero saber quais alunos têm presença suficiente para uma potencial graduação.

**Critérios de aceite:**
- Seção na aba Alunos de `/relatorios` ou dentro do perfil de cada aluno
- Exibe alunos com X+ presenças desde o último registro de faixa/grau (threshold configurável por professor)
- Não toma decisão de graduar — apenas sinaliza candidatos
- Threshold padrão sugerido: 50 presenças para subir de grau, 120 para subir de faixa (ajustável)

---

---

### EP-13 · Aluno — Jornada de Aprendizado

#### B-043 · Portal do Aluno V2 — Multi-page com bottom nav
**Prioridade:** P1 | **Estimativa:** L  
Como aluno, quero um app com navegação clara entre as seções, não uma única tela com tudo empilhado.

**Critérios de aceite:**
- Bottom nav do aluno com 4 itens: Home / Técnicas / Histórico / Perfil
- Nav aparece em todas as rotas `/aluno/*`, nunca no portal do professor
- `/aluno` (Home): check-in ao vivo + avisos + técnicas da semana + empty state com próximo treino
- `/aluno/historico`: frequência 30/90d + lista de presenças com técnicas de cada aula
- `/aluno/perfil`: avatar editável + faixa + turmas + toggle de notificações
- Helper `src/lib/aluno-auth.ts` centraliza auth check (sem duplicar lógica em cada página)
- Layout `src/app/(app)/aluno/layout.tsx` injeta o nav e padding `pb-20`

**Referência:** `HANDOFF-007-portal-aluno-v2.md` na raiz do projeto.

---

#### B-044 · Técnicas aprendidas do aluno (`/aluno/tecnicas`)
**Prioridade:** P1 | **Estimativa:** M  
Como aluno, quero ver todas as posições que já passei em aula, agrupadas por categoria, com barra de progresso mostrando minha cobertura do currículo.

**Critérios de aceite:**
- Página `/aluno/tecnicas` lista todas as categorias do currículo global
- Para cada categoria: barra de progresso (técnicas vistas / total), contagem X/Y
- Técnicas que o aluno viu (estava presente quando foram ensinadas) = chips dourados
- Técnicas do currículo não vistas = chips cinzas discretos
- Categorias ordenadas por % de cobertura (mais conhecida primeiro)
- Empty state quando aluno ainda não tem nenhuma presença
- Dados: `presencas` × `aula_tecnicas (tipo='ensinada')` × `tecnicas (global=true)`
- Sem nova migration — toda a estrutura já existe desde o sprint10 (currículo global)

**Referência:** `HANDOFF-007-portal-aluno-v2.md` (seção 5).

---

### EP-14 · Agendamento e Recorrência

#### B-045 · Aulas agendadas — professor cria e gerencia aulas futuras
**Prioridade:** P1 | **Estimativa:** L  
Como professor, quero criar aulas para datas futuras e vê-las no dashboard para abrir no momento certo.

**Critérios de aceite:**
- Formulário de nova aula aceita datas futuras (campo `data` + campo `horario`)
- Aula com data futura salva com `status='agendada'` automaticamente
- Dashboard exibe seção "Próximas aulas" com as agendadas dos próximos 14 dias
- Cada card de agendada exibe: turma, data, horário, contagem de confirmados
- Botão "Abrir" muda status para 'aberta' e dispara push notification
- Botão "Cancelar" cancela a aula sem apagar histórico de pré-confirmações
- Migration: `ALTER TABLE aulas ADD COLUMN horario TEXT`
- Migration: verificar e atualizar constraint de status se necessário

**Referência:** `HANDOFF-008-aulas-agendadas-recorrentes.md`.

---

#### B-046 · Recorrência — gerar ciclo de aulas a partir da turma
**Prioridade:** P1 | **Estimativa:** M  
Como professor, quero gerar automaticamente as aulas da semana com um clique, baseado nos dias configurados na turma.

**Critérios de aceite:**
- Na página da turma: seção "Gerar aulas" com seletor 1/2/4 semanas
- Preview antes de confirmar: "Vai criar X aulas entre {início} e {fim}"
- Algoritmo calcula datas baseado em `turma.dias_semana` e `turma.horario`
- Datas onde já existe aula (status='agendada' ou 'aberta') são ignoradas (sem duplicatas)
- Aulas geradas com `status='agendada'`, podendo ser editadas antes de abrir
- Toast de confirmação: "X aulas criadas"
- Utilitário `src/lib/gerar-aulas.ts` com função `calcularDatasRecorrentes` (puro TS, testável)

**Referência:** `HANDOFF-008-aulas-agendadas-recorrentes.md` (seção B-046).

---

#### B-047 · Portal do aluno — próximas aulas agendadas
**Prioridade:** P1 | **Estimativa:** M  
Como aluno, quero ver as próximas aulas da minha turma no app, mesmo fora do horário de treino, e poder confirmar minha presença antecipadamente.

**Critérios de aceite:**
- Home do aluno (`/aluno`) exibe seção "Próximas aulas" quando não há aula ao vivo
- Lista as aulas agendadas das turmas do aluno, ordenadas por data/horário
- Cada card exibe: dia da semana + data, turma, horário, contagem de confirmados, técnicas planejadas (se houver)
- Aluno pode pré-confirmar presença (mesmo mecanismo de check-in — tabela `presencas`)
- Quando professor abre a aula (status → 'aberta'), os pré-confirmados já constam como presentes
- Fallback hierárquico: aula ao vivo > agendadas futuras > empty state com "Próximo treino: {dia}"
- Aulas canceladas NÃO aparecem na home do aluno

**Referência:** `HANDOFF-008-aulas-agendadas-recorrentes.md` (seção B-047).

---

### EP-15 · Banho de Loja: Portal Aluno V2 (Insights + Drill-down)

#### B-050 · Avatar upload UX + header redesign
**Prioridade:** P1 | **Estimativa:** S  
Remover "TROCAR FOTO" como texto solto. Avatar circle = o próprio botão de upload, com ícone de câmera como overlay circular dourado. Header: banda de cor da faixa (3px) + avatar com câmera + nome + badge de faixa colorido + sino (Bell/BellOff Lucide).

**Critérios de aceite:**
- `AvatarUpload` refatorado: `<label>` envolve o círculo, câmera overlay `bottom:2px right:2px` no círculo
- Nenhum texto "TROCAR FOTO" visível em qualquer tela
- Bell/BellOff em círculo 38px (sem underline, sem texto)
- Banda de cor da faixa (3px) no topo de todas as telas do aluno

**Referência:** `HANDOFF-009-banho-de-loja-aluno-v2.md` (seção B-050).

---

#### B-048 · Técnicas: overview compacto + drill-down por categoria
**Prioridade:** P1 | **Estimativa:** M  
Overview com cards compactos (chips apenas das vistas, stale em laranja, `+N` unseen, seta `›`). Nova rota `/aluno/tecnicas/[id]` com 3 seções: "Precisa reforçar" (laranja, > 21 dias), "Aprendidas" (com frequência e data), "Ainda não viu" (dim chips).

**Critérios de aceite:**
- Overview: card por categoria com barra de progresso + max 4 chips + "+N" + ChevronRight
- Categorias com técnica stale (>21d) aparecem PRIMEIRO com borda laranja sutil
- Toque em qualquer categoria → `/aluno/tecnicas/[id]`
- Detail page: stale section (laranja), learned (gold, com "vista Nx · última: Y dias"), unseen (dim)
- Frequency badge: Frequente (≥5×), Boa (≥3×), ou "Nx" para resto
- Empty state correto quando aluno nunca viu nada nesta categoria

**Referência:** `HANDOFF-009-banho-de-loja-aluno-v2.md` (seção B-048).

---

#### B-049 · Home insights engine
**Prioridade:** P1 | **Estimativa:** M  
Substituir o vazio da home entre treinos por 4 cards de insight: "Hora de revisar" (técnica stale, link para categoria), stats strip (aulas/mês + técnicas aprendidas), progresso da melhor categoria, última aula com técnicas. Empty state motivacional para alunos novos.

**Critérios de aceite:**
- RPC `aluno_home_insights(p_aluno_id)` retorna: técnica stale, contagens, melhor categoria, última aula
- Card "Hora de revisar" com nome da técnica + dias + link para categoria
- Stats: 2 cards — "X aulas este mês" e "Y técnicas aprendidas"
- Card de progresso: melhor categoria com barra e "aprenda mais N técnicas"
- Card de última aula: data + técnicas como chips dourados
- Aluno sem presença alguma: empty state com link para `/aluno/tecnicas`
- Nenhuma tela com "NENHUMA AULA AO VIVO AGORA" sozinho sem contexto

**Referência:** `HANDOFF-009-banho-de-loja-aluno-v2.md` (seção B-049).

---

---

### EP-16 · Fluxo de Aula — Professor

#### B-051 · Status pendente — toda aula nasce como `agendada`
**Prioridade:** P0 | **Estimativa:** S  
Como professor, quero criar o plano de aula e só depois iniciar a aula quando os alunos chegarem.

**Critérios de aceite:**
- `abrirAula()` sempre cria com `status='agendada'` (remove o split por data)
- Formulário: botão "SALVAR AULA" (não "ABRIR AULA")
- Badge "Pendente" para aulas `agendada` com data ≤ hoje; "Agendada" para datas futuras
- Dashboard "Próximas aulas" inclui aulas de hoje (`gte`, não `gt`)
- "Iniciar" (AulaAgendadaActions existente) abre a aula → AO VIVO + push
- Sem migration — status `agendada` já existe

**Referência:** `HANDOFF-010-fluxo-pendente-multi-posicoes.md` (seção B-051).

---

#### B-052 · Múltiplas posições por aula
**Prioridade:** P0 | **Estimativa:** M  
Como professor, quero planejar técnicas de múltiplas categorias na mesma aula (ex: Costas + Guarda Fechada).

**Critérios de aceite:**
- Formulário de nova aula: picker com busca + navegação por categoria (sem filtro por tema único)
- Chips selecionados sempre visíveis no topo do picker
- Ad-hoc na aula AO VIVO: remover filtro de tema em `disponiveis` (técnicas de qualquer categoria disponíveis)
- Técnicas na tela da aula agrupadas por categoria quando há múltiplas
- Título do bloco de técnicas: "POSIÇÕES — COSTAS" se uma só categoria, "POSIÇÕES" se múltiplas

**Referência:** `HANDOFF-010-fluxo-pendente-multi-posicoes.md` (seção B-052).

---

#### B-053 · Busca de técnicas ad-hoc durante aula AO VIVO
**Prioridade:** P1 | **Estimativa:** S  
Como professor durante uma aula ao vivo, quero adicionar uma posição digitando o nome — não rolando um dropdown de 100+ itens.

**Critérios de aceite:**
- Campo de busca substitui o `<select>` flat
- Mínimo 2 caracteres para mostrar resultados; máximo 6 chips
- Chip mostra "Nome · Categoria" (categoria em dim)
- Toque → adiciona como `ensinada`; campo limpa automaticamente
- Zero resultados → mensagem "Nenhuma posição encontrada"

**Referência:** `HANDOFF-010-fluxo-pendente-multi-posicoes.md` (seção B-053).

---

#### B-054 · Duplicar aula
**Prioridade:** P1 | **Estimativa:** M  
Como professor, quero copiar o planejamento de técnicas de uma aula para outra turma ou horário.

**Critérios de aceite:**
- Botão "Duplicar" (ícone Copy) no header da tela de detalhe da aula
- Bottom sheet: select de turma + date + time picker
- Nova aula criada como `agendada` com as técnicas `planejadas` da original
- Técnicas `ensinada`/`nao_ensinada` NÃO copiadas (pertencem à execução da aula original)
- Após duplicar: redirect para `/aulas/{novaAulaId}`
- RLS: só duplica aulas da própria academia

**Referência:** `HANDOFF-010-fluxo-pendente-multi-posicoes.md` (seção B-054).

---

## Ordem de Implementação Sugerida

```
Sprint 1 — Fundação
B-025 → B-026 → B-001 → B-002 → B-003 → B-004

Sprint 2 — Alunos e Turmas
B-006 → B-007 → B-010 → B-012 → B-020 → B-027

Sprint 3 — Coração do Produto (Professor)
B-013 → B-033 → B-016 → B-032 → B-018 → B-014 → B-015

Sprint 4 — App do Aluno
B-028 → B-029 → B-030 → B-031 → B-036

Sprint 5 — Notificações e Refinamento
B-035 → B-021 → B-022 → B-023 → B-024 → B-008 → B-009
```
