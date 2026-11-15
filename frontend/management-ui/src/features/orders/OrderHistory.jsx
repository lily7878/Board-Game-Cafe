import { History } from 'lucide-react';
import { formatMoney, formatTime, tableLabel } from '../../shared/format';
import { Badge, Button, Card, EmptyMessage, Skeleton } from '../../shared/ui';
import styles from './Orders.module.css';

/** How a finished order is shown: delivered, rejected entirely, or cancelled by the customer. */
function finishedBadge(order) {
  if (order.status === 'DELIVERED') return <Badge tone="success">Livrată</Badge>;
  if (order.cancellationReason === 'ALL_ITEMS_REJECTED') return <Badge tone="active">Anulată · respinsă</Badge>;
  return <Badge tone="neutral">Anulată de client</Badge>;
}

const finishedAt = (order) => order.deliveredAt ?? order.cancelledAt;

/** 7d — delivered and cancelled orders of one business day, latest first. */
export function OrderHistory({ query }) {
  const { data, loading, error, refetch } = query;

  if (loading && !data) {
    return (
      <Card size="lg" className={styles.historyCard}>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} width="100%" height={22} style={{ margin: '14px 0' }} tone={i % 2 ? 2 : 1} />
        ))}
      </Card>
    );
  }
  if (error && !data) {
    return (
      <Card size="lg">
        <EmptyMessage icon={History} title="Nu am putut încărca istoricul" action={<Button variant="secondary" onClick={refetch}>Reîncearcă</Button>}>
          {error.detail}
        </EmptyMessage>
      </Card>
    );
  }
  if (!data || data.length === 0) {
    return (
      <Card size="lg">
        <EmptyMessage icon={History} title="Nicio comandă încheiată">
          Comenzile livrate sau anulate în această zi apar aici.
        </EmptyMessage>
      </Card>
    );
  }

  const rows = [...data].sort((a, b) => new Date(finishedAt(b)) - new Date(finishedAt(a)));

  return (
    <Card size="lg" className={styles.historyCard}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Comandă</th>
            <th>Masă</th>
            <th>Produse</th>
            <th>Încheiată</th>
            <th>Total</th>
            <th>Stare</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id}>
              <td className={styles.code}>#C-{order.id}</td>
              <td>Masa {tableLabel(order.tableNumber)}</td>
              <td>
                {order.items.map((item, index) => (
                  <span key={item.id}>
                    {index > 0 && ' · '}
                    {item.status === 'REJECTED' ? (
                      <s title={item.rejectionReason ?? undefined}>
                        {item.productName} ×{item.quantity}
                      </s>
                    ) : (
                      `${item.productName} ×${item.quantity}`
                    )}
                  </span>
                ))}
              </td>
              <td className={styles.muted}>
                {formatTime(finishedAt(order))}
                {order.cancellationReason === 'CUSTOMER_CANCELLED' && ' · client'}
              </td>
              <td className={styles.strong}>{formatMoney(order.total)}</td>
              <td>{finishedBadge(order)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
