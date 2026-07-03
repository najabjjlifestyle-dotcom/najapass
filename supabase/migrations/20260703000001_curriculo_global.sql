-- ============================================================
-- Catálogo de técnicas por faixa, sugerido pelo Mestre Naja.
--
-- tecnicas.global e tecnicas.academia_id nullable já existiam no
-- schema desde o início, mas NUNCA foram usados — toda query de
-- técnicas no app filtra academia_id = <academia do professor>,
-- então uma técnica com academia_id NULL nunca apareceria em lugar
-- nenhum, e não havia policy de RLS liberando SELECT em global=true.
-- Essa migration ativa o recurso: técnicas globais (academia_id
-- NULL, global=true) ficam visíveis pra qualquer academia, hoje e
-- no futuro, sem precisar reseedar por academia.
--
-- Ver commits em paralelo pra: 1) policy de RLS pra global=true,
-- 2) queries do app passando a incluir `.or(academia_id.eq.X,global.eq.true)`.
-- ============================================================

-- Temas novos (os que já existiam foram reaproveitados: Guarda
-- Fechada, Guarda Aberta, Meia Guarda, De La Riva, Guarda Aranha,
-- 50/50, Montada, Cem Quilos, Costas, Passagem de Guarda,
-- Takedown / Queda)
INSERT INTO categorias_tecnicas (nome, cor) VALUES
  ('Guarda Borboleta',  '#0EA5E9'),
  ('Guarda Lasso',      '#D946EF'),
  ('Joelho na Barriga', '#F59E0B'),
  ('Norte-Sul',         '#8B5CF6'),
  ('Tartaruga',         '#65A30D'),
  ('Chaves de Pé',      '#DC2626')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO tecnicas (categoria_id, nome, faixas, global, academia_id)
