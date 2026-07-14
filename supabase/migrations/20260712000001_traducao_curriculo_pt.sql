-- ============================================================
-- Tradução do currículo global (sprint10, migration
-- 20260703000001_curriculo_global.sql) para português.
--
-- Escopo: só as ~168 técnicas GLOBAIS (academia_id IS NULL,
-- global = true) inseridas naquela migration. Técnicas cadastradas
-- por uma academia específica (professor usando /tecnicas) não são
-- tocadas — são conteúdo do próprio professor, não currículo padrão.
--
-- Critério de tradução (mesmo critério do catálogo do Mestre Naja):
-- 1. Nome próprio mantido (Kimura, Berimbolo, Ezequiel, De La Riva).
-- 2. Termo sem tradução usada no tatame mantido (Dogfight, Matrix —
--    nomes cunhados sem conteúdo descritivo pra traduzir).
-- 3. Termo com tradução consagrada no BJJ brasileiro: traduzido
--    (Butterfly Sweep → Raspagem Borboleta, Underhook → Gancho por
--    Baixo, Toe Hold → Chave de Pé, Heel Hook → Chave de Calcanhar).
--
-- Categoria "Takedown / Queda" renomeada pra "Queda" (era o único
-- nome de categoria com palavra em inglês).
--
-- Recomendado: revisar com o Mestre Naja antes de aplicar em
-- produção, especialmente os itens marcados como "nome cunhado
-- mantido" — são chamadas de julgamento, não regra fixa.
-- ============================================================

UPDATE categorias_tecnicas SET nome = 'Queda' WHERE nome = 'Takedown / Queda';

