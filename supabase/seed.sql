-- Seed the shared activity catalog. Ids match src/lib/activities.ts (SEED_CATALOG),
-- so the local fallback and the backend stay in sync.
insert into public.activity_catalog (id, title, description, category, icon, tags, base_points) values
  ('c-read-15',  'Ler 15 páginas de um livro',        'Escolha um livro na cabeceira e mergulhe.',            'Mente',        'book-outline',            array['reading','learn','calm'],        20),
  ('c-cook',     'Cozinhar uma refeição do zero',     'Prepare algo gostoso sem app de delivery.',            'Casa',         'restaurant-outline',      array['cooking','family_time'],         30),
  ('c-walk',     'Caminhar 20 minutos ao ar livre',   'Sinta o sol e respire fundo.',                          'Corpo',        'walk-outline',            array['fitness','outdoors','health'],   25),
  ('c-kids',     'Brincar com as crianças',           'Sem telas por perto, presença total.',                  'Família',      'happy-outline',           array['family','family_time'],          30),
  ('c-meditate', 'Meditar por 10 minutos',            'Feche os olhos e observe a respiração.',                'Mente',        'flower-outline',          array['mindfulness','calm','health'],   20),
  ('c-run',      'Correr 2 km',                       'Coloque o tênis e vá.',                                 'Corpo',        'fitness-outline',         array['fitness','health'],              35),
  ('c-series',   'Assistir 1 episódio com atenção',   'Aquela série que você ama, sem o celular na mão.',     'Lazer',        'film-outline',            array['series'],                        15),
  ('c-music',    'Tocar ou ouvir música por 20 min',  'Deixe a playlist rolar de verdade.',                    'Lazer',        'musical-notes-outline',   array['music','calm'],                  15),
  ('c-draw',     'Desenhar ou pintar algo',           'Não precisa ser perfeito, só criativo.',                'Criatividade', 'color-palette-outline',   array['art','creativity'],              20),
  ('c-learn',    'Estudar 15 min de um novo tema',    'Um idioma, um instrumento, o que quiser.',              'Mente',        'school-outline',          array['learning','learn'],              25),
  ('c-call',     'Ligar para alguém querido',         'Uma chamada de voz vale mais que 100 mensagens.',      'Conexões',     'call-outline',            array['social','family_time'],          20),
  ('c-pet',      'Passear ou brincar com o pet',      'Ele também merece seu tempo.',                          'Casa',         'paw-outline',             array['pets','outdoors'],               20),
  ('c-water',    'Beber 2 litros de água hoje',       'Hidratação é autocuidado.',                             'Corpo',        'water-outline',           array['health'],                        10),
  ('c-declutter','Organizar um cantinho da casa',     'Ambiente leve, mente leve.',                            'Casa',         'home-outline',            array['calm'],                          15),
  ('c-friends',  'Marcar um encontro com amigos',     'Presença de verdade, olho no olho.',                    'Conexões',     'wine-outline',            array['social','family_time'],          25)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  icon = excluded.icon,
  tags = excluded.tags,
  base_points = excluded.base_points;
