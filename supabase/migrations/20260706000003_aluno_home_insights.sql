-- ============================================================
-- Home insights do aluno: uma chamada só em vez de N queries
-- sequenciais na home. SECURITY DEFINER pra ler presenças/aulas
-- de qualquer academia, mas valida que p_aluno_id bate com
-- id_do_aluno() (o aluno do usuário autenticado) antes de
-- devolver qualquer coisa — mesmo padrão de atualizar_foto_propria/
-- aluno_mais_ausente. Sem essa validação, SECURITY DEFINER
-- permitiria ler o progresso de qualquer aluno de qualquer
-- academia só trocando o parâmetro na chamada da RPC.
-- ============================================================

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
    -- 1. Técnica mais antiga (stale, > 21 dias sem ver de novo)
    'tecnica_reforcar', (
      SELECT json_build_object(
        'nome', t.nome,
        'categoria_nome', cat.nome,
        'categoria_id', cat.id,
        'ultima_vez', MAX(a.data)::text
      )
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
      JOIN tecnicas t ON t.id = at.tecnica_id
      JOIN categorias_tecnicas cat ON cat.id = t.categoria_id
      WHERE p.aluno_id = p_aluno_id
      GROUP BY t.id, t.nome, cat.nome, cat.id
      HAVING MAX(a.data) < CURRENT_DATE - INTERVAL '21 days'
      ORDER BY MAX(a.data) ASC
      LIMIT 1
    ),
    -- 2. Contagens
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
    -- 3. Melhor categoria (maior % de cobertura, com pelo menos 1 técnica vista)
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
    -- 4. Última aula + técnicas ensinadas
    'ultima_aula', (
      SELECT json_build_object(
        'data', a.data::text,
        'turma_nome', tu.nome,
        'tecnicas', COALESCE((
          SELECT json_agg(t.nome)
          FROM aula_tecnicas at2
          JOIN tecnicas t ON t.id = at2.tecnica_id
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
