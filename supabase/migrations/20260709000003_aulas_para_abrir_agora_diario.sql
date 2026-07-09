-- ============================================================
-- Ajuste: o plano Hobby da Vercel só permite cron 1x/dia (o
-- deploy com */30 * * * * foi rejeitado: "Hobby accounts are
-- limited to daily cron jobs"). Sem rodar a cada 30min, a lógica
-- original de "abrir N horas antes do horário" não faz sentido —
-- só dá pra verificar 1x por dia, então a RPC agora abre de uma
-- vez todas as aulas de HOJE das turmas com auto-abertura ligada.
-- O cron roda bem cedo (7h UTC = 4h em São Paulo), antes de
-- qualquer horário de aula realista.
-- ============================================================

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
    AND a.data = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date;
END;
$$;
