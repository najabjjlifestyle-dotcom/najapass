-- Storage do bucket `aulas-fotos` — permite o professor enviar E TROCAR a foto
-- da turma. O upload no client usa `upsert: true`; quando a foto já existe, o
-- upsert vira um UPDATE em storage.objects. Se só a policy de INSERT existir,
-- a primeira foto sobe mas "Trocar" falha por RLS. Aqui garantimos as duas
-- (INSERT + UPDATE), idempotentes.
--
-- Path do objeto: `<aula_id>/foto.<ext>` → (storage.foldername(name))[1] = aula_id.
-- Autoriza qualquer professor da mesma academia da aula.

DROP POLICY IF EXISTS "professor_upload_foto_aula" ON storage.objects;
CREATE POLICY "professor_upload_foto_aula"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'aulas-fotos'
  AND auth.uid() IN (
    SELECT p.user_id FROM professores p
    JOIN aulas a ON a.academia_id = p.academia_id
    WHERE a.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "professor_update_foto_aula" ON storage.objects;
CREATE POLICY "professor_update_foto_aula"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'aulas-fotos'
  AND auth.uid() IN (
    SELECT p.user_id FROM professores p
    JOIN aulas a ON a.academia_id = p.academia_id
    WHERE a.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'aulas-fotos'
  AND auth.uid() IN (
    SELECT p.user_id FROM professores p
    JOIN aulas a ON a.academia_id = p.academia_id
    WHERE a.id::text = (storage.foldername(name))[1]
  )
);
