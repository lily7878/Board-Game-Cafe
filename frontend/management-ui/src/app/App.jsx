import { LoginPage } from '../features/auth/LoginPage';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { ToastProvider } from '../shared/ui';
import { Redirect, RouterProvider, usePath } from './router';
import { StaffAuthProvider, useStaffAuth } from './StaffAuthContext';
import { AppShell } from './shell/AppShell';
import { findRoute } from './navigation';

/** Providers wrap the whole app: router -> auth -> toasts. */
export function App() {
  return (
    <RouterProvider>
      <StaffAuthProvider>
        <ToastProvider>
          <Routes />
        </ToastProvider>
      </StaffAuthProvider>
    </RouterProvider>
  );
}

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
  return (
    <AppShell title={title}>
      <PlaceholderPage key={route.path} title={title} />
    </AppShell>
  );
}
