-- FIX CRÍTICO — recursão infinita no RLS da tabela `alunos`.
-- A policy "aluno_ve_colegas_mesma_academia" (HANDOFF-027/B-106) usava uma
-- subconsulta NA PRÓPRIA `alunos`:
--   academia_id IN (SELECT academia_id FROM alunos WHERE user_id = auth.uid())
-- Pra avaliar o acesso a `alunos`, o Postgres reexecutava a mesma policy →
-- recursão infinita → TODA query autenticada em `alunos` falhava e voltava
-- vazia. Efeito: aluno caía no BEM-VINDO e professor via zero alunos (e não
-- conseguia cadastrar/editar).
--
-- Correção: usar a função academia_do_aluno() (SECURITY DEFINER, já existe),
-- que resolve a academia do aluno SEM disparar o RLS de `alunos` de novo.
-- Idempotente.

DROP POLICY IF EXISTS "aluno_ve_colegas_mesma_academia" ON alunos;
CREATE POLICY "aluno_ve_colegas_mesma_academia"
ON alunos FOR SELECT
USING (ativo = TRUE AND academia_id = academia_do_aluno());
