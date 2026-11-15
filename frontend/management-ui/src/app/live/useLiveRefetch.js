import { useEffect, useRef } from 'react';
import { RECONNECTED, useLive } from './LiveProvider';

const DEBOUNCE_MS = 250;

/**
 * Calls `refetch` when a live event whose type starts with one of `prefixes` arrives
 * (e.g. ['order.', 'session.checkout-pending']) and always after a reconnect.
 *
 * Bursts are coalesced: one staff action can emit several events (e.g. processing an
 * order emits order.processed + order.status-changed), so we wait 250 ms and refetch once.
 */
export function useLiveRefetch(refetch, prefixes) {
  const { subscribe } = useLive();
  const refetchRef = useRef(refetch);
  const prefixesRef = useRef(prefixes);

  // Always call the latest callback without re-subscribing on every render.
  useEffect(() => {
    refetchRef.current = refetch;
    prefixesRef.current = prefixes;
  });

  useEffect(() => {
    let timer = null;
    const unsubscribe = subscribe((event) => {
      const matches =
        event.type === RECONNECTED || prefixesRef.current.some((prefix) => event.type?.startsWith(prefix));
      if (!matches) return;
      clearTimeout(timer);
      timer = setTimeout(() => refetchRef.current(), DEBOUNCE_MS);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [subscribe]);
}
