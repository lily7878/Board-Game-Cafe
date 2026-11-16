import { createElement } from 'react';
import { gameIcon } from './gameModel';

/** Decorative per-game icon, picked from a fixed list. */
export function GameIcon({ id, size }) {
  return createElement(gameIcon(id), { size });
}
