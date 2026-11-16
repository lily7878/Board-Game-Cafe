import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useParticipant } from '../ParticipantContext';

/**
 * One STOMP connection per phone. A participant may subscribe only to its own table
 * (/topic/sessions/{id}) and to the shared catalog (/topic/catalog: menu, games availability).
 *
 * Events are SIGNALS ONLY; screens refetch through REST. After a reconnect a synthetic
 * `live.reconnected` event makes every screen reload (missed events are not replayed).
 * status: 'connecting' | 'live' | 'reconnecting'  ('reconnecting' shows the 6c banner)
 */
export const RECONNECTED = 'live.reconnected';
const RECONNECT_DELAY_MS = 3000;

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const { participant } = useParticipant();
  const token = participant?.accessToken ?? null;
  const sessionId = participant?.sessionId ?? null;

  const [status, setStatus] = useState('connecting');
  const listeners = useRef(new Set());
  const clientRef = useRef(null);

  const emit = useCallback((event) => {
    listeners.current.forEach((listener) => listener(event));
  }, []);

  // Dev only: simulate a live event from the console.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    window.__bgcLiveEmit = (event) => emit({ at: new Date().toISOString(), ...event });
    return () => delete window.__bgcLiveEmit;
  }, [emit]);

  useEffect(() => {
    if (!token || !sessionId) return undefined;

    let wasConnected = false;
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const onMessage = (message) => {
      try {
        emit(JSON.parse(message.body));
      } catch {
        // Malformed frame: ignore, the next event or reconnect will resync.
      }
    };
    const client = new Client({
      brokerURL: `${scheme}://${window.location.host}/ws`,
      connectHeaders: { 'X-Participant-Token': token },
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/sessions/${sessionId}`, onMessage);
        client.subscribe('/topic/catalog', onMessage);
        setStatus('live');
        if (wasConnected) emit({ type: RECONNECTED });
        wasConnected = true;
      },
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
  }, [token, sessionId, emit]);

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
