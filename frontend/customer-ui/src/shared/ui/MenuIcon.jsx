import { createElement } from 'react';
import { menuIcon } from '../menuIcons';

/** Product icon by its Lucide name from Core; picked from a fixed list, never created here. */
export function MenuIcon({ name, size }) {
  return createElement(menuIcon(name), { size });
}
