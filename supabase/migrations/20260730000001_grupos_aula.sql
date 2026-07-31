-- EP-37 (B-119) — Grupos dentro da aula: técnicas por subgrupo numa mesma
-- sessão (ex: 3 experimentais fazendo posições de iniciante enquanto a turma
-- principal faz outras). Aula sem grupos = comportamento de hoje (todos
-- aprendem tudo), retrocompatível. Idempotente.

-- 1. Grupos de uma aula
CREATE TABLE IF NOT EXISTS aula_grupos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id    UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL CHECK (char_length(trim(nome)) > 0),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aula_grupos_aula ON aula_grupos(aula_id);

ALTER TABLE aula_grupos ENABLE ROW LEVEL SECURITY;

-- RLS via academia da aula, usando as funções SECURITY DEFINER que já existem
-- (não reentram em aula_grupos → sem risco de recursão de RLS).
DROP POLICY IF EXISTS "professor_gerencia_grupos" ON aula_grupos;
CREATE POLICY "professor_gerencia_grupos" ON aula_grupos
  FOR ALL
  USING (EXISTS (SELECT 1 FROM aulas a WHERE a.id = aula_id AND a.academia_id = academia_do_professor()))
  WITH CHECK (EXISTS (SELECT 1 FROM aulas a WHERE a.id = aula_id AND a.academia_id = academia_do_professor()));

DROP POLICY IF EXISTS "aluno_le_grupos" ON aula_grupos;
CREATE POLICY "aluno_le_grupos" ON aula_grupos
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM aulas a WHERE a.id = aula_id AND a.academia_id = academia_do_aluno()));

-- 2. Atribuição de técnica a grupo. NULL = vale pra aula toda (comum).
ALTER TABLE aula_tecnicas
  ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES aula_grupos(id) ON DELETE CASCADE;

-- 3. Grupo em que o aluno estava. NULL = sem grupo (só recebe as comuns).
--    ON DELETE SET NULL pra não perder a presença se o grupo for removido.
ALTER TABLE presencas
  ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES aula_grupos(id) ON DELETE SET NULL;
