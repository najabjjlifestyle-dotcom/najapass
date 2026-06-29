# Fluxos de Usuário — NajaPass

**Versão:** 1.1  
**Data:** 2026-06-29  
**Fase:** 1 — A Academia Digital

### Changelog
- v1.1: Aluno é usuário do Dia 1. Adicionados fluxos FU-11 a FU-15 (check-in, visão da aula, histórico próprio).

---

## Personas

| Persona | Descrição |
|---|---|
| **Professor** | Abre aulas, define tema/vídeo/técnicas, gerencia presença. Usuário primário. |
| **Aluno** | Faz check-in, vê o que vai ter na aula, vê quem vai, consulta próprio histórico. |
| **Visitante** | Sem conta. Professor adiciona o nome manualmente. Aparece na lista de presentes. |

---

## FU-01 — Primeiro Acesso (Onboarding)

**Ator:** Professor  
**Gatilho:** Acessa o app pela primeira vez

```
[Tela de boas-vindas]
      ↓
[Informa e-mail]
      ↓
[Supabase envia magic link]
      ↓
[Professor clica no link no e-mail]
      ↓
[App pergunta: "Você é professor de uma academia?"]
      ↓
[Sim] → [Cria academia] → [Nome, cidade, estilo principal]
      ↓
[Cadastra primeiro professor (ele mesmo)]
      ↓
[Dashboard vazio com prompt: "Abra sua primeira aula"]
```

**Regras:**
- O e-mail se torna o identificador permanente do professor.
- Uma academia pode ter múltiplos professores (Fase 4).
- Primeira academia = professor é owner.

---

## FU-02 — Login Recorrente

**Ator:** Professor  
**Gatilho:** Abre o app em um dispositivo com sessão ativa

```
[Abre o app]
      ↓
[Sessão válida?]
   Sim → [Dashboard]
   Não → [Tela de e-mail] → (fluxo magic link)
```

**Regra:** Sessão válida por 30 dias. Após expiração, novo magic link.

---

## FU-03 — Abrir uma Aula

**Ator:** Professor  
**Gatilho:** Toca em "Nova Aula" no dashboard  
**Tempo esperado:** < 30 segundos

```
[Dashboard]
      ↓
[Botão "Nova Aula"]
      ↓
[Seleciona turma] (ou "Aula avulsa")
      ↓
[Data e hora preenchidas automaticamente (agora)]
      ↓
[Confirma] → [Aula aberta]
      ↓
[Tela da aula: lista de alunos da turma]
```

**Regras:**
- Data/hora padrão = agora.
- Turma puxa lista de alunos automaticamente.
- Aula começa com status "aberta".

---

## FU-04 — Registrar Presença

**Ator:** Professor  
**Gatilho:** Aula está aberta  
**Tempo esperado:** < 1 minuto para toda a turma

```
[Tela da aula — lista de alunos]
      ↓
[Professor toca no nome do aluno]
      ↓
[Aluno marcado como presente ✓]
      ↓
[Pode desmarcar tocando novamente]
      ↓
[Contador atualiza: "12/18 presentes"]
```

**Regras:**
- Interface de toggle: toque = marca/desmarca.
- Todos começam como ausentes.
- Pode adicionar aluno avulso (não cadastrado na turma).
- Contador visível o tempo todo.

---

## FU-05 — Registrar Técnicas da Aula

**Ator:** Professor  
**Gatilho:** Durante ou após registrar presença

```
[Tela da aula]
      ↓
[Seção "Técnicas ensinadas hoje"]
      ↓
[Campo de busca ou lista por categoria]
      ↓
[Professor seleciona técnicas]
      ↓ 
[Técnicas aparecem como chips selecionados]
      ↓
[Pode criar nova técnica "on the fly"]
      ↓
[Salva automaticamente]
```

**Regras:**
- Técnicas organizadas por categoria (Guarda, Raspagem, Finalização, etc.).
- Busca por nome em tempo real.
- "Criar nova técnica" abre modal com nome + categoria.
- Múltiplas técnicas por aula (0 é permitido).

---

## FU-06 — Finalizar Aula

**Ator:** Professor  
**Gatilho:** Treino encerrado

```
[Tela da aula]
      ↓
[Botão "Finalizar Aula"]
      ↓
[Resumo: X presentes, Y técnicas registradas]
      ↓
[Campo opcional: "Observações da aula"]
      ↓
[Confirmar]
      ↓
[Aula status → "finalizada"]
      ↓
[Retorna ao Dashboard]
```

**Regras:**
- Aula finalizada não pode ter presença alterada.
- Aula finalizada pode ter observações editadas.
- Dashboard mostra streak de aulas da semana.

---

## FU-07 — Cadastrar Aluno

**Ator:** Professor  
**Gatilho:** Acessa "Alunos" no menu

```
[Tela de Alunos]
      ↓
[Botão "+ Novo Aluno"]
      ↓
[Formulário: Nome*, E-mail, Telefone, Faixa, Turma(s)]
      ↓
[Salvar]
      ↓
[Aluno aparece na lista e nas turmas selecionadas]
```

**Regras:**
- Apenas nome é obrigatório.
- Aluno pode estar em mais de uma turma.
- Faixa padrão: branca.

---

## FU-08 — Consultar Histórico do Aluno

**Ator:** Professor  
**Gatilho:** Toca no nome de um aluno

```
[Lista de alunos]
      ↓
[Seleciona aluno]
      ↓
[Perfil do aluno]
   ├── Nome, faixa, grau
   ├── Frequência (mês atual e últimos 3 meses)
   ├── Última presença: X dias atrás
   └── Aulas recentes (lista cronológica reversa)
        ├── Data
        ├── Turma
        └── Técnicas que foram ensinadas nessa aula
```

