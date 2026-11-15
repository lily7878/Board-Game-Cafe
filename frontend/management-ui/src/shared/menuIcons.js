import {
  Beer,
  CakeSlice,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Donut,
  GlassWater,
  IceCreamCone,
  Leaf,
  Milk,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  Wine,
} from 'lucide-react';

/**
 * Product icons. Core stores the Lucide name in kebab-case (default "coffee"), so the customer
 * app can draw the same icon. Unknown names fall back to the coffee cup.
 */
export const MENU_ICONS = {
  coffee: Coffee,
  'cup-soda': CupSoda,
  'glass-water': GlassWater,
  milk: Milk,
  leaf: Leaf,
  beer: Beer,
  wine: Wine,
  'cake-slice': CakeSlice,
  cookie: Cookie,
  donut: Donut,
  croissant: Croissant,
  'ice-cream-cone': IceCreamCone,
  sandwich: Sandwich,
  pizza: Pizza,
  popcorn: Popcorn,
  salad: Salad,
  soup: Soup,
};

export const MENU_ICON_NAMES = Object.keys(MENU_ICONS);

export function menuIcon(name) {
  return MENU_ICONS[name] ?? Coffee;
}
