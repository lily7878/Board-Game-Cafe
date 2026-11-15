import { useEffect, useRef, useState } from 'react';
import { ArrowUpNarrowWide, ChevronDown, ClipboardList, History, X } from 'lucide-react';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate, useSearchParams } from '../../app/router';
import { useStaffAuth } from '../../app/StaffAuthContext';
import { apiRequest } from '../../shared/api/http';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { useNow } from '../../shared/hooks/useNow';
import { ORDER_NEXT_STEP } from '../../shared/statuses';
import { Button, Card, EmptyMessage, Skeleton } from '../../shared/ui';
import { OrderCard } from './OrderCard';
import { OrderHistory } from './OrderHistory';
import { useOrderProcessing } from './useOrderProcessing';
import styles from './Orders.module.css';

const FILTERS = [
  { value: 'all', label: 'În lucru' },
  { value: 'PLACED', label: 'Noi' },
  { value: 'ACCEPTED', label: 'Acceptate' },
  { value: 'PREPARING', label: 'În preparare' },
  { value: 'READY', label: 'Gata' },
];

/**
 * 2g / 2h / 7d — Orders. URL state:
 *   /orders?order=ID          expanded card (deep link from the dashboard and the table drawer)
 *   /orders?view=history&day= delivered + cancelled orders of a business day
 */
