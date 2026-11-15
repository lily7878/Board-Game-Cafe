import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Minimal internal router on the History API (spec: no react-router in v1).
 *  - usePath()      -> current pathname
 *  - useNavigate()  -> navigate(to, { replace })
 *  - <Link to="/x"> -> <a> that navigates without a page reload
 */
const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (to === window.location.pathname) return;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
    setPath(new URL(to, window.location.origin).pathname);
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('Router hooks must be used inside <RouterProvider>');
  return ctx;
}

export const usePath = () => useRouter().path;
export const useNavigate = () => useRouter().navigate;

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
