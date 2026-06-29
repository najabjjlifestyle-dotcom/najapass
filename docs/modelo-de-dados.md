# Modelo de Dados — NajaPass

**Versão:** 1.1  
**Data:** 2026-06-29  
**Fase:** 1 — A Academia Digital

### Changelog
- v1.1: `alunos.user_id` (login próprio), `aulas.tema` + `aulas.video_url`, `aula_tecnicas.tipo` (planejada/ensinada), `presencas.nome_visitante` (visitante/experimental sem conta)

---

## Visão Geral das Entidades

```
academias
   └── professores          (user_id → auth.users)
   └── turmas
         └── alunos_turmas (N:N)
   └── alunos               (user_id → auth.users, nullable = sem conta)
         └── presencas
   └── aulas                (tema, video_url, status: agendada|aberta|finalizada)
         └── presencas      (aluno_id nullable + nome_visitante para visitantes)
         └── aula_tecnicas  (tipo: planejada | ensinada)
   └── tecnicas
         └── categorias_tecnicas
```

---

## Perfis de Acesso

| Perfil | Como acessa | Pode fazer |
|---|---|---|
| **Professor** | Magic Link → `professores.user_id` | Tudo: gerenciar academia, aulas, alunos, técnicas |
| **Aluno** | Magic Link → `alunos.user_id` | Check-in, ver aula (tema, quem vai), ver próprio histórico |
| **Visitante** | Sem conta | Não acessa o app — professor adiciona o nome manualmente |

---

## Schema PostgreSQL

### `academias`
```sql
CREATE TABLE academias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,        -- ex: "naja-bjj"
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);
```

### `professores`
```sql
CREATE TABLE professores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL,
  faixa        TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
```

### `alunos`
```sql
CREATE TABLE alunos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id    UUID REFERENCES academias(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL = sem conta ainda
  nome           TEXT NOT NULL,
  email          TEXT,
  telefone       TEXT,
  foto_url       TEXT,                       -- path no Supabase Storage: avatars/{aluno_id}
  faixa          TEXT DEFAULT 'branca'
    CHECK (faixa IN ('branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta')),
  grau           SMALLINT DEFAULT 0 CHECK (grau BETWEEN 0 AND 4),
  ativo          BOOLEAN DEFAULT TRUE,
  matriculado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);
```

> **Nota:** `user_id` é nullable. Um aluno pode existir no sistema sem ter conta no app. O professor convida o aluno por e-mail para ele criar conta — quando o aluno faz o primeiro login, o sistema cruza pelo e-mail e associa o `user_id`.

> **Foto:** armazenada no Supabase Storage no bucket `avatars`, path `avatars/{aluno_id}.jpg`. O campo `foto_url` guarda a URL pública gerada pelo Storage. Upload feito pelo professor no cadastro ou pelo próprio aluno no perfil.

### `turmas`
```sql
CREATE TABLE turmas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professores(id),
  nome         TEXT NOT NULL,
  dias_semana  TEXT[],                     -- ["segunda", "quarta", "sexta"]
  horario      TIME,
  ativa        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
```

### `alunos_turmas` (N:N)
```sql
CREATE TABLE alunos_turmas (
  aluno_id    UUID REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id    UUID REFERENCES turmas(id) ON DELETE CASCADE,
  ativo       BOOLEAN DEFAULT TRUE,
  entrou_em   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (aluno_id, turma_id)
);
```

### `categorias_tecnicas`
```sql
CREATE TABLE categorias_tecnicas (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL,
  cor       TEXT
);
```

### `tecnicas`
```sql
CREATE TABLE tecnicas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id   UUID REFERENCES academias(id) ON DELETE CASCADE,
  categoria_id  UUID REFERENCES categorias_tecnicas(id),
  nome          TEXT NOT NULL,
  descricao     TEXT,
  global        BOOLEAN DEFAULT FALSE,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);
```

### `aulas`
```sql
CREATE TABLE aulas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id   UUID REFERENCES academias(id) ON DELETE CASCADE,
  turma_id      UUID REFERENCES turmas(id),
  professor_id  UUID REFERENCES professores(id),
  data          DATE NOT NULL,
  hora_inicio   TIME,
  hora_fim      TIME,
  tema          TEXT,                       -- descrição livre: "Raspagens da meia guarda"
  video_url     TEXT,                       -- link YouTube, Instagram, etc.
  observacoes   TEXT,                       -- nota interna do professor (pós-aula)
  status        TEXT DEFAULT 'agendada'
    CHECK (status IN ('agendada', 'aberta', 'finalizada')),
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);
```

> **Status da aula:**
> - `agendada` → professor criou, ainda não abriu. Aluno já vê o tema e pode indicar presença.
> - `aberta` → professor abriu (aula em andamento). Aluno faz check-in.
> - `finalizada` → professor encerrou. Histórico permanente.

### `presencas`
```sql
CREATE TABLE presencas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id         UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  aluno_id        UUID REFERENCES alunos(id) ON DELETE CASCADE,  -- NULL = visitante
  nome_visitante  TEXT,                     -- preenchido quando aluno_id é NULL
  origem          TEXT DEFAULT 'professor'
    CHECK (origem IN ('professor', 'aluno')),  -- quem registrou
  registrado_em   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT presenca_identificada CHECK (
    aluno_id IS NOT NULL OR nome_visitante IS NOT NULL
  ),
  UNIQUE NULLS NOT DISTINCT (aula_id, aluno_id)
);
```

> **Visitante/Experimental:** `aluno_id = NULL` + `nome_visitante = "João Experimental"`. Professor adiciona manualmente na tela da aula. Aparece na lista de presentes mas sem link para perfil.