**Regras:**
- Frequência calculada em tempo real do banco.
- Lista de aulas paginada (10 por página).

---

## FU-09 — Consultar Histórico de Aulas

**Ator:** Professor  
**Gatilho:** Acessa "Histórico" no menu

```
[Histórico de Aulas]
      ↓
[Filtros: Turma | Mês | Busca por técnica]
      ↓
[Lista cronológica de aulas finalizadas]
      ↓
[Seleciona aula]
      ↓
[Detalhe: data, turma, presentes, técnicas ensinadas, observações]
```

---

## FU-10 — Dashboard

**Ator:** Professor  
**Gatilho:** Abre o app com sessão ativa

```
[Dashboard]
   ├── [Botão principal: "Nova Aula"]
   ├── [Aula aberta agora? → Banner com CTA para continuar]
   ├── [Esta semana: X aulas, Y presenças totais]
   ├── [Últimas 3 aulas]
   └── [Atalhos: Alunos | Técnicas | Histórico]
```

---

## FU-11 — Login do Aluno (Primeiro Acesso)

**Ator:** Aluno  
**Gatilho:** Recebe convite da academia ou acessa o link do app pela primeira vez

```
[Tela de login]
      ↓
[Informa e-mail]
      ↓
[Magic link enviado]
      ↓
[Aluno clica no link]
      ↓
[Sistema cruza e-mail com cadastro existente]
   Match → [user_id associado ao aluno] → [Home do Aluno]
   Sem match → [Tela: "Seu e-mail não está cadastrado. Fale com seu professor."]
```

**Regras:**
- Aluno não cria conta por conta própria — precisa estar cadastrado pelo professor.
- O trigger `associar_user_ao_aluno` faz o vínculo automaticamente no primeiro login.
- Sessão persiste 30 dias.

---

## FU-12 — Home do Aluno

**Ator:** Aluno  
**Gatilho:** Abre o app com sessão ativa

```
[Home do Aluno]
   ├── [Próximas aulas das turmas em que está matriculado]
   │     ├── Data, horário, turma
   │     ├── Tema da aula (se professor preencheu)
   │     ├── Vídeo de referência (se professor adicionou)
   │     ├── Técnicas planejadas (chips)
   │     ├── X confirmados — "Ver quem vai"
   │     └── [Botão "Confirmar presença" / "Cancelar"]
   └── [Atalho: "Meu histórico"]
```

**Regras:**
- Mostra aulas com status `agendada` ou `aberta` das turmas do aluno.
- Aulas finalizadas somem da home e vão para o histórico.

---

## FU-13 — Check-in do Aluno

**Ator:** Aluno  
**Gatilho:** Toca em "Confirmar presença" em uma aula

```
[Card da aula na home]
      ↓
[Toca "Confirmar presença"]
      ↓
[Presença registrada com origem = 'aluno']
      ↓
[Botão vira "✓ Confirmado" — toque novamente cancela]
      ↓
[Contador de confirmados atualiza]
```

**Regras:**
- Aluno só pode fazer check-in em aulas das turmas em que está matriculado.
- Check-in disponível quando aula está `agendada` ou `aberta`.
- Professor vê check-ins do aluno na tela da aula, junto com presenças que ele marcou.
- Aula `finalizada`: check-in bloqueado.

---

## FU-14 — Ver Quem Vai na Aula

**Ator:** Aluno  
**Gatilho:** Toca em "X confirmados" em uma aula

```
[Modal / tela "Quem vai"]
      ↓
[Lista de nomes dos alunos confirmados]
   ├── João Silva ✓
   ├── Maria Souza ✓
   └── Pedro (visitante)
```

**Regras:**
- Mostra nome de todos com presença registrada (alunos + visitantes).
- Não mostra faixa, telefone ou outros dados sensíveis.
- Visitantes aparecem com label "(visitante)".

---

## FU-15 — Histórico Próprio do Aluno

**Ator:** Aluno  
**Gatilho:** Toca em "Meu histórico"

```
[Histórico do Aluno]
   ├── Frequência: X treinos este mês
   ├── Última presença: Y dias atrás
   └── [Lista de aulas — cronológica reversa]
         ├── Data, turma
         ├── Técnicas que foram ensinadas nessa aula
         └── [Badge: "Você estava aqui ✓"]
```

**Regras:**
- Aluno vê apenas aulas em que esteve presente.
- Técnicas exibidas = `aula_tecnicas.tipo = 'ensinada'`.
- Sem acesso a dados de outros alunos.

---

## FU-16 — Adicionar Visitante à Aula (Professor)

**Ator:** Professor  
**Gatilho:** Na tela da aula, toca em "+ Visitante"

```
[Tela da aula]
      ↓
[Botão "+ Visitante / Experimental"]
      ↓
[Campo de texto: "Nome do visitante"]
      ↓
[Confirma]
      ↓
[Nome aparece na lista de presentes com label "(visitante)"]
```

**Regras:**
- Visitante não tem conta. Só aparece nessa aula.
- Aparece na lista "Quem vai" visível ao aluno.
- Nome fica registrado no histórico permanentemente.

---

## Estados de Erro Importantes

| Situação | Comportamento |
|---|---|
| Sem internet | App mostra dados em cache; bloqueia check-in e abertura de nova aula |
| Magic link expirado | Mostra mensagem + botão "Enviar novo link" |
| Aluno tenta logar com e-mail não cadastrado | Mensagem: "Fale com seu professor para ser cadastrado" |
| Aluno duplicado | Alerta com sugestão de merge |
| Aula já existe na mesma data/turma | Avisa e pergunta se quer abrir nova mesmo assim |
| Aluno tenta check-in em aula de outra turma | Bloqueado por RLS |