SELECT c.id, v.nome, v.faixas, true, NULL
FROM (VALUES
  -- Guarda Fechada
  ('Guarda Fechada', 'Quebra de postura', ARRAY['branca']),
  ('Guarda Fechada', 'Controle de mangas e gola', ARRAY['branca']),
  ('Guarda Fechada', 'Hip bump (raspagem de quadril)', ARRAY['branca']),
  ('Guarda Fechada', 'Raspagem tesourinha', ARRAY['branca']),
  ('Guarda Fechada', 'Raspagem pêndulo', ARRAY['branca']),
  ('Guarda Fechada', 'Arm lock', ARRAY['branca']),
  ('Guarda Fechada', 'Triângulo', ARRAY['branca']),
  ('Guarda Fechada', 'Guilhotina básica', ARRAY['branca']),
  ('Guarda Fechada', 'Kimura', ARRAY['branca']),
  ('Guarda Fechada', 'Omoplata básica', ARRAY['branca']),
  ('Guarda Fechada', 'Flower Sweep', ARRAY['azul']),
  ('Guarda Fechada', 'Triângulo invertido', ARRAY['azul']),
  ('Guarda Fechada', 'Arm lock voador (sit-up)', ARRAY['azul']),
  ('Guarda Fechada', 'Omoplata com raspagem', ARRAY['azul']),
  ('Guarda Fechada', 'Ataques em sequência (Triângulo → Arm Lock → Omoplata)', ARRAY['azul']),
  ('Guarda Fechada', 'Barata (Wrist Lock)', ARRAY['roxa','marrom','preta']),
  ('Guarda Fechada', 'Gogoplata', ARRAY['roxa','marrom','preta']),
  ('Guarda Fechada', 'Dead Orchard', ARRAY['roxa','marrom','preta']),
  ('Guarda Fechada', 'Armbar invertido', ARRAY['roxa','marrom','preta']),
  ('Guarda Fechada', 'Sistemas avançados de ataques em cadeia', ARRAY['roxa','marrom','preta']),

  -- Guarda Aberta
  ('Guarda Aberta', 'Controle de pés nos quadris', ARRAY['branca']),
  ('Guarda Aberta', 'Raspagem técnica', ARRAY['branca']),
  ('Guarda Aberta', 'Gancho na canela', ARRAY['branca']),
  ('Guarda Aberta', 'Arm drag', ARRAY['branca']),
  ('Guarda Aberta', 'Single Leg a partir da guarda', ARRAY['branca']),
  ('Guarda Aberta', 'Spider Guard', ARRAY['azul']),
  ('Guarda Aberta', 'Lasso Guard', ARRAY['azul']),
  ('Guarda Aberta', 'De La Riva básica', ARRAY['azul']),
  ('Guarda Aberta', 'Raspagem Tripod', ARRAY['azul']),
  ('Guarda Aberta', 'Raspagem Tomoe Nage', ARRAY['azul']),
  ('Guarda Aberta', 'Balloon Sweep', ARRAY['azul']),
  ('Guarda Aberta', 'Berimbolo', ARRAY['roxa','marrom','preta']),
  ('Guarda Aberta', 'Matrix', ARRAY['roxa','marrom','preta']),
  ('Guarda Aberta', 'Kiss of the Dragon', ARRAY['roxa','marrom','preta']),
  ('Guarda Aberta', 'Inversões', ARRAY['roxa','marrom','preta']),
  ('Guarda Aberta', 'Back takes avançados', ARRAY['roxa','marrom','preta']),

  -- Meia Guarda
  ('Meia Guarda', 'Recuperação de guarda', ARRAY['branca']),
  ('Meia Guarda', 'Underhook', ARRAY['branca']),
  ('Meia Guarda', 'Old School Sweep', ARRAY['branca']),
  ('Meia Guarda', 'Knee Lever', ARRAY['branca']),
  ('Meia Guarda', 'Single Leg', ARRAY['branca']),
  ('Meia Guarda', 'Dogfight', ARRAY['azul']),
  ('Meia Guarda', 'Lucas Leite Sweep', ARRAY['azul']),
  ('Meia Guarda', 'Coyote Guard', ARRAY['azul']),
  ('Meia Guarda', 'Deep Half básica', ARRAY['azul']),
  ('Meia Guarda', 'Deep Half avançada', ARRAY['roxa','marrom','preta']),
  ('Meia Guarda', 'Waiter Sweep', ARRAY['roxa','marrom','preta']),
  ('Meia Guarda', 'Back takes', ARRAY['roxa','marrom','preta']),
  ('Meia Guarda', 'Leg entries', ARRAY['roxa','marrom','preta']),

  -- Guarda Borboleta
  ('Guarda Borboleta', 'Butterfly Sweep', ARRAY['branca']),
  ('Guarda Borboleta', 'Elevação básica', ARRAY['branca']),
  ('Guarda Borboleta', 'Arm Drag', ARRAY['branca']),
  ('Guarda Borboleta', 'X Guard entrada', ARRAY['azul']),
  ('Guarda Borboleta', 'Single Leg X entrada', ARRAY['azul']),
  ('Guarda Borboleta', 'Shoulder Crunch', ARRAY['azul']),
  ('Guarda Borboleta', 'Reverse X', ARRAY['roxa','marrom','preta']),
  ('Guarda Borboleta', 'Saddle entries', ARRAY['roxa','marrom','preta']),
  ('Guarda Borboleta', 'Ashi Garami', ARRAY['roxa','marrom','preta']),

  -- De La Riva
  ('De La Riva', 'Berimbolo básico', ARRAY['azul']),
  ('De La Riva', 'Balloon Sweep', ARRAY['azul']),
  ('De La Riva', 'Back take', ARRAY['azul']),
  ('De La Riva', 'Trip Sweep', ARRAY['azul']),
  ('De La Riva', 'Matrix', ARRAY['roxa','marrom','preta']),
  ('De La Riva', 'Kiss of the Dragon', ARRAY['roxa','marrom','preta']),
  ('De La Riva', 'Leg Drag entries', ARRAY['roxa','marrom','preta']),

  -- Guarda Aranha (Spider Guard)
  ('Guarda Aranha', 'Triângulo', ARRAY['azul']),
  ('Guarda Aranha', 'Omoplata', ARRAY['azul']),
  ('Guarda Aranha', 'Balloon Sweep', ARRAY['azul']),
  ('Guarda Aranha', 'Spider Sweep', ARRAY['azul']),
  ('Guarda Aranha', 'Spider-Lasso', ARRAY['roxa','marrom','preta']),
  ('Guarda Aranha', 'Matrix', ARRAY['roxa','marrom','preta']),
  ('Guarda Aranha', 'Inversões', ARRAY['roxa','marrom','preta']),

  -- Guarda Lasso
  ('Guarda Lasso', 'Lasso Sweep', ARRAY['azul']),
  ('Guarda Lasso', 'Omoplata', ARRAY['azul']),
  ('Guarda Lasso', 'Triângulo', ARRAY['azul']),
  ('Guarda Lasso', 'Lasso-X', ARRAY['roxa','marrom','preta']),
  ('Guarda Lasso', 'Back Takes', ARRAY['roxa','marrom','preta']),
  ('Guarda Lasso', 'Leg Drag', ARRAY['roxa','marrom','preta']),

  -- 50/50
  ('50/50', 'Sweep', ARRAY['roxa']),
  ('50/50', 'Back Take', ARRAY['roxa']),
  ('50/50', 'Straight Ankle Lock', ARRAY['roxa']),
  ('50/50', 'Heel Hook (somente onde permitido pelas regras)', ARRAY['marrom','preta']),
  ('50/50', 'Transições avançadas', ARRAY['marrom','preta']),

  -- Montada
  ('Montada', 'Americana', ARRAY['branca']),
  ('Montada', 'Ezekiel', ARRAY['branca']),
  ('Montada', 'Arm Lock', ARRAY['branca']),
  ('Montada', 'Mata-Leão cruzado', ARRAY['branca']),
  ('Montada', 'Montada alta', ARRAY['branca']),
  ('Montada', 'S-Mount', ARRAY['azul']),
  ('Montada', 'Arm Triangle', ARRAY['azul']),
  ('Montada', 'Cross Choke avançado', ARRAY['azul']),
  ('Montada', 'Mounted Triangle', ARRAY['roxa','marrom','preta']),
  ('Montada', 'Back Take', ARRAY['roxa','marrom','preta']),
  ('Montada', 'Armbar em transição', ARRAY['roxa','marrom','preta']),

  -- Cem Quilos (Side Control)
  ('Cem Quilos', 'Americana', ARRAY['branca']),
  ('Cem Quilos', 'Kimura', ARRAY['branca']),
  ('Cem Quilos', 'Paper Cutter', ARRAY['branca']),
  ('Cem Quilos', 'Transição para montada', ARRAY['branca']),
  ('Cem Quilos', 'North-South', ARRAY['azul']),
  ('Cem Quilos', 'Arm Triangle', ARRAY['azul']),
  ('Cem Quilos', 'Brabo Choke', ARRAY['azul']),
  ('Cem Quilos', 'North-South Choke', ARRAY['roxa','marrom','preta']),
  ('Cem Quilos', 'Wrist Locks', ARRAY['roxa','marrom','preta']),
  ('Cem Quilos', 'Transições avançadas', ARRAY['roxa','marrom','preta']),

  -- Joelho na Barriga
  ('Joelho na Barriga', 'Controle', ARRAY['branca']),
  ('Joelho na Barriga', 'Transição para montada', ARRAY['branca']),
  ('Joelho na Barriga', 'Arm Lock', ARRAY['azul']),
  ('Joelho na Barriga', 'Baseball Choke', ARRAY['azul']),
  ('Joelho na Barriga', 'Kimura', ARRAY['azul']),
  ('Joelho na Barriga', 'Back Take', ARRAY['roxa','marrom','preta']),
  ('Joelho na Barriga', 'Armbar voador', ARRAY['roxa','marrom','preta']),

  -- Norte-Sul
  ('Norte-Sul', 'North-South Choke', ARRAY['azul']),
  ('Norte-Sul', 'Kimura', ARRAY['azul']),
  ('Norte-Sul', 'Transição para montada', ARRAY['azul']),
  ('Norte-Sul', 'Wrist Locks', ARRAY['roxa','marrom','preta']),
  ('Norte-Sul', 'Back Takes', ARRAY['roxa','marrom','preta']),

  -- Costas (Pegada nas Costas / Back Control)
  ('Costas', 'Mata-Leão', ARRAY['branca']),
  ('Costas', 'Estrangulamento de gola', ARRAY['branca']),
  ('Costas', 'Bow and Arrow básico', ARRAY['branca']),
  ('Costas', 'Short Choke', ARRAY['azul']),
  ('Costas', 'Arm Trap', ARRAY['azul']),
  ('Costas', 'Body Triangle', ARRAY['azul']),
  ('Costas', 'Transições para arm lock', ARRAY['roxa','marrom','preta']),
  ('Costas', 'Rear Triangle', ARRAY['roxa','marrom','preta']),
  ('Costas', 'Crucifix', ARRAY['roxa','marrom','preta']),

  -- Tartaruga (Turtle)
  ('Tartaruga', 'Quebra da base', ARRAY['branca']),
  ('Tartaruga', 'Seat Belt', ARRAY['branca']),
  ('Tartaruga', 'Back Take', ARRAY['branca']),
  ('Tartaruga', 'Clock Choke', ARRAY['azul']),
  ('Tartaruga', 'Crucifixo', ARRAY['azul']),
  ('Tartaruga', 'Anaconda', ARRAY['azul']),
  ('Tartaruga', 'Rolling Back Take', ARRAY['roxa','marrom','preta']),
  ('Tartaruga', 'Japanese Necktie', ARRAY['roxa','marrom','preta']),

  -- Passagem de Guarda
  ('Passagem de Guarda', 'Toreando', ARRAY['branca']),
  ('Passagem de Guarda', 'Knee Slide', ARRAY['branca']),
  ('Passagem de Guarda', 'Over Under', ARRAY['branca']),
  ('Passagem de Guarda', 'Double Under', ARRAY['branca']),
  ('Passagem de Guarda', 'Leg Drag', ARRAY['azul']),
  ('Passagem de Guarda', 'Smash Pass', ARRAY['azul']),
  ('Passagem de Guarda', 'Long Step', ARRAY['azul']),
  ('Passagem de Guarda', 'Body Lock Pass', ARRAY['roxa','marrom','preta']),
  ('Passagem de Guarda', 'Folding Pass', ARRAY['roxa','marrom','preta']),
  ('Passagem de Guarda', 'Float Pass', ARRAY['roxa','marrom','preta']),

  -- Takedown / Queda
  ('Takedown / Queda', 'Double Leg', ARRAY['branca']),
  ('Takedown / Queda', 'Single Leg', ARRAY['branca']),
  ('Takedown / Queda', 'Osoto Gari', ARRAY['branca']),
  ('Takedown / Queda', 'Ouchi Gari', ARRAY['branca']),
  ('Takedown / Queda', 'Ankle Pick', ARRAY['azul']),
  ('Takedown / Queda', 'Fireman''s Carry', ARRAY['azul']),
  ('Takedown / Queda', 'Arm Drag para queda', ARRAY['azul']),
  ('Takedown / Queda', 'Uchi Mata', ARRAY['roxa','marrom','preta']),
  ('Takedown / Queda', 'Harai Goshi', ARRAY['roxa','marrom','preta']),
  ('Takedown / Queda', 'Cadeias de ataques', ARRAY['roxa','marrom','preta']),

  -- Chaves de Pé (Leg Locks)
  ('Chaves de Pé', 'Straight Ankle Lock', ARRAY['azul']),
  ('Chaves de Pé', 'Estima Lock (introdução)', ARRAY['azul']),
  ('Chaves de Pé', 'Toe Hold', ARRAY['roxa']),
  ('Chaves de Pé', 'Kneebar', ARRAY['roxa']),
  ('Chaves de Pé', 'Heel Hook (apenas em regras que permitam)', ARRAY['marrom','preta']),
  ('Chaves de Pé', 'Saddle', ARRAY['marrom','preta']),
  ('Chaves de Pé', 'Outside Ashi', ARRAY['marrom','preta']),
  ('Chaves de Pé', 'Inside Sankaku', ARRAY['marrom','preta']),
  ('Chaves de Pé', '50/50 ofensiva', ARRAY['marrom','preta'])
) AS v(categoria_nome, nome, faixas)
JOIN categorias_tecnicas c ON c.nome = v.categoria_nome;

-- RLS: SELECT liberado pra qualquer autenticado quando global = true.
-- INSERT/UPDATE/DELETE continuam restritos por "tecnicas_professor"
-- (academia_id = academia_do_professor()) — profesor não consegue
-- criar suas próprias entradas globais, só a curadoria via migration.
CREATE POLICY "tecnicas_global_select" ON tecnicas FOR SELECT
  TO authenticated USING (global = true);