### `avisos`
```sql
CREATE TABLE avisos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professores(id),
  turma_id     UUID REFERENCES turmas(id),     -- NULL = aviso para toda a academia
  titulo       TEXT NOT NULL,
  corpo        TEXT NOT NULL,
  ativo        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
```

> **Aviso ativo:** aparece fixado no topo da home do aluno. Professor arquiva quando não for mais relevante (`ativo = false`). Ao criar um aviso, dispara Web Push para os alunos impactados.

### `aula_tecnicas`
```sql
CREATE TABLE aula_tecnicas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id     UUID REFERENCES aulas(id) ON DELETE CASCADE,
  tecnica_id  UUID REFERENCES tecnicas(id) ON DELETE CASCADE,
  tipo        TEXT DEFAULT 'ensinada'
    CHECK (tipo IN ('planejada', 'ensinada')),
  UNIQUE (aula_id, tecnica_id, tipo)
);
```

> **Planejada:** professor define antes da aula — aluno vê no app.  
> **Ensinada:** professor registra durante/após a aula — compõe o histórico técnico.

---

## Row Level Security (RLS)

### Regra base — Professor acessa própria academia
```sql
CREATE POLICY "professor_acessa_academia"
ON aulas FOR ALL
USING (
  academia_id IN (
    SELECT academia_id FROM professores WHERE user_id = auth.uid()
  )
);
```

### Regra — Aluno acessa dados da própria academia
```sql
CREATE POLICY "aluno_acessa_academia"
ON aulas FOR SELECT
USING (
  academia_id IN (
    SELECT academia_id FROM alunos WHERE user_id = auth.uid()
  )
);
```

### Regra — Aluno vê apenas próprias presenças
```sql
CREATE POLICY "aluno_ve_proprias_presencas"
ON presencas FOR SELECT
USING (
  aluno_id IN (
    SELECT id FROM alunos WHERE user_id = auth.uid()
  )
);

-- Aluno pode inserir check-in na própria presença
CREATE POLICY "aluno_faz_checkin"
ON presencas FOR INSERT
WITH CHECK (
  aluno_id IN (
    SELECT id FROM alunos WHERE user_id = auth.uid()
  )
  AND origem = 'aluno'
);
```

### Regra — Aluno vê quem vai na aula (somente nomes)
```sql
-- View pública de presença (somente nomes, sem dados sensíveis)
CREATE VIEW presencas_publicas AS
SELECT
  p.aula_id,
  COALESCE(a.nome, p.nome_visitante) AS nome,
  p.origem,
  p.registrado_em
FROM presencas p
LEFT JOIN alunos a ON a.id = p.aluno_id;
```

---

## Indexes Recomendados

```sql
CREATE INDEX ON aulas (academia_id, data DESC);
CREATE INDEX ON aulas (turma_id, status);
CREATE INDEX ON presencas (aula_id);
CREATE INDEX ON presencas (aluno_id);
CREATE INDEX ON alunos (user_id);
CREATE INDEX ON alunos (academia_id, ativo);
CREATE INDEX ON aula_tecnicas (aula_id, tipo);
```

---

## Função: Associar Aluno ao Criar Conta

Quando um aluno faz o primeiro login via Magic Link, o sistema deve cruzar o e-mail para associar o `user_id`:

```sql
CREATE OR REPLACE FUNCTION associar_user_ao_aluno()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE alunos
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION associar_user_ao_aluno();
```

---

## Queries Estratégicas

```sql
-- Técnicas que um aluno treinou (ensinadas)
SELECT DISTINCT t.nome, c.nome as categoria, a.data
FROM presencas p
JOIN aulas a ON a.id = p.aula_id
JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
JOIN tecnicas t ON t.id = at.tecnica_id
JOIN categorias_tecnicas c ON c.id = t.categoria_id
WHERE p.aluno_id = $1
ORDER BY a.data DESC;

-- Técnicas planejadas para próxima aula (visão do aluno)
SELECT t.nome, c.nome as categoria
FROM aula_tecnicas at
JOIN tecnicas t ON t.id = at.tecnica_id
JOIN categorias_tecnicas c ON c.id = t.categoria_id
WHERE at.aula_id = $1 AND at.tipo = 'planejada';

-- Quem vai na aula
SELECT COALESCE(a.nome, p.nome_visitante) AS nome, p.origem
FROM presencas p
LEFT JOIN alunos a ON a.id = p.aluno_id
WHERE p.aula_id = $1
ORDER BY p.registrado_em;

-- Frequência do aluno nos últimos 30 dias
SELECT COUNT(*) as presencas
FROM presencas p
JOIN aulas a ON a.id = p.aula_id
WHERE p.aluno_id = $1
  AND a.data >= NOW() - INTERVAL '30 days'
  AND a.status = 'finalizada';

-- Última vez que cada técnica foi ensinada na academia
SELECT t.nome, MAX(a.data) as ultima_vez
FROM aula_tecnicas at
JOIN aulas a ON a.id = at.aula_id
JOIN tecnicas t ON t.id = at.tecnica_id
WHERE a.academia_id = $1 AND at.tipo = 'ensinada'
GROUP BY t.id, t.nome
ORDER BY ultima_vez ASC;
```

---

## Dados de Seed (Categorias Padrão)

```sql
INSERT INTO categorias_tecnicas (nome, cor) VALUES
  ('Guarda Fechada', '#2563EB'),
  ('Meia Guarda', '#7C3AED'),
  ('Guarda Aberta', '#0891B2'),
  ('Montada', '#DC2626'),
  ('Costas', '#EA580C'),
  ('Passagem de Guarda', '#16A34A'),
  ('Raspagem', '#CA8A04'),
  ('Finalização', '#9333EA'),
  ('Defesa', '#64748B'),
  ('Fundamentos', '#374151');
```
