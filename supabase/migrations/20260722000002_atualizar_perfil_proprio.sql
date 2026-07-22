-- HANDOFF-021 (fix) — Aluno salvar o próprio perfil
-- O aluno só tem SELECT do próprio registro em `alunos` (ver
-- 20260702000003). Um UPDATE direto do aluno atualiza 0 linhas por RLS,
-- SEM erro — por isso "salvava" mas nada mudava. Mesma solução da foto:
-- função SECURITY DEFINER estreita, só nos campos que o aluno pode editar.
-- dia_mensalidade fica de fora de propósito (é controlado pelo professor).

CREATE OR REPLACE FUNCTION atualizar_perfil_proprio(
  p_data_nascimento DATE,
  p_condicoes_saude TEXT
)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE alunos
     SET data_nascimento = p_data_nascimento,
         condicoes_saude = p_condicoes_saude
   WHERE id = id_do_aluno();
$$;

GRANT EXECUTE ON FUNCTION atualizar_perfil_proprio(DATE, TEXT) TO authenticated;
