import { createElement } from 'react';
import { gameIcon } from './gameModel';

/** Decorative per-game icon. The icon component is picked from a fixed list, never created here. */
export function GameIcon({ id, size }) {
  return createElement(gameIcon(id), { size });
}
