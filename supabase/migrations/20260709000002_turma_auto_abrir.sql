-- ============================================================
-- Auto-abertura de aulas por turma. NULL = manual (comportamento
-- atual, professor abre na mão). Um número = quantas horas antes
-- do horário da aula o cron deve virar o status pra 'aberta'.
-- ============================================================

ALTER TABLE turmas ADD COLUMN IF NOT EXISTS auto_abrir_horas INT DEFAULT NULL;

-- RPC chamada pelo cron (a cada 30min) pra descobrir quais aulas
-- agendadas já entraram na janela de auto-abertura da turma.
-- SECURITY DEFINER porque quem chama é o endpoint de cron (sem
-- sessão de usuário), não um professor autenticado — por isso não
-- tem o guard de academia_do_professor() que as outras RPCs têm;
-- a proteção aqui é o endpoint checar o CRON_SECRET antes de chamar.
CREATE OR REPLACE FUNCTION aulas_para_abrir_agora()
RETURNS TABLE(id UUID, turma_id UUID, turma_nome TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.turma_id,
    t.nome AS turma_nome
  FROM aulas a
  JOIN turmas t ON t.id = a.turma_id
  WHERE
    a.status = 'agendada'
    AND t.auto_abrir_horas IS NOT NULL
    AND (
      (a.data::timestamp + COALESCE(a.hora_inicio, '00:00'::time)::interval)
      - (t.auto_abrir_horas * INTERVAL '1 hour')
    ) <= (NOW() AT TIME ZONE 'America/Sao_Paulo')
    AND (
      -- não abre aulas com horário de mais de 2h atrás — evita abrir
      -- em massa aulas antigas se o cron ficar fora do ar por um tempo
      (a.data::timestamp + COALESCE(a.hora_inicio, '00:00'::time)::interval)
    ) >= (NOW() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '2 hours';
END;
$$;

GRANT EXECUTE ON FUNCTION aulas_para_abrir_agora() TO service_role;
