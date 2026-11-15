import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { ALL_GAME_REQUEST_STATUSES, ALL_ORDER_STATUSES } from '../../shared/statuses';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';

/**
 * Everything the dashboard reads, each kept fresh by the live events that can change it.
 * Orders and game requests are "all of today" (any status) so the activity feed can show
 * delivered / returned items too; the business day id is needed first (dependent query).
 */
export function useDashboardData({ isManager }) {
  const day = useApiQuery('/api/admin/business-days/current');
  const dayId = day.data?.id;

  const overview = useApiQuery('/api/admin/tables/overview');
  const orders = useApiQuery(dayId ? `/api/admin/orders?businessDayId=${dayId}&status=${ALL_ORDER_STATUSES}` : null);
  const requests = useApiQuery(
    dayId ? `/api/admin/game-requests?businessDayId=${dayId}&status=${ALL_GAME_REQUEST_STATUSES}` : null,
  );
  const preview = useApiQuery(isManager ? '/api/admin/business-days/current/preview' : null);
  const hours = useApiQuery(isManager ? '/api/admin/opening-hours' : null);

  useLiveRefetch(day.refetch, ['business-day.']);
  useLiveRefetch(overview.refetch, ['session.', 'order.', 'game.', 'tables.', 'payment.', 'business-day.']);
  useLiveRefetch(orders.refetch, ['order.']);
  useLiveRefetch(requests.refetch, ['game.']);
  useLiveRefetch(preview.refetch, ['session.', 'payment.', 'business-day.']);
  useLiveRefetch(hours.refetch, ['settings.']);

  const core = [day, overview, orders, requests];
  return {
    day: day.data,
    overview: overview.data,
    orders: orders.data,
    requests: requests.data,
    preview: preview.data,
    hours: hours.data,
    // Loading until every core query has data. "loading" alone is not enough: orders and
    // requests wait for the day id, so they are briefly idle (loading=false, data=null).
    // Later refetches keep the old data on screen, so there is no flashing skeleton.
    loading: core.some((q) => q.data == null && !q.error),
    error: core.find((q) => q.error)?.error ?? null,
    retry: () => core.forEach((q) => q.refetch()),
  };
}
