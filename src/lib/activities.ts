import type { ActivityCatalogItem, ActivityProfile } from '../types/database';

/**
 * Interest options offered when the user builds their lifestyle profile.
 * `value` is what we store & match against catalog tags.
 */
export const INTEREST_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'reading', label: 'Ler', icon: 'book-outline' },
  { value: 'cooking', label: 'Cozinhar', icon: 'restaurant-outline' },
  { value: 'fitness', label: 'Exercícios', icon: 'barbell-outline' },
  { value: 'outdoors', label: 'Ar livre', icon: 'leaf-outline' },
  { value: 'family', label: 'Família', icon: 'people-outline' },
  { value: 'mindfulness', label: 'Meditar', icon: 'flower-outline' },
  { value: 'music', label: 'Música', icon: 'musical-notes-outline' },
  { value: 'art', label: 'Arte', icon: 'color-palette-outline' },
  { value: 'learning', label: 'Aprender', icon: 'school-outline' },
  { value: 'series', label: 'Séries/Filmes', icon: 'film-outline' },
  { value: 'social', label: 'Amigos', icon: 'wine-outline' },
  { value: 'pets', label: 'Pets', icon: 'paw-outline' },
];

export const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: 'health', label: 'Cuidar da saúde' },
  { value: 'family_time', label: 'Mais tempo com a família' },
  { value: 'learn', label: 'Aprender algo novo' },
  { value: 'calm', label: 'Reduzir a ansiedade' },
  { value: 'creativity', label: 'Ser mais criativo' },
  { value: 'less_screen', label: 'Menos tempo de tela' },
];

/** Local fallback catalog — also the seed data for `activity_catalog`. */
export const SEED_CATALOG: ActivityCatalogItem[] = [
  { id: 'c-read-15', title: 'Ler 15 páginas de um livro', description: 'Escolha um livro na cabeceira e mergulhe.', category: 'Mente', icon: 'book-outline', tags: ['reading', 'learn', 'calm'], base_points: 20 },
  { id: 'c-cook', title: 'Cozinhar uma refeição do zero', description: 'Prepare algo gostoso sem app de delivery.', category: 'Casa', icon: 'restaurant-outline', tags: ['cooking', 'family_time'], base_points: 30 },
  { id: 'c-walk', title: 'Caminhar 20 minutos ao ar livre', description: 'Sinta o sol e respire fundo.', category: 'Corpo', icon: 'walk-outline', tags: ['fitness', 'outdoors', 'health'], base_points: 25 },
  { id: 'c-kids', title: 'Brincar com as crianças', description: 'Sem telas por perto, presença total.', category: 'Família', icon: 'happy-outline', tags: ['family', 'family_time'], base_points: 30 },
  { id: 'c-meditate', title: 'Meditar por 10 minutos', description: 'Feche os olhos e observe a respiração.', category: 'Mente', icon: 'flower-outline', tags: ['mindfulness', 'calm', 'health'], base_points: 20 },
  { id: 'c-run', title: 'Correr 2 km', description: 'Coloque o tênis e vá.', category: 'Corpo', icon: 'fitness-outline', tags: ['fitness', 'health'], base_points: 35 },
  { id: 'c-series', title: 'Assistir 1 episódio com atenção', description: 'Aquela série que você ama, sem o celular na mão.', category: 'Lazer', icon: 'film-outline', tags: ['series'], base_points: 15 },
  { id: 'c-music', title: 'Tocar ou ouvir música por 20 min', description: 'Deixe a playlist rolar de verdade.', category: 'Lazer', icon: 'musical-notes-outline', tags: ['music', 'calm'], base_points: 15 },
  { id: 'c-draw', title: 'Desenhar ou pintar algo', description: 'Não precisa ser perfeito, só criativo.', category: 'Criatividade', icon: 'color-palette-outline', tags: ['art', 'creativity'], base_points: 20 },
  { id: 'c-learn', title: 'Estudar 15 min de um novo tema', description: 'Um idioma, um instrumento, o que quiser.', category: 'Mente', icon: 'school-outline', tags: ['learning', 'learn'], base_points: 25 },
  { id: 'c-call', title: 'Ligar para alguém querido', description: 'Uma chamada de voz vale mais que 100 mensagens.', category: 'Conexões', icon: 'call-outline', tags: ['social', 'family_time'], base_points: 20 },
  { id: 'c-pet', title: 'Passear ou brincar com o pet', description: 'Ele também merece seu tempo.', category: 'Casa', icon: 'paw-outline', tags: ['pets', 'outdoors'], base_points: 20 },
  { id: 'c-water', title: 'Beber 2 litros de água hoje', description: 'Hidratação é autocuidado.', category: 'Corpo', icon: 'water-outline', tags: ['health'], base_points: 10 },
  { id: 'c-declutter', title: 'Organizar um cantinho da casa', description: 'Ambiente leve, mente leve.', category: 'Casa', icon: 'home-outline', tags: ['calm'], base_points: 15 },
  { id: 'c-friends', title: 'Marcar um encontro com amigos', description: 'Presença de verdade, olho no olho.', category: 'Conexões', icon: 'wine-outline', tags: ['social', 'family_time'], base_points: 25 },
];

/**
 * Rank the catalog for a given lifestyle profile. Items that match the user's
 * interests and goals bubble up; everything else stays available but lower.
 */
export function suggestActivities(
  catalog: ActivityCatalogItem[],
  profile: ActivityProfile | null,
  limit = 6,
): ActivityCatalogItem[] {
  if (!profile) return catalog.slice(0, limit);

  const wanted = new Set([...(profile.interests ?? []), ...(profile.goals ?? [])]);

  const scored = catalog.map((item) => {
    let score = 0;
    for (const tag of item.tags) if (wanted.has(tag)) score += 2;
    if (profile.has_kids && item.tags.includes('family')) score += 3;
    if (profile.energy_level === 'low' && item.tags.includes('calm')) score += 1;
    if (profile.energy_level === 'high' && item.tags.includes('fitness')) score += 1;
    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.item.base_points - a.item.base_points)
    .slice(0, limit)
    .map((s) => s.item);
}

/** Simple gamification: level up every 100 points. */
export function levelFromPoints(points: number): {
  level: number;
  current: number;
  needed: number;
  progress: number;
} {
  const level = Math.floor(points / 100) + 1;
  const current = points % 100;
  return { level, current, needed: 100, progress: current / 100 };
}
