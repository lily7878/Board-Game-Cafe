import {
  Armchair,
  ClipboardList,
  Coffee,
  Dices,
  LayoutDashboard,
  LayoutGrid,
  Puzzle,
  Settings,
  Table2,
  TrendingUp,
  Users,
} from 'lucide-react';

/**
 * Single source of truth for routes, sidebar items and topbar titles.
 * `managerOnly` routes are hidden from the sidebar AND blocked by the guard.
 */
export const OPERATIONS_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tables', label: 'Mese', icon: Armchair },
  { path: '/orders', label: 'Comenzi', icon: ClipboardList, counter: 'orders' },
  { path: '/game-requests', label: 'Cereri jocuri', icon: Dices, counter: 'gameRequests' },
];

export const ADMIN_NAV = [
  { path: '/admin', label: 'Toate modulele', title: 'Administrare', icon: LayoutGrid, exact: true },
  { path: '/admin/staff', label: 'Personal', icon: Users },
  { path: '/admin/tables', label: 'Configurare mese', icon: Table2 },
  { path: '/admin/games', label: 'Jocuri', icon: Puzzle },
  { path: '/admin/menu', label: 'Meniu', icon: Coffee },
  { path: '/admin/settings', label: 'Setări', icon: Settings },
  { path: '/admin/reports', label: 'Rapoarte', icon: TrendingUp },
].map((item) => ({ ...item, managerOnly: true }));

export const ALL_ROUTES = [...OPERATIONS_NAV, ...ADMIN_NAV];

export function isActive(item, path) {
  return item.exact ? path === item.path : path === item.path || path.startsWith(`${item.path}/`);
}

/** Most specific route that matches the current path (longest prefix wins). */
export function findRoute(path) {
  return ALL_ROUTES.filter((item) => isActive(item, path)).sort((a, b) => b.path.length - a.path.length)[0] ?? null;
}
