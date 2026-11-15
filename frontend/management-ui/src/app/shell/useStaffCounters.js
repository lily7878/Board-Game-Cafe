import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { useLiveRefetch } from '../live/useLiveRefetch';

/**
 * Sidebar counters = work waiting for staff:
 *  - orders: PLACED (not yet accepted/rejected)
 *  - gameRequests: REQUESTED + RESERVED (still to reserve or to deliver)
 */
export function useStaffCounters() {
  const orders = useApiQuery('/api/admin/orders?status=PLACED');
  const requests = useApiQuery('/api/admin/game-requests?status=REQUESTED,RESERVED');

  useLiveRefetch(orders.refetch, ['order.', 'session.closed']);
  useLiveRefetch(requests.refetch, ['game.', 'session.closed']);

  return {
    orders: orders.data?.length ?? 0,
    gameRequests: requests.data?.length ?? 0,
  };
}
