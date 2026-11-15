import { useApiQuery } from '../../../shared/hooks/useApiQuery';
import { useLiveRefetch } from '../../../app/live/useLiveRefetch';

/**
 * Everything the table drawer shows for one session. Each part has its own endpoint in Core
 * (details, bill, orders, game requests), so they load in parallel.
 * Live: only events of THIS session trigger a refetch (predicate on event.sessionId),
 * plus settings changes that may alter the game limit.
 */
export function useSessionData(sessionId) {
  const base = sessionId ? `/api/admin/sessions/${sessionId}` : null;
  const details = useApiQuery(base);
  const bill = useApiQuery(base && `${base}/bill`);
  const orders = useApiQuery(base && `${base}/orders`);
  const requests = useApiQuery(base && `${base}/game-requests`);

  const refetchAll = () => [details, bill, orders, requests].forEach((q) => q.refetch());
  useLiveRefetch(refetchAll, (event) => event.sessionId === sessionId);

  return {
    details: details.data,
    bill: bill.data,
    orders: orders.data ?? [],
    requests: requests.data ?? [],
    loading: details.data == null && !details.error,
    error: details.error,
    refetchAll,
  };
}
