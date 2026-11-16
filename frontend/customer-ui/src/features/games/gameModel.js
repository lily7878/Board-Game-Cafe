import { Castle, Crown, Dices, Gem, Grid2x2, Hexagon, Map as MapIcon, Puzzle, Sparkles, Swords, TrainFront } from 'lucide-react';

export const DIFFICULTY = { EASY: 'Ușoară', MEDIUM: 'Medie', HARD: 'Grea' };

export const players = (g) => (g.minPlayers === g.maxPlayers ? `${g.minPlayers}` : `${g.minPlayers}–${g.maxPlayers}`);
export const duration = (g) =>
  g.maxDurationMinutes && g.maxDurationMinutes !== g.durationMinutes ? `${g.durationMinutes}–${g.maxDurationMinutes}′` : `${g.durationMinutes}′`;
export const durationLong = (g) =>
  g.maxDurationMinutes && g.maxDurationMinutes !== g.durationMinutes ? `${g.durationMinutes}–${g.maxDurationMinutes} min` : `${g.durationMinutes} min`;

/** Availability as the customer should read it (computed by Core from usable copies not on loan). */
export function availability(game) {
  const n = Number(game.availableCopies ?? 0);
  if (n === 0) return { tone: 'none', text: 'Toate exemplarele sunt ocupate' };
  if (n === 1) return { tone: 'last', text: 'Ultimul exemplar disponibil' };
  return { tone: 'ok', text: `${n} exemplare disponibile` };
}

/** Same decorative icon per game id as in the management app. */
const GAME_ICONS = [Hexagon, Sparkles, TrainFront, Castle, Grid2x2, Dices, Crown, Gem, MapIcon, Swords, Puzzle];
export const gameIcon = (id) => GAME_ICONS[(Number(id) || 0) % GAME_ICONS.length];

/** Catalog query for the filters (Core supports one category per search). */
export function catalogPath(filters) {
  const params = new URLSearchParams({ page: '0', size: '100', sortBy: 'title', direction: 'ASC' });
  if (filters.players) params.set('players', String(filters.players));
  if (filters.maxDuration) params.set('maxDurationMinutes', String(filters.maxDuration));
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId));
  if (filters.availableOnly) params.set('availableOnly', 'true');
  return `/api/participant/games/search?${params}`;
}
