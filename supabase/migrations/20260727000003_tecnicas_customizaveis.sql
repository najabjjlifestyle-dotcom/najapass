-- EP-36 — Técnicas Globais Customizáveis por Academia (B-115)
--
-- O currículo global (~168 técnicas com academia_id = NULL, global = true) é
-- compartilhado. Duas customizações por academia, sem tocar na técnica global:
--   1) Renomear   → override de nome (tabela tecnicas_academias)
--   2) Duplicar   → nova técnica própria da academia (tecnica_origem_id)
-- Idempotente.

-- 1. Override de nome por academia (renomear)
CREATE TABLE IF NOT EXISTS tecnicas_academias (
  academia_id  UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  tecnica_id   UUID NOT NULL REFERENCES tecnicas(id)  ON DELETE CASCADE,
  nome_custom  TEXT NOT NULL CHECK (char_length(trim(nome_custom)) > 0),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (academia_id, tecnica_id)
);

ALTER TABLE tecnicas_academias ENABLE ROW LEVEL SECURITY;

-- Professor gerencia (CRUD) os overrides da própria academia. As subconsultas
-- batem em professores/alunos (tabelas diferentes) — sem risco de recursão de
-- RLS na própria tecnicas_academias. IN (não =) porque a subconsulta pode, em
-- tese, retornar mais de uma linha.
DROP POLICY IF EXISTS "professor_gerencia_overrides" ON tecnicas_academias;
CREATE POLICY "professor_gerencia_overrides" ON tecnicas_academias
  FOR ALL
  USING (academia_id IN (SELECT academia_id FROM professores WHERE user_id = auth.uid()))
  WITH CHECK (academia_id IN (SELECT academia_id FROM professores WHERE user_id = auth.uid()));

-- Aluno só lê os overrides da própria academia.
DROP POLICY IF EXISTS "aluno_le_overrides" ON tecnicas_academias;
CREATE POLICY "aluno_le_overrides" ON tecnicas_academias
  FOR SELECT
  USING (academia_id IN (SELECT academia_id FROM alunos WHERE user_id = auth.uid()));

-- 2. Rastreabilidade de duplicação: aponta a técnica-origem quando é variação.
ALTER TABLE tecnicas
  ADD COLUMN IF NOT EXISTS tecnica_origem_id UUID REFERENCES tecnicas(id);
