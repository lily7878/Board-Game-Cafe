import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RECONNECTED, useLive } from '../live/LiveProvider';
import { useLiveRefetch } from '../live/useLiveRefetch';
import { useApiQuery } from '../../shared/hooks/useApiQuery';

const NotificationsContext = createContext(null);
const MAX_ITEMS = 30;

/**
 * Which live events become a notification for staff. Only things that customers (or the
 * connection) cause: staff do not need to be notified about their own clicks.
 * `to(event)` is where clicking the notification leads.
 */
const RULES = {
  'order.placed': { kind: 'order', title: 'Comandă nouă', to: (e) => `/orders?order=${e.entityId}` },
  'order.updated': { kind: 'order', title: 'Comandă modificată de client', to: (e) => `/orders?order=${e.entityId}` },
  'order.cancelled': { kind: 'order', title: 'Comandă anulată de client', to: () => '/orders?view=history' },
  'game.requested': { kind: 'game', title: 'Cerere joc', to: () => '/game-requests' },
  'game.cancelled': { kind: 'game', title: 'Cerere de joc anulată', to: () => '/game-requests' },
  'session.checkout-pending': { kind: 'checkout', title: 'Checkout inițiat', to: (e) => `/tables?table=${e.tableId}` },
  'payment.failed': { kind: 'payment', title: 'Plată eșuată', to: (e) => `/tables?pay=${e.sessionId}` },
  'session.closed': { kind: 'paid', title: 'Masă plătită', to: null },
  [RECONNECTED]: { kind: 'live', title: 'Conexiune live restabilită', detail: 'datele au fost reîncărcate', to: null },
};

/**
 * 2f — notifications of THIS work session, built from live events in the browser.
 * They are not a saved history: a refresh or logout starts an empty list (the design says so).
 */
export function NotificationsProvider({ children }) {
  const { subscribe } = useLive();
  const [items, setItems] = useState([]);
  const seq = useRef(0);

  // Table numbers for the titles ("Masa 04"); events only carry the table id.
  const tables = useApiQuery('/api/admin/tables/overview');
  useLiveRefetch(tables.refetch, ['tables.', 'session.opened']);

  useEffect(
    () =>
      subscribe((event) => {
        const rule = RULES[event.type];
        if (!rule) return;
        setItems((list) =>
          [
            {
              id: ++seq.current,
              type: event.type,
              kind: rule.kind,
              title: rule.title,
              detail: rule.detail ?? null,
              tableId: event.tableId ?? null,
              href: rule.to ? rule.to(event) : null,
              at: event.at ?? new Date().toISOString(),
              read: false,
            },
            ...list,
          ].slice(0, MAX_ITEMS),
        );
      }),
    [subscribe],
  );

  const markAllRead = useCallback(() => setItems((list) => list.map((n) => (n.read ? n : { ...n, read: true }))), []);
  const markRead = useCallback((id) => setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n))), []);

  const value = useMemo(() => {
    const numbers = new Map((tables.data ?? []).map((t) => [t.tableId, t.tableNumber]));
    return {
      items,
      unread: items.filter((n) => !n.read).length,
      tableNumber: (tableId) => numbers.get(tableId) ?? null,
      markAllRead,
      markRead,
    };
  }, [items, tables.data, markAllRead, markRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return ctx;
}
