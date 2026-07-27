-- Proteção de dados sensíveis (LGPD) — dívida do HANDOFF-027/B-106.
-- A policy "aluno_ve_colegas_mesma_academia" (RLS é row-level) expunha
-- TODAS as colunas de `alunos` aos colegas, incluindo condicoes_saude
-- (dado de saúde, categoria especial), data_nascimento e dia_mensalidade.
-- Solução: mover esses 3 campos pra uma tabela própria com RLS estrita
-- (só o próprio aluno + o professor da academia). Assim a policy de colega
-- não alcança mais nada sensível — os campos nem estão mais em `alunos`.
-- Idempotente.

-- ============================================================
-- 1. Tabela dos campos sensíveis (1:1 com alunos)
-- ============================================================
CREATE TABLE IF NOT EXISTS alunos_dados_sensiveis (
  aluno_id        UUID PRIMARY KEY REFERENCES alunos(id) ON DELETE CASCADE,
  data_nascimento DATE,
  condicoes_saude TEXT,
  dia_mensalidade SMALLINT CHECK (dia_mensalidade BETWEEN 1 AND 31)
);

ALTER TABLE alunos_dados_sensiveis ENABLE ROW LEVEL SECURITY;

-- Próprio aluno lê os próprios dados (a escrita vai pelo RPC SECURITY DEFINER).
DROP POLICY IF EXISTS "dados_sensiveis_self_select" ON alunos_dados_sensiveis;
CREATE POLICY "dados_sensiveis_self_select"
ON alunos_dados_sensiveis FOR SELECT
USING (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()));

-- Professor da academia lê e escreve (edita a ficha do aluno).
DROP POLICY IF EXISTS "dados_sensiveis_professor" ON alunos_dados_sensiveis;
CREATE POLICY "dados_sensiveis_professor"
ON alunos_dados_sensiveis FOR ALL
USING (
  aluno_id IN (
    SELECT a.id FROM alunos a
    JOIN professores p ON p.academia_id = a.academia_id
    WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  aluno_id IN (
    SELECT a.id FROM alunos a
    JOIN professores p ON p.academia_id = a.academia_id
    WHERE p.user_id = auth.uid()
  )
);

-- ============================================================
-- 2. Migra os dados existentes e remove as colunas de `alunos`.
-- Guardado por "as colunas ainda existem" pra ser idempotente.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alunos' AND column_name = 'condicoes_saude'
  ) THEN
    INSERT INTO alunos_dados_sensiveis (aluno_id, data_nascimento, condicoes_saude, dia_mensalidade)
    SELECT id, data_nascimento, condicoes_saude, dia_mensalidade FROM alunos
    ON CONFLICT (aluno_id) DO NOTHING;

    ALTER TABLE alunos DROP COLUMN data_nascimento;
    ALTER TABLE alunos DROP COLUMN condicoes_saude;
    ALTER TABLE alunos DROP COLUMN dia_mensalidade;
  END IF;
END $$;

-- ============================================================
-- 3. RPC de auto-edição do aluno passa a escrever na tabela nova.
-- SECURITY DEFINER ignora RLS (o aluno não tem UPDATE direto). Mesma
-- assinatura de antes — o app não muda a chamada.
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_perfil_proprio(
  p_data_nascimento DATE,
  p_condicoes_saude TEXT
)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO alunos_dados_sensiveis (aluno_id, data_nascimento, condicoes_saude)
  VALUES (id_do_aluno(), p_data_nascimento, p_condicoes_saude)
  ON CONFLICT (aluno_id) DO UPDATE
    SET data_nascimento = EXCLUDED.data_nascimento,
        condicoes_saude = EXCLUDED.condicoes_saude;
$$;

GRANT EXECUTE ON FUNCTION atualizar_perfil_proprio(DATE, TEXT) TO authenticated;
