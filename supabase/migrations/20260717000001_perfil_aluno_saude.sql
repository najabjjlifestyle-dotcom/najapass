-- HANDOFF-021 / B-081 — Perfil completo do aluno
-- Adiciona data de nascimento, condições de saúde e dia da mensalidade.
-- Idempotente: ADD COLUMN IF NOT EXISTS.

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS data_nascimento  DATE,
  ADD COLUMN IF NOT EXISTS condicoes_saude  TEXT,
  ADD COLUMN IF NOT EXISTS dia_mensalidade  SMALLINT CHECK (dia_mensalidade BETWEEN 1 AND 31);

COMMENT ON COLUMN alunos.data_nascimento  IS 'Data de nascimento — usada para aniversários e registro de graduação';
COMMENT ON COLUMN alunos.condicoes_saude  IS 'Condições de saúde relevantes para o treino (diabetes, asma, lesões, alergias). NULL = não preenchido. String vazia = sem condições.';
COMMENT ON COLUMN alunos.dia_mensalidade  IS 'Dia do mês do vencimento da mensalidade (1–31). Visual only — sem integração de pagamento.';

-- Sem novas políticas de RLS: as colunas pertencem a `alunos`, que já tem
-- políticas cobrindo professor (todos os alunos da própria academia) e
-- aluno (apenas o próprio registro via user_id). Ambos os campos herdam.
