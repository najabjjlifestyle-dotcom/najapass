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
CREATE TEMP TABLE _categoria_canonico AS
SELECT nome, MIN(id::text)::uuid AS canonico
FROM categorias_tecnicas
GROUP BY nome;

UPDATE tecnicas t
SET categoria_id = cc.canonico
FROM categorias_tecnicas c
JOIN _categoria_canonico cc ON cc.nome = c.nome
WHERE t.categoria_id = c.id AND c.id <> cc.canonico;

UPDATE aulas a
SET tema_id = cc.canonico
FROM categorias_tecnicas c
JOIN _categoria_canonico cc ON cc.nome = c.nome
WHERE a.tema_id = c.id AND c.id <> cc.canonico;

DELETE FROM categorias_tecnicas c
USING _categoria_canonico cc
WHERE c.nome = cc.nome AND c.id <> cc.canonico;

DROP TABLE _categoria_canonico;

ALTER TABLE categorias_tecnicas ADD CONSTRAINT categorias_tecnicas_nome_key UNIQUE (nome);
