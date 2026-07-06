-- ============================================================
-- Foto de perfil do professor. Alunos já tinham (foto_url +
-- upload no bucket avatars); professor não tinha lugar nenhum
-- pra subir foto.
-- ============================================================

ALTER TABLE professores ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Professor pode enviar/atualizar a própria foto no bucket avatars
-- (mesmo bucket dos alunos — path {id}.ext, sem colisão possível
-- entre id de professor e id de aluno).
DROP POLICY IF EXISTS "avatars_professor_self_insert" ON storage.objects;
CREATE POLICY "avatars_professor_self_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (regexp_match(name, '^([0-9a-f-]{36})\.'))[1]::uuid IN (
      SELECT id FROM professores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "avatars_professor_self_update" ON storage.objects;
CREATE POLICY "avatars_professor_self_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (regexp_match(name, '^([0-9a-f-]{36})\.'))[1]::uuid IN (
      SELECT id FROM professores WHERE user_id = auth.uid()
    )
  );
