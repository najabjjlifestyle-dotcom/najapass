-- HANDOFF-025 / B-100 — Cantinho da Resenha
-- Comentários dos alunos por aula. Idempotente. Prefixo 000005
-- (000004 já é o professor_surreal).

CREATE TABLE IF NOT EXISTS resenhas_aula (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id    UUID NOT NULL REFERENCES aulas(id)  ON DELETE CASCADE,
  aluno_id   UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  texto      TEXT NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 280),
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS resenhas_aula_aula_id_idx ON resenhas_aula(aula_id);

ALTER TABLE resenhas_aula ENABLE ROW LEVEL SECURITY;

-- Postgres não tem CREATE POLICY IF NOT EXISTS — DROP + CREATE.

-- Aluno vê resenhas de aulas da própria academia
DROP POLICY IF EXISTS "aluno_ve_resenhas_academia" ON resenhas_aula;
CREATE POLICY "aluno_ve_resenhas_academia"
ON resenhas_aula FOR SELECT
USING (
  aula_id IN (
    SELECT a.id FROM aulas a
    JOIN alunos al ON al.academia_id = a.academia_id
    WHERE al.user_id = auth.uid()
  )
);

-- Aluno insere resenha em aulas da sua academia, como ele mesmo
DROP POLICY IF EXISTS "aluno_insere_resenha" ON resenhas_aula;
CREATE POLICY "aluno_insere_resenha"
ON resenhas_aula FOR INSERT
WITH CHECK (
  aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid())
  AND aula_id IN (
    SELECT a.id FROM aulas a
    JOIN alunos al ON al.academia_id = a.academia_id
    WHERE al.user_id = auth.uid()
  )
);

-- Aluno deleta apenas as próprias resenhas
DROP POLICY IF EXISTS "aluno_deleta_propria_resenha" ON resenhas_aula;
CREATE POLICY "aluno_deleta_propria_resenha"
ON resenhas_aula FOR DELETE
USING (
  aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid())
);

-- Professor modera: deleta qualquer resenha da sua academia
DROP POLICY IF EXISTS "professor_modera_resenhas" ON resenhas_aula;
CREATE POLICY "professor_modera_resenhas"
ON resenhas_aula FOR DELETE
USING (
  aula_id IN (
    SELECT a.id FROM aulas a
    JOIN professores p ON p.academia_id = a.academia_id
    WHERE p.user_id = auth.uid()
  )
);
