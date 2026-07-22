-- HANDOFF-021 (extensão) — Datas de graduação
-- Registra QUANDO o aluno recebeu a faixa atual e o último grau.
-- Preenchidas a partir da próxima graduação — sem backfill de histórico
-- que não temos. Idempotente.

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS graduado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grau_em     TIMESTAMPTZ;

COMMENT ON COLUMN alunos.graduado_em IS 'Data em que o aluno recebeu a faixa ATUAL (última troca de faixa).';
COMMENT ON COLUMN alunos.grau_em     IS 'Data do último grau atribuído na faixa atual. NULL logo após trocar de faixa (sem graus ainda).';
