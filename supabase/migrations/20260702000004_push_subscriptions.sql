-- ============================================================
-- Push Notifications: subscriptions + RPCs de disparo
-- ============================================================

CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuário só gerencia a própria subscription
CREATE POLICY "push_subscriptions_own" ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Professor busca subscriptions dos alunos de uma turma (pra avisar "aula aberta"
-- ou aviso direcionado). SECURITY DEFINER porque o professor não tem (e não deve
-- ter) SELECT direto em push_subscriptions de outros usuários — a validação de
-- que ele é professor da academia acontece dentro da função via academia_do_professor().
CREATE OR REPLACE FUNCTION subscricoes_da_turma(p_turma_id UUID)
RETURNS TABLE(endpoint TEXT, p256dh TEXT, auth TEXT) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ps.endpoint, ps.p256dh, ps.auth
  FROM push_subscriptions ps
  JOIN alunos a ON a.user_id = ps.user_id
  JOIN alunos_turmas at ON at.aluno_id = a.id AND at.turma_id = p_turma_id AND at.ativo = true
  WHERE a.academia_id = academia_do_professor();
$$;

GRANT EXECUTE ON FUNCTION subscricoes_da_turma(UUID) TO authenticated;

-- Professor busca subscriptions de todos os alunos da academia (aviso geral)
CREATE OR REPLACE FUNCTION subscricoes_da_academia()
RETURNS TABLE(endpoint TEXT, p256dh TEXT, auth TEXT) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ps.endpoint, ps.p256dh, ps.auth
  FROM push_subscriptions ps
  JOIN alunos a ON a.user_id = ps.user_id
  WHERE a.academia_id = academia_do_professor();
$$;

GRANT EXECUTE ON FUNCTION subscricoes_da_academia() TO authenticated;
