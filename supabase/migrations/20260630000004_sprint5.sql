-- Sprint 5: técnicas, graduação, múltiplos professores, relatórios

-- Temas de aula (posições de guarda / situações do BJJ)
INSERT INTO categorias_tecnicas (nome, cor) VALUES
  ('Meia Guarda',            '#3B82F6'),
  ('Guarda Fechada',         '#10B981'),
  ('Guarda Aranha',          '#F59E0B'),
  ('De La Riva',             '#8B5CF6'),
  ('Guarda X',               '#EF4444'),
  ('50/50',                  '#F97316'),
  ('Meia Guarda Profunda',   '#A78BFA'),
  ('Cem Quilos',             '#6B7280'),
  ('Montada',                '#EC4899'),
  ('Costas',                 '#14B8A6'),
  ('Passagem de Guarda',     '#FB923C'),
  ('Takedown / Queda',       '#84CC16'),
  ('Defesa',                 '#94A3B8'),
  ('Fundamentos',            '#C8A96E')
ON CONFLICT DO NOTHING;

-- Adiciona tema_id em aulas para referenciar o tema trabalhado
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS tema_id UUID REFERENCES categorias_tecnicas(id);

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
