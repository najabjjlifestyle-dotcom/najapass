-- HANDOFF-026 / Sprint 29 — Jornada à Maestria
-- turmas.duracao_minutos + RPCs de horas, ranking mensal e conquistas.
-- Idempotente. Prefixo 000006 (000005 é o resenhas_aula).
-- Todos os RPCs são SECURITY DEFINER e VALIDAM o chamador: um aluno só
-- lê os próprios dados / o ranking da própria academia.

-- ============================================================
-- B-103: Duração da aula configurável por turma (1h padrão)
-- ============================================================
ALTER TABLE turmas
  ADD COLUMN IF NOT EXISTS duracao_minutos SMALLINT NOT NULL DEFAULT 60;

ALTER TABLE turmas
  DROP CONSTRAINT IF EXISTS turmas_duracao_valida;

ALTER TABLE turmas
  ADD CONSTRAINT turmas_duracao_valida
  CHECK (duracao_minutos IN (60, 90, 120));

-- ============================================================
-- B-103: Horas reais no tatame — usa a duração da turma de cada aula.
-- Guard: só o próprio aluno (id_do_aluno()) lê suas horas.
-- ============================================================
CREATE OR REPLACE FUNCTION horas_no_tatame(p_aluno_id UUID)
RETURNS NUMERIC
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT ROUND(COALESCE(SUM(COALESCE(t.duracao_minutos, 60) / 60.0), 0), 1)
  FROM presencas p
  JOIN aulas a  ON a.id = p.aula_id
  JOIN turmas t ON t.id = a.turma_id
  WHERE p.aluno_id = p_aluno_id
    AND p_aluno_id = id_do_aluno()
$$;

GRANT EXECUTE ON FUNCTION horas_no_tatame(UUID) TO authenticated;

-- ============================================================
-- B-104: Ranking mensal de frequência da academia.
-- Guard: só quem é aluno ativo da p_academia_id vê o ranking dela.
-- ============================================================
CREATE OR REPLACE FUNCTION ranking_frequencia_mensal(
  p_academia_id UUID,
  p_ano INT,
  p_mes INT
)
RETURNS TABLE (
  aluno_id UUID,
  aluno_nome TEXT,
  foto_url TEXT,
  presencas_mes BIGINT,
  posicao BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    al.id,
    al.nome,
    al.foto_url,
    COUNT(p.id) AS presencas_mes,
    RANK() OVER (ORDER BY COUNT(p.id) DESC) AS posicao
  FROM alunos al
  INNER JOIN presencas p ON p.aluno_id = al.id
  INNER JOIN aulas a ON a.id = p.aula_id
    AND EXTRACT(YEAR FROM a.data) = p_ano
    AND EXTRACT(MONTH FROM a.data) = p_mes
    AND a.academia_id = p_academia_id
  WHERE al.academia_id = p_academia_id
    AND al.ativo = TRUE
    AND p_academia_id IN (SELECT academia_id FROM alunos WHERE user_id = auth.uid())
  GROUP BY al.id, al.nome, al.foto_url
  ORDER BY presencas_mes DESC, al.nome ASC
$$;

GRANT EXECUTE ON FUNCTION ranking_frequencia_mensal(UUID, INT, INT) TO authenticated;

-- ============================================================
-- B-105: Dados agregados pras conquistas (total + máx treinos/mês).
-- Guard: só o próprio aluno.
-- ============================================================
CREATE OR REPLACE FUNCTION dados_conquistas_aluno(p_aluno_id UUID)
RETURNS TABLE (
  total_presencas BIGINT,
  max_treinos_mes BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH por_mes AS (
    SELECT COUNT(*) AS cnt
    FROM presencas p
    JOIN aulas a ON a.id = p.aula_id
    WHERE p.aluno_id = p_aluno_id
      AND p_aluno_id = id_do_aluno()
    GROUP BY EXTRACT(YEAR FROM a.data), EXTRACT(MONTH FROM a.data)
  )
  SELECT
    (SELECT COUNT(*) FROM presencas
      WHERE aluno_id = p_aluno_id AND p_aluno_id = id_do_aluno()) AS total_presencas,
    COALESCE((SELECT MAX(cnt) FROM por_mes), 0) AS max_treinos_mes
$$;

GRANT EXECUTE ON FUNCTION dados_conquistas_aluno(UUID) TO authenticated;
