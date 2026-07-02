-- ============================================================
-- Storage: bucket de fotos de perfil dos alunos
-- Path do objeto: {aluno_id}.jpg (ou .png/.webp)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (fotos não são dado sensível)
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Professor pode enviar/atualizar/remover foto de aluno da própria academia
CREATE POLICY "avatars_professor_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (regexp_match(name, '^([0-9a-f-]{36})\.'))[1]::uuid IN (
      SELECT id FROM alunos WHERE academia_id = academia_do_professor()
    )
  );

CREATE POLICY "avatars_professor_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (regexp_match(name, '^([0-9a-f-]{36})\.'))[1]::uuid IN (
      SELECT id FROM alunos WHERE academia_id = academia_do_professor()
    )
  );

CREATE POLICY "avatars_professor_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (regexp_match(name, '^([0-9a-f-]{36})\.'))[1]::uuid IN (
      SELECT id FROM alunos WHERE academia_id = academia_do_professor()
    )
  );

-- Aluno pode enviar/atualizar a própria foto
CREATE POLICY "avatars_aluno_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (regexp_match(name, '^([0-9a-f-]{36})\.'))[1]::uuid = id_do_aluno()
  );

CREATE POLICY "avatars_aluno_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (regexp_match(name, '^([0-9a-f-]{36})\.'))[1]::uuid = id_do_aluno()
  );

-- ============================================================
-- alunos.foto_url: professor já pode atualizar via policy
-- "alunos_professor" (FOR ALL). Aluno não tem UPDATE em alunos
-- (só SELECT do próprio registro), e não dá pra conceder UPDATE
-- de coluna só pro aluno via GRANT porque professor e aluno
-- compartilham o role "authenticated". Por isso, uma função
-- SECURITY DEFINER estreita, só pra esse campo.
-- ============================================================

CREATE OR REPLACE FUNCTION atualizar_foto_propria(p_foto_url TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE alunos SET foto_url = p_foto_url WHERE id = id_do_aluno();
$$;

GRANT EXECUTE ON FUNCTION atualizar_foto_propria(TEXT) TO authenticated;
