-- EP-36 (B-118) — RPCs que devolvem nome de técnica agora respeitam o override
-- da academia (tecnicas_academias.nome_custom) via COALESCE. As demais RPCs
-- (professor_dashboard_insights) só devolvem categoria/aluno/turma — não mexem.
-- CREATE OR REPLACE — idempotente.

-- ── aluno_home_insights: tecnica_reforcar.nome + ultima_aula.tecnicas ──
CREATE OR REPLACE FUNCTION aluno_home_insights(p_aluno_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_academia_id UUID;
  v_result JSON;
BEGIN
  IF p_aluno_id != id_do_aluno() THEN
    RETURN NULL;
  END IF;

  SELECT academia_id INTO v_academia_id
  FROM alunos WHERE id = p_aluno_id;

  SELECT json_build_object(
    'tecnica_reforcar', (
      SELECT json_build_object(
        'nome', COALESCE(ta.nome_custom, t.nome),
        'categoria_nome', cat.nome,
        'categoria_id', cat.id,
        'ultima_vez', MAX(a.data)::text
      )
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
      JOIN tecnicas t ON t.id = at.tecnica_id
      JOIN categorias_tecnicas cat ON cat.id = t.categoria_id
      LEFT JOIN tecnicas_academias ta ON ta.tecnica_id = t.id AND ta.academia_id = v_academia_id
      WHERE p.aluno_id = p_aluno_id
      GROUP BY t.id, t.nome, ta.nome_custom, cat.nome, cat.id
      HAVING MAX(a.data) < CURRENT_DATE - INTERVAL '21 days'
      ORDER BY MAX(a.data) ASC
      LIMIT 1
    ),
    'presencas_30d', (
      SELECT COUNT(*) FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      WHERE p.aluno_id = p_aluno_id
        AND p.registrado_em >= NOW() - INTERVAL '30 days'
    ),
    'tecnicas_aprendidas', (
      SELECT COUNT(DISTINCT at.tecnica_id)
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
      WHERE p.aluno_id = p_aluno_id
    ),
    'melhor_categoria', (
      SELECT json_build_object(
        'nome', cat.nome,
        'id', cat.id,
        'vistas', COUNT(DISTINCT at.tecnica_id),
        'total', (SELECT COUNT(*) FROM tecnicas t2 WHERE t2.categoria_id = cat.id AND (t2.global = true OR t2.academia_id = v_academia_id))
      )
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
      JOIN tecnicas t ON t.id = at.tecnica_id
      JOIN categorias_tecnicas cat ON cat.id = t.categoria_id
      WHERE p.aluno_id = p_aluno_id
      GROUP BY cat.id, cat.nome
      HAVING COUNT(DISTINCT at.tecnica_id) > 0
      ORDER BY COUNT(DISTINCT at.tecnica_id)::float / NULLIF((SELECT COUNT(*) FROM tecnicas t2 WHERE t2.categoria_id = cat.id AND (t2.global = true OR t2.academia_id = v_academia_id)), 0) DESC
      LIMIT 1
    ),
    'ultima_aula', (
      SELECT json_build_object(
        'data', a.data::text,
        'turma_nome', tu.nome,
        'tecnicas', COALESCE((
          SELECT json_agg(COALESCE(ta.nome_custom, t.nome))
          FROM aula_tecnicas at2
          JOIN tecnicas t ON t.id = at2.tecnica_id
          LEFT JOIN tecnicas_academias ta ON ta.tecnica_id = t.id AND ta.academia_id = v_academia_id
          WHERE at2.aula_id = a.id AND at2.tipo = 'ensinada'
          LIMIT 5
        ), '[]'::json)
      )
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      LEFT JOIN turmas tu ON tu.id = a.turma_id
      WHERE p.aluno_id = p_aluno_id
      ORDER BY a.data DESC
      LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION aluno_home_insights(UUID) TO authenticated;

-- ── insights_turma: tecnicas_ausentes[].nome + tecnicas_recentes[].nome ──
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
      COALESCE(ta.nome_custom, t.nome) AS tecnica_nome,
      MAX(a.data) AS ultima_data
    FROM tecnicas t
    LEFT JOIN tecnicas_academias ta
      ON ta.tecnica_id = t.id
     AND ta.academia_id = p_academia_id
    LEFT JOIN aula_tecnicas at
      ON at.tecnica_id = t.id
     AND at.tipo = 'ensinada'
    LEFT JOIN aulas a
      ON a.id = at.aula_id
     AND a.turma_id = p_turma_id
     AND a.status = 'finalizada'
    WHERE t.global = true
       OR t.academia_id = p_academia_id
    GROUP BY t.id, t.nome, ta.nome_custom
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
      COALESCE(ta.nome_custom, t.nome) AS nome,
      COUNT(*) AS vezes
    FROM aula_tecnicas at
    JOIN aulas a  ON a.id = at.aula_id
    JOIN tecnicas t ON t.id = at.tecnica_id
    LEFT JOIN tecnicas_academias ta ON ta.tecnica_id = t.id AND ta.academia_id = p_academia_id
    WHERE a.turma_id    = p_turma_id
      AND a.status      = 'finalizada'
      AND at.tipo       = 'ensinada'
      AND a.data       >= (CURRENT_DATE - 30)
    GROUP BY COALESCE(ta.nome_custom, t.nome)
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
