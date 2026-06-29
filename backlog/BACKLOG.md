# Backlog — NajaPass Fase 1

**Última atualização:** 2026-06-29 (v1.1)  
**Fase:** 1 — A Academia Digital  
**Critério de done:** Feature funciona no mobile, testada por Mestre Naja, sem erros no console.

### Changelog
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
