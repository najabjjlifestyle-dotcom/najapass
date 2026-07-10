-- ============================================================
-- Histórinhas: sequências de técnicas nomeadas que o professor
-- monta antes das aulas e aplica com um toque no planejamento.
-- ============================================================

CREATE TABLE IF NOT EXISTS historinhas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historinha_tecnicas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historinha_id UUID NOT NULL REFERENCES historinhas(id) ON DELETE CASCADE,
  tecnica_id    UUID NOT NULL REFERENCES tecnicas(id),
  ordem         INT NOT NULL DEFAULT 0,
  UNIQUE (historinha_id, tecnica_id)
);

ALTER TABLE historinhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historinha_tecnicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professor ve historinhas da sua academia" ON historinhas;
CREATE POLICY "professor ve historinhas da sua academia"
  ON historinhas FOR SELECT
  USING (
    academia_id IN (
      SELECT academia_id FROM professores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "professor gerencia historinhas da sua academia" ON historinhas;
CREATE POLICY "professor gerencia historinhas da sua academia"
  ON historinhas FOR ALL
  USING (
    academia_id IN (
      SELECT academia_id FROM professores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "professor ve tecnicas de historinhas da sua academia" ON historinha_tecnicas;
CREATE POLICY "professor ve tecnicas de historinhas da sua academia"
  ON historinha_tecnicas FOR SELECT
  USING (
    historinha_id IN (
      SELECT h.id FROM historinhas h
      JOIN professores p ON p.academia_id = h.academia_id
      WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "professor gerencia tecnicas de historinhas" ON historinha_tecnicas;
CREATE POLICY "professor gerencia tecnicas de historinhas"
  ON historinha_tecnicas FOR ALL
  USING (
    historinha_id IN (
      SELECT h.id FROM historinhas h
      JOIN professores p ON p.academia_id = h.academia_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_historinhas_academia ON historinhas(academia_id);
CREATE INDEX IF NOT EXISTS idx_historinha_tecnicas_historinha ON historinha_tecnicas(historinha_id, ordem);
