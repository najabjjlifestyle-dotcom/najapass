-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE academias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos_turmas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_tecnicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tecnicas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE aula_tecnicas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos          ENABLE ROW LEVEL SECURITY;

-- Helper: academia_id do professor logado
CREATE OR REPLACE FUNCTION academia_do_professor()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT academia_id FROM professores WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper: academia_id do aluno logado
CREATE OR REPLACE FUNCTION academia_do_aluno()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT academia_id FROM alunos WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper: id do aluno logado
CREATE OR REPLACE FUNCTION id_do_aluno()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM alunos WHERE user_id = auth.uid() LIMIT 1;
$$;

-- academias: professor vê a própria, aluno vê a própria
CREATE POLICY "academia_professor" ON academias FOR ALL
  USING (id = academia_do_professor());

CREATE POLICY "academia_aluno_select" ON academias FOR SELECT
  USING (id = academia_do_aluno());

-- professores: professor vê/edita da própria academia
CREATE POLICY "professores_all" ON professores FOR ALL
  USING (academia_id = academia_do_professor());

-- alunos: professor CRUD, aluno SELECT próprio
CREATE POLICY "alunos_professor" ON alunos FOR ALL
  USING (academia_id = academia_do_professor());

CREATE POLICY "aluno_select_proprio" ON alunos FOR SELECT
  USING (user_id = auth.uid());

-- turmas: professor CRUD, aluno SELECT
CREATE POLICY "turmas_professor" ON turmas FOR ALL
  USING (academia_id = academia_do_professor());

CREATE POLICY "turmas_aluno_select" ON turmas FOR SELECT
  USING (academia_id = academia_do_aluno());

-- alunos_turmas: professor CRUD, aluno SELECT próprio
CREATE POLICY "alunos_turmas_professor" ON alunos_turmas FOR ALL
  USING (EXISTS (SELECT 1 FROM alunos a WHERE a.id = aluno_id AND a.academia_id = academia_do_professor()));

CREATE POLICY "alunos_turmas_aluno_select" ON alunos_turmas FOR SELECT
  USING (aluno_id = id_do_aluno());

-- categorias_tecnicas: leitura pública (autenticado)
CREATE POLICY "categorias_select" ON categorias_tecnicas FOR SELECT
  TO authenticated USING (true);

-- tecnicas: professor CRUD, aluno SELECT
CREATE POLICY "tecnicas_professor" ON tecnicas FOR ALL
  USING (academia_id = academia_do_professor());

CREATE POLICY "tecnicas_aluno_select" ON tecnicas FOR SELECT
  USING (academia_id = academia_do_aluno());

-- aulas: professor CRUD, aluno SELECT
CREATE POLICY "aulas_professor" ON aulas FOR ALL
  USING (academia_id = academia_do_professor());

CREATE POLICY "aulas_aluno_select" ON aulas FOR SELECT
  USING (academia_id = academia_do_aluno());

-- presencas: professor CRUD; aluno SELECT + INSERT (checkin próprio)
CREATE POLICY "presencas_professor" ON presencas FOR ALL
  USING (EXISTS (SELECT 1 FROM aulas a WHERE a.id = aula_id AND a.academia_id = academia_do_professor()));

CREATE POLICY "presencas_aluno_select" ON presencas FOR SELECT
  USING (aluno_id = id_do_aluno());

CREATE POLICY "presencas_aluno_checkin" ON presencas FOR INSERT
  WITH CHECK (aluno_id = id_do_aluno() AND origem = 'aluno');

CREATE POLICY "presencas_aluno_delete" ON presencas FOR DELETE
  USING (aluno_id = id_do_aluno() AND origem = 'aluno');

-- aula_tecnicas: professor CRUD, aluno SELECT
CREATE POLICY "aula_tecnicas_professor" ON aula_tecnicas FOR ALL
  USING (EXISTS (SELECT 1 FROM aulas a WHERE a.id = aula_id AND a.academia_id = academia_do_professor()));

CREATE POLICY "aula_tecnicas_aluno_select" ON aula_tecnicas FOR SELECT
  USING (EXISTS (SELECT 1 FROM aulas a WHERE a.id = aula_id AND a.academia_id = academia_do_aluno()));

-- avisos: professor CRUD, aluno SELECT
CREATE POLICY "avisos_professor" ON avisos FOR ALL
  USING (academia_id = academia_do_professor());

CREATE POLICY "avisos_aluno_select" ON avisos FOR SELECT
  USING (academia_id = academia_do_aluno());
