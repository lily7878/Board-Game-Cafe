import { LoginPage } from '../features/auth/LoginPage';
import { TablesAdminPage } from '../features/admin-tables/TablesAdminPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { GameRequestsPage } from '../features/game-requests/GameRequestsPage';
import { TablesPage } from '../features/tables/TablesPage';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { ErrorBoundary, ToastProvider } from '../shared/ui';
import { LiveProvider } from './live/LiveProvider';
import { Redirect, RouterProvider, usePath } from './router';
import { StaffAuthProvider, useStaffAuth } from './StaffAuthContext';
import { AppShell } from './shell/AppShell';
import { findRoute } from './navigation';

/** Providers wrap the whole app: router -> auth -> live connection -> toasts. */
export function App() {
  return (
    <RouterProvider>
      <StaffAuthProvider>
        <LiveProvider>
          <ToastProvider>
            <Routes />
          </ToastProvider>
        </LiveProvider>
      </StaffAuthProvider>
    </RouterProvider>
  );
}

/** Screens that are already built; everything else shows the placeholder. */
const PAGES = {
  '/dashboard': DashboardPage,
  '/tables': TablesPage,
  '/orders': OrdersPage,
  '/game-requests': GameRequestsPage,
  '/admin/tables': TablesAdminPage,
};

/**
 * Route guard:
 *  - anonymous           -> /login
 *  - logged in on /login -> /dashboard
 *  - unknown path        -> /dashboard
 *  - STAFF on /admin/*   -> /dashboard (Administrare is MANAGER-only)
 */
function Routes() {
  const path = usePath();
  const { status, isManager } = useStaffAuth();

  if (status === 'anonymous') {
    return path === '/login' ? <LoginPage /> : <Redirect to="/login" />;
  }

  const route = findRoute(path);
  if (!route || (route.managerOnly && !isManager)) return <Redirect to="/dashboard" />;

  const title = route.title ?? route.label;
  const Page = PAGES[route.path];
  return (
    <AppShell title={title}>
      <ErrorBoundary key={route.path}>
        {Page ? <Page /> : <PlaceholderPage title={title} />}
      </ErrorBoundary>
    </AppShell>
  );
}
