-- Sprint 6: Planejamento de aulas + faixas por posição

-- 1. Faixas-alvo em tecnicas (quais faixas essa posição é indicada)
ALTER TABLE tecnicas ADD COLUMN IF NOT EXISTS faixas text[] DEFAULT '{}';

-- 2. aula_tecnicas: suporte ao fluxo de planejamento
-- Remove unique antigo que incluía tipo (permitia duplicatas por tipo)
ALTER TABLE aula_tecnicas DROP CONSTRAINT IF EXISTS aula_tecnicas_aula_id_tecnica_id_tipo_key;
-- Nova unique: uma entrada por técnica por aula
ALTER TABLE aula_tecnicas ADD CONSTRAINT aula_tecnicas_unique_entry UNIQUE (aula_id, tecnica_id);
-- Expande tipo para incluir 'nao_ensinada'
ALTER TABLE aula_tecnicas DROP CONSTRAINT IF EXISTS aula_tecnicas_tipo_check;
ALTER TABLE aula_tecnicas ADD CONSTRAINT aula_tecnicas_tipo_check
  CHECK (tipo IN ('planejada', 'ensinada', 'nao_ensinada'));
-- Default muda para 'planejada' (planning-first)
ALTER TABLE aula_tecnicas ALTER COLUMN tipo SET DEFAULT 'planejada';
-- Flag de reforço (professor marcou que precisa repetir)
ALTER TABLE aula_tecnicas ADD COLUMN IF NOT EXISTS reforco boolean DEFAULT false;
