import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, configureHttp } from '../shared/api/http';

/**
 * Staff identity (spec: JWT in localStorage, valid 60 min, NO refresh).
 *
 * status:
 *  - 'anonymous' : nobody logged in -> Login (1a)
 *  - 'active'    : valid token
 *  - 'expired'   : token reached expiresAt or Core answered 401.
 *                  The token is already deleted, but we keep the name/role so the
 *                  shell stays visible behind the blocking modal (7f).
 */
const STORAGE_KEY = 'bgc.staff.auth';
const StaffAuthContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    return stored?.accessToken && stored?.expiresAt ? stored : null;
  } catch {
    return null;
  }
}

function initialState() {
  const stored = readStored();
  if (stored && new Date(stored.expiresAt).getTime() <= Date.now()) {
    localStorage.removeItem(STORAGE_KEY);
    return { user: null, expired: false };
  }
  return { user: stored, expired: false };
}

export function StaffAuthProvider({ children }) {
  const [state, setState] = useState(initialState);
  const { user, expired } = state;

  const expire = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // Only a logged-in user can "expire"; a 401 on the login page stays anonymous.
    setState((s) => (s.user ? { ...s, expired: true } : s));
  }, []);

  // Every request reads the token from storage; any 401 expires the session.
  useEffect(() => {
    configureHttp({ getToken: () => readStored()?.accessToken ?? null, onUnauthorized: expire });
  }, [expire]);

  // Expire exactly at expiresAt (no refresh token in v1).
  useEffect(() => {
    if (!user || expired) return undefined;
    const msLeft = new Date(user.expiresAt).getTime() - Date.now();
    const timer = setTimeout(expire, Math.max(0, msLeft));
    return () => clearTimeout(timer);
  }, [user, expired, expire]);

  const login = useCallback(async (email, password) => {
    const response = await apiRequest('/api/admin/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    const next = {
      accessToken: response.accessToken,
      expiresAt: response.expiresAt,
      staffId: response.staffId,
      fullName: response.fullName,
      role: response.role, // 'STAFF' | 'MANAGER'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState({ user: next, expired: false });
    return next;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, expired: false });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isManager: user?.role === 'MANAGER',
      status: !user ? 'anonymous' : expired ? 'expired' : 'active',
      login,
      logout,
    }),
    [user, expired, login, logout],
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuth must be used inside <StaffAuthProvider>');
  return ctx;
}
