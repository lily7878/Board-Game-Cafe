import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Minimal internal router on the History API (spec: no react-router in v1).
 *  - usePath()         -> current pathname
 *  - useSearchParams() -> URLSearchParams of the query string (?table=3)
 *  - useNavigate()     -> navigate(to, { replace })
 *  - <Link to="/x">    -> <a> that navigates without a page reload
 *
 * UI state that should survive a refresh or be shareable (e.g. which table drawer is open)
 * lives in the query string instead of component state.
 */
const RouterContext = createContext(null);

const currentLocation = () => ({ path: window.location.pathname, search: window.location.search });

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(currentLocation);

  useEffect(() => {
    const onPop = () => setLocation(currentLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const url = new URL(to, window.location.origin);
    if (url.pathname + url.search === window.location.pathname + window.location.search) return;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', url.pathname + url.search);
    setLocation({ path: url.pathname, search: url.search });
  }, []);

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('Router hooks must be used inside <RouterProvider>');
  return ctx;
}

export const usePath = () => useRouter().path;
export const useNavigate = () => useRouter().navigate;

export function useSearchParams() {
  const { search } = useRouter();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function Link({ to, onClick, children, ...rest }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        // Let the browser handle new-tab / modified clicks.
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** In-app redirect rendered as a component (e.g. guards). */
export function Redirect({ to }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace: true }), [navigate, to]);
  return null;
}
