-- HANDOFF-023 / B-089 — Professor Surreal
-- Notas privadas por aluno + foto da turma + RPCs aluno do mês / churn.
-- Idempotente. Prefixo 000004 (001–003 já usados nas sprints 24/25).

-- ============================================================
-- 1. Notas privadas do professor por aluno
-- ============================================================
CREATE TABLE IF NOT EXISTS notas_professor (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
  aluno_id     UUID NOT NULL REFERENCES alunos(id)      ON DELETE CASCADE,
  texto        TEXT NOT NULL CHECK (char_length(texto) <= 1000),
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notas_professor ENABLE ROW LEVEL SECURITY;

-- Postgres não tem CREATE POLICY IF NOT EXISTS — usar DROP + CREATE.
DROP POLICY IF EXISTS "professor_ve_proprias_notas" ON notas_professor;
CREATE POLICY "professor_ve_proprias_notas"
ON notas_professor FOR ALL
USING (professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid()))
WITH CHECK (professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid()));

-- ============================================================
-- 2. Foto da turma pós-aula
-- ============================================================
ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ============================================================
-- 3. RPC — aluno do mês (mais presenças no mês corrente)
-- ============================================================
CREATE OR REPLACE FUNCTION aluno_do_mes(p_academia_id UUID)
RETURNS TABLE (
  aluno_id      UUID,
  aluno_nome    TEXT,
  foto_url      TEXT,
  presencas_mes INTEGER
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    a.id,
    a.nome,
    a.foto_url,
    COUNT(p.id)::INTEGER AS presencas_mes
  FROM alunos a
  JOIN presencas p ON p.aluno_id = a.id
  JOIN aulas au    ON au.id = p.aula_id
  WHERE a.academia_id  = p_academia_id
    AND a.ativo        = TRUE
    AND au.status      = 'finalizada'
    AND au.data        >= DATE_TRUNC('month', CURRENT_DATE)::DATE
    AND au.data        <= CURRENT_DATE
  GROUP BY a.id, a.nome, a.foto_url
  ORDER BY presencas_mes DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION aluno_do_mes(UUID) TO authenticated;

-- ============================================================
-- 4. RPC — alunos em risco de churn
-- Eram frequentes (≥3 treinos nos 30–90 dias anteriores) mas sumiram
-- (≤1 treino nos últimos 30 dias).
-- ============================================================
CREATE OR REPLACE FUNCTION alunos_em_risco_churn(p_academia_id UUID)
RETURNS TABLE (
  aluno_id             UUID,
  aluno_nome           TEXT,
  foto_url             TEXT,
  presencas_recentes   INTEGER,
  presencas_anteriores INTEGER
)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH recentes AS (
    SELECT
      a.id, a.nome, a.foto_url,
      COUNT(p.id)::INTEGER AS cnt
    FROM alunos a
    LEFT JOIN presencas p ON p.aluno_id = a.id
    LEFT JOIN aulas au    ON au.id = p.aula_id
      AND au.status = 'finalizada'
      AND au.data   >= CURRENT_DATE - 30
    WHERE a.academia_id = p_academia_id
      AND a.ativo = TRUE
    GROUP BY a.id, a.nome, a.foto_url
  ),
  anteriores AS (
    SELECT
      a.id,
      COUNT(p.id)::INTEGER AS cnt
    FROM alunos a
    LEFT JOIN presencas p ON p.aluno_id = a.id
    LEFT JOIN aulas au    ON au.id = p.aula_id
      AND au.status = 'finalizada'
      AND au.data   >= CURRENT_DATE - 90
      AND au.data   <  CURRENT_DATE - 30
    WHERE a.academia_id = p_academia_id
      AND a.ativo = TRUE
    GROUP BY a.id
  )
  SELECT
    r.id, r.nome, r.foto_url,
    r.cnt              AS presencas_recentes,
    COALESCE(an.cnt, 0) AS presencas_anteriores
  FROM recentes r
  LEFT JOIN anteriores an ON an.id = r.id
  WHERE r.cnt               <= 1
    AND COALESCE(an.cnt, 0)  >= 3
  ORDER BY an.cnt DESC NULLS LAST
  LIMIT 3;
$$;

GRANT EXECUTE ON FUNCTION alunos_em_risco_churn(UUID) TO authenticated;

-- ============================================================
-- 5. Bucket de fotos de aula — CRIAR MANUALMENTE no Dashboard
-- Storage → New bucket → nome: "aulas-fotos", Public: SIM (leitura pública
-- pra exibir a foto). Depois rodar a policy de INSERT/UPDATE abaixo:
--
--   DROP POLICY IF EXISTS "professor_upload_foto_aula" ON storage.objects;
--   CREATE POLICY "professor_upload_foto_aula"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'aulas-fotos'
--     AND auth.uid() IN (
--       SELECT p.user_id FROM professores p
--       JOIN aulas a ON a.academia_id = p.academia_id
--       WHERE a.id::text = (storage.foldername(name))[1]
--     )
--   );
-- (repetir uma policy FOR UPDATE com o mesmo USING/WITH CHECK pra permitir upsert)
-- ============================================================
