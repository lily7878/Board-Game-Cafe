import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, configureHttp } from '../shared/api/http';

const STORAGE_KEY = 'bgc.participant';
export const CART_KEY = 'bgc.cart';

const ParticipantContext = createContext(null);

/**
 * Who this phone is at the table. No account: the join (QR token + PIN + name) returns an
 * access token for THIS phone. It is kept in sessionStorage, so a refresh keeps the place at
 * the table but a new tab has to join again (spec: never a participant id chosen by the client).
 *
 * status (endedReason: 'closed' | 'left' | 'paid'):
 *  - 'none'   no identity yet  -> only /join/:token is reachable
 *  - 'active' joined           -> the app
 *  - 'ended'  Core answered 401 (table closed / participant left) or "Ieși" -> 4n, cart cleared
 */
function load() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return stored?.accessToken ? stored : null;
  } catch {
    return null;
  }
}

function clearLocal() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(CART_KEY);
    sessionStorage.removeItem('bgc.payment');
  } catch {
    // storage unavailable (private mode): nothing to clear
  }
}

/*
 * Configured at import time, not in an effect: child effects run before parent effects, so the
 * first page requests would otherwise leave without the token.
 */
let onAccessLost = () => {};
configureHttp({
  getToken: () => load()?.accessToken ?? null,
  onUnauthorized: () => {
    if (load()) onAccessLost();
  },
});

export function ParticipantProvider({ children }) {
  const [participant, setParticipant] = useState(load);
  const [ended, setEnded] = useState(null); // null | 'closed' | 'left'

  const end = useCallback((reason) => {
    clearLocal();
    setParticipant(null);
    setEnded(reason);
  }, []);

  useEffect(() => {
    onAccessLost = () => end('closed');
  }, [end]);

  const join = useCallback(async ({ joinToken, pin, displayName, tableNumber }) => {
    const result = await apiRequest('/api/participant/sessions/join', {
      method: 'POST',
      auth: false,
      body: { joinToken, pin, displayName },
    });
    const identity = { ...result, tableNumber };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    } catch {
      // private mode: the identity lives only in memory for this page
    }
    setEnded(null);
    setParticipant(identity);
    return identity;
  }, []);

  /** "Ieși de pe acest telefon": tells Core first; locally we end anyway (the token is gone). */
  const leave = useCallback(async () => {
    try {
      await apiRequest('/api/participant/sessions/current/leave', { method: 'POST' });
    } catch {
      // Already closed or offline: the phone forgets the token regardless.
    }
    end('left');
  }, [end]);

  const value = useMemo(
    () => ({
      participant,
      status: participant ? 'active' : ended ? 'ended' : 'none',
      endedReason: ended,
      join,
      leave,
      end,
    }),
    [participant, ended, join, leave, end],
  );

  return <ParticipantContext.Provider value={value}>{children}</ParticipantContext.Provider>;
}

export function useParticipant() {
  const ctx = useContext(ParticipantContext);
  if (!ctx) throw new Error('useParticipant must be used inside <ParticipantProvider>');
  return ctx;
}
