import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/http';

/**
 * GET hook used by every feature: { data, loading, error, refetch }.
 *  - aborts the in-flight request on unmount / path change
 *  - ignores stale responses (only the latest request may write state)
 *  - `refetch()` keeps the old data visible (REFRESHING) instead of blanking it
 * Pass path = null to skip fetching.
 */
export function useApiQuery(path) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const requestId = useRef(0);
  const controllerRef = useRef(null);

  const run = useCallback(async () => {
    if (!path) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const id = ++requestId.current;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiRequest(path, { signal: controller.signal });
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (controller.signal.aborted && error?.name === 'AbortError') return;
      if (id === requestId.current) setState((s) => ({ ...s, loading: false, error }));
    }
  }, [path]);

  useEffect(() => {
    run();
    return () => controllerRef.current?.abort();
  }, [run]);

  return { ...state, refetch: run };
}
