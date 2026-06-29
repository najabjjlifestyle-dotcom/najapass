-- ============================================================
-- Indexes de performance
-- ============================================================

CREATE INDEX ON aulas (academia_id, data DESC);
CREATE INDEX ON aulas (turma_id, status);
CREATE INDEX ON presencas (aula_id);
CREATE INDEX ON presencas (aluno_id);
CREATE INDEX ON alunos (user_id);
CREATE INDEX ON alunos (academia_id, ativo);
CREATE INDEX ON aula_tecnicas (aula_id, tipo);
CREATE INDEX ON professores (user_id);
CREATE INDEX ON professores (academia_id);
