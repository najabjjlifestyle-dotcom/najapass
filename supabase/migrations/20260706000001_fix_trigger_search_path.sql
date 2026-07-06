-- ============================================================
-- Fix: "Database error saving new user" no signInWithOtp de
-- qualquer usuário novo (visto ao logar como aluno pela 1a vez).
--
-- associar_user_ao_aluno() (20260629000004_functions_triggers.sql)
-- é SECURITY DEFINER e roda como trigger AFTER INSERT ON auth.users
-- — ou seja, dentro da transação do próprio GoTrue, sob a role
-- supabase_auth_admin. O search_path dessa role não inclui "public",
-- então a referência não-qualificada a "alunos" não resolve e a
-- função lança uma exceção, que o GoTrue devolve como 500 genérico.
-- Só não aparecia antes porque os professores de teste já tinham
-- conta criada antes desse trigger existir — qualquer signup
-- realmente novo (ex: primeiro login de um aluno) sempre bateu nisso.
-- ============================================================

CREATE OR REPLACE FUNCTION associar_user_ao_aluno()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.alunos
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;
