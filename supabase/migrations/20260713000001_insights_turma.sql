-- ============================================================
-- Insights por turma pra página /planejamento: técnicas há mais
-- tempo sem aparecer, mais ensinadas no último mês, e alunos
-- sumindo (sem presença há 14+ dias, ou nunca compareceram).
-- SECURITY DEFINER pra ler dados de toda a academia, mas valida
-- que o professor autenticado é da academia informada — mesmo
-- padrão de aluno_mais_ausente/frequencia_resumo/jornada_tecnica_aluno.
-- ============================================================

CREATE OR REPLACE FUNCTION insights_turma(
  p_turma_id UUID,
  p_academia_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM professores
    WHERE user_id = auth.uid() AND academia_id = p_academia_id
  ) THEN
    RETURN NULL;
  END IF;

  WITH
  ultima_vez_tecnica AS (
    SELECT
      t.id   AS tecnica_id,
      t.nome AS tecnica_nome,
      MAX(a.data) AS ultima_data
    FROM tecnicas t
    LEFT JOIN aula_tecnicas at
      ON at.tecnica_id = t.id
     AND at.tipo = 'ensinada'
    LEFT JOIN aulas a
      ON a.id = at.aula_id
     AND a.turma_id = p_turma_id
     AND a.status = 'finalizada'
    WHERE t.global = true
       OR t.academia_id = p_academia_id
    GROUP BY t.id, t.nome
  ),
  ausentes AS (
    SELECT
      tecnica_nome AS nome,
      ultima_data,
      CASE
        WHEN ultima_data IS NULL THEN NULL
        ELSE (CURRENT_DATE - ultima_data::date)
      END AS dias_ausente
    FROM ultima_vez_tecnica
    ORDER BY
      (ultima_data IS NOT NULL),
      ultima_data ASC
    LIMIT 5
  ),
  recentes AS (
    SELECT
      t.nome,
      COUNT(*) AS vezes
    FROM aula_tecnicas at
    JOIN aulas a  ON a.id = at.aula_id
    JOIN tecnicas t ON t.id = at.tecnica_id
    WHERE a.turma_id    = p_turma_id
      AND a.status      = 'finalizada'
      AND at.tipo       = 'ensinada'
      AND a.data       >= (CURRENT_DATE - 30)
    GROUP BY t.nome
    ORDER BY vezes DESC
    LIMIT 3
  ),
  alunos_ausentes AS (
    SELECT
      al.nome,
      MAX(a.data) AS ultima_presenca,
      CASE
        WHEN MAX(a.data) IS NULL THEN NULL
        ELSE (CURRENT_DATE - MAX(a.data)::date)
      END AS dias_ausente
    FROM alunos al
    JOIN alunos_turmas atu
      ON atu.aluno_id = al.id
     AND atu.turma_id = p_turma_id
     AND atu.ativo    = true
    LEFT JOIN presencas p ON p.aluno_id = al.id
    LEFT JOIN aulas a
      ON a.id = p.aula_id
     AND a.turma_id  = p_turma_id
     AND a.status    = 'finalizada'
    WHERE al.academia_id = p_academia_id
      AND al.ativo       = true
    GROUP BY al.id, al.nome
    HAVING
      MAX(a.data) IS NULL
      OR MAX(a.data) < (CURRENT_DATE - 14)
    ORDER BY MAX(a.data) ASC NULLS FIRST
    LIMIT 3
  )
  SELECT json_build_object(
    'tecnicas_ausentes', (SELECT COALESCE(json_agg(row_to_json(ausentes)), '[]'::json) FROM ausentes),
    'tecnicas_recentes', (SELECT COALESCE(json_agg(row_to_json(recentes)), '[]'::json) FROM recentes),
    'alunos_ausentes',   (SELECT COALESCE(json_agg(row_to_json(alunos_ausentes)), '[]'::json) FROM alunos_ausentes)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION insights_turma(UUID, UUID) TO authenticated;
