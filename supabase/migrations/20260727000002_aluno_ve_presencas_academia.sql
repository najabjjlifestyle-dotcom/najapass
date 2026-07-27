-- Aluno vê "quem foi" nas aulas da própria academia.
-- A RLS de presencas só deixava o aluno ver a PRÓPRIA presença
-- (presencas_aluno_select: aluno_id = id_do_aluno()), então a lista
-- "Quem foi" no detalhe da aula mostrava só ele mesmo.
--
-- Policy adicional (OR com a existente): aluno lê presenças de aulas da
-- sua academia. Usa academia_do_aluno() (SECURITY DEFINER) e referencia
-- `aulas` — NÃO `presencas` — então sem recursão de RLS.
-- Nada sensível aqui: presencas só tem aula_id/aluno_id/nome_visitante.
-- Idempotente.

DROP POLICY IF EXISTS "presencas_aluno_ve_da_academia" ON presencas;
CREATE POLICY "presencas_aluno_ve_da_academia"
ON presencas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM aulas a
    WHERE a.id = aula_id AND a.academia_id = academia_do_aluno()
  )
);
