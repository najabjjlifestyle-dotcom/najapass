-- ============================================================
-- NajaPass — Schema completo (Fase 1)
-- ============================================================

-- academias
CREATE TABLE academias (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  cidade     TEXT,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- professores
CREATE TABLE professores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL,
  faixa        TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- alunos
CREATE TABLE alunos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id    UUID REFERENCES academias(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome           TEXT NOT NULL,
  email          TEXT,
  telefone       TEXT,
  foto_url       TEXT,
  faixa          TEXT DEFAULT 'branca'
    CHECK (faixa IN ('branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta')),
  grau           SMALLINT DEFAULT 0 CHECK (grau BETWEEN 0 AND 4),
  ativo          BOOLEAN DEFAULT TRUE,
  matriculado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- turmas
CREATE TABLE turmas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professores(id),
  nome         TEXT NOT NULL,
  dias_semana  TEXT[],
  horario      TIME,
  ativa        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- alunos_turmas (N:N)
CREATE TABLE alunos_turmas (
  aluno_id   UUID REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id   UUID REFERENCES turmas(id) ON DELETE CASCADE,
  ativo      BOOLEAN DEFAULT TRUE,
  entrou_em  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (aluno_id, turma_id)
);

-- categorias_tecnicas
CREATE TABLE categorias_tecnicas (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor  TEXT
);

-- tecnicas
CREATE TABLE tecnicas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_tecnicas(id),
  nome         TEXT NOT NULL,
  descricao    TEXT,
  global       BOOLEAN DEFAULT FALSE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- aulas
CREATE TABLE aulas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  turma_id     UUID REFERENCES turmas(id),
  professor_id UUID REFERENCES professores(id),
  data         DATE NOT NULL,
  hora_inicio  TIME,
  hora_fim     TIME,
  tema         TEXT,
  video_url    TEXT,
  observacoes  TEXT,
  status       TEXT DEFAULT 'agendada'
    CHECK (status IN ('agendada','aberta','finalizada')),
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- presencas
CREATE TABLE presencas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id        UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  aluno_id       UUID REFERENCES alunos(id) ON DELETE CASCADE,
  nome_visitante TEXT,
  origem         TEXT DEFAULT 'professor'
    CHECK (origem IN ('professor','aluno')),
  registrado_em  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT presenca_identificada CHECK (
    aluno_id IS NOT NULL OR nome_visitante IS NOT NULL
  ),
  UNIQUE NULLS NOT DISTINCT (aula_id, aluno_id)
);

-- aula_tecnicas
CREATE TABLE aula_tecnicas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id    UUID REFERENCES aulas(id) ON DELETE CASCADE,
  tecnica_id UUID REFERENCES tecnicas(id) ON DELETE CASCADE,
  tipo       TEXT DEFAULT 'ensinada'
    CHECK (tipo IN ('planejada','ensinada')),
  UNIQUE (aula_id, tecnica_id, tipo)
);

-- avisos
CREATE TABLE avisos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professores(id),
  turma_id     UUID REFERENCES turmas(id),
  titulo       TEXT NOT NULL,
  corpo        TEXT NOT NULL,
  ativo        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
