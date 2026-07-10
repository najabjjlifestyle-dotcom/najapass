-- ============================================================
-- Resumo de frequência pra aba "Frequência" do retrospecto
-- (/aulas). SECURITY DEFINER pra ler dados de toda a academia, mas
-- valida que p_academia_id bate com academia_do_professor() —
-- mesmo padrão de aluno_mais_ausente/professor_dashboard_insights.
-- ============================================================

CREATE OR REPLACE FUNCTION frequencia_resumo(
  p_academia_id UUID,
  p_turma_id UUID DEFAULT NULL,
  p_dias INT DEFAULT 90
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resultado JSON;
BEGIN
  IF p_academia_id != academia_do_professor() THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'total_aulas', (
      SELECT COUNT(*) FROM aulas a
      WHERE a.academia_id = p_academia_id AND a.status = 'finalizada'
        AND a.data >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
        AND (p_turma_id IS NULL OR a.turma_id = p_turma_id)
    ),
    'media_presentes', (
      SELECT ROUND(AVG(contagem), 1)
      FROM (
        SELECT COUNT(p.id) AS contagem
        FROM aulas a
        LEFT JOIN presencas p ON p.aula_id = a.id
        WHERE a.academia_id = p_academia_id AND a.status = 'finalizada'
          AND a.data >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
          AND (p_turma_id IS NULL OR a.turma_id = p_turma_id)
        GROUP BY a.id
      ) sub
    ),
    'top_alunos', (
      SELECT json_agg(sub ORDER BY sub.total DESC)
      FROM (
        SELECT al.nome, COUNT(p.id) AS total
        FROM presencas p
        JOIN alunos al ON al.id = p.aluno_id
        JOIN aulas a ON a.id = p.aula_id
        WHERE a.academia_id = p_academia_id
          AND a.data >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
          AND (p_turma_id IS NULL OR a.turma_id = p_turma_id)
        GROUP BY al.id, al.nome
        ORDER BY total DESC
        LIMIT 5
      ) sub
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION frequencia_resumo(UUID, UUID, INT) TO authenticated;
