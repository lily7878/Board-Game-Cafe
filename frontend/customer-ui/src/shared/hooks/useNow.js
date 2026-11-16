import { useEffect, useState } from 'react';

/** Current timestamp that re-renders every `intervalMs` — for "acum 6 min" labels. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
