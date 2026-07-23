# NajaPass

> A evolução do Jiu-Jitsu, registrada treino após treino.

PWA para professores de Jiu-Jitsu registrarem aulas, presença e técnicas. O objetivo não é administrar pagamentos — é construir a memória técnica da academia.

---

## O problema

Em praticamente toda academia de Jiu-Jitsu, o professor ensina dezenas de técnicas ao longo do ano, mas poucos meses depois ninguém consegue responder com precisão:

- Quais posições já foram ensinadas?
- Quando determinado aluno aprendeu uma técnica?
- Quem realmente está evoluindo?
- Quais conteúdos precisam ser reforçados?
- Quem está treinando de forma consistente?

A evolução dos alunos depende da memória do professor, não de um histórico confiável.

O NajaPass transforma cada treino em um registro permanente.

---

## Perfis de usuário e responsabilidades

### 🥋 Professor

O professor é o administrador da academia. Tem acesso total à gestão operacional e aos dados de todos os alunos da sua academia.

**Gestão da academia**
- Cria e configura a academia (nome, slug)
- Convida alunos por e-mail
- Gerencia múltiplos professores

**Turmas**
- Cria, edita e arquiva turmas
- Define dias da semana, horário e configuração de abertura automática
- Visualiza cockpit por turma: stats, insights, alunos, histórico

**Aulas**
- Abre aulas manualmente ou agenda para datas futuras
- Gera ciclos recorrentes de aulas a partir da turma
- Define tema e vídeo de referência
- Planeja técnicas antes da aula (planejadas)
- Registra técnicas ensinadas e reforços durante/após a aula
- Finaliza a aula com feedback: "O que você ensinou?"
- Duplica aulas com estrutura de planejamento
- Registra foto da turma pós-aula

**Presença**
- Registra presença por toggle (individual)
- Adiciona visitantes/alunos experimentais por nome (sem conta)
- Visualiza histórico completo de presenças por aula

**Alunos**
- Cadastra, edita e inativa alunos
- Gerencia dados completos: faixa, grau, data de nascimento, condições de saúde, dia de vencimento da mensalidade
- Adiciona foto de perfil
- Visualiza jornada técnica individual: todas as aulas e técnicas aprendidas
- Escreve notas privadas por aluno (invisíveis para o aluno)
- Gradua alunos (faixa e grau)
- Acessa card de graduação instagramável para compartilhamento

**Técnicas**
- Cria técnicas específicas da academia
- Usa o currículo global de mais de 168 técnicas em PT-BR
- Organiza por categoria e associa a faixas recomendadas
- Cria histórinhas: sequências nomeadas de técnicas para reutilizar em aulas

**Relatórios e insights**
- Dashboard com: aulas hoje, aluno do mês, alertas de churn precoce, insights dinâmicos (turma sem plano, categoria esquecida, aluno ausente)
- `/relatorios` com 4 abas: Técnicas, Alunos, Frequência, Currículo
- Gap curricular por faixa: técnicas não ensinadas nos últimos 90 dias
- Candidatos a graduação por threshold de presenças
- Ranking de alunos por frequência

**Planejamento**
- Visão turma-centric: última aula + próximas agendadas
- Insights por turma: técnicas ausentes há mais tempo, mais ensinadas no mês, alunos ausentes
- Revisão de conteúdo da última aula ao planejar a próxima

**Avisos**
- Publica avisos para a academia ou turma específica
- Aviso dispara push notification para os alunos impactados
- Arquiva avisos quando não forem mais relevantes

---

### 📱 Aluno

O aluno acessa o próprio portal com conta própria (Magic Link). Vê apenas os dados da sua academia e o seu próprio histórico.

**Home**
- Visualiza aula ao vivo em andamento
- Faz check-in em aulas abertas e confirma presença em aulas agendadas
- Vê quem vai treinar na aula (lista de presentes)
- Vê tema e vídeo da aula
- Acessa técnicas planejadas para a aula
- Recebe avisos da academia
- Vê streak semanal de treinos no header (🔥 X semanas seguidas)
- Recebe banners contextuais de momentos da jornada

**Técnicas**
- Visualiza currículo completo agrupado por categoria
- Barra de progresso por categoria (técnicas vistas / total)
- Técnicas stale (>21 dias sem reforço) sinalizadas em laranja
- Drill-down por categoria: técnicas frequentes, aprendidas, ainda não vistas

