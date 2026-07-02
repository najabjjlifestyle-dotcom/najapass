-- ============================================================
-- categorias_tecnicas nunca teve policy de INSERT — com RLS
-- habilitado e só a policy de SELECT, nem professor conseguia
-- criar um tema novo. Habilita INSERT só para professores (temas
-- são uma lista global compartilhada entre academias, igual o
-- SELECT já era; alunos continuam sem poder escrever).
-- ============================================================

CREATE POLICY "categorias_insert_professor" ON categorias_tecnicas FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM professores WHERE user_id = auth.uid()));
