import { useEffect, useRef } from 'react';
import { RECONNECTED, useLive } from './LiveProvider';

const DEBOUNCE_MS = 250;

/**
 * Calls `refetch` when a matching live event arrives, and always after a reconnect.
 *
 * `match` is either
 *  - an array of type prefixes, e.g. ['order.', 'session.checkout-pending'], or
 *  - a predicate (event) => boolean, e.g. only events of one session:
 *      (e) => e.sessionId === sessionId
 *
 * Bursts are coalesced: one staff action can emit several events (e.g. processing an
 * order emits order.processed + order.status-changed), so we wait 250 ms and refetch once.
 */
export function useLiveRefetch(refetch, match) {
  const { subscribe } = useLive();
  const refetchRef = useRef(refetch);
  const matchRef = useRef(match);

  // Always use the latest callback / matcher without re-subscribing on every render.
  useEffect(() => {
    refetchRef.current = refetch;
    matchRef.current = match;
  });

  useEffect(() => {
    let timer = null;
    const unsubscribe = subscribe((event) => {
      const m = matchRef.current;
      const matches =
        event.type === RECONNECTED ||
        (typeof m === 'function' ? m(event) : m.some((prefix) => event.type?.startsWith(prefix)));
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
