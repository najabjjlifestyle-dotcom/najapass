-- Sprint 5: técnicas, graduação, múltiplos professores, relatórios

-- Seed categorias de técnicas BJJ
INSERT INTO categorias_tecnicas (nome, cor) VALUES
  ('Guarda',             '#3B82F6'),
  ('Passagem de Guarda', '#10B981'),
  ('Raspagem',           '#F59E0B'),
  ('Finalização',        '#EF4444'),
  ('Takedown / Queda',   '#8B5CF6'),
  ('Posição',            '#F97316'),
  ('Defesa',             '#6B7280'),
  ('Conceito',           '#14B8A6')
ON CONFLICT DO NOTHING;

-- Função para professor se vincular pelo e-mail (bypass RLS)
CREATE OR REPLACE FUNCTION vincular_professor_por_email(p_email TEXT, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE rows_updated INTEGER;
BEGIN
  UPDATE professores
  SET user_id = p_user_id
  WHERE email = p_email AND user_id IS NULL;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
