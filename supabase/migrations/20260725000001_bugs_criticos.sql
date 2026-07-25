-- HANDOFF-027 / Sprint 30 — Bugs críticos (P0)
-- B-106 aluno vê colegas · B-108 múltiplos visitantes · B-107 conquistas de colega
-- Idempotente.

-- ============================================================
-- B-106: Aluno vê dados básicos de colegas da MESMA academia.
-- A RLS de `alunos` só deixava o aluno ver a própria linha, então o
-- embed alunos(nome, foto_url, ...) na lista "quem foi" voltava null.
--
-- ⚠️ ATENÇÃO (privacidade/LGPD): RLS é row-level, não column-level. Esta
-- policy expõe TODAS as colunas de `alunos` da academia — inclusive as
-- sensíveis (condicoes_saude, data_nascimento, dia_mensalidade). A camada
-- de app nunca as seleciona em queries de aluno, MAS um aluno com o client
-- JS ainda conseguiria consultá-las direto. Ver nota no PR sobre mover
-- esses campos pra proteção real (tabela/RPC separada).
-- ============================================================
DROP POLICY IF EXISTS "aluno_ve_colegas_mesma_academia" ON alunos;
CREATE POLICY "aluno_ve_colegas_mesma_academia"
ON alunos FOR SELECT
USING (
  ativo = TRUE
  AND academia_id IN (SELECT academia_id FROM alunos WHERE user_id = auth.uid())
);

-- ============================================================
-- B-108: Múltiplos visitantes na mesma aula.
-- Bug real: `UNIQUE NULLS NOT DISTINCT (aula_id, aluno_id)` no schema trata
-- todo visitante (aluno_id NULL) como duplicata → só 1 visitante por aula.
-- Troca por índice parcial: unicidade só pra aluno de verdade (não-NULL),
-- preservando "1 presença por aluno por aula" e liberando N visitantes.
-- ============================================================
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'presencas'::regclass AND contype = 'u'
  LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE presencas DROP CONSTRAINT %I', cname);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS presencas_aluno_unico_por_aula
  ON presencas (aula_id, aluno_id)
  WHERE aluno_id IS NOT NULL;

-- ============================================================
-- B-107: perfil público mostra as conquistas do colega. O RPC
-- dados_conquistas_aluno (sprint29) tinha guard `= id_do_aluno()` que
-- bloqueava ver o colega. Relaxa pra self OU colega ativo da mesma
-- academia (conquistas não são sensíveis — já aparecem no perfil público).
-- ============================================================
CREATE OR REPLACE FUNCTION dados_conquistas_aluno(p_aluno_id UUID)
RETURNS TABLE (
  total_presencas BIGINT,
  max_treinos_mes BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH permitido AS (
    SELECT (
      p_aluno_id = id_do_aluno()
      OR p_aluno_id IN (
        SELECT id FROM alunos
        WHERE ativo = TRUE
          AND academia_id IN (SELECT academia_id FROM alunos WHERE user_id = auth.uid())
      )
    ) AS ok
  ),
  por_mes AS (
    SELECT COUNT(*) AS cnt
    FROM presencas p
    JOIN aulas a ON a.id = p.aula_id
    WHERE p.aluno_id = p_aluno_id
      AND (SELECT ok FROM permitido)
    GROUP BY EXTRACT(YEAR FROM a.data), EXTRACT(MONTH FROM a.data)
  )
  SELECT
    (SELECT COUNT(*) FROM presencas
      WHERE aluno_id = p_aluno_id AND (SELECT ok FROM permitido)) AS total_presencas,
    COALESCE((SELECT MAX(cnt) FROM por_mes), 0) AS max_treinos_mes
$$;

GRANT EXECUTE ON FUNCTION dados_conquistas_aluno(UUID) TO authenticated;