**Histórico**
- Lista de aulas em que esteve presente (cronológica reversa)
- Técnicas ensinadas em cada aula
- Ícone de diário (✏️ sem nota / 📝 com nota) em cada aula
- Stats de frequência: treinos no mês, últimos 30/90 dias

**Perfil**
- Edita próprios dados (nome, email, telefone, data de nascimento, condições de saúde)
- Atualiza foto de perfil
- Visualiza faixa atual com BeltBar estilizado, data de faixa e data de grau
- Linha do tempo da faixa: quantas aulas treinou na faixa atual
- Frase contextual baseada no volume de aulas
- Link para compartilhar card de graduação

**Diário de treino**
- Adiciona anotação pessoal após cada aula (máx. 2000 caracteres)
- Edita ou deleta a própria nota
- Notas são privadas: só o aluno vê, o professor nunca tem acesso
- Acesso via link no card de check-in e via ícone no histórico

**Celebração de graduação**
- Ao ser graduado, na próxima abertura do app é redirecionado para tela de celebração
- Tela full-screen com gradiente na cor da nova faixa, BeltBar animado, stats e top 3 técnicas
- Dismiss libera o aluno de volta para a home

**Jornada no Tatame — momentos instagramáveis**
- 🎂 **Aniversário**: card full-screen no dia do aniversário com total de aulas e frase motivacional
- 🏆 **Anual**: "Seu ano no tatame" — treinos no ano, técnica favorita, faixa atual; aparece no aniversário de matrícula (≥1 ano)
- 📅 **Mensal**: resumo do mês anterior com contagem de treinos e barra de meta (12 treinos)
- 🥋 **Graduação**: card instagramável de graduação sempre acessível via perfil

---

### 👤 Visitante / Experimental

Pessoa sem conta no sistema. Não acessa o app.

- O professor adiciona o nome manualmente na tela da aula
- Aparece na lista de presentes com label "visitante"
- Registrado no histórico da aula
- Sem perfil, sem histórico individual, sem acesso ao portal

---

## Papéis do time

### 🥋 Vitim — CEO · Product Owner

Engenheiro de Produção e praticante de Jiu-Jitsu. Define a visão do produto, prioriza funcionalidades e garante que toda decisão resolva um problema real vivido dentro da academia.

**Responsabilidades:**
- Visão estratégica e posicionamento do produto
- Priorização do backlog com base em valor real para o professor/aluno
- Aprovação final de features antes de entrar em produção
- Garantir que o produto permaneça Lean: sem features sem valor

---

### 🐍 Mestre Naja — Especialista de Domínio

A pessoa mais importante do projeto. Toda funcionalidade precisa melhorar a rotina do professor e dos alunos dentro do tatame.

**Responsabilidades:**
- Validação de todos os fluxos de aula no mundo real
- Confirmação de que presença, técnicas, graduações e histórico fazem sentido para o professor
- Garantir que o produto funcione na prática, não apenas no software
- Feedback após cada sprint sobre o que funciona e o que precisa ajustar

---

### 🤖 Claude.ai — Product Manager · Gestor de Projetos

Mantém toda a documentação técnica e de produto do NajaPass.

**Responsabilidades:**
- Manter `backlog/KANBAN.md` atualizado com status de todos os cards
- Manter `backlog/BACKLOG.md` com épicos e critérios de aceite
- Escrever HANDOFFs para o Claude Code implementar
- Registrar ADRs (Architectural Decision Records) em `docs/ADRs/`
- Manter `docs/modelo-de-dados.md` e `docs/fluxos-de-usuario.md` atualizados
- Auditar o código e sugerir melhorias de produto e experiência
- Garantir que nenhuma decisão se perca entre sessões de desenvolvimento

---

### 💻 Claude Code — CTO · Desenvolvedor

Escreve o código, modela o banco, implementa features e mantém a qualidade técnica.

**Responsabilidades:**
- Implementar features a partir de HANDOFFs (`HANDOFF-0XX-*.md`)
- Modelar e evoluir o schema do banco de dados (Supabase/PostgreSQL)
- Aplicar migrations idempotentes via SQL Editor do Supabase
- Garantir RLS (Row Level Security) em todas as tabelas
- Escrever testes com Vitest
- Manter o codebase performático no mobile
- Documentar desvios do HANDOFF no KANBAN (o que mudou e por quê)
- Mover cards no KANBAN ao iniciar e concluir implementações

---

