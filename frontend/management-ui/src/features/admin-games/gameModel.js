import { Castle, Crown, Dices, Gem, Grid2x2, Hexagon, Map as MapIcon, Puzzle, Sparkles, Swords, TrainFront } from 'lucide-react';
import { tableLabel } from '../../shared/format';

export const DIFFICULTY = {
  EASY: 'Ușoară',
  MEDIUM: 'Medie',
  HARD: 'Grea',
};

/**
 * Where a physical copy is right now. A loan (RESERVED / DELIVERED) wins over the condition:
 * a usable copy that is on a table is "La masă", not "Disponibil".
 *   kind: available | table | out  (drives the colour of the copy bars on the game cards)
 */
export function copyState(copy) {
  if (copy.activeRequestStatus === 'DELIVERED') return { kind: 'table', tone: 'active', label: 'La masă', where: `Masa ${tableLabel(copy.tableNumber)}` };
  if (copy.activeRequestStatus === 'RESERVED') return { kind: 'table', tone: 'reserved', label: 'Rezervat', where: `Masa ${tableLabel(copy.tableNumber)}` };
  if (copy.conditionStatus === 'USABLE') return { kind: 'available', tone: 'success', label: 'Disponibil', where: 'Raft' };
  if (copy.conditionStatus === 'UNDER_MAINTENANCE') return { kind: 'out', tone: 'warning', label: 'În verificare', where: 'Depozit' };
  return { kind: 'out', tone: 'neutral', label: 'Indisponibil', where: 'Depozit' };
}

export const COPY_FILTERS = [
  { value: 'all', label: 'Stare: toate' },
  { value: 'available', label: 'Disponibile' },
  { value: 'table', label: 'La mese / rezervate' },
  { value: 'out', label: 'Indisponibile / în verificare' },
];

export const CONDITIONS = [
  { value: 'USABLE', label: 'În stare bună', hint: 'Poate fi rezervat pentru mese.' },
  { value: 'UNDER_MAINTENANCE', label: 'În verificare', hint: 'Lipsesc piese sau e deteriorat ușor.' },
  { value: 'UNAVAILABLE', label: 'Indisponibil', hint: 'Scos din circulație.' },
];

/**
 * Inventory codes for "add several copies": PREFIX-NN, continuing after the highest number in use.
 * Mirrors the Core rule (InventoryCodes); used only to preview the codes — the server assigns the real ones.
 */
export function defaultCodePrefix(title) {
  const ascii = (title ?? '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return ascii ? ascii.slice(0, 3) : 'JOC';
}

export function previewCodes(prefix, existingCodes, count) {
  const numbered = new RegExp(`^${prefix.replace(/[^A-Z0-9]/g, '')}-(\\d{1,9})$`);
  const highest = (existingCodes ?? []).reduce((max, code) => {
    const match = numbered.exec((code ?? '').toUpperCase());
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(highest + i + 1).padStart(2, '0')}`);
}

export const players = (g) => (g.minPlayers === g.maxPlayers ? `${g.minPlayers}` : `${g.minPlayers}–${g.maxPlayers}`);
export const duration = (g) =>
  g.maxDurationMinutes && g.maxDurationMinutes !== g.durationMinutes ? `${g.durationMinutes}–${g.maxDurationMinutes} min` : `${g.durationMinutes} min`;

/** Decorative icon per game, stable for a given id (the designs give each title its own glyph). */
const GAME_ICONS = [Hexagon, Sparkles, TrainFront, Castle, Grid2x2, Dices, Crown, Gem, MapIcon, Swords, Puzzle];
export const gameIcon = (id) => GAME_ICONS[(Number(id) || 0) % GAME_ICONS.length];

/** copies grouped per game id, each with its state. */
export function copiesByGame(copies) {
  const map = new Map();
  for (const copy of copies ?? []) {
    const list = map.get(copy.gameId) ?? [];
    list.push({ ...copy, state: copyState(copy) });
    map.set(copy.gameId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.inventoryCode.localeCompare(b.inventoryCode, 'ro'));
  return map;
}
