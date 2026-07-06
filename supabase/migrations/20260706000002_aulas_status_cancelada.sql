-- ============================================================
-- Aulas agendadas e recorrentes (HANDOFF-008).
--
-- 'agendada' já era um valor aceito pelo status desde o schema
-- original (só nunca tinha sido usado de fato pelo app — toda
-- aula sempre nascia com status='aberta'). Falta só 'cancelada'
-- pro professor poder cancelar uma aula agendada sem apagar o
-- histórico de pré-confirmações.
--
-- Não precisa de coluna nova pra horário — aulas.hora_inicio já
-- existe (TIME) desde o schema original e cobre o mesmo caso de uso.
-- ============================================================

ALTER TABLE aulas DROP CONSTRAINT IF EXISTS aulas_status_check;
ALTER TABLE aulas ADD CONSTRAINT aulas_status_check
  CHECK (status IN ('agendada', 'aberta', 'finalizada', 'cancelada'));