## Workflow de desenvolvimento

```
PM (Claude.ai) escreve HANDOFF → Claude Code lê BACKLOG + fluxos + ADRs
  → implementa na branch correta
  → move card para Concluído no KANBAN
  → documenta desvios do handoff
  → Mestre Naja valida no tatame
  → Vitim aprova e faz merge
```

Toda decisão de arquitetura vira um ADR em `docs/ADRs/`. Todo desvio significativo em relação ao HANDOFF é documentado no KANBAN.

---

## Princípios inegociáveis

**Performance mobile primeiro.** Se não funciona bem no celular, não está pronto.

**RLS no Supabase.** Nunca expor dados de uma academia para outra. Nenhuma query bypassa Row Level Security.

**Sem senha.** Auth é sempre Magic Link. Professores e alunos não criam senha.

**Brevidade.** Abrir aula + registrar presença deve levar menos de um minuto. Toda interação desnecessária é descartada.

---

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 15 (App Router) | Framework principal |
| TypeScript + Zod | Tipagem e validação |
| Tailwind CSS | Design system com tokens `--brand-*` |
| Supabase (PostgreSQL) | Banco de dados + Auth + Storage + RLS |
| Vercel | Deploy automático (CI/CD) |
| PWA | Instalação como app no celular |
| Web Push API | Notificações nativas |
| Magic Link | Autenticação sem senha |
| Vitest | Testes unitários |

---

## Estrutura do projeto

```
najapass/
├── src/
│   ├── app/
│   │   ├── (app)/              # Rotas autenticadas
│   │   │   ├── aluno/          # Portal do aluno
│   │   │   ├── alunos/         # Gestão de alunos (professor)
│   │   │   ├── aulas/          # Aulas (professor)
│   │   │   ├── dashboard/      # Dashboard professor
│   │   │   ├── historico/      # Histórico de aulas
│   │   │   ├── planejamento/   # Planejamento por turma
│   │   │   ├── relatorios/     # Insights e relatórios
│   │   │   └── turmas/         # Gestão de turmas
│   │   ├── (auth)/             # Login, onboarding, boas-vindas
│   │   └── api/                # Rotas de API (cron, push)
│   ├── components/             # Componentes reutilizáveis
│   └── lib/                    # Utilitários, auth, Supabase client
├── supabase/
│   └── migrations/             # Migrations SQL idempotentes
├── docs/
│   ├── ADRs/                   # Decisões de arquitetura
│   ├── modelo-de-dados.md      # Schema completo
│   └── fluxos-de-usuario.md    # Fluxos de usuário
├── backlog/
│   ├── BACKLOG.md              # Cards com critérios de aceite
│   └── KANBAN.md               # Status dos cards + detalhes de sprint
└── HANDOFF-0XX-*.md            # Briefings para o Claude Code
```

---

## Status atual

**Fase 1 — A Academia Digital** em andamento avançado.

| Épico | Status |
|---|---|
| Autenticação (Magic Link) | ✅ Concluído |
| Academia & Professor | ✅ Concluído |
| Alunos (cadastro + perfil completo) | ✅ Concluído |
| Turmas (cockpit + recorrência) | ✅ Concluído |
| Aulas (fluxo completo) | ✅ Concluído |
| Presença (professor + aluno + visitante) | ✅ Concluído |
| Técnicas (currículo global + academia) | ✅ Concluído |
| Histórico (professor + aluno) | ✅ Concluído |
| Dashboard + Insights | ✅ Concluído |
| PWA + Deploy | ✅ Concluído |
| Portal do Aluno V2 | ✅ Concluído |
| Aluno Surreal (streak, diário, celebração) | ✅ Concluído |
| Professor Surreal (notas, churn, currículo) | ✅ Concluído |
| Jornada no Tatame (cards instagramáveis) | ✅ Concluído |
| Aula Social (detalhe da aula + Cantinho da Resenha) | ⏳ Sprint 28 |

102 cards · 28 sprints · 25 HANDOFFs · R$ 0/mês

---

## Como rodar localmente

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

**Variáveis de ambiente necessárias** (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=
```

---

## Migrations

Todas as migrations ficam em `supabase/migrations/` e são aplicadas manualmente via SQL Editor do Supabase (o CLI local não está linkado ao projeto de produção). Todas são idempotentes — podem ser reaplicadas com segurança.

---

feito com 🥋 por Vitim, Mestre Naja e a equipe Claude
