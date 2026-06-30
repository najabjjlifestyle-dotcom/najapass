-- Função chamada pelo aluno para vincular user_id ao seu registro
-- SECURITY DEFINER: roda como owner, bypassa RLS
CREATE OR REPLACE FUNCTION vincular_aluno_por_email(p_email TEXT, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE alunos
  SET user_id = p_user_id
  WHERE email = p_email AND user_id IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
