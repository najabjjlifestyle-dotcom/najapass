-- ============================================================
-- Quem vai na aula (FU-14) — expõe apenas nomes, sem dados sensíveis
-- ============================================================

CREATE OR REPLACE FUNCTION quem_vai(p_aula_id UUID)
RETURNS TABLE(nome TEXT, visitante BOOLEAN) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(a.nome, p.nome_visitante) AS nome, (p.aluno_id IS NULL) AS visitante
  FROM presencas p
  LEFT JOIN alunos a ON a.id = p.aluno_id
  JOIN aulas au ON au.id = p.aula_id
  WHERE p.aula_id = p_aula_id
    AND (au.academia_id = academia_do_professor() OR au.academia_id = academia_do_aluno())
  ORDER BY p.registrado_em;
$$;

GRANT EXECUTE ON FUNCTION quem_vai(UUID) TO authenticated;
