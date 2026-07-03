-- ============================================================
-- Separado de 20260703000001_curriculo_global.sql de propósito —
-- ver comentário lá. Rode isso depois que os INSERTs da 000001
-- já tiverem commitado.
-- ============================================================

-- RLS: SELECT liberado pra qualquer autenticado quando global = true.
-- INSERT/UPDATE/DELETE continuam restritos por "tecnicas_professor"
-- (academia_id = academia_do_professor()) — professor não consegue
-- criar suas próprias entradas globais, só a curadoria via migration.
DROP POLICY IF EXISTS "tecnicas_global_select" ON tecnicas;
CREATE POLICY "tecnicas_global_select" ON tecnicas FOR SELECT
  TO authenticated USING (global = true);
