-- ============================================================
-- Insights unificados do dashboard do professor: uma chamada em
-- vez de N queries sequenciais. SECURITY DEFINER pra ler dados de
-- toda a academia, mas valida que p_academia_id bate com
-- academia_do_professor() (mesmo padrão de aluno_mais_ausente) —
-- sem isso, um professor de outra academia poderia ler estes
-- insights só trocando o parâmetro na chamada da RPC.
-- ============================================================

CREATE OR REPLACE FUNCTION professor_dashboard_insights(p_academia_id UUID)
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
    -- Turmas com aula hoje sem nenhuma técnica planejada/ensinada
    'turmas_sem_plano', (
      SELECT json_agg(json_build_object('aula_id', a.id, 'turma_nome', t.nome, 'hora', a.hora_inicio))
      FROM aulas a
      LEFT JOIN turmas t ON t.id = a.turma_id
      LEFT JOIN aula_tecnicas at ON at.aula_id = a.id
      WHERE a.academia_id = p_academia_id
        AND a.data = CURRENT_DATE
        AND a.status = 'agendada'
        AND at.id IS NULL
    ),
    -- Categoria não ensinada há mais de 21 dias (para qualquer turma)
    'categoria_esquecida', (
      SELECT json_build_object('categoria_nome', c.nome, 'dias', CURRENT_DATE - MAX(a.data)::date)
      FROM aula_tecnicas at
      JOIN tecnicas tec ON tec.id = at.tecnica_id
      JOIN categorias_tecnicas c ON c.id = tec.categoria_id
      JOIN aulas a ON a.id = at.aula_id
      WHERE a.academia_id = p_academia_id AND at.tipo = 'ensinada'
      GROUP BY c.id, c.nome
      HAVING CURRENT_DATE - MAX(a.data)::date > 21
      ORDER BY CURRENT_DATE - MAX(a.data)::date DESC
      LIMIT 1
    ),
    -- Aluno ausente há mais de 14 dias
    'aluno_ausente', (
      SELECT json_build_object('aluno_nome', al.nome, 'aluno_id', al.id, 'dias', CURRENT_DATE - MAX(a.data)::date)
      FROM presencas p
      JOIN alunos al ON al.id = p.aluno_id
      JOIN aulas a ON a.id = p.aula_id
      WHERE a.academia_id = p_academia_id AND al.ativo = true
      GROUP BY al.id, al.nome
      HAVING CURRENT_DATE - MAX(a.data)::date > 14
      ORDER BY CURRENT_DATE - MAX(a.data)::date DESC
      LIMIT 1
    ),
    -- Reforços pendentes da semana passada (aulas finalizadas com técnica marcada pra repetir)
    'reforcos_pendentes', (
      SELECT COUNT(*) FROM aula_tecnicas at
      JOIN aulas a ON a.id = at.aula_id
      WHERE a.academia_id = p_academia_id AND at.reforco = true
        AND a.data >= CURRENT_DATE - 7 AND a.status = 'finalizada'
    )
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION professor_dashboard_insights(UUID) TO authenticated;
