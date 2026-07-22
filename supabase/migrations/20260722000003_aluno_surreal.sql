-- HANDOFF-022 / B-084 — Aluno Surreal
-- Diário de treino (anotações privadas) + flag de celebração + RPC de streak.
-- Idempotente. Prefixo 000003 porque 000001/000002 já são da sprint24.

-- ============================================================
-- 1. Diário de treino — anotações privadas do aluno por aula
-- ============================================================
CREATE TABLE IF NOT EXISTS anotacoes_treino (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id   UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  aula_id    UUID NOT NULL REFERENCES aulas(id)  ON DELETE CASCADE,
  texto      TEXT NOT NULL CHECK (char_length(texto) <= 2000),
  criado_em  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, aula_id)
);

ALTER TABLE anotacoes_treino ENABLE ROW LEVEL SECURITY;

-- Aluno só vê e edita as próprias anotações (totalmente privado).
-- Postgres não tem CREATE POLICY IF NOT EXISTS — usar DROP + CREATE.
DROP POLICY IF EXISTS "aluno_anotacoes_proprias" ON anotacoes_treino;
CREATE POLICY "aluno_anotacoes_proprias"
ON anotacoes_treino FOR ALL
USING (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()))
WITH CHECK (aluno_id IN (SELECT id FROM alunos WHERE user_id = auth.uid()));

-- ============================================================
-- 2. Flag de celebração de graduação
-- ============================================================
ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS celebrar_graduacao BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 3. RPC — streak semanal do aluno
-- "Semana com treino" = ao menos 1 presença em aula finalizada naquela
-- semana ISO (seg–dom). A semana atual sem treino ainda NÃO quebra o
-- streak (grace). Retorna nº de semanas consecutivas (0 = nenhuma).
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_streak_aluno(p_aluno_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_streak    INTEGER := 0;
  v_week      DATE;
  v_has_train BOOLEAN;
BEGIN
  v_week := DATE_TRUNC('week', CURRENT_DATE)::DATE;

  LOOP
    SELECT EXISTS(
      SELECT 1
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id
      WHERE p.aluno_id = p_aluno_id
        AND a.status   = 'finalizada'
        AND a.data     >= v_week
        AND a.data     <  v_week + 7
    ) INTO v_has_train;

    IF v_has_train THEN
      v_streak := v_streak + 1;
      v_week   := v_week - 7;
    ELSIF v_week = DATE_TRUNC('week', CURRENT_DATE)::DATE THEN
      -- Semana em andamento sem treino: pula sem quebrar
      v_week := v_week - 7;
    ELSE
      EXIT; -- gap encontrado → streak termina
    END IF;

    EXIT WHEN v_streak > 200; -- safety (~4 anos)
  END LOOP;

  RETURN v_streak;
END;
$$;

GRANT EXECUTE ON FUNCTION calcular_streak_aluno(UUID) TO authenticated;

-- ============================================================
-- 4. RPC — aluno zera a própria flag de celebração
-- O aluno só tem SELECT em `alunos` (RLS), então um UPDATE direto
-- atualizaria 0 linhas SEM erro e a flag nunca zeraria — prendendo o
-- aluno em loop na tela de celebração. Mesmo padrão da foto/perfil.
-- ============================================================
CREATE OR REPLACE FUNCTION dismissar_celebracao_propria()
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE alunos SET celebrar_graduacao = FALSE WHERE id = id_do_aluno();
$$;

GRANT EXECUTE ON FUNCTION dismissar_celebracao_propria() TO authenticated;
