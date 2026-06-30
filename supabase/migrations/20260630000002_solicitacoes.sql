-- Solicitações de alunos para entrar em uma academia
CREATE TABLE solicitacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  nome        TEXT NOT NULL,
  status      TEXT DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (academia_id, user_id)
);

ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;

-- Aluno: pode inserir e ver as próprias
CREATE POLICY "solicitacoes_insert" ON solicitacoes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "solicitacoes_select_proprio" ON solicitacoes FOR SELECT
  USING (user_id = auth.uid());

-- Professor: pode ver e atualizar da própria academia
CREATE POLICY "solicitacoes_professor_select" ON solicitacoes FOR SELECT
  USING (academia_id = academia_do_professor());

CREATE POLICY "solicitacoes_professor_update" ON solicitacoes FOR UPDATE
  USING (academia_id = academia_do_professor());

-- Qualquer usuário autenticado pode ver academias (para o dropdown de seleção)
CREATE POLICY "academias_select_autenticado" ON academias FOR SELECT
  TO authenticated USING (true);
