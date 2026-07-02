-- ============================================================
-- Fix: categorias_tecnicas duplicadas.
--
-- 20260629000005_seed_categorias.sql e 20260630000004_sprint5.sql
-- inseriram categorias com nomes repetidos (ex: "Defesa",
-- "Fundamentos", "Costas"). O segundo tinha ON CONFLICT DO NOTHING,
-- mas a tabela nunca teve uma constraint UNIQUE(nome) pra esse
-- conflito disparar — então as duplicatas foram inseridas normalmente
-- e aparecem repetidas no seletor de tema da aula.
--
-- Consolida cada grupo de nome duplicado na menor id (canônica),
-- repontando as referências em tecnicas.categoria_id e aulas.tema_id
-- antes de apagar as duplicatas, e adiciona a constraint que devia
-- existir desde o início.
-- ============================================================

-- MIN()/MAX() não existem pra uuid no Postgres (só tem operadores de
-- comparação p/ índice btree, sem agregado definido) — castamos pra
-- text pra poder pegar um valor canônico determinístico.
--
-- Sem TEMP TABLE de propósito: o pooler do Supabase pode não manter a
-- mesma sessão entre statements de um script, e temp table é
-- session-scoped. Cada statement abaixo recalcula o canônico via CTE
-- própria — como nada em categorias_tecnicas muda até o DELETE final,
-- o cálculo fica consistente entre os três.

WITH canonicos AS (
  SELECT nome, MIN(id::text)::uuid AS canonico
  FROM categorias_tecnicas
  GROUP BY nome
)
UPDATE tecnicas t
SET categoria_id = ca.canonico
FROM categorias_tecnicas c
JOIN canonicos ca ON ca.nome = c.nome
WHERE t.categoria_id = c.id AND c.id <> ca.canonico;

WITH canonicos AS (
  SELECT nome, MIN(id::text)::uuid AS canonico
  FROM categorias_tecnicas
  GROUP BY nome
)
UPDATE aulas a
SET tema_id = ca.canonico
FROM categorias_tecnicas c
JOIN canonicos ca ON ca.nome = c.nome
WHERE a.tema_id = c.id AND c.id <> ca.canonico;

WITH canonicos AS (
  SELECT nome, MIN(id::text)::uuid AS canonico
  FROM categorias_tecnicas
  GROUP BY nome
)
DELETE FROM categorias_tecnicas c
USING canonicos ca
WHERE c.nome = ca.nome AND c.id <> ca.canonico;

ALTER TABLE categorias_tecnicas ADD CONSTRAINT categorias_tecnicas_nome_key UNIQUE (nome);
