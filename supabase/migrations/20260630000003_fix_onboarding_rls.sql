-- Onboarding: novo professor precisa criar academia antes de ter registro em professores.
-- A policy existente "academia_professor" usa academia_do_professor() que retorna NULL
-- para quem ainda não existe na tabela professores — bloqueava o INSERT.

CREATE POLICY "academia_insert_autenticado" ON academias FOR INSERT
  TO authenticated WITH CHECK (true);

-- Mesma lógica: a policy "professores_all" exige academia_do_professor() != NULL,
-- mas na criação inicial o professor ainda não tem registro.
CREATE POLICY "professores_insert_proprio" ON professores FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
