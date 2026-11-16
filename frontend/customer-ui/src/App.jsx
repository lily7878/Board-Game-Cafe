import { DashboardPage } from './features/dashboard/DashboardPage';
import { AccessEndedPage } from './features/ended/AccessEndedPage';
import { JoinPage } from './features/join/JoinPage';
import { PlaceholderPage } from './features/placeholder/PlaceholderPage';
import { LiveProvider } from './app/live/LiveProvider';
import { ParticipantProvider, useParticipant } from './app/ParticipantContext';
import { Redirect, RouterProvider, usePath } from './app/router';
import { ErrorBoundary, ToastProvider } from './shared/ui';

/** Providers: router -> participant identity -> live connection -> toasts. */
export default function App() {
  return (
    <RouterProvider>
      <ParticipantProvider>
        <LiveProvider>
          <ToastProvider>
            <Routes />
          </ToastProvider>
        </LiveProvider>
      </ParticipantProvider>
    </RouterProvider>
  );
}

/** Screens that exist; the rest of the customer routes show a placeholder for now. */
const PAGES = {
  '/dashboard': DashboardPage,
};
const TITLES = {
  '/menu': 'Meniu',
  '/cart': 'Coșul tău',
  '/orders': 'Comenzile mele',
  '/games': 'Jocuri',
  '/game-requests': 'Cererile mele',
  '/bill': 'Nota mesei',
  '/checkout': 'Checkout',
  '/payment': 'Plată',
};

/**
 * Route guard:
 *  - /join/<token>          always reachable (a new QR wins over an old place at a table)
 *  - no identity / ended    -> 4n (access ended or "scan the code")
 *  - joined                 -> the app; unknown paths -> /dashboard
 */
function Routes() {
  const path = usePath();
  const { status, endedReason } = useParticipant();

  const joinMatch = path.match(/^\/join\/([^/]+)$/);
  if (joinMatch) {
    if (status === 'active') return <Redirect to="/dashboard" />;
    return <JoinPage key={joinMatch[1]} joinToken={decodeURIComponent(joinMatch[1])} />;
  }
  if (status !== 'active') return <AccessEndedPage reason={endedReason ?? 'none'} />;

  const base = `/${path.split('/')[1] ?? ''}`;
  const Page = PAGES[base];
  if (Page) {
    return (
      <ErrorBoundary key={base}>
        <Page />
      </ErrorBoundary>
    );
  }
  if (TITLES[base]) return <PlaceholderPage title={TITLES[base]} />;
  return <Redirect to="/dashboard" />;
}
