-- ============================================================
-- Insight de dashboard: aluno mais ausente da academia (+14 dias
-- sem presença, ou nunca treinou). SECURITY DEFINER pra ler todos
-- os alunos da academia, mas só retorna algo se p_academia_id
-- bater com a academia do professor autenticado — senão a HAVING
-- nunca casa e a função devolve vazio. Mesmo padrão de quem_vai().
-- ============================================================

CREATE OR REPLACE FUNCTION aluno_mais_ausente(p_academia_id UUID)
RETURNS TABLE(aluno_id UUID, nome TEXT, dias_ausente INT) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.id,
    a.nome,
    EXTRACT(DAY FROM NOW() - MAX(p.registrado_em))::INT AS dias_ausente
  FROM alunos a
  LEFT JOIN presencas p ON p.aluno_id = a.id
  WHERE a.academia_id = p_academia_id
    AND a.ativo = TRUE
    AND p_academia_id = academia_do_professor()
  GROUP BY a.id, a.nome
  HAVING MAX(p.registrado_em) < NOW() - INTERVAL '14 days'
      OR MAX(p.registrado_em) IS NULL
  ORDER BY dias_ausente DESC NULLS LAST
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION aluno_mais_ausente(UUID) TO authenticated;
