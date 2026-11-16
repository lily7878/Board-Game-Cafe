import { BillPage } from './features/bill/BillPage';
import { CheckoutPage } from './features/bill/CheckoutPage';
import { PaymentPage } from './features/bill/PaymentPage';
import { CartPage } from './features/cart/CartPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { AccessEndedPage } from './features/ended/AccessEndedPage';
import { GameRequestsPage } from './features/games/GameRequestsPage';
import { GamesSection } from './features/games/GamesSection';
import { JoinPage } from './features/join/JoinPage';
import { MenuPage } from './features/menu/MenuPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { CartProvider } from './app/CartContext';
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
            <CartForParticipant>
              <Routes />
            </CartForParticipant>
          </ToastProvider>
        </LiveProvider>
      </ParticipantProvider>
    </RouterProvider>
  );
}

/** A new identity (another table, or after "Ieși") always starts with an empty cart. */
function CartForParticipant({ children }) {
  const { participant } = useParticipant();
  return <CartProvider key={participant?.accessToken ?? 'none'}>{children}</CartProvider>;
}

/** Customer screens by their first path segment. */
const PAGES = {
  '/dashboard': DashboardPage,
  '/menu': MenuPage,
  '/cart': CartPage,
  '/orders': OrdersPage,
  '/games': GamesSection,
  '/game-requests': GameRequestsPage,
  '/bill': BillPage,
  '/checkout': CheckoutPage,
  '/payment': PaymentPage,
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
  return <Redirect to="/dashboard" />;
}
