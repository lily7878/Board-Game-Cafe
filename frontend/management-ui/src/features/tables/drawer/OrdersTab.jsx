import { ArrowRight } from 'lucide-react';
import { useNavigate } from '../../../app/router';
import { formatMoney, formatTime } from '../../../shared/format';
import { ORDER_NEXT_STEP, ORDER_STATUS } from '../../../shared/statuses';
import { Badge, Button } from '../../../shared/ui';
import styles from './TableDrawer.module.css';

/**
 * 2b — the table's orders, newest first. Accept/reject per line happens on the Orders screen
 * (2g), so a new order links there; later kitchen steps are one button each.
 */
export function OrdersTab({ data, actions, pending }) {
  const navigate = useNavigate();
  const orders = [...data.orders].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));

  if (orders.length === 0) return <p className={styles.muted}>Nicio comandă la această masă.</p>;

  return orders.map((order) => {
    const status = ORDER_STATUS[order.status];
    const next = ORDER_NEXT_STEP[order.status];
    const isNew = order.status === 'PLACED';
    return (
      <article key={order.id} className={`${styles.orderCard} ${isNew ? styles.orderNew : ''}`}>
        <header className={styles.orderHead}>
          <strong>#C-{order.id}</strong>
          <span className={styles.mutedSmall}>
            {formatTime(order.placedAt)} · {order.participantName}
          </span>
          <span className={styles.push}>
            <Badge tone={isNew ? 'active' : status.tone} icon={status.icon}>
              {status.label}
            </Badge>
          </span>
        </header>

        {order.items.map((item) =>
          item.status === 'REJECTED' ? (
            <div key={item.id} className={`${styles.line} ${styles.lineRejected}`}>
              <s>
                {item.productName} ×{item.quantity}
              </s>
              <span>respinsă{item.rejectionReason ? ` · ${item.rejectionReason}` : ''}</span>
            </div>
          ) : (
            <div key={item.id} className={styles.line}>
              <span>
                {item.productName} ×{item.quantity}
              </span>
              <span>{formatMoney(item.lineTotal)}</span>
            </div>
          ),
        )}

        <footer className={`${styles.orderFoot} ${isNew ? styles.orderFootNew : ''}`}>
          <strong>
            {formatMoney(order.total)}{' '}
            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && <span className={styles.mutedInline}>preliminar</span>}
          </strong>
          {isNew && (
            <Button size="sm" onClick={() => navigate(`/orders?order=${order.id}`)}>
              Procesează pozițiile
            </Button>
          )}
          {next && (
            <Button
              size="sm"
              variant="secondary"
              iconRight={ArrowRight}
              submitting={pending === `order-${order.id}`}
              onClick={() => actions.advanceOrder(order)}
            >
              {next.label}
            </Button>
          )}
          {order.status === 'DELIVERED' && <span className={styles.mutedSmall}>livrată la {formatTime(order.deliveredAt)}</span>}
          {order.status === 'CANCELLED' && <span className={styles.mutedSmall}>anulată la {formatTime(order.cancelledAt)}</span>}
        </footer>
      </article>
    );
  });
}