UPDATE tecnicas t
SET nome = v.nome_novo
FROM (VALUES
  -- Guarda Fechada
  ('Guarda Fechada', 'Hip bump (raspagem de quadril)', 'Raspagem de quadril'),
  ('Guarda Fechada', 'Raspagem tesourinha', 'Raspagem tesoura'),
  ('Guarda Fechada', 'Arm lock', 'Chave de braço'),
  ('Guarda Fechada', 'Flower Sweep', 'Raspagem flor (pêndulo)'),
  ('Guarda Fechada', 'Arm lock voador (sit-up)', 'Chave de braço voadora (sit-up)'),
  ('Guarda Fechada', 'Ataques em sequência (Triângulo → Arm Lock → Omoplata)', 'Ataques em sequência (Triângulo → Chave de Braço → Omoplata)'),
  ('Guarda Fechada', 'Barata (Wrist Lock)', 'Barata (chave de pulso)'),
  ('Guarda Fechada', 'Dead Orchard', 'Orquídea Morta'),
  ('Guarda Fechada', 'Armbar invertido', 'Chave de braço invertida'),

  -- Guarda Aberta
  ('Guarda Aberta', 'Arm drag', 'Puxada de braço'),
  ('Guarda Aberta', 'Single Leg a partir da guarda', 'Queda de uma perna a partir da guarda'),
  ('Guarda Aberta', 'Spider Guard', 'Guarda Aranha (entrada)'),
  ('Guarda Aberta', 'Lasso Guard', 'Guarda Laço (entrada)'),
  ('Guarda Aberta', 'Raspagem Tripod', 'Raspagem tripé'),
  ('Guarda Aberta', 'Raspagem Tomoe Nage', 'Raspagem tomoe'),
  ('Guarda Aberta', 'Balloon Sweep', 'Raspagem de balão'),
  ('Guarda Aberta', 'Kiss of the Dragon', 'Beijo do Dragão'),
  ('Guarda Aberta', 'Back takes avançados', 'Pegada de costas avançada'),

  -- Meia Guarda
  ('Meia Guarda', 'Underhook', 'Gancho por baixo'),
  ('Meia Guarda', 'Old School Sweep', 'Raspagem estilo antigo'),
  ('Meia Guarda', 'Knee Lever', 'Alavanca de joelho'),
  ('Meia Guarda', 'Single Leg', 'Isolamento de perna'),
  ('Meia Guarda', 'Lucas Leite Sweep', 'Raspagem Lucas Leite'),
  ('Meia Guarda', 'Coyote Guard', 'Guarda Coiote'),
  ('Meia Guarda', 'Deep Half básica', 'Meia-guarda profunda básica'),
  ('Meia Guarda', 'Deep Half avançada', 'Meia-guarda profunda avançada'),
  ('Meia Guarda', 'Waiter Sweep', 'Raspagem do garçom'),
  ('Meia Guarda', 'Back takes', 'Pegada de costas'),
  ('Meia Guarda', 'Leg entries', 'Entradas de perna'),

  -- Guarda Borboleta
  ('Guarda Borboleta', 'Butterfly Sweep', 'Raspagem borboleta'),
  ('Guarda Borboleta', 'Arm Drag', 'Puxada de braço'),
  ('Guarda Borboleta', 'X Guard entrada', 'Guarda X (entrada)'),
  ('Guarda Borboleta', 'Single Leg X entrada', 'Guarda X de uma perna (entrada)'),
  ('Guarda Borboleta', 'Shoulder Crunch', 'Compressão de ombro'),
  ('Guarda Borboleta', 'Reverse X', 'Guarda X invertida'),
  ('Guarda Borboleta', 'Saddle entries', 'Entradas na sela'),
  ('Guarda Borboleta', 'Ashi Garami', 'Nó de perna (Ashi Garami)'),

  -- De La Riva
  ('De La Riva', 'Balloon Sweep', 'Raspagem de balão'),
  ('De La Riva', 'Back take', 'Pegada de costas'),
  ('De La Riva', 'Trip Sweep', 'Raspagem de tropeço'),
  ('De La Riva', 'Kiss of the Dragon', 'Beijo do Dragão'),
  ('De La Riva', 'Leg Drag entries', 'Entradas de arrasto de perna'),

  -- Guarda Aranha
  ('Guarda Aranha', 'Balloon Sweep', 'Raspagem de balão'),
  ('Guarda Aranha', 'Spider Sweep', 'Raspagem aranha'),
  ('Guarda Aranha', 'Spider-Lasso', 'Aranha-Laço'),

  -- Guarda Lasso
  ('Guarda Lasso', 'Lasso Sweep', 'Raspagem laço'),
  ('Guarda Lasso', 'Lasso-X', 'Laço-X'),
  ('Guarda Lasso', 'Back Takes', 'Pegada de costas'),
  ('Guarda Lasso', 'Leg Drag', 'Arrasto de perna'),

  -- 50/50
  ('50/50', 'Sweep', 'Raspagem'),
  ('50/50', 'Back Take', 'Pegada de costas'),
  ('50/50', 'Straight Ankle Lock', 'Chave de tornozelo reta'),
  ('50/50', 'Heel Hook (somente onde permitido pelas regras)', 'Chave de calcanhar (somente onde permitido pelas regras)'),

  -- Montada
  ('Montada', 'Ezekiel', 'Ezequiel'),
  ('Montada', 'Arm Lock', 'Chave de braço'),
  ('Montada', 'S-Mount', 'Montada em S'),
  ('Montada', 'Arm Triangle', 'Triângulo de braço'),
  ('Montada', 'Cross Choke avançado', 'Estrangulamento cruzado avançado'),
  ('Montada', 'Mounted Triangle', 'Triângulo montado'),
  ('Montada', 'Back Take', 'Pegada de costas'),
  ('Montada', 'Armbar em transição', 'Chave de braço em transição'),

  -- Cem Quilos
  ('Cem Quilos', 'Paper Cutter', 'Estrangulamento papel de pão'),
  ('Cem Quilos', 'North-South', 'Norte-Sul'),
  ('Cem Quilos', 'Arm Triangle', 'Triângulo de braço'),
  ('Cem Quilos', 'Brabo Choke', 'Estrangulamento Brabo'),
  ('Cem Quilos', 'North-South Choke', 'Estrangulamento Norte-Sul'),
  ('Cem Quilos', 'Wrist Locks', 'Chaves de pulso'),

  -- Joelho na Barriga
  ('Joelho na Barriga', 'Arm Lock', 'Chave de braço'),
  ('Joelho na Barriga', 'Baseball Choke', 'Estrangulamento de beisebol'),
  ('Joelho na Barriga', 'Back Take', 'Pegada de costas'),
  ('Joelho na Barriga', 'Armbar voador', 'Chave de braço voadora'),

  -- Norte-Sul
  ('Norte-Sul', 'North-South Choke', 'Estrangulamento Norte-Sul'),
  ('Norte-Sul', 'Wrist Locks', 'Chaves de pulso'),
  ('Norte-Sul', 'Back Takes', 'Pegada de costas'),

  -- Costas
  ('Costas', 'Bow and Arrow básico', 'Estrangulamento baiano básico'),
  ('Costas', 'Short Choke', 'Estrangulamento curto'),
  ('Costas', 'Arm Trap', 'Aprisionamento de braço'),
  ('Costas', 'Body Triangle', 'Triângulo corporal'),
  ('Costas', 'Transições para arm lock', 'Transições para chave de braço'),
  ('Costas', 'Rear Triangle', 'Triângulo pelas costas'),
  ('Costas', 'Crucifix', 'Crucifixo'),

  -- Tartaruga
  ('Tartaruga', 'Seat Belt', 'Cinto de segurança'),
  ('Tartaruga', 'Back Take', 'Pegada de costas'),
  ('Tartaruga', 'Clock Choke', 'Estrangulamento relógio'),
  ('Tartaruga', 'Rolling Back Take', 'Pegada de costas rolando'),
  ('Tartaruga', 'Japanese Necktie', 'Gravata japonesa'),

  -- Passagem de Guarda
  ('Passagem de Guarda', 'Toreando', 'Passagem toreando'),
  ('Passagem de Guarda', 'Knee Slide', 'Passagem corte de joelho'),
  ('Passagem de Guarda', 'Over Under', 'Passagem por cima e por baixo'),
  ('Passagem de Guarda', 'Double Under', 'Passagem com dois ganchos nas pernas'),
  ('Passagem de Guarda', 'Leg Drag', 'Passagem raspando (arrasto de perna)'),
  ('Passagem de Guarda', 'Smash Pass', 'Passagem em cachecol (esgrima)'),
  ('Passagem de Guarda', 'Long Step', 'Passagem folga (long step)'),
  ('Passagem de Guarda', 'Body Lock Pass', 'Passagem de abraço (body lock)'),
  ('Passagem de Guarda', 'Folding Pass', 'Passagem dobrando (folding pass)'),
  ('Passagem de Guarda', 'Float Pass', 'Passagem flutuante (float pass)'),

  -- Queda (era "Takedown / Queda", renomeada acima)
  ('Queda', 'Double Leg', 'Queda dupla (agarrar as duas pernas)'),
  ('Queda', 'Single Leg', 'Queda de uma perna'),
  ('Queda', 'Ankle Pick', 'Pegada de tornozelo'),
  ('Queda', 'Fireman''s Carry', 'Carregada de bombeiro'),
  ('Queda', 'Arm Drag para queda', 'Puxada de braço para queda'),

  -- Chaves de Pé
  ('Chaves de Pé', 'Straight Ankle Lock', 'Chave de tornozelo reta'),
  ('Chaves de Pé', 'Estima Lock (introdução)', 'Chave Estima (introdução)'),
  ('Chaves de Pé', 'Toe Hold', 'Chave de pé (dedão/torção)'),
  ('Chaves de Pé', 'Kneebar', 'Chave de joelho'),
  ('Chaves de Pé', 'Heel Hook (apenas em regras que permitam)', 'Chave de calcanhar (apenas em regras que permitam)'),
  ('Chaves de Pé', 'Saddle', 'Sela'),
  ('Chaves de Pé', 'Outside Ashi', 'Ashi externo'),
  ('Chaves de Pé', 'Inside Sankaku', 'Sankaku interno')

) AS v(categoria_nome, nome_antigo, nome_novo)
JOIN categorias_tecnicas c ON c.nome = v.categoria_nome
WHERE t.categoria_id = c.id
  AND t.nome = v.nome_antigo
  AND t.global = true;
