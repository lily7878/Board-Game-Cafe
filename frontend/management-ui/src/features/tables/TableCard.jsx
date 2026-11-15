import { CircleCheck, ClipboardList, Dices, DoorOpen, Timer, TriangleAlert, Users } from 'lucide-react';
import { formatDuration, plural, tableLabel } from '../../shared/format';
import { SESSION_STATUS } from '../../shared/statuses';
import { Badge } from '../../shared/ui';
import styles from './Tables.module.css';

/**
 * One card of the 1d grid.
 *  - free      -> "Deschide masa" button
 *  - active    -> 2x2 meta (connected, timer, open orders, games at table); click opens the drawer
 *  - checkout  -> amber card + what blocks the payment
 */
export function TableCard({ table, selected, now, onOpenTable, onSelect }) {
  const { session } = table;

  if (!session) {
    return (
      <div className={styles.card}>
        <CardHead table={table} badge={<Badge tone="success" icon={CircleCheck}>Liberă</Badge>} />
        <button type="button" className={styles.openButton} onClick={() => onOpenTable(table)}>
          <DoorOpen size={16} aria-hidden />
          Deschide masa
        </button>
      </div>
    );
  }

  const checkout = session.status === 'CHECKOUT_PENDING';
  const status = SESSION_STATUS[session.status];
  const blockers = [];
  if (checkout && session.openOrders > 0) blockers.push(plural(session.openOrders, 'comandă', 'comenzi'));
  if (checkout && session.gamesAtTable > 0) blockers.push(plural(session.gamesAtTable, 'joc', 'jocuri'));

  return (
    <button
      type="button"
      className={`${styles.card} ${styles.clickable} ${checkout ? styles.checkout : ''} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect(table)}
      aria-pressed={selected}
    >
      <CardHead
        table={table}
        badge={
          <Badge tone={status.tone} icon={status.icon}>
            {status.label}
          </Badge>
        }
      />
      {blockers.length > 0 && (
        <div className={styles.blocker}>
          <TriangleAlert size={14} aria-hidden />
          {blockers.join(' și ')} blochează plata
        </div>
      )}
      <div className={styles.meta}>
        <span><Users size={16} aria-hidden />{plural(session.connectedParticipants, 'conectat', 'conectați')}</span>
        <span title="Durata sesiunii"><Timer size={16} aria-hidden />{formatDuration(session.startedAt, now)}</span>
        <span><ClipboardList size={16} aria-hidden />{plural(session.openOrders, 'comandă', 'comenzi')}</span>
        <span><Dices size={16} aria-hidden />{plural(session.gamesAtTable, 'joc', 'jocuri')}</span>
      </div>
    </button>
  );
}

function CardHead({ table, badge }) {
  return (
    <div className={styles.cardHead}>
      <div>
        <div className={styles.cardTitle}>Masa {tableLabel(table.tableNumber)}</div>
        <div className={styles.cardSub}>{plural(table.capacity, 'loc', 'locuri')}</div>
      </div>
      {badge}
    </div>
  );
}