export function OrdersPage() {
  const params = useSearchParams();
  const navigate = useNavigate();
  const { isManager } = useStaffAuth();
  const now = useNow();
  const [filter, setFilter] = useState('all');

  const view = params.get('view') === 'history' ? 'history' : 'open';
  const expandedId = Number(params.get('order')) || null;

  // Without a status filter Core returns the orders still in progress, oldest first.
  const open = useApiQuery('/api/admin/orders');
  const tables = useApiQuery('/api/admin/tables/overview');
  const currentDay = useApiQuery('/api/admin/business-days/current');
  const days = useApiQuery(isManager ? '/api/admin/business-days' : null);
  const dayId = Number(params.get('day')) || currentDay.data?.id || null;
  const history = useApiQuery(dayId ? `/api/admin/orders?status=DELIVERED,CANCELLED&businessDayId=${dayId}` : null);

  useLiveRefetch(open.refetch, ['order.', 'session.']);
  useLiveRefetch(tables.refetch, ['session.', 'payment.', 'tables.']);
  useLiveRefetch(history.refetch, ['order.']);
  useLiveRefetch(currentDay.refetch, ['business-day.']);

  const { run, pending: advancing } = useAction();
  const processing = useOrderProcessing({ refetch: open.refetch });

  // Scroll a deep-linked order into view once its card exists.
  const cardRefs = useRef(new Map());
  const scrolledFor = useRef(null);
  useEffect(() => {
    if (!expandedId || scrolledFor.current === expandedId) return;
    const el = cardRefs.current.get(expandedId);
    if (el) {
      scrolledFor.current = expandedId;
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  const orders = open.data ?? [];
  const checkoutSessions = new Set(
    (tables.data ?? []).filter((t) => t.session?.status === 'CHECKOUT_PENDING').map((t) => t.session.sessionId),
  );
  const countOf = (value) => (value === 'all' ? orders.length : orders.filter((o) => o.status === value).length);
  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const missing = view === 'open' && expandedId && open.data && !orders.some((o) => o.id === expandedId);

  const toggle = (order) =>
    navigate(expandedId === order.id ? '/orders' : `/orders?order=${order.id}`, { replace: true });

  const advance = (order) => {
    const next = ORDER_NEXT_STEP[order.status];
    return run(
      `order-${order.id}`,
      () => apiRequest(`/api/admin/orders/${order.id}/status`, { method: 'PATCH', body: { status: next.status } }),
      { success: `Comanda #C-${order.id} ${next.done}.`, after: open.refetch },
    );
  };

  const historyChip = (active) => (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipOn : styles.chipOutline}`}
      aria-pressed={active}
      onClick={() => navigate('/orders?view=history')}
    >
      <History size={14} aria-hidden />
      Livrate și anulate
      {history.data && <span className={styles.chipCount}>{history.data.length}</span>}
    </button>
  );

  if (view === 'history') {
    return (
      <>
        <div className={styles.toolbar}>
          <button type="button" className={styles.chip} onClick={() => navigate('/orders')}>
            În lucru {open.data && <span className={styles.chipCount}>{orders.length}</span>}
          </button>
          <span className={styles.divider} aria-hidden />
          {historyChip(true)}
          <DayPicker
            isManager={isManager}
            days={days.data}
            currentDay={currentDay.data}
            value={dayId}
            onChange={(id) => navigate(`/orders?view=history&day=${id}`, { replace: true })}
          />
        </div>
        <OrderHistory query={history} />
      </>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.chips} role="radiogroup" aria-label="Filtru comenzi">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              className={`${styles.chip} ${filter === f.value ? styles.chipOn : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              {open.data && <span className={styles.chipCount}>{countOf(f.value)}</span>}
            </button>
          ))}
        </div>
        <span className={styles.divider} aria-hidden />
        {historyChip(false)}
        <span className={styles.sortHint}>
          <ArrowUpNarrowWide size={14} aria-hidden />
          Cele mai vechi primele
        </span>
      </div>

      {missing && (
        <div className={styles.notice} role="status">
          <span>
            Comanda <strong>#C-{expandedId}</strong> nu mai este în lucru: a fost livrată sau anulată între timp.
          </span>
          <Button size="sm" variant="secondary" onClick={() => navigate('/orders?view=history')}>
            Vezi istoricul
          </Button>
          <button type="button" className={styles.noticeClose} onClick={() => navigate('/orders', { replace: true })} aria-label="Închide">
            <X size={16} />
          </button>
        </div>
      )}

      {open.loading && !open.data ? (
        <ListSkeleton />
      ) : open.error && !open.data ? (
        <Card size="lg">
          <EmptyMessage
            icon={ClipboardList}
            title="Nu am putut încărca comenzile"
            action={<Button variant="secondary" onClick={open.refetch}>Reîncearcă</Button>}
          >
            {open.error.detail}
          </EmptyMessage>
        </Card>
      ) : orders.length === 0 ? (
        <Card size="lg">
          <EmptyMessage icon={ClipboardList} title="Nicio comandă în lucru">
            Comenzile trimise de clienți apar aici automat.
          </EmptyMessage>
        </Card>
      ) : visible.length === 0 ? (
        <p className={styles.noMatch}>Nicio comandă în această categorie.</p>
      ) : (
        <div className={styles.list}>
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              ref={(el) => (el ? cardRefs.current.set(order.id, el) : cardRefs.current.delete(order.id))}
              order={order}
              now={now}
              expanded={order.id === expandedId}
              blocksCheckout={checkoutSessions.has(order.sessionId)}
              onToggle={() => toggle(order)}
              onAdvance={advance}
              advancing={advancing === `order-${order.id}`}
              processing={processing}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** Managers can browse past days; staff only see the current one (business-day list is MANAGER-only). */
function DayPicker({ isManager, days, currentDay, value, onChange }) {
  const current = currentDay ? `Ziua #${currentDay.dayNumber}` : 'Ziua curentă';
  if (!isManager || !days?.length) return <span className={styles.dayPill}>{current}</span>;

  const sorted = [...days].sort((a, b) => b.dayNumber - a.dayNumber);
  return (
    <label className={styles.daySelect}>
      <select aria-label="Ziua de lucru" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {sorted.map((d) => (
          <option key={d.businessDayId} value={d.businessDayId}>
            Ziua #{d.dayNumber}
            {d.status === 'OPEN' ? ' (azi)' : ''}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden />
    </label>
  );
}

function ListSkeleton() {
  return (
    <div className={styles.list}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={styles.card} style={{ opacity: i < 2 ? 1 : 0.6 }}>
          <div className={styles.cardHead}>
            <Skeleton width={46} height={46} style={{ borderRadius: 999 }} />
            <div className={styles.cardMain}>
              <Skeleton width="30%" height={16} />
              <Skeleton width="50%" height={12} tone={2} style={{ marginTop: 8 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
