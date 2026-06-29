-- ============================================================
-- Função + Trigger: associa user_id ao aluno no primeiro login
-- ============================================================

CREATE OR REPLACE FUNCTION associar_user_ao_aluno()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE alunos
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION associar_user_ao_aluno();
