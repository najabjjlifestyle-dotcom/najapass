-- ============================================================
-- Jornada técnica do aluno (visão professor): técnicas que o
-- aluno efetivamente aprendeu (presença em aula × técnica
-- marcada como 'ensinada'), agrupadas por categoria.
-- SECURITY DEFINER pra ler dados de qualquer aluno da academia,
-- mas valida que o professor autenticado é da mesma academia do
-- aluno — mesmo padrão de aluno_mais_ausente/frequencia_resumo.
-- ============================================================

CREATE OR REPLACE FUNCTION jornada_tecnica_aluno(p_aluno_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_academia_id UUID;
BEGIN
  SELECT a.academia_id INTO v_academia_id
  FROM alunos a
  WHERE a.id = p_aluno_id;

  IF v_academia_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM professores p
    WHERE p.user_id = auth.uid()
    AND p.academia_id = v_academia_id
  ) THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT json_agg(cat_row ORDER BY cat_row->>'categoria')
    FROM (
      SELECT
        c.nome AS categoria,
        c.id AS categoria_id,
        json_agg(
          json_build_object('id', t.id, 'nome', t.nome, 'vezes', sub.vezes)
          ORDER BY sub.vezes DESC, t.nome
        ) AS tecnicas,
        SUM(sub.vezes) AS total_visto
      FROM (
        SELECT
          at.tecnica_id,
          COUNT(*) AS vezes
        FROM presencas pr
        JOIN aulas au ON au.id = pr.aula_id
        JOIN aula_tecnicas at ON at.aula_id = au.id AND at.tipo = 'ensinada'
        WHERE pr.aluno_id = p_aluno_id
        GROUP BY at.tecnica_id
      ) sub
      JOIN tecnicas t ON t.id = sub.tecnica_id
      JOIN categorias_tecnicas c ON c.id = t.categoria_id
      GROUP BY c.id, c.nome
    ) cat_row
  );
END;
$$;

GRANT EXECUTE ON FUNCTION jornada_tecnica_aluno(UUID) TO authenticated;
