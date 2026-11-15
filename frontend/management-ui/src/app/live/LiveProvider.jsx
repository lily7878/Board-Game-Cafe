import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useStaffAuth } from '../StaffAuthContext';

/**
 * One STOMP-over-WebSocket connection per tab, subscribed to /topic/staff.
 *
 * Events are SIGNALS ONLY ({ type, sessionId, tableId, entityId, status, at }):
 * listeners refetch the affected data through REST. After a reconnect we emit a synthetic
 * `live.reconnected` event so every screen reloads everything (events sent while we were
 * offline are lost — the broker does not replay them).
 *
 * status: 'connecting' (first attempt) | 'live' | 'reconnecting'
 */
export const RECONNECTED = 'live.reconnected';
const RECONNECT_DELAY_MS = 3000;

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const { user, status: authStatus } = useStaffAuth();
  const token = authStatus === 'active' ? user?.accessToken : null;

  const [status, setStatus] = useState('connecting');
  const listeners = useRef(new Set());
  const clientRef = useRef(null);

  const emit = useCallback((event) => {
    listeners.current.forEach((listener) => listener(event));
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    let wasConnected = false;
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const client = new Client({
      // Same origin -> Vite proxies /ws to the Core service on :8082.
      brokerURL: `${scheme}://${window.location.host}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe('/topic/staff', (message) => {
          try {
            emit(JSON.parse(message.body));
          } catch {
            // Malformed frame: ignore, the next event or reconnect will resync.
          }
        });
        setStatus('live');
        if (wasConnected) emit({ type: RECONNECTED });
        wasConnected = true;
      },
      // Ignore close events of a client we already replaced (logout, token change, retry).
      onWebSocketClose: () => {
        if (clientRef.current === client) setStatus('reconnecting');
      },
      onStompError: () => {
        if (clientRef.current === client) setStatus('reconnecting');
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      clientRef.current = null;
      client.deactivate();
      setStatus('connecting');
    };
  }, [token, emit]);

  /** "Reîncearcă" button: drop the current attempt and connect right away. */
  const retry = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    await client.deactivate();
    if (clientRef.current === client) client.activate();
  }, []);

  const subscribe = useCallback((listener) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);

  const value = useMemo(() => ({ status, retry, subscribe }), [status, retry, subscribe]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLive must be used inside <LiveProvider>');
  return ctx;
}
